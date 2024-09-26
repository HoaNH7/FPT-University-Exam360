using System;
namespace backend.DTOs.Auth
{
	public class ImportProctorIntoScheduleDTO
	{
		public DateTime startTime { get; set; } 
		public DateTime EndTime { get; set; }
        public string RoomName { get; set; } = null!;
		public string ProctorEmail { get; set; } = null!;
		public string Semester { get; set; } = null!;

	}
}

