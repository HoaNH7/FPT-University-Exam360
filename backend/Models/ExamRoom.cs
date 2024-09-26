using System;
using System.Collections.Generic;

namespace backend.Models
{
    public partial class ExamRoom
    {
        public ExamRoom()
        {
            StudentRoomSubjects = new HashSet<StudentRoomSubject>();
            ExamRoomProctors = new HashSet<ExamRoomProctor>();
        }

        public uint ExamRoomId { get; set; }
        public uint PlaceId { get; set; }
        public uint? ProctorId { get; set; }// nếu proctorid null trong bảng examroom thì lổi ở api Importprotorintoschedule thêm ? sẽ hết lỗi, đừng động vào đ
        public uint ScheduleId { get; set; }
        public string? RoomName { get; set; } = null!;
        public string? Attempt { get; set; } = null!;

        public virtual Place Place { get; set; } = null!;
        public virtual User? Proctor { get; set; } = null!;
        public virtual Schedule Schedule { get; set; } = null!;
        public virtual ICollection<StudentRoomSubject> StudentRoomSubjects { get; set; }
        public virtual ICollection<ExamRoomProctor> ExamRoomProctors { get; set; }
    }
}
