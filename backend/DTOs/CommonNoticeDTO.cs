namespace backend.DTOs
{
    public class CommonNoticeDTO
    {
        public uint SenderId { get; set; }
        public string? Title { get; set; }
        public string? Content { get; set; }
        public string? FileAttach { get; set; }
    }
}