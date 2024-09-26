using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Checkout
    {
        public uint CheckoutId { get; set; }
        public uint ProctorId { get; set; }
        public uint StudentId { get; set; }
        public uint ExamRoomId { get; set; }
        public DateTime CheckoutTime { get; set; }
        public bool IsCheckout { get; set; }
        public bool? IsSubmit { get; set; }
        public string? Note { get; set; }

        public virtual User Proctor { get; set; } = null!;
        public virtual Student Student { get; set; } = null!;
    }
}
