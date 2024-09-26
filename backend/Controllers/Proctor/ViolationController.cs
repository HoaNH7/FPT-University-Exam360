using Azure.Core;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class ViolationController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ViolationController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetAllStudentViolationByProctorId/{proctorId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllStudentViolationByProctorId(uint proctorId, [FromQuery] string startTime, [FromQuery] string endTime, [FromQuery] string room)
        {
            if (!DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startDateTime) ||
                !DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endDateTime))
            {
                return BadRequest("Invalid date format. Please use 'yyyy-MM-dd HH:mm'.");
            }

            var studentRequestsQuery = from srs in _context.StudentRoomSubjects
                                       join student in _context.Students on srs.StudentId equals student.StudentId
                                       join subject in _context.Subjects.Include(s => s.ExamCodes) on srs.SubjectId equals subject.SubjectId
                                       join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                                       join examRoomProctor in _context.ExamRoomProctors on examRoom.ExamRoomId equals examRoomProctor.ExamRoomId into examRoomProctors
                                       from erp in examRoomProctors.DefaultIfEmpty()
                                       where (examRoom.Proctor.UserId == proctorId || erp.ProctorId == proctorId) &&
                                             examRoom.Schedule.StartTime >= startDateTime &&
                                             examRoom.Schedule.EndTime <= endDateTime
                                       select new
                                       {
                                           Stt = student.StudentId,
                                           RollNo = student.StudentIdNumber,
                                           FullName = student.FullName,
                                           Subject = subject.SubjectCode,
                                           Title = subject.ExamCodes.FirstOrDefault().Title,
                                           Room = examRoom.RoomName,
                                           Proctor = examRoom.Proctor.Email,
                                           //Request = student.Requests.FirstOrDefault().Note
                                       };

            if (!string.IsNullOrEmpty(room))
            {
                studentRequestsQuery = studentRequestsQuery.Where(sr => sr.Room == room);
            }

            var studentRequests = await studentRequestsQuery.ToListAsync();


            return Ok(studentRequests);
        }

        [HttpGet("ViewAllViolationByProctorId")]
        public async Task<IActionResult> GetViolation(
            [FromQuery] uint? reportById,
            [FromQuery] string? startTime,
            [FromQuery] string? endTime,
            [FromQuery] string? roomName,
            [FromQuery] int? pageNumber = 1,
            [FromQuery] int? pageSize = null)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);
            var query = _context.Violations.AsQueryable();

            if (reportById.HasValue)
            {
                query = query.Where(r => r.ReportById == reportById.Value);
            }

            DateTime? parsedStartTime = null;
            DateTime? parsedEndTime = null;
            string format = "yyyy-MM-dd HH:mm";

            if (!string.IsNullOrEmpty(startTime))
            {
                if (!DateTime.TryParseExact(startTime, format, null, System.Globalization.DateTimeStyles.None, out var tempStartTime))
                {
                    return BadRequest("Invalid start time format. Please use 'YYYY-MM-DD HH:mm'.");
                }
                parsedStartTime = tempStartTime;
            }

            if (!string.IsNullOrEmpty(endTime))
            {
                if (!DateTime.TryParseExact(endTime, format, null, System.Globalization.DateTimeStyles.None, out var tempEndTime))
                {
                    return BadRequest("Invalid end time format. Please use 'YYYY-MM-DD HH:mm'.");
                }
                parsedEndTime = tempEndTime;
            }
            var examroom = await _context.ExamRooms
               .Include(er => er.Schedule)
               .Where(srs => srs.ProctorId == userId && srs.Schedule.StartTime == parsedStartTime && srs.Schedule.EndTime == parsedEndTime && srs.RoomName == roomName)
               .FirstOrDefaultAsync();
            var violations = await (from r in query
                                  join sr in _context.StudentViolations on r.ViolationId equals sr.ViolationId into srj
                                  from sr in srj.DefaultIfEmpty()
                                  join srs in _context.StudentRoomSubjects on sr.StudentId equals srs.StudentId into srsj
                                  from srs in srsj.DefaultIfEmpty()
                                  join student in _context.Students on sr.StudentId equals student.StudentId into stj
                                  from student in stj.DefaultIfEmpty()
                                  join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId into erj
                                  from examRoom in erj.DefaultIfEmpty()
                                  join subject in _context.Subjects on srs.SubjectId equals subject.SubjectId into subj
                                  from subject in subj.DefaultIfEmpty()
                                  where (string.IsNullOrEmpty(roomName) || (examRoom != null && examRoom.RoomName.ToLower() == roomName.ToLower()))
                                  && (!parsedStartTime.HasValue || (examRoom != null && examRoom.Schedule.StartTime >= parsedStartTime.Value))
                                  && (!parsedEndTime.HasValue || (examRoom != null && examRoom.Schedule.EndTime <= parsedEndTime.Value))
                                  select new
                                  {
                                      r.ViolationId,
                                      r.ViolationTitle,
                                      r.Note,
                                      r.ReportDate,
                                      r.ResolveDate,
                                      r.ResolveStatus,
                                      r.ResponseNote,
                                      ProctorEmail = _context.Users
                                          .Where(u => u.UserId == r.ReportById)
                                          .Select(u => u.Email)
                                          .FirstOrDefault(),
                                      StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                      FullName = student != null ? student.FullName : null,
                                      RoomName = examRoom != null ? examRoom.RoomName : null,
                                      SubjectCode = subject != null ? subject.SubjectCode : null,
                                      sr.ExamRoomId

                                  })
                                  .ToListAsync();
            if (examroom != null)
            {
                violations = violations.Where(x => x.ExamRoomId == examroom.ExamRoomId).ToList();
            }

            if (!violations.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                TotalViolations = violations.Count,
                Violations = violations
            });
        }

        [HttpPost("AddViolations")]
        public async Task<ActionResult> AddViolations([FromBody] List<ViolationDto> listViolationsDto)
        {
            try
            {
                if (listViolationsDto == null || !listViolationsDto.Any())
                {
                    return BadRequest("Invalid request data.");
                }

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        foreach (var violationDto in listViolationsDto)
                        {
                            if (violationDto == null || string.IsNullOrWhiteSpace(violationDto.StudentIdNumber))
                            {
                                return BadRequest("Invalid request data in one of the requests.");
                            }

                            var student = await _context.Students
                                .Where(x => x.StudentIdNumber == violationDto.StudentIdNumber)
                                .Select(x => new
                                {
                                    x.StudentId,
                                    x.Email,
                                    x.StudentIdNumber
                                })
                                .FirstOrDefaultAsync();

                            if (student == null)
                            {
                                return NotFound($"Student not found for StudentIdNumber: {violationDto.StudentIdNumber}");
                            }

                            // Chuyển đổi StartTime và EndTime từ chuỗi sang DateTime
                            if (!DateTime.TryParseExact(violationDto.StartTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startTime))
                            {
                                return BadRequest("Invalid StartTime format. Please use 'yyyy-MM-dd HH:mm'.");
                            }

                            if (!DateTime.TryParseExact(violationDto.EndTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endTime))
                            {
                                return BadRequest("Invalid EndTime format. Please use 'yyyy-MM-dd HH:mm'.");
                            }

                            // Tìm ExamRoom và Schedule dựa trên ExamRoom và StartTime/EndTime
                            var examRoom = await _context.ExamRooms
                                .Include(er => er.Schedule)
                                .Where(er => er.RoomName == violationDto.RoomName &&
                                             er.Schedule.StartTime == startTime &&
                                             er.Schedule.EndTime == endTime)
                                .FirstOrDefaultAsync();

                            if (examRoom == null)
                            {
                                return NotFound($"ExamRoom not found for RoomName: {violationDto.RoomName} and the provided time range.");
                            }

                            // Kiểm tra xem ProctorId có tồn tại trong ExamRoom không
                            if (examRoom.ProctorId != violationDto.ProctorId && examRoom.ExamRoomProctors.Any(x => x.ProctorId != violationDto.ProctorId))
                            {
                                return NotFound($"ProctorId {violationDto.ProctorId} not found in ExamRoom {violationDto.RoomName}.");
                            }

                            var violation = new Violation
                            {
                                ReportById = violationDto.ProctorId,
                                ViolationTitle = violationDto.ViolationTitle,
                                Note = violationDto.Note,
                                ReportDate = DateTime.Now,
                                ResolveStatus = "pending"
                            };

                            _context.Violations.Add(violation);
                            await _context.SaveChangesAsync();

                            var studentViolation = new StudentViolation
                            {
                                ViolationId = violation.ViolationId,
                                StudentId = student.StudentId,
                                ExamRoomId = examRoom.ExamRoomId
                            };

                            _context.StudentViolations.Add(studentViolation);
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();
                        return Ok("Violations added successfully.");
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        Console.WriteLine($"Exception: {ex.Message}");
                        return StatusCode(500, $"An error occurred while adding the violations: {ex.Message}");
                    }
                }
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"InvalidCastException: {ex.Message}");
                return StatusCode(500, $"An error occurred while adding the violations. Invalid data type: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(500, $"An error occurred while adding the violations: {ex.Message}");
            }
        }


    }
}


