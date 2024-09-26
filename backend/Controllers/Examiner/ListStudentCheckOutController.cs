using System;
using backend.Authorization;
using backend.Models;
using DocumentFormat.OpenXml.Drawing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class ListStudentCheckOutController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ListStudentCheckOutController(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("GetAllStudentsGroupedBySchedule")]
        public async Task<IActionResult> GetAllStudentsGroupedBySchedule(
    [FromQuery] string? startDate = null,
    [FromQuery] string? endDate = null,
    [FromQuery] string? room = null,
    [FromQuery] int? pageNumber = 1,
    [FromQuery] int? pageSize = null)
        {

            DateTime? startDateTime = null;
            DateTime? endDateTime = null;

            if (!string.IsNullOrEmpty(startDate))
            {
                if (!DateTime.TryParseExact(startDate, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime parsedStartDate))
                {
                    return BadRequest("Invalid start date format. Please use 'yyyy-MM-dd HH:mm'.");
                }
                startDateTime = parsedStartDate;
            }

            if (!string.IsNullOrEmpty(endDate))
            {
                if (!DateTime.TryParseExact(endDate, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime parsedEndDate))
                {
                    return BadRequest("Invalid end date format. Please use 'yyyy-MM-dd HH:mm'.");
                }
                endDateTime = parsedEndDate;
            }

            var validExamRoomIds = await _context.Checkins
                .Where(cin => cin.IsCheckin == true)
                .Select(cin => cin.ExamRoomId)
                .Distinct()
                .ToListAsync();

            var query = from s in _context.Students
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
                              (string.IsNullOrEmpty(room) || exr.RoomName == room)
                        select new
                        {
                            sch.Semester,
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
                            Section = cout.Note,
                            cin.IsCheckin,
                            cin.CheckinTime,
                            IsCheckout = cout != null && cout.IsCheckout,
                            CheckoutTime = cout != null ? cout.CheckoutTime : (DateTime?)null,
                            IsSubmit = cout != null ? cout.IsSubmit : (bool?)null,
                            s.Image
                        };

            var studentRequests = await query.ToListAsync();

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
                        s.Semester,
                        s.StudentId,
                        s.StudentIdNumber,
                        s.FullName,
                        s.CitizenIdentity,
                        s.Email,
                        s.ProctorName,
                        s.SubjectCode,
                        s.Section,
                        s.IsCheckin,
                        s.CheckinTime,
                        s.IsCheckout,
                        s.CheckoutTime,
                        s.IsSubmit,
                        s.Image
                    }).ToList()
                })
                .ToList();

            var totalCount = groupedResult.Count;
            if (pageSize.HasValue && pageSize.Value > 0)
            {
                groupedResult = groupedResult
                                  .Skip((pageNumber.Value - 1) * pageSize.Value)
                                  .Take(pageSize.Value)
                                  .ToList();
            }

            var paginatedResult = groupedResult
                .ToList();

            return Ok(new { totalCount, groupedResult = paginatedResult });
        }






    }
}



