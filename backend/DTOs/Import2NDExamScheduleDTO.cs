using System;
namespace backend.DTOs
{
    public class Import2NDExamScheduleDTO {
        public string RollNo {get;set;} = null!;
        public string ExamRoom {get;set;} = null!;
        public string SubjectCode {get;set;} = null!;
        public string? Note {get;set;} = null!;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Semester {get;set;} = null!; 
        public string Attempt {get;set;} = null!;
        public string ProctorMail {get;set;} = null!;
         public string? PlaceName { get; set; } = null!;
    }

}