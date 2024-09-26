using backend.Authorization;
using backend.DTOs;
using backend.Models;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class RequestController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        public RequestController(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("GetAllStudentByProctorId/{proctorId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetAllStudentByProctorId(uint proctorId, [FromQuery] string startTime, [FromQuery] string endTime, [FromQuery] string room)
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
                                             examRoom.Schedule.StartTime >= startDateTime && examRoom.Schedule.EndTime <= endDateTime
                                       select new
                                       {
                                           Stt = student.StudentId,
                                           RollNo = student.StudentIdNumber,
                                           FullName = student.FullName,
                                           Subject = subject.SubjectCode,
                                           Title = subject.ExamCodes.FirstOrDefault().Title,
                                           Room = examRoom.RoomName,
                                           Proctor = examRoom.Proctor.Email,
                                       };

            if (!string.IsNullOrEmpty(room))
            {
                studentRequestsQuery = studentRequestsQuery.Where(sr => sr.Room == room);
            }

            var studentRequests = await studentRequestsQuery.ToListAsync();

            return Ok(studentRequests);
        }


        [HttpGet("ViewAllRequestByProctorId")]
        public async Task<IActionResult> GetRequest(
            [FromQuery] uint? requestById,
            [FromQuery] string? startTime,
            [FromQuery] string? endTime,
            [FromQuery] string? roomName,
            [FromQuery] int? pageNumber = 1,
            [FromQuery] int? pageSize = null)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);
            var query = _context.Requests.AsQueryable();

            if (requestById.HasValue)
            {
                query = query.Where(r => r.RequestById == requestById.Value);
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
                                  where (string.IsNullOrEmpty(roomName) || (examRoom != null && examRoom.RoomName.ToLower() == roomName.ToLower()))
                                  && (!parsedStartTime.HasValue || (examRoom != null && examRoom.Schedule.StartTime >= parsedStartTime.Value))
                                  && (!parsedEndTime.HasValue || (examRoom != null && examRoom.Schedule.EndTime <= parsedEndTime.Value))
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
                                      SubjectCode = subject != null ? subject.SubjectCode : null,
                                      r.ResponseNote,
                                      sr.ExamRoomId
                                     
                                  })
                                  .ToListAsync();
            if (examroom!= null)
            {
                requests = requests.Where(x => x.ExamRoomId == examroom.ExamRoomId).ToList();
            }

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                TotalRequests = requests.Count,
                Requests = requests
            });
        }

        [HttpGet("ViewAllRequestByStudentIdNumber")]
        public async Task<IActionResult> GetAllRequestByStudentIdNumber(
    [FromQuery] string? studentIdNumber,
    [FromQuery] string? startTime,
    [FromQuery] string? endTime,
    [FromQuery] string? roomName,
    [FromQuery] int? pageNumber = 1,
    [FromQuery] int? pageSize = null)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);
            var query = _context.Requests.AsQueryable();

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
                                  where (string.IsNullOrEmpty(roomName) || (examRoom != null && examRoom.RoomName.ToLower() == roomName.ToLower()))
                                  && (!parsedStartTime.HasValue || (examRoom != null && examRoom.Schedule.StartTime >= parsedStartTime.Value))
                                  && (!parsedEndTime.HasValue || (examRoom != null && examRoom.Schedule.EndTime <= parsedEndTime.Value))
                                  && (string.IsNullOrEmpty(studentIdNumber) || (student != null && student.StudentIdNumber == studentIdNumber))
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
                                      RequestHandlerEmail = _context.Users
                                        .Where(u => u.UserId == r.ResolveById)
                                        .Select(u => u.Email)
                                        .FirstOrDefault(),
                                      StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                      FullName = student != null ? student.FullName : null,
                                      RoomName = examRoom != null ? examRoom.RoomName : null,
                                      SubjectCode = subject != null ? subject.SubjectCode : null,
                                      r.ResponseNote,
                                      sr.ExamRoomId
                                  })
                                  .ToListAsync();

            if (examroom != null)
            {
                requests = requests.Where(x => x.ExamRoomId == examroom.ExamRoomId).ToList();
            }

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                TotalRequests = requests.Count,
                Requests = requests
            });
        }


        [HttpPost("AddRequests")]
        public async Task<ActionResult> AddRequests([FromBody] List<RequestDto> listRequestsDto)
        {
            try
            {
                if (listRequestsDto == null || !listRequestsDto.Any())
                {
                    return BadRequest("Invalid request data.");
                }

                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    try
                    {
                        foreach (var requestDto in listRequestsDto)
                        {
                            if (requestDto == null || string.IsNullOrWhiteSpace(requestDto.StudentIdNumber))
                            {
                                return BadRequest("Invalid request data in one of the requests.");
                            }

                            // Tìm sinh viên theo StudentIdNumber
                            var student = await _context.Students
                                .Where(x => x.StudentIdNumber == requestDto.StudentIdNumber)
                                .FirstOrDefaultAsync();

                            if (student == null)
                            {
                                return NotFound($"Student not found for StudentIdNumber: {requestDto.StudentIdNumber}");
                            }

                            // Chuyển đổi StartTime và EndTime từ chuỗi sang DateTime
                            if (!DateTime.TryParseExact(requestDto.StartTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startTime))
                            {
                                return BadRequest("Invalid StartTime format. Please use 'yyyy-MM-dd HH:mm'.");
                            }

                            if (!DateTime.TryParseExact(requestDto.EndTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endTime))
                            {
                                return BadRequest("Invalid EndTime format. Please use 'yyyy-MM-dd HH:mm'.");
                            }

                            // Tìm ExamRoom và Schedule dựa trên RoomName và StartTime/EndTime
                            var examRoom = await _context.ExamRooms
                                .Include(er => er.Schedule)
                                .Where(er => er.RoomName == requestDto.RoomName &&
                                             er.Schedule.StartTime == startTime &&
                                             er.Schedule.EndTime == endTime)
                                .FirstOrDefaultAsync();

                            if (examRoom == null)
                            {
                                return NotFound($"ExamRoom not found for RoomName: {requestDto.RoomName} and the provided time range.");
                            }

                            // Kiểm tra xem ProctorId có tồn tại trong ExamRoom không
                            if (examRoom.ProctorId.GetValueOrDefault() != requestDto.ProctorId && examRoom.ExamRoomProctors.Any(x=>x.ProctorId !=requestDto.ProctorId))
                            {
                                return NotFound($"ProctorId {requestDto.ProctorId} not found in ExamRoom {requestDto.RoomName}.");
                            }

                            var request = new Request
                            {
                                RequestById = requestDto.ProctorId,
                                RequestTitle = requestDto.RequestTitle,
                                Note = requestDto.Note,
                                RequestDate = DateTime.Now,
                                ResolveStatus = "pending"
                            };

                            _context.Requests.Add(request);
                            await _context.SaveChangesAsync();

                            var studentRequest = new StudentRequest
                            {
                                RequestId = request.RequestId,
                                StudentId = student.StudentId,
                                ExamRoomId = examRoom.ExamRoomId // Lưu ExamRoomId
                            };

                            _context.StudentRequests.Add(studentRequest);
                        }

                        await _context.SaveChangesAsync();
                        await transaction.CommitAsync();
                        return Ok("Requests added successfully.");
                    }
                    catch (Exception ex)
                    {
                        await transaction.RollbackAsync();
                        Console.WriteLine($"Exception: {ex.Message}");
                        if (ex.InnerException != null)
                        {
                            Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                        }
                        return StatusCode(500, $"An error occurred while adding the requests: {ex.Message}, InnerException: {ex.InnerException?.Message}");
                    }
                }
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"InvalidCastException: {ex.Message}");
                return StatusCode(500, $"An error occurred while adding the requests. Invalid data type: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                }
                return StatusCode(500, $"An error occurred while adding the requests: {ex.Message}, InnerException: {ex.InnerException?.Message}");
            }
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
                    var respones = await _context.StudentRequests.Include(x => x.Request).Include(x => x.Student)
                        .Where(x => x.StudentId == student.StudentId)
                        .Select(x => new
                        {
                            x.Request,

                        })
                        .ToListAsync();

                    if (!respones.Any())
                    {
                        updateResult.Add("no request found to update!");
                    }
                    foreach (var respone in respones)
                    {
                        respone.Request.ResolveStatus = updateRequestDto.ResolveStatus;
                        respone.Request.ResolveDate = DateTime.Now;
                        respone.Request.ResolveById = resolveIdInt;// you must change 53 by resolveIdInt when signing in browser
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


