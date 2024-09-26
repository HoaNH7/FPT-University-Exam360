using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class UserRole
    {
        public uint UserId { get; set; }
        public uint RoleId { get; set; }

        public virtual Role Role { get; set; } = null!;
        public virtual User User { get; set; } = null!;
    }
}
