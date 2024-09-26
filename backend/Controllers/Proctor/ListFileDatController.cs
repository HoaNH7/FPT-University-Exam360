using Azure.Storage.Blobs;
using backend.Authorization;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [ApiController]
    [Route("api/[controller]")]
    public class ListFileDatController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ListFileDatController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetAllSubmissions")]
        public async Task<IActionResult> GetAllSubmissions(
            [FromQuery] int? proctorId,
            [FromQuery] string? startTime,
            [FromQuery] string? endTime,
            [FromQuery] string? room
        )
        {
            DateTime parsedStartTime, parsedEndTime;
            bool isStartTimeValid = DateTime.TryParseExact(startTime, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedStartTime);
            bool isEndTimeValid = DateTime.TryParseExact(endTime, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out parsedEndTime);

            var query = _context.StudentSubmissions
                .Include(x => x.Student)
                .Include(x => x.Subject)
                .Include(x => x.Schedule)
                .ThenInclude(x => x.ExamRooms)
                .AsQueryable();

            if (proctorId > 0)
            {
                query = query.Where(x => x.Schedule.ExamRooms.Any(er => er.ProctorId == proctorId));
            }

            if (isStartTimeValid)
            {
                query = query.Where(x => x.Schedule.StartTime.Date >= parsedStartTime.Date);
            }

            if (isEndTimeValid)
            {
                query = query.Where(x => x.Schedule.EndTime.Date <= parsedEndTime.Date);
            }

            if (!string.IsNullOrEmpty(room))
            {
                query = query.Where(x => x.Schedule.ExamRooms.Any(er => er.RoomName == room));
            }

            var submissionsByStudentId = await query
                .Select(x => new
                {
                    x.Student.StudentIdNumber,
                    x.Student.FullName,
                    Date = x.Schedule.StartTime.ToString("yyyy-MM-dd"),
                    Slot = x.Schedule.StartTime.ToString("HH:mm") + "-" + x.Schedule.EndTime.ToString("HH:mm"),
                    x.Subject.SubjectCode,
                    file = x.FilePath,
                    uploadDate = x.SubmissionDate.ToString("yyyy-MM-dd HH:mm")
                })
                .ToListAsync();

            return Ok(submissionsByStudentId);
        }
    }
}
