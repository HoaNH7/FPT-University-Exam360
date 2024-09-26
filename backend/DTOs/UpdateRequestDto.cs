using System;
namespace backend.DTOs
{
	public class UpdateRequestDto
	{
        public int RequestId { get; set; }
        public string StudentIdNumber { get; set; } = null!;
		public string? ResponseNote { get; set; } = null!;
		public string ResolveStatus { get; set; } = null!;
		

    }
}

