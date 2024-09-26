using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class StudentViolation
    {
        public uint StudentId { get; set; }
        public uint ViolationId { get; set; }
        public uint ExamRoomId { get; set; }

        public virtual Student Student { get; set; } = null!;
        public virtual Violation Violation { get; set; } = null!;
    }
}
