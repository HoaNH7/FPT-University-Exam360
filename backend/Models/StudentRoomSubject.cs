using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class StudentRoomSubject
    {
        public uint StudentId { get; set; }
        public uint ExamRoomId { get; set; }
        public uint SubjectId { get; set; }
        public string? Note { get; set; }
        public virtual ExamRoom ExamRoom { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
    }
}
