using System;
namespace backend.DTOs
{
	public class ExamRoomDTO
	{
        public string? ExamRoomId { get; set; } = null!;
        public string? PlaceName { get; set; } = null!;
        public uint? ScheduleId { get; set; } = null!;
        public string? RoomName { get; set; } = null!;
        public uint? ProctorId { get; set; } = null!;
        public string? Title { get; set; } = null!;
        public string? Proctor { get; set; } = null!;
        public List<StudentRoomSubjectDTO> StudentRoomSubjects { get; set; } = null!;
    }
}







