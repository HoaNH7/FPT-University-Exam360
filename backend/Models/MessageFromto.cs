using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class MessageFromto
    {
        public uint MessageFromtoId { get; set; }
        public uint FromUserId { get; set; }
        public uint ToUserId { get; set; }
        public uint MessageContentId { get; set; }
        public DateTime Time { get; set; }

        public virtual User FromUser { get; set; } = null!;
        public virtual MessageContent MessageContent { get; set; } = null!;
        public virtual User ToUser { get; set; } = null!;
    }
}
