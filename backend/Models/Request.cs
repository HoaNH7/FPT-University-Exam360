using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Request
    {
        public Request()
        {
            Students = new HashSet<Student>();
            StudentRequests = new HashSet<StudentRequest>();
        }

        public uint RequestId { get; set; }
        public uint RequestById { get; set; }
        public uint? ResolveById { get; set; }
        public string? RequestTitle { get; set; }
        public string? Note { get; set; }
        public DateTime? RequestDate { get; set; }
        public DateTime? ResolveDate { get; set; }
        public string ResolveStatus { get; set; } = null!;
        public string? ResponseNote { get; set; } = null!;

        public virtual User RequestBy { get; set; } = null!;
        public virtual User? ResolveBy { get; set; }
        public virtual ICollection<StudentRequest> StudentRequests { get; set; }


        public virtual ICollection<Student> Students { get; set; }
    }
}
