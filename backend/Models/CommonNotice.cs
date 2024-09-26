using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class CommonNotice
    {
        public uint CommonNoticeId { get; set; }
        public uint SenderId { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public DateTime? SendTime { get; set; }
        public string? FileAttach { get; set; }

        public virtual User Sender { get; set; } = null!;
    }
}
