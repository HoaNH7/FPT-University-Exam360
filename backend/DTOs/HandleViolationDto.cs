using System;
namespace backend.DTOs
{
	public class HandleViolationDto
	{
        public int ViolationId { get; set; }
        public string StudentIdNumber { get; set; } = null!;
        public string ResolveStatus { get; set; } = null!;
        public string ResponseNote { get; set; } = null!;   
    }
}

