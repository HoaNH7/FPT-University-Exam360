using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Schedule
    {
        public Schedule()
        {
            ExamCodes = new HashSet<ExamCode>();
            ExamRooms = new HashSet<ExamRoom>();
            StudentSubmissions = new HashSet<StudentSubmission>();
        }

        public uint ScheduleId { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Semester { get; set; } = null!;

        public virtual ICollection<ExamCode> ExamCodes { get; set; }
        public virtual ICollection<ExamRoom> ExamRooms { get; set; }
        public virtual ICollection<StudentSubmission> StudentSubmissions { get; set; }
    }
}
