namespace backend.DTOs
{
    public class StudentCheckOutStatusDTO
    {
        public string RollNo { get; set; }
        public bool IsCheckout { get; set; }
        public string CheckoutTime { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string RoomName { get; set; } = null!;
        public List<string>? Note { get; set; }
    }
}
