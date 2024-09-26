using System;
using backend.Authorization;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class ListStudentCheckInController : ControllerBase
    {

        private readonly SEP490_V3Context _context;

        public ListStudentCheckInController(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("GetAllStudentsGroupedBySchedule")]
        public async Task<IActionResult> GetAllStudentsGroupedBySchedule(
    [FromQuery] string? startDate = null,
    [FromQuery] string? endDate = null,
    [FromQuery] string? room = null,
    [FromQuery] int pageNumber = 1)
        {
            const int pageSize = 10; // Number of records per page

            DateTime? parsedStartDate = ParseDate(startDate);
            DateTime? parsedEndDate = ParseDate(endDate);

            var query = _context.StudentRoomSubjects
                .Include(srs => srs.Student)
                .Include(srs => srs.ExamRoom)
                .Include(srs => srs.Student.Class)
                .Include(srs => srs.Student.Checkins)
                .Include(srs => srs.ExamRoom.Schedule)
                .Where(srs => srs.Student.Checkins.Any()); // Only include records with check-ins

            // Apply optional filters
            if (parsedStartDate.HasValue)
            {
                query = query.Where(srs => srs.ExamRoom.Schedule.StartTime >= parsedStartDate.Value);
            }

            if (parsedEndDate.HasValue)
            {
                query = query.Where(srs => srs.ExamRoom.Schedule.EndTime <= parsedEndDate.Value);
            }

            if (!string.IsNullOrEmpty(room))
            {
                query = query.Where(srs => srs.ExamRoom.RoomName == room);
            }

            // Get the total count of unique students with check-ins
            var totalCount = await query
                .Select(x => x.StudentId)
                .Distinct()
                .CountAsync();

            // Get the paginated list of student records
            var studentRecords = await query
                .Select(x => new
                {
                    x.ExamRoom.Schedule.StartTime,
                    x.ExamRoom.Schedule.EndTime,
                    x.ExamRoom.RoomName,
                    StudentId = x.StudentId,
                    RollNo = x.Student.StudentIdNumber,
                    FullName = x.Student.FullName,
                    CitizenIdentity = x.Student.CitizenIdentity,
                    ProctorName = x.ExamRoom.Proctor.Email,
                    Email = x.Student.Email,
                    SubjectCode = x.Subject.SubjectCode ?? string.Empty,
                    IsCheckin = x.Student.Checkins.Any(c => c.IsCheckin == true), // Check if there is any check-in record
                    Image = x.Student.Image
                })
                .Where(x => x.IsCheckin) // Ensure only students with check-ins are included
                .OrderBy(x => x.FullName) // Optional: Order by student name or any other attribute
                .Skip((pageNumber - 1) * pageSize) // Skip records for previous pages
                .Take(pageSize) // Take records for the current page
                .ToListAsync();

            return Ok(new { totalCount, studentRecords });
        }

        private DateTime? ParseDate(string dateStr)
        {
            if (DateTime.TryParse(dateStr, out DateTime parsedDate))
            {
                return parsedDate;
            }
            return null;
        }





    }
}



