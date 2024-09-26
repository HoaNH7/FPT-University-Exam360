using System;
namespace backend.DTOs
{
	public class ImportExcelUserDTO
	{
		public string Email { get; set; } = null!;
		public string? CampusName { get; set; } = null!;
		public string RoleName { get; set; } = null!;
	}
}

