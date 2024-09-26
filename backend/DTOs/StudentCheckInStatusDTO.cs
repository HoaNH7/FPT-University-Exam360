namespace backend.DTOs
{
    public class StudentCheckInStatusDTO
    {
        public string RollNo { get; set; }
        public bool IsCheckin { get; set; }
        public string? Note { get; set; }
        public DateTime CheckinTime { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string RoomName { get; set; } = null!;
    }
}
