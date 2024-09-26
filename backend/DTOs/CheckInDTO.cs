namespace backend.DTOs
{
    public class CheckInDTO
    {
        public uint StudentId { get; set; }
        public string RollNo { get; set; } = null!;
        public string FullName { get; set; } = null!;
        public string CitizenIdentity { get; set; } = null!;
        public string ProctorName { get; set; } = null!;
       // public DateTime Time { get; set; }
       // public string ClassName { get; set; } = null!;
        public string SubjectCode { get; set; } = null!;
        public bool IsCheckin { get; set; } = false;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }


    }
}
