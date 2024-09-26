using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Violation
    {
        public Violation()
        {
            StudentViolations = new HashSet<StudentViolation>();
            Students = new HashSet<Student>();
        }

        public uint ViolationId { get; set; }
        public uint ReportById { get; set; }
        public uint? ResolveById { get; set; }
        public string? ViolationTitle { get; set; }
        public string? Note { get; set; }
        public string? ResponseNote { get; set; }
        public DateTime? ReportDate { get; set; }
        public DateTime? ResolveDate { get; set; }
        public string ResolveStatus { get; set; } = null!;

        public virtual User ReportBy { get; set; } = null!;
        public virtual User? ResolveBy { get; set; }
        public virtual ICollection<StudentViolation> StudentViolations { get; set; }

        public virtual ICollection<Student> Students { get; set; }
    }
}
