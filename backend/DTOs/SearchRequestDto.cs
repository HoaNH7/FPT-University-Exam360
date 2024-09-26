namespace backend.DTOs
{
    public class SearchRequestDto
    {
        public DateTime? RequestFrom { get; set; }
        public DateTime? RequestTo { get; set; }
        public string? RequestTitle { get; set; }
        public uint? RequestById { get; set; }
        public string? ResolveStatus { get; set; }
        public string? RoomName { get; set; }
        public string? Semester { get; set; }
    }
}