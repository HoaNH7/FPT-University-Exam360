using System;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.ITStaff
{
    [Authorize(Authorization.Role.ITStaff)]
    [Route("ITStaff[controller]")]
    [ApiController]
    public class ReceiveRequestResetPassword:ControllerBase
	{
        private readonly SEP490_V3Context _context;

        public ReceiveRequestResetPassword(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("GetAllRequestResetPassword")]
        public async Task<IActionResult> GetAllRequestResetPassword(
    [FromQuery] uint? requestById,
    [FromQuery] string? date,
    [FromQuery] string? time,
    [FromQuery] string? requestDate,
    [FromQuery] string? email,
    [FromQuery] string? roomName,
    [FromQuery] int? pageNumber = 1,
    [FromQuery] int? pageSize = null)
        {
            var validExamRoomIdsQuery = _context.StudentRequests
                .Select(sv => sv.ExamRoomId)
                .Distinct();

            var query = from r in _context.Requests
                        join sv in _context.StudentRequests on r.RequestId equals sv.RequestId
                        join srs in _context.StudentRoomSubjects on sv.StudentId equals srs.StudentId
                        join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                        where validExamRoomIdsQuery.Contains(examRoom.ExamRoomId) && r.RequestTitle == "Reset Password"
                        select new
                        {
                            r,
                            sv,
                            srs,
                            examRoom
                        };

            if (requestById.HasValue)
            {
                query = query.Where(x => x.r.RequestById == requestById.Value);
            }

            if (!string.IsNullOrEmpty(date))
            {
                if (DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out DateTime dateValue))
                {
                    query = query.Where(x => x.r.RequestDate.HasValue && x.r.RequestDate.Value.Date == dateValue.Date);
                }
                else
                {
                    return BadRequest("Invalid date format. Please use 'yyyy-MM-dd'.");
                }
            }

            if (!string.IsNullOrEmpty(time))
            {
                if (DateTime.TryParseExact(time, "HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime timeValue))
                {
                    query = query.Where(x => x.r.RequestDate.HasValue && x.r.RequestDate.Value.TimeOfDay == timeValue.TimeOfDay);
                }
                else
                {
                    return BadRequest("Invalid time format. Please use 'HH:mm'.");
                }
            }

            if (!string.IsNullOrEmpty(requestDate))
            {
                if (DateTime.TryParseExact(requestDate, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out DateTime dateTime))
                {
                    query = query.Where(x => x.r.RequestDate.HasValue && x.r.RequestDate.Value.Date == dateTime.Date);
                }
                else
                {
                    return BadRequest("Invalid requestDate format. Please use 'yyyy-MM-dd'.");
                }
            }

            if (!string.IsNullOrEmpty(email))
            {
                var proctor = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (proctor != null)
                {
                    query = query.Where(x => x.r.RequestById == proctor.UserId);
                }
            }

            var totalRequests = await query.CountAsync();

            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var requests = await (from x in query
                                  join student in _context.Students on x.sv.StudentId equals student.StudentId into stj
                                  from student in stj.DefaultIfEmpty()
                                  join subject in _context.Subjects on x.srs.SubjectId equals subject.SubjectId into subj
                                  from subject in subj.DefaultIfEmpty()
                                  where string.IsNullOrEmpty(roomName) || (x.examRoom != null && x.examRoom.RoomName.ToLower() == roomName.ToLower())
                                  select new
                                  {
                                      x.r.RequestId,
                                      x.r.RequestTitle,
                                      x.r.Note,
                                      x.r.RequestDate,
                                      x.r.ResolveDate,
                                      x.r.ResolveStatus,
                                      ProctorEmail = _context.Users
                                          .Where(u => u.UserId == x.r.RequestById)
                                          .Select(u => u.Email)
                                          .FirstOrDefault(),
                                      RequestHandlerEmail = _context.Users
                                        .Where(u => u.UserId == x.r.ResolveById)
                                        .Select(u => u.Email)
                                        .FirstOrDefault(),
                                      StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                      FullName = student != null ? student.FullName : null,
                                      RoomName = x.examRoom != null ? x.examRoom.RoomName : null,
                                      SubjectCode = subject != null ? subject.SubjectCode : null,
                                      x.r.ResponseNote
                                  })
                                  .GroupBy(r => r.RequestId)
                                  .Select(g => g.FirstOrDefault())
                                  .ToListAsync();

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                TotalRequests = totalRequests,
                Requests = requests
            });
        }



        [HttpPut("HandleRequestResetPassword")]
        public async Task<ActionResult> HandleRequestResetPassword([FromBody] List<UpdateRequestDto> listUpdateRequestsDto)
        {
            var resolveId = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(resolveId, out uint resolveIdInt);
            try
            {
                if (listUpdateRequestsDto == null || !listUpdateRequestsDto.Any())
                {
                    return BadRequest("Invalid request data.");
                }

                var updateResult = new List<string>();

                foreach (var updateRequestDto in listUpdateRequestsDto)
                {
                    if (updateRequestDto == null || string.IsNullOrWhiteSpace(updateRequestDto.StudentIdNumber))
                    {
                        return BadRequest("Invalid request data in one of the requests.");
                    }

                    var student = await _context.Students
                        .Where(x => x.StudentIdNumber == updateRequestDto.StudentIdNumber)
                        .Select(x => new
                        {
                            x.StudentId,
                            x.Email,
                            x.StudentIdNumber
                        })
                        .FirstOrDefaultAsync();

                    if (student == null)
                    {
                        return NotFound($"Student not found for StudentIdNumber: {updateRequestDto.StudentIdNumber}");
                    }

                    var responses = await _context.StudentRequests
                        .Include(x => x.Request)
                        .Include(x => x.Student)
                        .Where(x => x.StudentId == student.StudentId)
                        .Select(x => new
                        {
                            x.Request
                        })
                        .ToListAsync();

                    if (!responses.Any())
                    {
                        updateResult.Add("No request found to update!");
                    }

                    foreach (var response in responses)
                    {
                        response.Request.ResolveStatus = updateRequestDto.ResolveStatus;
                        response.Request.ResolveDate = DateTime.Now;
                        response.Request.ResolveById = resolveIdInt;
                        response.Request.ResponseNote = updateRequestDto.ResponseNote;
                    }

                    await _context.SaveChangesAsync();
                }

                return Ok("Requests updated successfully.");
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"InvalidCastException: {ex.Message}");
                return StatusCode(500, $"An error occurred while updating the requests. Invalid data type: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(500, $"An error occurred while updating the requests: {ex.Message}");
            }
        }

    }
}

