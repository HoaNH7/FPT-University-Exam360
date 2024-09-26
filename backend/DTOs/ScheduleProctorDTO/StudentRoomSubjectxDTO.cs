using System;
namespace backend.DTOs.ScheduleProctorDTO
{
    public class StudentRoomSubjectxDTO
    {
        public uint StudentId { get; set; }
        public uint ExamRoomId { get; set; }
        public uint SubjectId { get; set; }
        public StudentxDTO Student { get; set; } = null!;
        public SubjectxDTO Subject { get; set; } = null!;
    }
}

