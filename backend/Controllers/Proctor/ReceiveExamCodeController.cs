using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Authorization;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class ReceiveExamCodeController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        public ReceiveExamCodeController(SEP490_V3Context context)
        {
            _context = context;
        }
        //by id + date
        [HttpGet("GetExamCodeByProctorId/{proctorId}")]
        public async Task<IActionResult> GetExamCodeByProctorId(int proctorId, [FromQuery] string startTime, [FromQuery] string endTime, [FromQuery] string subjectCodes)
        {
            try
            {
                var format = "yyyy-MM-dd HH:mm";
                var provider = CultureInfo.InvariantCulture;

                DateTime startDateTime = DateTime.ParseExact(startTime, format, provider);
                DateTime endDateTime = DateTime.ParseExact(endTime, format, provider);
                var subjectCodeArray = subjectCodes.Split(',').ToArray();

                var examCodes = await _context.ExamCodes
                    .Join(_context.Schedules,
                        ec => ec.ScheduleId,
                        s => s.ScheduleId,
                        (ec, s) => new
                        {
                            ec.Code,
                            ec.SubjectId,
                            ec.Title,
                            ec.OpenCode,
                            ec.Section,
                            ScheduleId = s.ScheduleId,
                            s.StartTime,
                            s.EndTime,
                            s.ExamRooms
                        })
                    .Where(ec => ec.StartTime >= startDateTime && ec.EndTime <= endDateTime
                        && subjectCodeArray.Contains(_context.Subjects
                            .Where(sub => sub.SubjectId == ec.SubjectId)
                            .Select(sub => sub.SubjectCode).FirstOrDefault()))
                    .ToListAsync();

                var results = new List<object>();

                foreach (var ec in examCodes)
                {
                    var subject = await _context.Subjects
                        .Where(sub => sub.SubjectId == ec.SubjectId && subjectCodeArray.Contains(sub.SubjectCode))
                        .Select(sub => new { sub.SubjectCode, sub.SubjectName })
                        .FirstOrDefaultAsync();

                    bool isProctorInExamRoom = ec.ExamRooms.Any(er => er.ProctorId == proctorId);
                    bool isProctorInExamRoomProctor = await _context.ExamRoomProctors
                        .AnyAsync(erp =>  erp.ProctorId == proctorId);

                    if (isProctorInExamRoom || isProctorInExamRoomProctor)
                    {
                        results.Add(new
                        {
                            ec.Code,
                            StartTime = ec.StartTime.ToString("yyyy-MM-dd HH:mm"),
                            EndTime = ec.EndTime.ToString("yyyy-MM-dd HH:mm"),
                            SubjectCode = subject?.SubjectCode,
                            SubjectName = subject?.SubjectName,
                            ec.Section,
                            ec.Title,
                            ec.OpenCode
                        });
                    }
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }


        [HttpGet("SearchExamCodeByCode")]
        public async Task<IActionResult> SearchExamCodeByCode(string examCode)
        {
            if (string.IsNullOrEmpty(examCode))
            {
                return BadRequest("ExamCode is required");
            }

            // Query to get exam code along with related schedules and subjects
            var query = from e in _context.ExamCodes
                        join s in _context.Subjects on e.SubjectId equals s.SubjectId
                        join sch in _context.Schedules on e.ScheduleId equals sch.ScheduleId
                        where e.Code.Contains(examCode)
                        select new
                        {
                            e.SubjectId,
                            e.Code,
                            e.OpenCode,
                            e.Title,
                            s.SubjectName,
                            s.SubjectCode,
                            sch.StartTime,
                            sch.EndTime
                        };

            var examCodes = await query.ToListAsync();

            if (!examCodes.Any())
            {
                return NotFound("Exam code not found");
            }

            return Ok(examCodes);
        }
    }
}






//[HttpGet("SearchExamCodeByCode")]
//public async Task<IActionResult> SearchExamCodeByCode(string examCode)
//{
//    if (string.IsNullOrEmpty(examCode))
//    {
//        return BadRequest("ExamCode is required");
//    }

//    // Query to get exam code along with related schedules and subjects
//    var query = from e in _context.ExamCodes
//                join s in _context.Subjects on e.SubjectId equals s.SubjectId
//                join sch in _context.Schedules on e.ScheduleId equals sch.ScheduleId
//                where e.Code.Contains(examCode)
//                select new
//                {
//                    SubjectId = e.SubjectId,
//                    ExamCode = e.Code,
//                    OpenCode = e.OpenCode,
//                    Title = e.Title,
//                    SubjectName = s.SubjectName,
//                    SubjectCode = s.SubjectCode,
//                    StartTime = sch.StartTime,
//                    EndTime = sch.EndTime
//                };

//    var examCodes = await query.ToListAsync();

//    if (!examCodes.Any())
//    {
//        return NotFound("Exam code not found");
//    }

//    return Ok(examCodes);
//}