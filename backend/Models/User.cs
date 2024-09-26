using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class User
    {
        public User()
        {
            Checkins = new HashSet<Checkin>();
            Checkouts = new HashSet<Checkout>();
            CommonNotices = new HashSet<CommonNotice>();
            ExamRooms = new HashSet<ExamRoom>();
            MessageFromtoFromUsers = new HashSet<MessageFromto>();
            MessageFromtoToUsers = new HashSet<MessageFromto>();
            RequestRequestBies = new HashSet<Request>();
            RequestResolveBies = new HashSet<Request>();
            ViolationReportBies = new HashSet<Violation>();
            ViolationResolveBies = new HashSet<Violation>();
            ExamRoomProctors = new HashSet<ExamRoomProctor>();
        }

        public uint UserId { get; set; }
        public string Email { get; set; } = null!;
        public string? EmailFe { get; set; }
        public bool? IsActive { get; set; }
        public uint CampusId { get; set; }

        public virtual Campus Campus { get; set; } = null!;
        public virtual ICollection<UserRole> UserRoles { get; set; }
        public virtual ICollection<Checkin> Checkins { get; set; }
        public virtual ICollection<Checkout> Checkouts { get; set; }
        public virtual ICollection<CommonNotice> CommonNotices { get; set; }
        public virtual ICollection<ExamRoom> ExamRooms { get; set; }
        public virtual ICollection<MessageFromto> MessageFromtoFromUsers { get; set; }
        public virtual ICollection<MessageFromto> MessageFromtoToUsers { get; set; }
        public virtual ICollection<Request> RequestRequestBies { get; set; }
        public virtual ICollection<Request> RequestResolveBies { get; set; }
        public virtual ICollection<Violation> ViolationReportBies { get; set; }
        public virtual ICollection<Violation> ViolationResolveBies { get; set; }
        public virtual ICollection<ExamRoomProctor> ExamRoomProctors { get; set; }

    }
}
