using System;
namespace backend.DTOs.ScheduleProctorDTO
{
    public class ExamRoomxDTO
    {
        public uint ExamRoomId { get; set; }
        public string PlaceName { get; set; } = null!;
        public uint ScheduleId { get; set; }
        public string RoomName { get; set; } = null!;
        public string? Attempt {  get; set; }
        public uint? ProctorId { get; set; }
        public string Title { get; set; } = null!;
        public List<StudentRoomSubjectxDTO> StudentRoomSubjects { get; set; } = new List<StudentRoomSubjectxDTO>();
    }
}

