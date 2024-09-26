using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public partial class ExamCode
    {
        public uint ExamCodeId { get; set; }
        public uint SubjectId { get; set; }
        public uint ScheduleId { get; set; }
        public string Code { get; set; } = null!;
        public string? Title { get; set; }
        public string? OpenCode { get; set; }
        public string? Section { get; set; }
        public bool Status { get; set; }
        [ForeignKey("ScheduleId")]
        public virtual Schedule Schedule { get; set; } = null!;
        [NotMapped]
        public virtual Subject Subject { get; set; } = null!;
    }
}
