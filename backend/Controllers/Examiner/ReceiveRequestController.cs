using AutoMapper.Internal.Mappers;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class ReceiveRequestController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ReceiveRequestController(SEP490_V3Context _context)
        {
            this._context = _context;
        }
        [HttpGet("GetAllRequestByProctorId")]
        public async Task<IActionResult> GetRequest(
    [FromQuery] string? roomName,
    [FromQuery] int? pageNumber = 1,
    [FromQuery] int? pageSize = null)
        {
            var validExamRoomIdsQuery = _context.StudentRequests
                .Select(sr => sr.ExamRoomId)
                .Distinct();

            var query = from sr in _context.StudentRequests
                        join r in _context.Requests on sr.RequestId equals r.RequestId
                        join srs in _context.StudentRoomSubjects on sr.StudentId equals srs.StudentId
                        join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                        where validExamRoomIdsQuery.Contains(examRoom.ExamRoomId)
                        select new
                        {
                            r,
                            sr,
                            srs,
                            examRoom
                        };

            if (!string.IsNullOrEmpty(roomName))
            {
                query = query.Where(x => x.examRoom != null && x.examRoom.RoomName.ToLower() == roomName.ToLower());
            }

            var requestsQuery = from x in query
                                join student in _context.Students on x.sr.StudentId equals student.StudentId into stj
                                from student in stj.DefaultIfEmpty()
                                join subject in _context.Subjects on x.srs.SubjectId equals subject.SubjectId into subj
                                from subject in subj.DefaultIfEmpty()
                                select new
                                {
                                    x.examRoom.ExamRoomId,
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
                                };

            var groupedRequests = await requestsQuery
                                    .GroupBy(r => r.RequestId)
                                    .Select(g => g.FirstOrDefault())
                                    .ToListAsync();

            var totalRequests = groupedRequests.Count();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                groupedRequests = groupedRequests
                                  .OrderByDescending(r => r.RequestDate)
                                  .Skip((pageNumber.Value - 1) * pageSize.Value)
                                  .Take(pageSize.Value)
                                  .ToList();
            }
            else
            {
                groupedRequests = groupedRequests
                                  .OrderByDescending(r => r.RequestDate)
                                  .ToList();
            }

            if (!groupedRequests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                TotalRequests = totalRequests,
                Requests = groupedRequests
            });
        }

        [HttpGet("ExportRequestsToExcel")]
        public async Task<IActionResult> ExportRequestsToExcel(
[FromQuery] uint? requestById = null,
[FromQuery] DateTime? FromDate = null,
[FromQuery] DateTime? ToDate = null,
[FromQuery] string? semester = null,
[FromQuery] string? requestTitle = null,
[FromQuery] string? room = null,
[FromQuery] string? status = null)
        {
            try
            {
                var validExamRoomIdsQuery = _context.StudentRequests
                    .Select(sr => sr.ExamRoomId)
                    .Distinct();

                var query = from sr in _context.StudentRequests
                            join r in _context.Requests on sr.RequestId equals r.RequestId
                            join srs in _context.StudentRoomSubjects on sr.StudentId equals srs.StudentId
                            join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                            where validExamRoomIdsQuery.Contains(examRoom.ExamRoomId) &&
                                  (semester == null || examRoom.Schedule.Semester == semester) &&
                                  (requestById == null || r.RequestById == requestById) &&
                                  (requestTitle == null || r.RequestTitle.Contains(requestTitle)) &&
                                  (room == null || examRoom.RoomName.Contains(room)) &&
                                  (status == null || r.ResolveStatus.Contains(status)) &&
                                  (!FromDate.HasValue || r.RequestDate >= FromDate) &&
                                  (!ToDate.HasValue || r.RequestDate <= ToDate)
                            select new
                            {
                                sr,
                                r,
                                srs,
                                examRoom
                            };

                var exportData = from x in query
                                 join student in _context.Students on x.sr.StudentId equals student.StudentId into stj
                                 from student in stj.DefaultIfEmpty()
                                 join subject in _context.Subjects on x.srs.SubjectId equals subject.SubjectId into subj
                                 from subject in subj.DefaultIfEmpty()
                                 select new
                                 {
                                     x.examRoom.ExamRoomId,
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
                                     x.r.ResponseNote,

                                     HandlerNote = x.r.Note
                                 };

                // Create a new workbook and worksheet
                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Requests");

                    // Set headers
                    worksheet.Cell(1, 1).Value = "Roll No";
                    worksheet.Cell(1, 2).Value = "Full Name";
                    worksheet.Cell(1, 3).Value = "Subject";
                    worksheet.Cell(1, 4).Value = "Room";
                    worksheet.Cell(1, 5).Value = "Proctor";
                    worksheet.Cell(1, 6).Value = "Request";
                    worksheet.Cell(1, 7).Value = "Request Date";
                    worksheet.Cell(1, 8).Value = "Status";
                    worksheet.Cell(1, 9).Value = "Request Handler";
                    worksheet.Cell(1, 10).Value = "Resolve Date";
                    worksheet.Cell(1, 11).Value = "Proctor Note";
                    worksheet.Cell(1, 12).Value = "Handler Note";

                    // Populate data rows
                    int row = 2;
                    foreach (var item in exportData)
                    {
                        worksheet.Cell(row, 1).Value = item.StudentIdNumber;
                        worksheet.Cell(row, 2).Value = item.FullName;
                        worksheet.Cell(row, 3).Value = item.SubjectCode;
                        worksheet.Cell(row, 4).Value = item.RoomName;
                        worksheet.Cell(row, 5).Value = item.ProctorEmail;
                        worksheet.Cell(row, 6).Value = item.RequestTitle;
                        worksheet.Cell(row, 7).Value = item.RequestDate.HasValue ? item.RequestDate.Value.ToString("yyyy-MM-dd HH:mm") : "";
                        worksheet.Cell(row, 8).Value = item.ResolveStatus;
                        worksheet.Cell(row, 9).Value = item.RequestHandlerEmail;
                        worksheet.Cell(row, 10).Value = item.ResolveDate.HasValue ? item.ResolveDate.Value.ToString("yyyy-MM-dd HH:mm") : "";
                        worksheet.Cell(row, 11).Value = item.Note;

                        worksheet.Cell(row, 12).Value = item.HandlerNote;
                        row++;
                    }

                    // Auto-fit columns for better readability
                    worksheet.Columns().AdjustToContents();

                    // MemoryStream to store the Excel file
                    using (var stream = new MemoryStream())
                    {
                        // Save the Excel file to the MemoryStream
                        workbook.SaveAs(stream);
                        stream.Position = 0;

                        // Return the Excel file as a downloadable attachment
                        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "requests.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting data to Excel.");
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
            var query = _context.Requests.AsQueryable();

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



