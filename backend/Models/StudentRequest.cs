using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class StudentRequest
    {
        public uint StudentId { get; set; }
        public uint RequestId { get; set; }
        public uint? ExamRoomId { get; set; }

        public virtual Request Request { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}
