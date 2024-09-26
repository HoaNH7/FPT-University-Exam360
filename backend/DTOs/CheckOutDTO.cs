namespace backend.DTOs
{
    public class CheckOutDTO
    {
        public uint StudentId { get; set; }
        public string RollNo { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string CitizenIdentity { get; set; } = null!;
        public string ProctorName { get; set; }
        public DateTime Time { get; set; }
        public uint SubjectId { get; set; } // Added SubjectId
        public uint ScheduleId { get; set; } // Added ScheduleId
        public string ClassName { get; set; } = null!;
        public string SubjectCode { get; set; } = null!;
        public bool IsCheckin { get; set; }
        public bool? IsCheckout { get; set; }
        public DateTime CheckoutTime { get; set; }
        public bool? IsSubmit { get; set; }
        public string? Image { get; set; }
        public bool? IsSubmitFileDat { get; set; }
        public uint? submissionId { get; set; }
        public List<string>? Note { get; set; }



    }
}



