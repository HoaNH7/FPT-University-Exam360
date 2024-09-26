using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class StudentSubmission
    {
        public uint SubmissionId { get; set; }
        public uint StudentId { get; set; }
        public uint SubjectId { get; set; }
        public uint ScheduleId { get; set; }
        public string? FilePath { get; set; }
        public DateTime SubmissionDate { get; set; }

        public virtual Schedule Schedule { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
        public virtual Subject Subject { get; set; } = null!;
    }
}
