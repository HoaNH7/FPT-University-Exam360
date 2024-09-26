using System;
namespace backend.DTOs
{
	public class ProctorOfExanScheduleDTO
	{
        public uint UserId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
    }
}

