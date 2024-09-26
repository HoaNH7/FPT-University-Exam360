using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class StudentImage
    {
        public uint StudentImageId { get; set; }
        public uint StudentId { get; set; }
        public string? UploadImage { get; set; }
        public DateTime UploadDate { get; set; }

        public virtual Student Student { get; set; } = null!;
    }
}
