using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Campus
    {
        public Campus()
        {
            Users = new HashSet<User>();
        }

        public uint CampusId { get; set; }
        public string CampusName { get; set; } = null!;
        public string? Address { get; set; }
        public string? Contact { get; set; }

        public virtual ICollection<User> Users { get; set; }
    }
}
