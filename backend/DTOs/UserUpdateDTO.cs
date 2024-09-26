namespace backend.DTOs
{
    public class UserUpdateDTO
    {
        public string Email { get; set; } = null!;
        
        public bool? IsActive { get; set; }
        public List<uint> RoleId { get; set; } = null!;
        public uint CampusId { get; set; }
    }
}
