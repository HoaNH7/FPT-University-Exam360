using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Authorization;
using backend.DTOs;

namespace backend.Controllers.HallwayProctor
{
    [Authorize(Authorization.Role.HallwayProctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class HallwayProctorController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public HallwayProctorController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetRequestsByTitle")]
        public async Task<IActionResult> GetRequestsByTitle(
    [FromQuery] int? pageNumber = 1,
    [FromQuery] int? pageSize = null)
        {
            var titles = new List<string>
    {
        "Provide scratch paper",
        "Proctor the exam on behalf of the exam room invigilator",
        "Issue a violation report",
        "Provide exam tools (pen, ruler, calculator)",
        "Other"
    };

            var validExamRoomIdsQuery = _context.StudentRequests
                .Select(sv => sv.ExamRoomId)
                .Distinct();

            var query = from v in _context.Requests
                        join sv in _context.StudentRequests on v.RequestId equals sv.RequestId
                        join srs in _context.StudentRoomSubjects on sv.StudentId equals srs.StudentId
                        join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                        where validExamRoomIdsQuery.Contains(examRoom.ExamRoomId) && titles.Contains(v.RequestTitle)
                        select new
                        {
                            v,
                            sv,
                            srs,
                            examRoom
                        };

            var totalRequests = await query.CountAsync();

            // Phân trang nếu cần
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var requests = await (from x in query
                                  join student in _context.Students on x.sv.StudentId equals student.StudentId into stj
                                  from student in stj.DefaultIfEmpty()
                                  join subject in _context.Subjects on x.srs.SubjectId equals subject.SubjectId into subj
                                  from subject in subj.DefaultIfEmpty()
                                  select new
                                  {
                                      x.v.RequestId,
                                      x.v.RequestTitle,
                                      x.v.Note,
                                      x.v.RequestDate,
                                      x.v.ResolveDate,
                                      x.v.ResolveStatus,
                                      ProctorEmail = _context.Users
                                          .Where(u => u.UserId == x.v.RequestById)
                                          .Select(u => u.Email)
                                          .FirstOrDefault(),
                                      RequestHandlerEmail = _context.Users
                                        .Where(u => u.UserId == x.v.ResolveById)
                                        .Select(u => u.Email)
                                        .FirstOrDefault(),
                                      StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                      FullName = student != null ? student.FullName : null,
                                      RoomName = x.examRoom != null ? x.examRoom.RoomName : null,
                                      SubjectCode = subject != null ? subject.SubjectCode : null,
                                      x.v.ResponseNote
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


        [HttpPut("UpdateRequests")]
        public async Task<ActionResult> UpdateRequests([FromBody] List<UpdateRequestDto> listUpdateRequestsDto)
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
                    if (updateRequestDto == null || string.IsNullOrWhiteSpace(updateRequestDto.StudentIdNumber) || updateRequestDto.RequestId <= 0)
                    {
                        return BadRequest("Invalid request data in one of the requests.");
                    }

                    // Tìm kiếm sinh viên trong cơ sở dữ liệu dựa trên StudentIdNumber
                    var student = await _context.Students
                        .Where(x => x.StudentIdNumber == updateRequestDto.StudentIdNumber)
                        .Select(x => new
                        {
                            x.StudentId,
                            x.Email,
                            x.StudentIdNumber
                        })
                        .FirstOrDefaultAsync();

                    // Nếu không tìm thấy sinh viên, trả về phản hồi không tìm thấy
                    if (student == null)
                    {
                        return NotFound($"Student not found for StudentIdNumber: {updateRequestDto.StudentIdNumber}");
                    }

                    // Tìm kiếm yêu cầu dựa trên RequestId và StudentId
                    var request = await _context.StudentRequests
                        .Include(x => x.Request)
                        .Where(x => x.Request.RequestId == updateRequestDto.RequestId && x.StudentId == student.StudentId)
                        .FirstOrDefaultAsync();

                    // Nếu không tìm thấy yêu cầu, trả về phản hồi không tìm thấy
                    if (request == null)
                    {
                        return NotFound($"Request not found for RequestId: {updateRequestDto.RequestId} and StudentIdNumber: {updateRequestDto.StudentIdNumber}");
                    }

                    // Cập nhật các thông tin của yêu cầu
                    request.Request.ResolveStatus = updateRequestDto.ResolveStatus;
                    request.Request.ResolveDate = DateTime.Now;
                    request.Request.ResolveById = resolveIdInt;
                    request.Request.ResponseNote = updateRequestDto.ResponseNote;

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

        [HttpGet("SearchRequests")]
        public async Task<IActionResult> SearchRequests([FromQuery] SearchRequestDto searchCriteria)
        {
            var titles = new List<string>
            {
                "Provide scratch paper",
                "Proctor the exam on behalf of the exam room invigilator",
                "Issue a violation report",
                "Provide exam tools (pen, ruler, calculator)",
                "Other"
            };

            var query = _context.Requests
                .Where(r => titles.Contains(r.RequestTitle))
                .AsQueryable();

            if (searchCriteria.RequestFrom.HasValue && searchCriteria.RequestTo.HasValue)
            {
                query = query.Where(r => r.RequestDate.HasValue && r.RequestDate.Value.Date >= searchCriteria.RequestFrom.Value.Date && r.RequestDate.Value.Date <= searchCriteria.RequestTo.Value.Date);
            }

            if (!string.IsNullOrEmpty(searchCriteria.RequestTitle))
            {
                query = query.Where(r => r.RequestTitle.Contains(searchCriteria.RequestTitle));
            }

            if (searchCriteria.RequestById.HasValue)
            {
                query = query.Where(r => r.RequestById == searchCriteria.RequestById.Value);
            }

            if (!string.IsNullOrEmpty(searchCriteria.ResolveStatus))
            {
                query = query.Where(r => r.ResolveStatus == searchCriteria.ResolveStatus);
            }

            var requests = await (from r in query
                                  join sr in _context.StudentRequests on r.RequestId equals sr.RequestId into srj
                                  from sr in srj.DefaultIfEmpty()
                                  join srs in _context.StudentRoomSubjects on sr.StudentId equals srs.StudentId into srsj
                                  from srs in srsj.DefaultIfEmpty()
                                  join student in _context.Students on sr.StudentId equals student.StudentId into stj
                                  from student in stj.DefaultIfEmpty()
                                  join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId into erj
                                  from examRoom in erj.DefaultIfEmpty()
                                  join subject in _context.Subjects on srs.SubjectId equals subject.SubjectId into subj
                                  from subject in subj.DefaultIfEmpty()
                                  where (string.IsNullOrEmpty(searchCriteria.RoomName) || examRoom.RoomName == searchCriteria.RoomName) &&
                                        (string.IsNullOrEmpty(searchCriteria.Semester) || examRoom.Schedule.Semester == searchCriteria.Semester)
                                  select new
                                  {
                                      r.RequestId,
                                      r.RequestTitle,
                                      r.Note,
                                      r.RequestDate,
                                      r.ResolveDate,
                                      r.ResolveStatus,
                                      ProctorEmail = _context.Users
                                          .Where(u => u.UserId == r.RequestById)
                                          .Select(u => u.Email)
                                          .FirstOrDefault(),
                                      StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                      FullName = student != null ? student.FullName : null,
                                      RoomName = examRoom != null ? examRoom.RoomName : null,
                                      SubjectName = subject != null ? subject.SubjectName : null,
                                      Semester = examRoom != null ? examRoom.Schedule.Semester : null
                                  })
                                  .ToListAsync();

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(requests);
        }
    }
}
