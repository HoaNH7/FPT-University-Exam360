using System;
using Azure.Core;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class ReceiveViolationController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ReceiveViolationController(SEP490_V3Context _context)
        {
            this._context = _context;
        }
        [HttpGet("GetAllViolationByProctorId")]
        public async Task<IActionResult> GetViolation(
        [FromQuery] string? roomName,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
         {
        // Câu truy vấn lấy các examRoomId hợp lệ
        var validExamRoomIdsQuery = _context.StudentViolations
            .Select(sv => sv.ExamRoomId)
            .Distinct();

        // Câu truy vấn chính
        var query = from sv in _context.StudentViolations
                    join v in _context.Violations on sv.ViolationId equals v.ViolationId
                    join srs in _context.StudentRoomSubjects on sv.StudentId equals srs.StudentId
                    join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId
                    where validExamRoomIdsQuery.Contains(examRoom.ExamRoomId)
                    select new
                    {
                        v,
                        sv,
                        srs,
                        examRoom
                    };

        // Lọc theo tên phòng nếu có
        if (!string.IsNullOrEmpty(roomName))
        {
            query = query.Where(x => x.examRoom != null && x.examRoom.RoomName.ToLower() == roomName.ToLower());
        }

        // Câu truy vấn lấy dữ liệu cuối cùng
        var violationsQuery = from x in query
                              join student in _context.Students on x.sv.StudentId equals student.StudentId into stj
                              from student in stj.DefaultIfEmpty()
                              join subject in _context.Subjects on x.srs.SubjectId equals subject.SubjectId into subj
                              from subject in subj.DefaultIfEmpty()
                              select new
                              {
                                  x.examRoom.ExamRoomId,
                                  x.v.ViolationId,
                                  x.v.ViolationTitle,
                                  x.v.Note,
                                  x.v.ReportDate,
                                  x.v.ResolveDate,
                                  x.v.ResolveStatus,
                                  ProctorEmail = _context.Users
                                      .Where(u => u.UserId == x.v.ReportById)
                                      .Select(u => u.Email)
                                      .FirstOrDefault(),
                                  ResolvedEmail = _context.Users
                                      .Where(u => u.UserId == x.v.ResolveById)
                                      .Select(u => u.Email)
                                      .FirstOrDefault(),
                                  StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                  FullName = student != null ? student.FullName : null,
                                  RoomName = x.examRoom != null ? x.examRoom.RoomName : null,
                                  SubjectCode = subject != null ? subject.SubjectCode : null,
                                  x.v.ResponseNote
                              };

        // Nhóm theo ViolationId và lấy kết quả
        var groupedViolations = await violationsQuery
                                    .GroupBy(v => v.ViolationId)
                                    .Select(g => g.FirstOrDefault())
                                    .ToListAsync();

        var totalViolations = groupedViolations.Count();

        // Phân trang nếu cần
        if (pageSize.HasValue && pageSize.Value > 0)
        {
            groupedViolations = groupedViolations
                                  .OrderByDescending(v => v.ReportDate)
                                  .Skip((pageNumber.Value - 1) * pageSize.Value)
                                  .Take(pageSize.Value)
                                  .ToList();
        }
        else
        {
            groupedViolations = groupedViolations
                                  .OrderByDescending(v => v.ReportDate)
                                  .ToList();
        }

        if (!groupedViolations.Any())
        {
            return NotFound("No violations found for the provided criteria.");
        }

        return Ok(new
        {
            TotalViolations = totalViolations,
            Violations = groupedViolations
        });
    }




        [HttpGet("GetAllViolationByProctorIdAndCheckOut")]
        public async Task<IActionResult> GetAllViolationByProctorIdAndCheckOut(
            [FromQuery] uint? violationById,
            [FromQuery] string? date,
            [FromQuery] string? time,
            [FromQuery] string? violationDate,
            [FromQuery] string? resolvedEmail,
            [FromQuery] string? roomName,
            [FromQuery] int? pageNumber = 1,
            [FromQuery] int? pageSize = null
            )
        {
            var query = _context.Violations.AsQueryable();

            if (violationById.HasValue)
            {
                query = query.Where(r => r.ReportById == violationById.Value);
            }

            if (!string.IsNullOrEmpty(date))
            {
                if (DateTime.TryParseExact(date, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out DateTime dateValue))
                {
                    query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value.Date == dateValue.Date);
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
                    query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value.TimeOfDay == timeValue.TimeOfDay);
                }
                else
                {
                    return BadRequest("Invalid time format. Please use 'HH:mm'.");
                }
            }

            if (!string.IsNullOrEmpty(violationDate))
            {
                if (DateTime.TryParseExact(violationDate, "yyyy-MM-dd", null, System.Globalization.DateTimeStyles.None, out DateTime dateTime))
                {
                    query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value.Date == dateTime.Date);
                }
                else
                {
                    return BadRequest("Invalid dateTime format. Please use 'yyyy-MM-dd'.");
                }
            }

            if (!string.IsNullOrEmpty(resolvedEmail))
            {
                var proctor = await _context.Users.FirstOrDefaultAsync(u => u.Email == resolvedEmail);
                if (proctor != null)
                {
                    query = query.Where(r => r.ResolveById == proctor.UserId);
                }
            }

            query = query.OrderByDescending(r => r.ReportDate);

            var totalViolations = await query.CountAsync();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }
            var violations = await (from r in query
                                    join sv in _context.StudentViolations on r.ViolationId equals sv.ViolationId into svj
                                    from sv in svj.DefaultIfEmpty()
                                    join srs in _context.StudentRoomSubjects on sv.StudentId equals srs.StudentId into srsj
                                    from srs in srsj.DefaultIfEmpty()
                                    join student in _context.Students on sv.StudentId equals student.StudentId into stj
                                    from student in stj.DefaultIfEmpty()
                                    join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId into erj
                                    from examRoom in erj.DefaultIfEmpty()
                                    join examCode in _context.ExamCodes on srs.Subject.SubjectId equals examCode.SubjectId into ecrj
                                    from examCode in ecrj.DefaultIfEmpty()
                                    join subject in _context.Subjects on srs.SubjectId equals subject.SubjectId into subj
                                    from subject in subj.DefaultIfEmpty()
                                    where string.IsNullOrEmpty(roomName) || (examRoom != null && examRoom.RoomName.ToLower() == roomName.ToLower())
                                    select new
                                    {
                                        r.ViolationId,
                                        r.ResolveById,
                                        r.ViolationTitle,
                                        r.Note,
                                        r.ReportDate,
                                        r.ResolveDate,
                                        r.ResolveStatus,
                                        ProctorEmail = _context.Users
                                            .Where(u => u.UserId == r.ReportById)
                                            .Select(u => u.Email)
                                            .FirstOrDefault(),
                                        //ResolvedEmail = _context.Users
                                        //    .Where(u => u.UserId == r.ResolveById)
                                        //    .Select(u => u.Email)
                                        //    .FirstOrDefault(),
                                        StudentId = student != null ? student.StudentId : (uint?)null,
                                        StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                        FullName = student != null ? student.FullName : null,
                                        RoomName = examRoom != null ? examRoom.RoomName : null,
                                        SubjectCode = subject != null ? subject.SubjectCode : null,
                                        r.ResponseNote
                                    })
                                    .GroupBy(r => r.ViolationId)
                                    .Select(g => g.FirstOrDefault())
                                    .ToListAsync();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            return Ok(new
            {
                TotalViolations = totalViolations,
                Violations = violations
            });
        }



        [HttpPut("UpdateViolations")]
        public async Task<ActionResult> UpdateViolations([FromBody] List<HandleViolationDto> listHandleViolationDto)
        {
            var resolveId = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(resolveId, out uint resolveIdInt);
            try
            {
                if (listHandleViolationDto == null || !listHandleViolationDto.Any())
                {
                    return BadRequest("Invalid request data.");
                }

                var updateResult = new List<string>();

                foreach (var handleViolationDto in listHandleViolationDto)
                {
                    if (handleViolationDto == null || string.IsNullOrWhiteSpace(handleViolationDto.StudentIdNumber) || handleViolationDto.ViolationId <= 0)
                    {
                        return BadRequest("Invalid request data in one of the requests.");
                    }

                    // Tìm kiếm sinh viên trong cơ sở dữ liệu dựa trên StudentIdNumber
                    var student = await _context.Students
                        .Where(x => x.StudentIdNumber == handleViolationDto.StudentIdNumber)
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
                        return NotFound($"Student not found for StudentIdNumber: {handleViolationDto.StudentIdNumber}");
                    }

                    // Tìm kiếm vi phạm dựa trên ViolationId và StudentId
                    var violation = await _context.StudentViolations
                        .Include(x => x.Violation)
                        .Where(x => x.Violation.ViolationId == handleViolationDto.ViolationId && x.StudentId == student.StudentId)
                        .FirstOrDefaultAsync();

                    // Nếu không tìm thấy vi phạm, trả về phản hồi không tìm thấy
                    if (violation == null)
                    {
                        return NotFound($"Violation not found for ViolationId: {handleViolationDto.ViolationId} and StudentIdNumber: {handleViolationDto.StudentIdNumber}");
                    }

                    // Cập nhật các thông tin của vi phạm
                    violation.Violation.ResolveStatus = handleViolationDto.ResolveStatus;
                    violation.Violation.ResolveDate = DateTime.Now;
                    violation.Violation.ResolveById = resolveIdInt; // Thay 54 bằng resolveIdInt khi đăng nhập qua trình duyệt
                    violation.Violation.ResponseNote = handleViolationDto.ResponseNote;

                    await _context.SaveChangesAsync();
                }

                return Ok("Violations updated successfully.");
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"InvalidCastException: {ex.Message}");
                return StatusCode(500, $"An error occurred while updating the violations. Invalid data type: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(500, $"An error occurred while updating the violations: {ex.Message}");
            }
        }

        [HttpGet("SearchViolations")]
        public async Task<IActionResult> SearchViolations([FromQuery] SearchViolationDto searchCriteria)
        {
            var query = _context.Violations.AsQueryable();

            if (searchCriteria.ViolationFrom.HasValue && searchCriteria.ViolationTo.HasValue)
            {
                query = query.Where(r => r.ReportDate.HasValue && r.ReportDate.Value.Date >= searchCriteria.ViolationFrom.Value.Date && r.ReportDate.Value.Date <= searchCriteria.ViolationTo.Value.Date);
            }

            if (!string.IsNullOrEmpty(searchCriteria.ViolationTitle))
            {
                query = query.Where(r => r.ViolationTitle.Contains(searchCriteria.ViolationTitle));
            }

            if (searchCriteria.ViolationById.HasValue)
            {
                query = query.Where(r => r.ReportById == searchCriteria.ViolationById.Value);
            }

            if (!string.IsNullOrEmpty(searchCriteria.ResolveStatus))
            {
                query = query.Where(r => r.ResolveStatus == searchCriteria.ResolveStatus);
            }

            if (!string.IsNullOrEmpty(searchCriteria.RoomName))
            {
                query = query.Where(r => _context.ExamRooms.Any(er => er.RoomName == searchCriteria.RoomName && er.ExamRoomId == _context.StudentRoomSubjects.FirstOrDefault(srs => srs.StudentId == _context.StudentViolations.FirstOrDefault(sv => sv.ViolationId == r.ViolationId).StudentId).ExamRoomId));
            }

            if (!string.IsNullOrEmpty(searchCriteria.Semester))
            {
                query = query.Where(r => _context.Schedules.Any(sch => sch.Semester == searchCriteria.Semester && sch.ScheduleId == _context.ExamRooms.FirstOrDefault(er => er.ExamRoomId == _context.StudentRoomSubjects.FirstOrDefault(srs => srs.StudentId == _context.StudentViolations.FirstOrDefault(sv => sv.ViolationId == r.ViolationId).StudentId).ExamRoomId).ScheduleId));
            }

            var violations = await (from r in query
                                    join sv in _context.StudentViolations on r.ViolationId equals sv.ViolationId into svj
                                    from sv in svj.DefaultIfEmpty()
                                    join student in _context.Students on sv.StudentId equals student.StudentId into stj
                                    from student in stj.DefaultIfEmpty()
                                    join srs in _context.StudentRoomSubjects on sv.StudentId equals srs.StudentId into srsj
                                    from srs in srsj.DefaultIfEmpty()
                                    join examRoom in _context.ExamRooms.Include(er => er.Proctor).Include(er => er.Schedule) on srs.ExamRoomId equals examRoom.ExamRoomId into erj
                                    from examRoom in erj.DefaultIfEmpty()
                                    join subject in _context.Subjects on srs.SubjectId equals subject.SubjectId into subj
                                    from subject in subj.DefaultIfEmpty()
                                    select new
                                    {
                                        r.ViolationId,
                                        r.ViolationTitle,
                                        r.Note,
                                        r.ReportDate,
                                        r.ResolveDate,
                                        r.ResolveStatus,
                                        ProctorEmail = _context.Users
                                            .Where(u => u.UserId == r.ReportById)
                                            .Select(u => u.Email)
                                            .FirstOrDefault(),
                                        ResolvedEmail = _context.Users
                                            .Where(u => u.UserId == r.ResolveById)
                                            .Select(u => u.Email)
                                            .FirstOrDefault(),
                                        StudentId = student != null ? student.StudentId : (uint?)null,
                                        StudentIdNumber = student != null ? student.StudentIdNumber : null,
                                        FullName = student != null ? student.FullName : null,
                                        RoomName = examRoom != null ? examRoom.RoomName : null,
                                        SubjectName = subject != null ? subject.SubjectName : null,
                                        Semester = examRoom != null ? examRoom.Schedule.Semester : null
                                    })
                                    .ToListAsync();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            return Ok(violations);
        }


        [HttpGet("ExportViolationStatisticsToExcel")]
        public async Task<IActionResult> ExportViolationStatisticsToExcel(
        [FromQuery] uint? violationById = null,
        [FromQuery] DateTime? FromDate = null,
        [FromQuery] DateTime? ToDate = null,
        [FromQuery] string? semester = null,
        [FromQuery] string? violationTitle = null,
        [FromQuery] string? room = null,
        [FromQuery] string? status = null,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {
            var query = from v in _context.Violations
                        join sv in _context.StudentViolations on v.ViolationId equals sv.ViolationId
                        join s in _context.Students on sv.StudentId equals s.StudentId
                        join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                        join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                        join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                        join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                        join u in _context.Users on v.ReportById equals u.UserId
                        // Removed campus join since campusName filter is no longer used
                        where (semester == null || sch.Semester == semester) &&
                              (violationById == null || v.ReportById == violationById) &&
                              (violationTitle == null || v.ViolationTitle.Contains(violationTitle)) &&
                              (room == null || er.RoomName.Contains(room)) &&
                              (status == null || v.ResolveStatus.Contains(status))
                        select new
                        {
                            StudentIdNumber = s.StudentIdNumber,
                            FullName = s.FullName,
                            Subject = sub.SubjectName,
                            Room = er.RoomName,
                            ProctorMail = u.Email,
                            Violation = v.ViolationTitle,
                            ViolationDate = v.ReportDate,
                            Status = v.ResolveStatus,
                            Note = v.Note
                        };

            // Apply date filters
            if (FromDate.HasValue)
            {
                query = query.Where(r => r.ViolationDate.HasValue && r.ViolationDate.Value.Date >= FromDate.Value.Date);
            }

            if (ToDate.HasValue)
            {
                query = query.Where(r => r.ViolationDate.HasValue && r.ViolationDate.Value.Date <= ToDate.Value.Date);
            }

            var totalRecords = await query.CountAsync();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var violations = await query.Distinct().ToListAsync();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            // Create a new workbook and worksheet
            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Violation Statistics");

                // Set headers
                worksheet.Cell(1, 1).Value = "Roll No";
                worksheet.Cell(1, 2).Value = "Full Name";
                worksheet.Cell(1, 3).Value = "Subject";
                worksheet.Cell(1, 4).Value = "Room";
                worksheet.Cell(1, 5).Value = "Proctor Mail";
                worksheet.Cell(1, 6).Value = "Violation";
                worksheet.Cell(1, 7).Value = "Violation Date";
                worksheet.Cell(1, 8).Value = "Status";
                worksheet.Cell(1, 9).Value = "Note";

                // Populate data rows
                int row = 2;
                foreach (var item in violations)
                {
                    worksheet.Cell(row, 1).Value = item.StudentIdNumber;
                    worksheet.Cell(row, 2).Value = item.FullName;
                    worksheet.Cell(row, 3).Value = item.Subject;
                    worksheet.Cell(row, 4).Value = item.Room;
                    worksheet.Cell(row, 5).Value = item.ProctorMail;
                    worksheet.Cell(row, 6).Value = item.Violation;
                    worksheet.Cell(row, 7).Value = item.ViolationDate?.ToString("yyyy-MM-dd HH:mm");
                    worksheet.Cell(row, 8).Value = item.Status;
                    worksheet.Cell(row, 9).Value = item.Note;
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
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "violation_statistics.xlsx");
                }
            }
        }




    }
}

