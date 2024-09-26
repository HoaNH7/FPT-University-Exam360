namespace backend.DTOs
{
    public class StudentDTO
    {
        public string Subject { get; set; } = null!;
        public string? ExamForm { get; set; }
        public string RollNo { get; set; } = null!;
        public string Hall { get; set; } = null!;

        public string FullName { get; set; } = null!;

        public string Proctor { get; set; } = null!;
       
        public string Resquest{ get; set; } = null!;

    }
}
