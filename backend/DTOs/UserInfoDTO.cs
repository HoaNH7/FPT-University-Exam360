namespace backend.DTOs
{
    public class UserInfoDTO
    {
        public uint UserId { get; set; }
        public string Email { get; set; } = null!;
        public List<string> Roles { get; set; } = null!;
        public string CampusName { get; set; } = null!;

    }
}

