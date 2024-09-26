using System;
namespace backend.DTOs
{
    public class ExamScheduleDTO
    {
        public uint? ScheduleId { get; set; }
        public string? Semester { get; set; } = null!;
        public string? StartTime { get; set; } = null!;
        public string? EndTime { get; set; } = null!;
        public List<ExamRoomDTO> ExamRooms { get; set; } = null!;
    }
}





