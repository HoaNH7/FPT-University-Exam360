using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class MessageContent
    {
        public MessageContent()
        {
            MessageFromtos = new HashSet<MessageFromto>();
        }

        public uint MessageContentId { get; set; }
        public string Content { get; set; } = null!;
        public string? FileAttachment { get; set; }

        public virtual ICollection<MessageFromto> MessageFromtos { get; set; }
    }
}
