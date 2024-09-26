using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Subject
    {
        public Subject()
        {
            ExamCodes = new HashSet<ExamCode>();
            StudentRoomSubjects = new HashSet<StudentRoomSubject>();
            StudentSubmissions = new HashSet<StudentSubmission>();
        }

        public uint SubjectId { get; set; }
        public string SubjectCode { get; set; } = null!;
        public string SubjectName { get; set; } = null!;

        public virtual ICollection<ExamCode> ExamCodes { get; set; }
        public virtual ICollection<StudentRoomSubject> StudentRoomSubjects { get; set; }
        public virtual ICollection<StudentSubmission> StudentSubmissions { get; set; }
    }
}
