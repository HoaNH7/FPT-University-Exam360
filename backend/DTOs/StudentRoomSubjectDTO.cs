using System;
namespace backend.DTOs
{
	public class StudentRoomSubjectDTO
	{
        public string? StudentId { get; set; } = null!;
        public string? ExamRoomId { get; set; } = null!;
        public uint? SubjectId { get; set; } 
        public StudentOfScheduleDTO Student { get; set; } = null!;
        public SubjectDTO Subject { get; set; } = null!;
    }
}







