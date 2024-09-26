using System;
namespace backend.DTOs.ScheduleProctorDTO
{
    public class SchedulexDTO
    {
        public uint ScheduleId { get; set; }
        public string Semester { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public List<ExamRoomxDTO> ExamRooms { get; set; } = new List<ExamRoomxDTO>();
    }
}

