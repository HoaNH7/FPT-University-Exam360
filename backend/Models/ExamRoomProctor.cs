using System;
namespace backend.Models
{
        public partial class ExamRoomProctor
        {
            public uint ExamRoomId { get; set; }
            public uint ProctorId { get; set; }

            public virtual User Proctor { get; set; } = null!;
            public virtual ExamRoom ExamRoom { get; set; } = null!;
        }
}

