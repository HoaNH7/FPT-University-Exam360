using backend.Authorization;
using backend.Models;
using DocumentFormat.OpenXml.Drawing;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using System.Globalization;
using System.Linq;
using System.Security.Claims;

namespace backend.Controllers.ExaminerHead
{
    [Authorize(Authorization.Role.ExaminerHead)]
    [Route("api/[controller]")]
    [ApiController]
    public class ExamRoomController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ExamRoomController(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("ListAllRooms")]
        public async Task<IActionResult> ListAllRooms(string? semester, string? roomName, string? proctorName, string? date, int? pageNumber = 1, int? pageSize = null)
        {
            try
            {
                var query = _context.ExamRooms
                    .Include(er => er.Schedule)
                    .ThenInclude(s => s.ExamCodes)
                    .Include(er => er.Proctor)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(semester))
                {
                    query = query.Where(er => er.Schedule.Semester == semester);
                }

                if (!string.IsNullOrEmpty(roomName))
                {
                    query = query.Where(er => er.RoomName.Contains(roomName));
                }

                if (!string.IsNullOrEmpty(proctorName))
                {
                    query = query.Where(er => er.Proctor.Email.Contains(proctorName));
                }

                if (!string.IsNullOrEmpty(date))
                {
                    DateTime parsedDate;
                    if (DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out parsedDate))
                    {
                        query = query.Where(er => er.Schedule.StartTime.Date == parsedDate);
                    }
                }

                var totalCount = await query.CountAsync();

                var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

                if (pageNumber.HasValue && pageNumber.Value > totalPages)
                {
                    pageNumber = totalPages;
                }

                var itemsQuery = query
                    .Select(er => new
                    {
                        RoomName = er.RoomName,
                        StartTime = er.Schedule.StartTime,
                        EndTime = er.Schedule.EndTime,
                        Semester = er.Schedule.Semester,
                        Status = er.Schedule.ExamCodes.Select(ec => ec.Status).FirstOrDefault(),
                        Proctors = new
                        {
                            MainProctorEmail = er.Proctor.Email,
                            AdditionalProctors = _context.ExamRoomProctors
                                .Where(erp => erp.ExamRoomId == er.ExamRoomId)
                                .Select(erp => erp.Proctor.Email)
                                .ToList()
                        }
                    });

                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
                }

                var items = await itemsQuery.ToListAsync();

                var result = new
                {
                    TotalCount = totalCount,
                    Rooms = items
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }

        [HttpGet("ListExamRoomsOf2NDSchedules")]
        public async Task<IActionResult> ListExamRoomsOf2NDSchedules(string? semester, string? roomName, string? proctorName, int? pageNumber = 1, int? pageSize = null)
        {
            try
            {
                var query = _context.StudentRoomSubjects
                    .Include(srs => srs.ExamRoom)
                        .ThenInclude(er => er.Schedule)
                    .Include(s => s.Student)
                    .Include(s => s.Subject)
                    .AsQueryable();

                // Filter by "2NDFE" attempt
                query = query.Where(x => x.ExamRoom.Attempt == "2NDFE");

                // Filter by semester if provided
                if (!string.IsNullOrEmpty(semester))
                {
                    query = query.Where(er => er.ExamRoom.Schedule.Semester == semester);
                }

                // Filter by room name if provided
                if (!string.IsNullOrEmpty(roomName))
                {
                    query = query.Where(x => x.ExamRoom.RoomName.Contains(roomName));
                }

                // Filter by proctor name if provided
                if (!string.IsNullOrEmpty(proctorName))
                {
                    query = query.Where(x => x.ExamRoom.Proctor.Email.Contains(proctorName.Trim()) ||
                                             _context.ExamRoomProctors.Any(erp => erp.ExamRoomId == x.ExamRoomId && erp.Proctor.Email.Contains(proctorName.Trim())));
                }

                // Apply pagination
                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

                if (pageNumber.HasValue && pageNumber.Value > totalPages)
                {
                    pageNumber = totalPages;
                }

                var itemsQuery = query
                    .Select(x => new
                    {
                        RollNo = x.Student.StudentIdNumber,
                        RoomName = x.ExamRoom.RoomName,
                        SubjectCode = x.Subject.SubjectCode,
                        Note = x.Note,
                        StartTime = x.ExamRoom.Schedule.StartTime,
                        EndTime = x.ExamRoom.Schedule.EndTime,
                        Semester = x.ExamRoom.Schedule.Semester,
                        Attempt = x.ExamRoom.Attempt,
                        PlaceName = x.ExamRoom.Place.Address,
                        Proctors = new
                        {
                            MainProctorEmail = x.ExamRoom.Proctor.Email,
                            AdditionalProctors = _context.ExamRoomProctors
                                .Where(erp => erp.ExamRoomId == x.ExamRoomId)
                                .Select(erp => erp.Proctor.Email)
                                .ToList()
                        }
                    });

                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
                }

                var items = await itemsQuery.ToListAsync();

                var result = new
                {
                    TotalCount = totalCount,
                    Rooms = items
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }


    }
}
