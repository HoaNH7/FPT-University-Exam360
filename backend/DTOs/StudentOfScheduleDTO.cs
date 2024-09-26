using System;
namespace backend.DTOs
{
	public class StudentOfScheduleDTO
	{
        public uint? StudentId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string StudentIdNumber { get; set; } = null!;
        public uint? ClassId { get; set; }
        public string CitizenIdentity { get; set; } = null!;
        public string? Avatar { get; set; } = null!;

    }
}
