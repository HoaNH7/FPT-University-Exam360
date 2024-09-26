using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using ClosedXML.Excel;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using backend.Authorization;
using Microsoft.IdentityModel.Tokens;
using System.Globalization;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("api/[controller]")]
    [ApiController]
    public class ExportController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ExportController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("ExportCheckInToExcel")]
        public async Task<IActionResult> ExportCheckInToExcel(
     [FromQuery] string? semester = null,
     [FromQuery] DateTime? date = null,
     [FromQuery] DateTime? time = null,
     [FromQuery] string? room = null,
     [FromQuery] string? subjectCode = null)
        {
            try
            {
                var query = _context.Checkins
                    .Include(c => c.Proctor)
                    .ThenInclude(p => p.UserRoles)
                    .ThenInclude(ur => ur.Role)
                    .Include(c => c.Student)
                    .ThenInclude(s => s.StudentRoomSubjects)
                    .ThenInclude(srs => srs.ExamRoom)
                    .ThenInclude(er => er.Schedule)
                    .Include(s => s.Student)
                    .Include(s => s.Student.StudentRoomSubjects)
                    .ThenInclude(srs => srs.Subject)
                    .AsQueryable();

                if (!string.IsNullOrEmpty(semester))
                {
                    query = query.Where(c => c.Student.StudentRoomSubjects.Any(srs => srs.ExamRoom.Schedule.Semester == semester));
                }

                if (date.HasValue)
                {
                    // Filter by date, assuming you want to match the `Schedule` start date
                    query = query.Where(c => c.Student.StudentRoomSubjects
                        .Any(srs => srs.ExamRoom.Schedule.StartTime.Date == date.Value.Date));
                }

                if (time.HasValue)
                {
                    var timeOfDay = time.Value.TimeOfDay;
                    query = query.Where(c => c.Student.StudentRoomSubjects
                        .Any(srs => srs.ExamRoom.Schedule.StartTime.TimeOfDay <= timeOfDay &&
                                    srs.ExamRoom.Schedule.EndTime.TimeOfDay >= timeOfDay));
                }

                if (!string.IsNullOrEmpty(room))
                {
                    query = query.Where(c => c.Student.StudentRoomSubjects.Any(srs => srs.ExamRoom.RoomName.ToLower() == room.ToLower()));
                }

                if (!string.IsNullOrEmpty(subjectCode))
                {
                    query = query.Where(c => c.Student.StudentRoomSubjects.Any(srs => srs.Subject.SubjectCode.ToLower() == subjectCode.ToLower()));
                }

                var exportData = await query.Select(c => new
                {
                    No = 1,  // Assuming you will handle row numbers in a different way
                    Name = c.Student.FullName,
                    Email = c.Student.Email,
                    RollNo = c.Student.StudentIdNumber,
                    Room = c.Student.StudentRoomSubjects.Select(srs => srs.ExamRoom.RoomName).FirstOrDefault(),
                    Date = c.CheckinTime,
                    StartTime = c.Student.StudentRoomSubjects.Select(srs => srs.ExamRoom.Schedule.StartTime.TimeOfDay).FirstOrDefault(),
                    EndTime = c.Student.StudentRoomSubjects.Select(srs => srs.ExamRoom.Schedule.EndTime.TimeOfDay).FirstOrDefault(),
                    CitizenIdentity = c.Student.CitizenIdentity,
                    SubjectCode = c.Student.StudentRoomSubjects.Select(srs => srs.Subject.SubjectCode).FirstOrDefault()
                }).ToListAsync();

                using (var workbook = new XLWorkbook())
                {
                    var worksheet = workbook.Worksheets.Add("CheckIn");

                    worksheet.Cell(1, 1).Value = "No";
                    worksheet.Cell(1, 2).Value = "Name";
                    worksheet.Cell(1, 3).Value = "Email";
                    worksheet.Cell(1, 4).Value = "Roll No";
                    worksheet.Cell(1, 5).Value = "Room";
                    worksheet.Cell(1, 6).Value = "Date";
                    worksheet.Cell(1, 7).Value = "Time";
                    worksheet.Cell(1, 8).Value = "Citizen Identity";
                    worksheet.Cell(1, 9).Value = "Subject Code";

                    int row = 2;
                    foreach (var item in exportData)
                    {
                        worksheet.Cell(row, 1).Value = row - 1;  // Setting row number
                        worksheet.Cell(row, 2).Value = item.Name;
                        worksheet.Cell(row, 3).Value = item.Email;
                        worksheet.Cell(row, 4).Value = item.RollNo;
                        worksheet.Cell(row, 5).Value = item.Room;
                        worksheet.Cell(row, 6).Value = item.Date.ToString("yyyy-MM-dd");
                        worksheet.Cell(row, 7).Value = $"{item.StartTime:hh\\:mm}-{item.EndTime:hh\\:mm}";
                        worksheet.Cell(row, 8).Value = item.CitizenIdentity;
                        worksheet.Cell(row, 9).Value = item.SubjectCode;
                        row++;
                    }

                    worksheet.Columns().AdjustToContents();

                    using (var stream = new MemoryStream())
                    {
                        workbook.SaveAs(stream);
                        stream.Position = 0;
                        return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "checkin.xlsx");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(StatusCodes.Status500InternalServerError, $"An error occurred while exporting data to Excel: {ex.Message}");
            }
        }

        [HttpGet("ExportCheckOutToExcel")]
        public async Task<IActionResult> ExportCheckOutToExcel(
    [FromQuery] string? semester = null,
    [FromQuery] string? date = null,
     [FromQuery] string? time = null,
    [FromQuery] string? room = null,
    [FromQuery] string? subjectCode = null,
    [FromQuery] bool? isCheckout = null)

        {

            DateTime? startDateTime = null;
            DateTime? endDateTime = null;
            TimeSpan? startTimeSpan = null;
            TimeSpan? endTimeSpan = null;

            if (!string.IsNullOrEmpty(date))
            {
                if (!DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsedDate))
                {
                    return BadRequest("Invalid date format. Use yyyy-MM-dd.");
                }
                startDateTime = parsedDate.Date; // Start of the day
                endDateTime = parsedDate.Date.AddDays(1).AddTicks(-1); // End of the day
            }

            if (!string.IsNullOrEmpty(time))
            {
                var timeParts = time.Split('-');
                if (timeParts.Length == 2 &&
                    TimeSpan.TryParse(timeParts[0], out var startTime) &&
                    TimeSpan.TryParse(timeParts[1], out var endTime))
                {
                    startTimeSpan = startTime;
                    endTimeSpan = endTime;
                }
                else
                {
                    return BadRequest("Invalid time format. Use hh:mm-hh:mm.");
                }
            }

            var validExamRoomIds = await _context.Checkins
                .Where(cin => cin.IsCheckin == true)
                .Select(cin => cin.ExamRoomId)
                .Distinct()
                .ToListAsync();

            var exportData = from s in _context.Students
                             join cin in _context.Checkins on s.StudentId equals cin.StudentId
                             join co in _context.Checkouts on s.StudentId equals co.StudentId into checkouts
                             from cout in checkouts.DefaultIfEmpty()
                             join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
                             join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
                             join usr in _context.Users on cin.ProctorId equals usr.UserId
                             join exr in _context.ExamRooms on srs.ExamRoomId equals exr.ExamRoomId
                             join sch in _context.Schedules on exr.ScheduleId equals sch.ScheduleId
                             where validExamRoomIds.Contains(exr.ExamRoomId) &&
                            (!startDateTime.HasValue || startDateTime <= sch.EndTime) &&
                            (!endDateTime.HasValue || endDateTime >= sch.StartTime) &&
                            (string.IsNullOrEmpty(room) || exr.RoomName == room) &&
                            (string.IsNullOrEmpty(subjectCode) || sub.SubjectCode == subjectCode) &&
                            (string.IsNullOrEmpty(semester) || sch.Semester == semester) &&
                            (!isCheckout.HasValue || (cout != null && cout.IsCheckout == isCheckout)) &&
                                (!startTimeSpan.HasValue || (sch.StartTime.TimeOfDay >= startTimeSpan)) &&
                                (!endTimeSpan.HasValue || (sch.EndTime.TimeOfDay <= endTimeSpan))
                             select new
                             {
                                 sch.StartTime,
                                 sch.EndTime,
                                 exr.RoomName,
                                 s.StudentId,
                                 s.StudentIdNumber,
                                 s.FullName,
                                 s.Email,
                                 s.CitizenIdentity,
                                 ProctorName = usr.Email,
                                 SubjectCode = sub.SubjectCode ?? string.Empty,
                                 cin.IsCheckin,
                                 cin.CheckinTime,
                                 IsCheckout = cout != null && cout.IsCheckout,
                                 CheckoutTime = cout != null ? cout.CheckoutTime : (DateTime?)null,
                                 IsSubmit = cout != null ? cout.IsSubmit : (bool?)null,
                                 s.Image
                             };

            var studentRequests = await exportData.ToListAsync();

            var groupedResult = studentRequests
                .GroupBy(s => new { s.StartTime, s.EndTime, s.RoomName })
                .OrderBy(g => g.Key.StartTime)
                .ThenBy(g => g.Key.EndTime)
                .Select(g => new
                {
                    g.Key.StartTime,
                    g.Key.EndTime,
                    g.Key.RoomName,
                    Students = g.Select(s => new
                    {
                        s.StudentId,
                        s.StudentIdNumber,
                        s.FullName,
                        s.CitizenIdentity,
                        s.Email,
                        s.ProctorName,
                        s.SubjectCode,
                        s.IsCheckin,
                        s.CheckinTime,
                        s.IsCheckout,
                        s.CheckoutTime,
                        s.IsSubmit,
                        s.Image
                    }).ToList()
                })
                .ToList();
            if (!exportData.Any())
            {
                return NotFound("No data found to export.");
            }

            using (var workbook = new XLWorkbook())
            {
                var worksheet = workbook.Worksheets.Add("CheckOut");

                worksheet.Cell(1, 1).Value = "No";
                worksheet.Cell(1, 2).Value = "Name";
                worksheet.Cell(1, 3).Value = "Email";
                worksheet.Cell(1, 4).Value = "Roll No";
                worksheet.Cell(1, 5).Value = "Citizen Identity";
                worksheet.Cell(1, 6).Value = "Room";
                worksheet.Cell(1, 7).Value = "Subject Code";
                worksheet.Cell(1, 8).Value = "Is Checkin";
                worksheet.Cell(1, 9).Value = "Checkin Time";
                worksheet.Cell(1, 10).Value = "Date";
                worksheet.Cell(1, 11).Value = "Time";
                worksheet.Cell(1, 12).Value = "Is Checkout";
                worksheet.Cell(1, 13).Value = "Checkout Time";

                int row = 2;
                foreach (var item in exportData)
                {
                    worksheet.Cell(row, 1).Value = row - 1;  // Setting row number
                    worksheet.Cell(row, 2).Value = item.FullName;
                    worksheet.Cell(row, 3).Value = item.Email;
                    worksheet.Cell(row, 4).Value = item.StudentIdNumber;
                    worksheet.Cell(row, 5).Value = item.CitizenIdentity;
                    worksheet.Cell(row, 6).Value = item.RoomName;
                    worksheet.Cell(row, 7).Value = item.SubjectCode;
                    worksheet.Cell(row, 8).Value = item.IsCheckin == true ? "Present" : "Absent";
                    worksheet.Cell(row, 9).Value = item.CheckinTime;
                    worksheet.Cell(row, 10).Value = item.StartTime.ToString("yyyy-MM-dd");
                    worksheet.Cell(row, 11).Value = $"{item.StartTime:hh\\:mm}-{item.EndTime:hh\\:mm}";
                    worksheet.Cell(row, 12).Value = item.IsCheckout == true ? "Checked Out" : "Not Checked Out";
                    worksheet.Cell(row, 13).Value = item.CheckoutTime?.ToString("yyyy-MM-dd HH:mm:ss");
                    row++;
                }

                worksheet.Columns().AdjustToContents();

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    stream.Position = 0;
                    return File(stream.ToArray(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "checkout.xlsx");
                }
            }
        }

    }
}



