namespace backend.DTOs
{
    public class SearchViolationDto
    {
        public DateTime? ViolationFrom { get; set; }
        public DateTime? ViolationTo { get; set; }
        public string? ViolationTitle { get; set; }
        public uint? ViolationById { get; set; }
        public string? ResolveStatus { get; set; }
        public string? RoomName { get; set; }
        public string? Semester { get; set; }
    }
}
