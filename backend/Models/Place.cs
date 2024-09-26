using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Place
    {
        public Place()
        {
            ExamRooms = new HashSet<ExamRoom>();
        }

        public uint PlaceId { get; set; }
        public string? Address { get; set; }

        public virtual ICollection<ExamRoom> ExamRooms { get; set; }
    }
}
