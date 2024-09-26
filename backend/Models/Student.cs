using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class Student
    {
        public Student()
        {
            Checkins = new HashSet<Checkin>();
            Checkouts = new HashSet<Checkout>();
            StudentRoomSubjects = new HashSet<StudentRoomSubject>();
            StudentSubmissions = new HashSet<StudentSubmission>();
            //Requests = new HashSet<Request>();
            //Violations = new HashSet<Violation>();
            StudentImages = new HashSet<StudentImage>();// student image
            StudentRequests = new HashSet<StudentRequest>();
            StudentViolations = new HashSet<StudentViolation>();
        }

        public uint StudentId { get; set; }
        public string Email { get; set; } = null!;
        public string StudentIdNumber { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public uint? ClassId { get; set; }
        public string CitizenIdentity { get; set; } = null!;
        public string? Image { get; set; }

        public virtual Class? Class { get; set; } = null!;
        public virtual ICollection<StudentRequest> StudentRequests { get; set; }
        public virtual ICollection<StudentViolation> StudentViolations { get; set; }
        public virtual ICollection<Checkin> Checkins { get; set; }
        public virtual ICollection<Checkout> Checkouts { get; set; }
        public virtual ICollection<StudentRoomSubject> StudentRoomSubjects { get; set; }
        public virtual ICollection<StudentSubmission> StudentSubmissions { get; set; }
        public virtual ICollection<StudentImage> StudentImages { get; set; }// student image
        public virtual ICollection<Request> Requests { get; set; }
        public virtual ICollection<Violation> Violations { get; set; }
    }
}