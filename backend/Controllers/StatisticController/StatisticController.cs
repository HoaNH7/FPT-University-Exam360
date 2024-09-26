using backend.Authorization;
using backend.DTOs;
using backend.Models;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.InkML;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static backend.Controllers.MockAPI.MockExamScheduleController;


namespace backend.Controllers.StatisticController
{
    [Authorize(Authorization.Role.ExaminerHead)]
    [Route("api/[controller]")]
    [ApiController]
    public class StatisticController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public StatisticController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("ExportRoomListToExcel")]
        public async Task<IActionResult> ExportRoomListToExcel(string? semester, string? roomName, string? proctorName, string? fromDate, string? toDate, int? pageNumber = 1, int? pageSize = null)
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

                DateTime? startDate = null;
                DateTime? endDate = null;

                if (!string.IsNullOrEmpty(fromDate))
                {
                    startDate = DateTime.ParseExact(fromDate, "yyyy-MM-dd", null);
                    query = query.Where(er => er.Schedule.StartTime >= startDate);
                }

                if (!string.IsNullOrEmpty(toDate))
                {
                    endDate = DateTime.ParseExact(toDate, "yyyy-MM-dd", null).AddDays(1).AddTicks(-1);
                    query = query.Where(er => er.Schedule.EndTime <= endDate);
                }

                var itemsQuery = query
                    .Select(er => new
                    {
                        RoomName = er.RoomName,
                        StartTime = er.Schedule.StartTime,
                        EndTime = er.Schedule.EndTime,
                        Semester = er.Schedule.Semester,
                        Status = er.Schedule.ExamCodes.Select(ec => ec.Status).FirstOrDefault(),
                        MainProctorEmail = er.Proctor.Email,
                        AdditionalProctors = _context.ExamRoomProctors
                            .Where(erp => erp.ExamRoomId == er.ExamRoomId)
                            .Select(erp => erp.Proctor.Email)
                            .ToList()
                    });

                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
                }

                var items = await itemsQuery.ToListAsync();

                if (!items.Any())
                {
                    return NotFound("No data found to export.");
                }

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("RoomList");

                    worksheet.Cell(1, 1).Value = "No";
                    worksheet.Cell(1, 2).Value = "Room Name";
                    worksheet.Cell(1, 3).Value = "Start Time";
                    worksheet.Cell(1, 4).Value = "End Time";
                    worksheet.Cell(1, 5).Value = "Proctor 1";
                    worksheet.Cell(1, 6).Value = "Proctor 2";
                    worksheet.Cell(1, 7).Value = "Semester";

                    int row = 2;
                    foreach (var item in items)
                    {
                        worksheet.Cell(row, 1).Value = row - 1; // No
                        worksheet.Cell(row, 2).Value = item.RoomName;
                        worksheet.Cell(row, 3).Value = item.StartTime.ToString("yyyy-MM-dd HH:mm");
                        worksheet.Cell(row, 4).Value = item.EndTime.ToString("HH:mm");
                        worksheet.Cell(row, 5).Value = item.MainProctorEmail;
                        worksheet.Cell(row, 6).Value = string.Join(", ", item.AdditionalProctors);
                        worksheet.Cell(row, 7).Value = item.Semester;
                        row++;
                    }

                    worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "assign_proctor.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }



        [HttpGet("ExportRetakeExamToExcel")]
        public async Task<IActionResult> ExportRetakeExamToExcel(
    [FromQuery] DateTime? fromDate = null,
    [FromQuery] DateTime? toDate = null,
    [FromQuery] string? subjectCode = null,
    [FromQuery] string? room = null)
        {
            try
            {
                // Define the end of the day for toDate
                DateTime endOfDayToDate = toDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;

                var query = from er in _context.ExamRooms
                            join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                            join srs in _context.StudentRoomSubjects on er.ExamRoomId equals srs.ExamRoomId
                            join s in _context.Subjects on srs.SubjectId equals s.SubjectId
                            join st in _context.Students on srs.StudentId equals st.StudentId
                            join u in _context.Users on er.ProctorId equals u.UserId
                            where (fromDate == null || sch.StartTime >= fromDate.Value)
                                && (toDate == null || sch.EndTime <= endOfDayToDate)
                                && (string.IsNullOrEmpty(subjectCode) || s.SubjectCode == subjectCode)
                                && (string.IsNullOrEmpty(room) || er.RoomName == room)
                                && er.Attempt == "2NDFE"
                            select new
                            {
                                No = 1, // Placeholder, will be updated during iteration
                                RollNo = st.StudentIdNumber,
                                ExamRoom = er.RoomName,
                                SubjectCode = s.SubjectCode,
                                Note = srs.Note,
                                Date = sch.StartTime.Date,
                                StartTime = sch.StartTime,
                                EndTime = sch.EndTime,
                                Attempt = er.Attempt,
                                ProctorEmail = u.Email
                            };

                var exportData = await query.ToListAsync();

                if (!exportData.Any())
                {
                    return NotFound("No data found to export.");
                }

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("RetakeExam");

                    worksheet.Cell(1, 1).Value = "No";
                    worksheet.Cell(1, 2).Value = "Roll No";
                    worksheet.Cell(1, 3).Value = "Exam Room";
                    worksheet.Cell(1, 4).Value = "Subject Code";
                    worksheet.Cell(1, 5).Value = "Note";
                    worksheet.Cell(1, 6).Value = "Date";
                    worksheet.Cell(1, 7).Value = "Start Time";
                    worksheet.Cell(1, 8).Value = "End Time";
                    worksheet.Cell(1, 9).Value = "Attempt";
                    worksheet.Cell(1, 10).Value = "Proctor Email";

                    int row = 2;
                    foreach (var item in exportData)
                    {
                        worksheet.Cell(row, 1).Value = row - 1; // Setting row number
                        worksheet.Cell(row, 2).Value = item.RollNo;
                        worksheet.Cell(row, 3).Value = item.ExamRoom;
                        worksheet.Cell(row, 4).Value = item.SubjectCode;
                        worksheet.Cell(row, 5).Value = item.Note;
                        worksheet.Cell(row, 6).Value = item.Date.ToString("yyyy-MM-dd");
                        worksheet.Cell(row, 7).Value = item.StartTime.ToString("HH:mm");
                        worksheet.Cell(row, 8).Value = item.EndTime.ToString("HH:mm");
                        worksheet.Cell(row, 9).Value = item.Attempt;
                        worksheet.Cell(row, 10).Value = item.ProctorEmail;
                        row++;
                    }

                    worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "retake_exam.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }



        [HttpGet("ExportExamCodesToExcel")]
        public async Task<IActionResult> ExportExamCodesToExcel(DateTime? fromDate = null, DateTime? toDate = null, string? subjectCode = null, int? pageNumber = 1, int? pageSize = null)
        {
            try
            {
                // Define the end of the day for toDate
                DateTime endOfDayToDate = toDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;

                var query = from e in _context.ExamCodes
                            join s in _context.Subjects on e.SubjectId equals s.SubjectId
                            join sch in _context.Schedules on e.ScheduleId equals sch.ScheduleId
                            select new ExamCodeSubjectScheduleDTO
                            {
                                ExamCodeId = e.ExamCodeId,
                                ExamCode = e.Code,
                                OpenCode = e.OpenCode,
                                Title = e.Title,
                                SubjectName = s.SubjectName,
                                SubjectCode = s.SubjectCode,
                                StartTime = sch.StartTime,
                                EndTime = sch.EndTime,
                                Semester = sch.Semester,
                                Status = e.Status,
                                Section = e.Section,
                            };

                if (fromDate.HasValue)
                {
                    query = query.Where(x => x.StartTime >= fromDate.Value);
                }

                if (toDate.HasValue)
                {
                    query = query.Where(x => x.EndTime <= endOfDayToDate);
                }

                if (!string.IsNullOrEmpty(subjectCode))
                {
                    query = query.Where(x => x.SubjectCode == subjectCode);
                }

                var totalCount = await query.CountAsync();
                var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

                if (pageNumber.HasValue && pageNumber.Value > totalPages)
                {
                    pageNumber = totalPages;
                }

                var itemsQuery = query;

                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
                }

                var examCodes = await itemsQuery.ToListAsync();

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("ExamCodes");

                    worksheet.Cell(1, 1).Value = "ExamCode";
                    worksheet.Cell(1, 2).Value = "OpenCode";
                    worksheet.Cell(1, 3).Value = "Title";
                    worksheet.Cell(1, 4).Value = "Section";
                    worksheet.Cell(1, 5).Value = "SubjectName";
                    worksheet.Cell(1, 6).Value = "SubjectCode";
                    worksheet.Cell(1, 7).Value = "Date";
                    worksheet.Cell(1, 8).Value = "StartTime";
                    worksheet.Cell(1, 9).Value = "EndTime";

                    for (int i = 0; i < examCodes.Count; i++)
                    {
                        var examCode = examCodes[i];
                        worksheet.Cell(i + 2, 1).Value = examCode.ExamCode;
                        worksheet.Cell(i + 2, 2).Value = examCode.OpenCode;
                        worksheet.Cell(i + 2, 3).Value = examCode.Title;
                        worksheet.Cell(i + 2, 4).Value = examCode.Section;
                        worksheet.Cell(i + 2, 5).Value = examCode.SubjectName;
                        worksheet.Cell(i + 2, 6).Value = examCode.SubjectCode;
                        worksheet.Cell(i + 2, 7).Value = examCode.StartTime.ToString("yyyy/MM/dd");
                        worksheet.Cell(i + 2, 8).Value = examCode.StartTime.ToString("HH:mm");
                        worksheet.Cell(i + 2, 9).Value = examCode.EndTime.ToString("HH:mm");
                    }

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        var content = stream.ToArray();
                        return File(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "ExamCodes.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }


        [HttpGet("GetAbsentStudents")]
        public async Task<IActionResult> GetAbsentStudents(
        [FromQuery] string? campusName,
        [FromQuery] string? examRoomName,
        [FromQuery] string? subjectCode,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {
            var query = (from s in _context.Students
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                         join ckin in _context.Checkins on s.StudentId equals ckin.StudentId
                         join u in _context.Users on er.ProctorId equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where sch.StartTime >= startTime &&
                               (campusName == null || c.CampusName == campusName) &&
                               (examRoomName == null || er.RoomName == examRoomName) &&
                               (subjectCode == null || sub.SubjectCode == subjectCode) &&
                               (semester == null || sch.Semester == semester) &&
                               ckin.IsCheckin == false
                         select new
                         {
                             s.StudentId,
                             s.StudentIdNumber,
                             s.FullName,
                             s.CitizenIdentity,
                             ProctorEmail = u.Email,
                             RoomName = er.RoomName,
                             SubjectCode = sub.SubjectCode,
                             Semester = sch.Semester,
                             sch.StartTime,
                             sch.EndTime
                         }).ToList().DistinctBy(s => s.StudentId);

            var totalRecords = query.Count();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var absentStudents = query
                .ToList();

            if (!absentStudents.Any())
            {
                return NotFound("No absent students found for the provided criteria.");
            }


            var absentStudent = absentStudents.Select(a => new
            {
                a.StudentId,
                a.StudentIdNumber,
                a.FullName,
                a.CitizenIdentity,
                a.ProctorEmail,
                a.RoomName,
                a.SubjectCode,
                a.Semester,
                Date = a.StartTime.Date,
                ProctoringTime = $"{a.StartTime:HH:mm} - {a.EndTime:HH:mm}" // Format as "Start Time - End Time"
            });
            return Ok(new
            {
                totalCount = totalRecords,
                absentStudent
            });
        }


        [HttpGet("GetAbsentStudentsCount")]
        public async Task<IActionResult> GetAbsentStudentsCount(
   [FromQuery] string? campusName,
        [FromQuery] string? examRoomName,
        [FromQuery] string? subjectCode,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester
        )
        {
            var query = (from s in _context.Students
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                         join ckin in _context.Checkins on s.StudentId equals ckin.StudentId
                         join u in _context.Users on er.ProctorId equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where sch.StartTime >= startTime &&
                               (campusName == null || c.CampusName == campusName) &&
                               (examRoomName == null || er.RoomName == examRoomName) &&
                               (subjectCode == null || sub.SubjectCode == subjectCode) &&
                               (semester == null || sch.Semester == semester) &&
                               ckin.IsCheckin == false
                         select new
                         {
                             s.StudentId,
                             s.StudentIdNumber,
                             s.FullName,
                             s.CitizenIdentity,
                             ProctorEmail = u.Email,
                             RoomName = er.RoomName,
                             SubjectCode = sub.SubjectCode,
                             Semester = sch.Semester,
                             sch.StartTime,
                             sch.EndTime
                         }).ToList().DistinctBy(s => s.StudentId);

            var totalRecords = query.Count();


            var absentStudents = query
                .ToList();

            if (!absentStudents.Any())
            {
                return NotFound("No absent students found for the provided criteria.");
            }


            return Ok(new
            {
                totalCount = totalRecords,

            });
        }

        [HttpGet("GetPresentStudents")]
        public async Task<IActionResult> GetPresentStudents(
        [FromQuery] string? campusName,
        [FromQuery] string? examRoomName,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {

            var query = (from s in _context.Students
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                         join ckin in _context.Checkins on s.StudentId equals ckin.StudentId
                         join u in _context.Users on er.ProctorId equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where sch.StartTime >= startTime &&
                               (campusName == null || c.CampusName == campusName) &&
                               (examRoomName == null || er.RoomName == examRoomName) &&
                               (semester == null || sch.Semester == semester) &&
                               ckin.IsCheckin == true
                         select new
                         {
                             s.StudentId,
                             s.StudentIdNumber,
                             s.FullName,
                             s.CitizenIdentity,
                             ProctorEmail = u.Email,
                             RoomName = er.RoomName,
                             SubjectCode = sub.SubjectCode,
                             StartTime = sch.StartTime
                         }).ToList().DistinctBy(s => s.StudentId);

            var totalRecords = query.Count();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var presentStudents = query
                .ToList();

            if (!presentStudents.Any())
            {
                return NotFound("No present students found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,
                presentStudents
            });
        }

        [HttpGet("GetPresentStudentsCount")]
        public async Task<IActionResult> GetPresentStudentsCount(
        [FromQuery] string? campusName,
        [FromQuery] string? examRoomName,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester
        )
        {

            var query = (from s in _context.Students
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                         join ckin in _context.Checkins on s.StudentId equals ckin.StudentId
                         join u in _context.Users on er.ProctorId equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where sch.StartTime >= startTime &&
                               (campusName == null || c.CampusName == campusName) &&
                               (examRoomName == null || er.RoomName == examRoomName) &&
                               (semester == null || sch.Semester == semester) &&
                               ckin.IsCheckin == true
                         select new
                         {
                             s.StudentId,
                             s.StudentIdNumber,
                             s.FullName,
                             s.CitizenIdentity,
                             ProctorEmail = u.Email,
                             RoomName = er.RoomName,
                             SubjectCode = sub.SubjectCode,
                             StartTime = sch.StartTime
                         }).ToList().DistinctBy(s => s.StudentId);

            var totalRecords = query.Count();


            var presentStudents = query
                .ToList();

            if (!presentStudents.Any())
            {
                return NotFound("No present students found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,

            });
        }
        [HttpGet("GetRequestStatistics")]
        public async Task<IActionResult> GetRequestStatistics(
        [FromQuery] DateTime? startTime,
        [FromQuery] string? campusName,
        [FromQuery] string? semester,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {

            var query = (from r in _context.Requests
                         join sr in _context.StudentRequests on r.RequestId equals sr.RequestId
                         join s in _context.Students on sr.StudentId equals s.StudentId
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join u in _context.Users on r.RequestById equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where (startTime == null || sch.StartTime >= startTime) &&
                               (campusName == null || c.CampusName == campusName) &&
                               (semester == null || sch.Semester == semester)
                         select new
                         {
                             r.RequestId,
                             StudentIdNumber = s.StudentIdNumber,
                             ResolveStatus = r.ResolveStatus,
                             RequestTitle = r.RequestTitle,
                             StartTime = sch.StartTime,
                             EndTime = sch.EndTime,
                             ExamRoom = er.RoomName,
                             Semester = sch.Semester,
                             TimeDoing = $"{sch.StartTime:HH:mm} - {sch.EndTime:HH:mm}"
                         }).ToList().DistinctBy(x => x.RequestId);

            var totalRecords = query.Count();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var requests = query
                .ToList();

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,
                requests
            });
        }


        public static class FormatHelper
        {
            public static string FormatTimeRange(DateTime startTime, DateTime? endTime)
            {
                if (endTime.HasValue)
                {
                    return $"{startTime:HH:mm} - {endTime.Value:HH:mm}";
                }
                else
                {
                    return $"{startTime:HH:mm} -";
                }
            }
        }
        [HttpGet("GetRequestCount")]
        public async Task<IActionResult> GetRequestCount(
         [FromQuery] DateTime? startTime,
        [FromQuery] string? campusName,
        [FromQuery] string? semester
        )
        {

            var query = (from r in _context.Requests
                         join sr in _context.StudentRequests on r.RequestId equals sr.RequestId
                         join s in _context.Students on sr.StudentId equals s.StudentId
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join u in _context.Users on r.RequestById equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where (startTime == null || sch.StartTime >= startTime) &&
                               (campusName == null || c.CampusName == campusName) &&
                               (semester == null || sch.Semester == semester)
                         select new
                         {
                             r.RequestId,
                             StudentIdNumber = s.StudentIdNumber,
                             ResolveStatus = r.ResolveStatus,
                             RequestTitle = r.RequestTitle,
                             StartTime = sch.StartTime,
                             EndTime = sch.EndTime,
                             ExamRoom = er.RoomName,
                             Semester = sch.Semester,
                             TimeDoing = $"{sch.StartTime:HH:mm} - {sch.EndTime:HH:mm}"
                         }).ToList().DistinctBy(x => x.RequestId);

            var totalRecords = query.Count();


            var requests = query
                .ToList();

            if (!requests.Any())
            {
                return NotFound("No requests found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,

            });
        }

        [HttpGet("GetAllViolationStatistics")]
        public async Task<IActionResult> GetAllViolationStatistics(
        [FromQuery] DateTime? startTime,
        [FromQuery] string? campusName,
        [FromQuery] string? semester,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {

            var query = (from v in _context.Violations
                         join sv in _context.StudentViolations on v.ViolationId equals sv.ViolationId
                         join s in _context.Students on sv.StudentId equals s.StudentId
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join u in _context.Users on v.ReportById equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where (startTime == null || sch.StartTime >= startTime) &&
                               (campusName == null || c.CampusName == campusName) &&
                               (semester == null || sch.Semester == semester)
                         select new
                         {
                             v.ViolationId,
                             Date = sch.StartTime.Date,
                             StartTime = sch.StartTime,
                             EndTime = sch.EndTime,
                             StudentIdNumber = s.StudentIdNumber,
                             ResolveStatus = v.ResolveStatus,
                             ViolationTitle = v.ViolationTitle,
                             ExamRoom = er.RoomName,
                             Semester = sch.Semester,
                             TimeDoing = FormatHelper.FormatTimeRange(sch.StartTime, sch.EndTime)
                         }).ToList().DistinctBy(x => x.ViolationId);

            var totalRecords = query.Count();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var violations = query
                .ToList();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,
                violations
            });
        }





        [HttpGet("CountAllViolations")]
        public async Task<IActionResult> CountAllViolations(
        [FromQuery] DateTime? startTime,
        [FromQuery] string? campusName,
        [FromQuery] string? semester
        )
        {

            var query = (from v in _context.Violations
                         join sv in _context.StudentViolations on v.ViolationId equals sv.ViolationId
                         join s in _context.Students on sv.StudentId equals s.StudentId
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join u in _context.Users on v.ReportById equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where (startTime == null || sch.StartTime >= startTime) &&
                               (campusName == null || c.CampusName == campusName) &&
                               (semester == null || sch.Semester == semester)
                         select new
                         {
                             v.ViolationId,
                             Date = sch.StartTime.Date,
                             StartTime = sch.StartTime,
                             EndTime = sch.EndTime,
                             StudentIdNumber = s.StudentIdNumber,
                             ResolveStatus = v.ResolveStatus,
                             ViolationTitle = v.ViolationTitle,
                             ExamRoom = er.RoomName,
                             Semester = sch.Semester,
                             TimeDoing = FormatHelper.FormatTimeRange(sch.StartTime, sch.EndTime)
                         }).ToList().DistinctBy(x => x.ViolationId);

            var totalRecords = query.Count();


            var violations = query
                .ToList();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,

            });
        }




        [HttpGet("GetProctorsCount")]
        public async Task<IActionResult> GetProctorsCount(
        [FromQuery] string? campusName,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester)
        {
            var query = from u in _context.Users
                        join er in _context.ExamRooms on u.UserId equals er.ProctorId
                        join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                        join c in _context.Campuses on u.CampusId equals c.CampusId
                        where sch.StartTime >= startTime &&
                              (campusName == null || c.CampusName == campusName) &&
                              (semester == null || sch.Semester == semester)
                        group u by u.UserId into g
                        select new
                        {
                            ProctorId = g.Key
                        };

            var result = await query.ToListAsync();

            if (!result.Any())
            {
                return NotFound("No proctors found for the provided criteria.");
            }

            var response = new
            {
                ProctorCount = result.Count
            };

            return Ok(response);
        }

        [HttpGet("GetProctorsWithTotalProctoringTime")]
        public async Task<IActionResult> GetProctorsWithTotalProctoringTime(
        [FromQuery] string? campusName,
        [FromQuery] DateTime startTime,
        [FromQuery] string? semester,
        [FromQuery] int? pageNumber = 1,
        [FromQuery] int? pageSize = null)
        {

            var query = from u in _context.Users
                        join er in _context.ExamRooms on u.UserId equals er.ProctorId
                        join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                        join c in _context.Campuses on u.CampusId equals c.CampusId
                        where sch.StartTime >= startTime &&
                              (campusName == null || c.CampusName == campusName) &&
                              (semester == null || sch.Semester == semester)
                        select new
                        {
                            u.UserId,
                            u.Email,
                            CampusName = c.CampusName,
                            Semester = sch.Semester, // Add semester to the select projection
                            StartTime = sch.StartTime,
                            EndTime = sch.EndTime
                        };

            // Execute query to list of proctor data
            var proctorData = await query.ToListAsync();
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            // Group by proctor and calculate total proctoring time in memory
            var groupedProctors = proctorData
                .GroupBy(p => new { p.UserId, p.Email, p.CampusName, p.Semester }) // Include semester in the grouping key
                .Select(g => new
                {
                    ProctorEmail = g.Key.Email,
                    TotalProctoringTime = g.Sum(x => (x.EndTime - x.StartTime).TotalMinutes),
                    CampusName = g.Key.CampusName,
                    Semester = g.Key.Semester // Add semester to the final output
                });

            var totalRecords = groupedProctors.Count();

            var TimeProctors = groupedProctors
                .ToList();

            if (!TimeProctors.Any())
            {
                return NotFound("No proctors found for the provided criteria.");
            }

            return Ok(new
            {
                totalCount = totalRecords,

                TimeProctors
            });
        }

        [HttpGet("ExportAbsentStudentsToExcel")]
        public async Task<IActionResult> ExportAbsentStudentsToExcel(
    [FromQuery] string? campusName,
    [FromQuery] string? examRoomName,
    [FromQuery] string? subjectCode,
    [FromQuery] DateTime startTime,
    [FromQuery] DateTime? fromDate,
    [FromQuery] DateTime? toDate,
    [FromQuery] string? semester)
        {
            DateTime endOfDayToDate = toDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;


            var query = (from s in _context.Students
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                         join ckin in _context.Checkins on s.StudentId equals ckin.StudentId
                         join u in _context.Users on er.ProctorId equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where sch.StartTime >= startTime &&
                               (fromDate == null || sch.StartTime >= fromDate) &&
                               (toDate == null || sch.StartTime <= endOfDayToDate) &&
                               (campusName == null || c.CampusName == campusName) &&
                               (examRoomName == null || er.RoomName == examRoomName) &&
                               (subjectCode == null || sub.SubjectCode == subjectCode) &&
                               (semester == null || sch.Semester == semester) &&
                               ckin.IsCheckin == false
                         select new
                         {
                             s.StudentId,
                             s.StudentIdNumber,
                             s.FullName,
                             s.CitizenIdentity,
                             ProctorEmail = u.Email,
                             RoomName = er.RoomName,
                             SubjectCode = sub.SubjectCode,
                             Semester = sch.Semester,
                             sch.StartTime,
                             sch.EndTime
                         }).ToList().DistinctBy(s => s.StudentId);

            var absentStudents = query.ToList();

            if (!absentStudents.Any())
            {
                return NotFound("No absent students found for the provided criteria.");
            }

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Absent Students");

                worksheet.Cell(1, 1).Value = "RollNo";
                worksheet.Cell(1, 2).Value = "FullName";
                worksheet.Cell(1, 3).Value = "CitizenIdentity";
                worksheet.Cell(1, 4).Value = "ProctorEmail";
                worksheet.Cell(1, 5).Value = "RoomName";
                worksheet.Cell(1, 6).Value = "SubjectCode";
                worksheet.Cell(1, 7).Value = "Semester";
                worksheet.Cell(1, 8).Value = "Date";
                worksheet.Cell(1, 9).Value = "ProctoringTime";

                int row = 2;
                foreach (var student in absentStudents)
                {
                    worksheet.Cell(row, 1).Value = student.StudentIdNumber;
                    worksheet.Cell(row, 2).Value = student.FullName;
                    worksheet.Cell(row, 3).Value = student.CitizenIdentity;
                    worksheet.Cell(row, 4).Value = student.ProctorEmail;
                    worksheet.Cell(row, 5).Value = student.RoomName;
                    worksheet.Cell(row, 6).Value = student.SubjectCode;
                    worksheet.Cell(row, 7).Value = student.Semester;
                    worksheet.Cell(row, 8).Value = student.StartTime.Date.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 9).Value = $"{student.StartTime:HH:mm} - {student.EndTime:HH:mm}";

                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    stream.Position = 0;
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "absent_students.xlsx");
                }
            }
        }




        [HttpGet("ExportRequestStatisticsToExcel")]
        public async Task<IActionResult> ExportRequestStatisticsToExcel(
[FromQuery] uint? requestById = null,
[FromQuery] DateTime? FromDate = null,
[FromQuery] DateTime? ToDate = null,
[FromQuery] string? semester = null,
[FromQuery] string? requestTitle = null,
[FromQuery] string? room = null,
[FromQuery] string? status = null,
[FromQuery] int? pageNumber = 1,
[FromQuery] int? pageSize = null)
        {
            try
            {
                var query = (from r in _context.Requests
                             join sr in _context.StudentRequests on r.RequestId equals sr.RequestId
                             join s in _context.Students on sr.StudentId equals s.StudentId
                             join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                             join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                             join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                             join u in _context.Users on r.RequestById equals u.UserId
                             join c in _context.Campuses on u.CampusId equals c.CampusId
                             where (requestById == null || r.RequestById == requestById) &&
                                   (FromDate == null || r.RequestDate.HasValue && r.RequestDate.Value.Date >= FromDate.Value.Date) &&
                                   (ToDate == null || r.RequestDate.HasValue && r.RequestDate.Value.Date <= ToDate.Value.Date) &&
                                   (semester == null || sch.Semester == semester) &&
                                   (requestTitle == null || r.RequestTitle.Contains(requestTitle)) &&
                                   (room == null || er.RoomName.ToLower() == room.ToLower()) &&
                                   (status == null || r.ResolveStatus.ToLower() == status.ToLower())
                             select new
                             {
                                 r.RequestId,
                                 FullName = s.FullName,
                                 Subject = srs.Subject.SubjectName, // Assuming Subject is correctly linked
                                 Room = er.RoomName,
                                 Proctor = er.Proctor.Email, // Assuming Proctor has an Email property
                                 Request = r.RequestTitle,
                                 RequestDate = r.RequestDate,
                                 Status = r.ResolveStatus,
                                 Note = r.Note,
                                 TimePeriod = $"{sch.StartTime:HH:mm} - {sch.EndTime:HH:mm}"
                             }).ToList().DistinctBy(s => s.RequestId); ;

                var totalRecords = query.Count();

                if (pageSize.HasValue && pageSize.Value > 0)
                {
                    query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
                }

                var requests = query.Distinct().ToList();

                if (!requests.Any())
                {
                    return NotFound("No requests found for the provided criteria.");
                }

                // Create a new workbook and worksheet
                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("Request Statistics");

                    // Set headers
                    worksheet.Cell(1, 1).Value = "Full Name";
                    worksheet.Cell(1, 2).Value = "Subject";
                    worksheet.Cell(1, 3).Value = "Room";
                    worksheet.Cell(1, 4).Value = "Proctor";
                    worksheet.Cell(1, 5).Value = "Request";
                    worksheet.Cell(1, 6).Value = "Request Date";
                    worksheet.Cell(1, 7).Value = "Status";
                    worksheet.Cell(1, 8).Value = "Note";
                    worksheet.Cell(1, 9).Value = "Time Period"; // New header for Time Period

                    // Populate data rows
                    int row = 2;
                    foreach (var item in requests)
                    {
                        worksheet.Cell(row, 1).Value = item.FullName;
                        worksheet.Cell(row, 2).Value = item.Subject;
                        worksheet.Cell(row, 3).Value = item.Room;
                        worksheet.Cell(row, 4).Value = item.Proctor;
                        worksheet.Cell(row, 5).Value = item.Request;
                        worksheet.Cell(row, 6).Value = item.RequestDate.HasValue ? item.RequestDate.Value.ToString("yyyy-MM-dd HH:mm") : "";
                        worksheet.Cell(row, 7).Value = item.Status;
                        worksheet.Cell(row, 8).Value = item.Note;
                        worksheet.Cell(row, 9).Value = item.TimePeriod; // Populate Time Period
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
                        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "request_statistics.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(StatusCodes.Status500InternalServerError, "An error occurred while exporting data to Excel.");
            }
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
            DateTime endOfDayToDate = ToDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;

            var query = (from v in _context.Violations
                         join sv in _context.StudentViolations on v.ViolationId equals sv.ViolationId
                         join s in _context.Students on sv.StudentId equals s.StudentId
                         join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                         join er in _context.ExamRooms on srs.ExamRoomId equals er.ExamRoomId
                         join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                         join u in _context.Users on v.ReportById equals u.UserId
                         join c in _context.Campuses on u.CampusId equals c.CampusId
                         where (violationById == null || v.ReportById == violationById) &&
                               (FromDate == null || v.ReportDate >= FromDate) &&
                               (ToDate == null || v.ReportDate <= endOfDayToDate) &&
                               (semester == null || sch.Semester == semester) &&
                               (violationTitle == null || v.ViolationTitle.Contains(violationTitle)) &&
                               (room == null || er.RoomName.ToLower() == room.ToLower()) &&
                               (status == null || v.ResolveStatus.ToLower() == status.ToLower())
                         select new
                         {
                             v.ViolationId,
                             FullName = s.FullName,
                             Room = er.RoomName,
                             Violation = v.ViolationTitle,
                             Date = v.ReportDate.Value.Date,
                             Status = v.ResolveStatus,
                             Note = v.Note,
                             TimePeriod = $"{sch.StartTime:HH:mm} - {sch.EndTime:HH:mm}"
                         }).ToList().DistinctBy(x => x.ViolationId);

            var totalRecords = query.Count();

            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var violations = query.Distinct().ToList();

            if (!violations.Any())
            {
                return NotFound("No violations found for the provided criteria.");
            }

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Violations");

                worksheet.Cell(1, 1).Value = "Full Name";
                worksheet.Cell(1, 2).Value = "Room";
                worksheet.Cell(1, 3).Value = "Violation";
                worksheet.Cell(1, 4).Value = "Date";
                worksheet.Cell(1, 5).Value = "Status";
                worksheet.Cell(1, 6).Value = "Note";
                worksheet.Cell(1, 7).Value = "Time Period";

                int row = 2;
                foreach (var item in violations)
                {
                    worksheet.Cell(row, 1).Value = item.FullName;
                    worksheet.Cell(row, 2).Value = item.Room;
                    worksheet.Cell(row, 3).Value = item.Violation;
                    worksheet.Cell(row, 4).Value = item.Date.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 5).Value = item.Status;
                    worksheet.Cell(row, 6).Value = item.Note;
                    worksheet.Cell(row, 7).Value = item.TimePeriod;
                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    stream.Position = 0;
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "violations.xlsx");
                }
            }
        }


        [HttpGet("ExportProctorsWithTotalProctoringTimeToExcel")]
        public async Task<IActionResult> ExportProctorsWithTotalProctoringTimeToExcel(
    [FromQuery] string? campusName,
    [FromQuery] DateTime? FromDate,
    [FromQuery] DateTime? ToDate,
    [FromQuery] string? semester)
        {
            DateTime endOfDayToDate = ToDate?.Date.AddDays(1).AddTicks(-1) ?? DateTime.MaxValue;

            var query = from u in _context.Users
                        join er in _context.ExamRooms on u.UserId equals er.ProctorId
                        join sch in _context.Schedules on er.ScheduleId equals sch.ScheduleId
                        join c in _context.Campuses on u.CampusId equals c.CampusId
                        where (FromDate == null || sch.StartTime >= FromDate) &&
                              (ToDate == null || sch.StartTime <= endOfDayToDate) &&
                              (campusName == null || c.CampusName == campusName) &&
                              (semester == null || sch.Semester == semester)
                        select new
                        {
                            u.UserId,
                            u.Email,
                            CampusName = c.CampusName,
                            Semester = sch.Semester,
                            StartTime = sch.StartTime,
                            EndTime = sch.EndTime
                        };

            var proctorData = await query.Distinct().ToListAsync();

            if (!proctorData.Any())
            {
                return NotFound("No proctors found for the provided criteria.");
            }

            var groupedProctors = proctorData
                .GroupBy(p => new { p.UserId, p.Email, p.CampusName, p.Semester })
                .Select(g => new
                {
                    ProctorEmail = g.Key.Email,
                    TotalProctoringTime = g.Sum(x => (x.EndTime - x.StartTime).TotalMinutes),
                    CampusName = g.Key.CampusName,
                    Semester = g.Key.Semester
                })
                .ToList();

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("Proctors Total Proctoring Time");

                worksheet.Cell(1, 1).Value = "ProctorEmail";
                worksheet.Cell(1, 2).Value = "TotalProctoringTime";
                worksheet.Cell(1, 3).Value = "CampusName";
                worksheet.Cell(1, 4).Value = "Semester";

                int row = 2;
                foreach (var proctor in groupedProctors)
                {
                    worksheet.Cell(row, 1).Value = proctor.ProctorEmail;
                    worksheet.Cell(row, 2).Value = proctor.TotalProctoringTime;
                    worksheet.Cell(row, 3).Value = proctor.CampusName;
                    worksheet.Cell(row, 4).Value = proctor.Semester;
                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    stream.Position = 0;
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "proctors_total_proctoring_time.xlsx");
                }
            }
        }

    }


}



