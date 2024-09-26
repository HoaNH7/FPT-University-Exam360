using System;
namespace backend.DTOs
{
	public class ExamCodeSubjectScheduleDTO
	{
        public uint ExamCodeId { get; set; }
        public bool Status { get; set; }
        public string ExamCode { get; set; } = null!;
        public string? OpenCode { get; set; } = null!;
        public string? Title { get; set; } = null!;
        public string SubjectName { get; set; } = null!;
        public string SubjectCode { get; set;} = null!;
        public string Semester { get; set; } = null!;
        public string? Section { get; set; } = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}

