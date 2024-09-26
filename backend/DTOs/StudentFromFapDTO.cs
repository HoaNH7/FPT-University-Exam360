using System;
namespace backend.DTOs
{
	public class StudentFromFapDTO
	{
        //public uint? StudentId { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string RollNumber { get; set; } = null!;
        public uint? ClassId { get; set; }
        public string? IDCard { get; set; } = null!;
        public string? Avatar { get; set; } = null!;
    }
}

