﻿using System;
namespace backend.DTOs
{
	public class ViolationDto
	{
        public string? StudentIdNumber { get; set; } = null!;
        public string? ViolationTitle { get; set; } = null!;
        public string? Note { get; set; } = null!;
        public uint ProctorId { get; set; }
        public string? StartTime { get; set; } = null!;
        public string? EndTime { get; set; } = null!;
        public string? RoomName { get; set; } = null!;
    }
}

