using backend.Authorization;
using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class ScheduleController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ScheduleController(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet("GetScheduleByProctorId/{proctorId}/{semester}")]
        public async Task<IActionResult> GetScheduleByProctorId(int proctorId, string semester)
        {
            try
            {
                var examSchedules = await _context.Schedules
                    .Where(s => s.Semester == semester)
                    .Join(_context.ExamRooms,
                        s => s.ScheduleId,
                        er => er.ScheduleId,
                        (s, er) => new
                        {
                            s.ScheduleId,
                            s.StartTime,
                            s.EndTime,
                            s.Semester,
                            er.RoomName,
                            er.ProctorId,
                        })
                    .Where(joined => joined.ProctorId == proctorId)
                    .ToListAsync();

                var results = examSchedules.Select(schedule => new
                {
                    Date = schedule.StartTime.ToString("yyyy-MM-dd"),
                    Time = $"{schedule.StartTime.ToString("HH:mm")}-{schedule.EndTime.ToString("HH:mm")}",
                    startTime = schedule.StartTime.ToString("yyyy-MM-dd HH:mm"),
                    endTime = schedule.EndTime.ToString("yyyy-MM-dd HH:mm"),
                    Room = schedule.RoomName
                }).ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }


    }
}
