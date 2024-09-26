using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Checkin
    {
        public uint CheckinId { get; set; }
        public uint ProctorId { get; set; }
        public uint StudentId { get; set; }
        public DateTime CheckinTime { get; set; }
        public bool IsCheckin { get; set; }
        public uint ExamRoomId { get; set; }
        public string? Note { get; set; }

        public virtual User Proctor { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}



