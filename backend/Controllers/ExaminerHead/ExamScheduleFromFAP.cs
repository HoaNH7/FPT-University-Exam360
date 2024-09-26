using System;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;

namespace backend.Controllers.ExaminerHead
{
    //[Authorize(Authorization.Role.ExaminerHead)]
    [Route("ExaminerHead/[controller]")]
    [ApiController]
    public class ExamScheduleFromFAP : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ExamScheduleFromFAP(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpPost("AddExamSchedulesFromFAP")]
        public async Task<IActionResult> AddExamSchedulesFromFAP([FromBody] List<ExamScheduleDTO> schedules)
        {

            foreach (var schedule in schedules)
            {
                if (!DateTime.TryParseExact(schedule.StartTime.Trim(), "dd/MM/yyyy HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startTime))
                {
                    Console.WriteLine("this is start time schedule");
                    Console.WriteLine(JsonConvert.SerializeObject(schedule));
                    return BadRequest($"Invalid StartTime format for schedule with Semester: {schedule.Semester}");
                }

                if (!DateTime.TryParseExact(schedule.EndTime.Trim(), "dd/MM/yyyy HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endTime))
                {
                    Console.WriteLine("this is end time schedule");
                    Console.WriteLine(JsonConvert.SerializeObject(schedule));
                    return BadRequest($"Invalid EndTime format for schedule with Semester: {schedule.Semester}");
                }
                if (schedule.Semester == "AL&BE") // hiện tại api bên FAP trả về AL&BE cái này sai nên chuyển sang SU24
                {
                    schedule.Semester = "SU24";
                }
                // Check if the schedule exists
                var existingSchedule = await _context.Schedules.Include(s => s.ExamRooms)
                .FirstOrDefaultAsync(s => s.StartTime == startTime && s.EndTime == endTime && s.Semester == schedule.Semester);
                uint scheduleId;
                if (existingSchedule == null)
                {
                    // Add new schedule
                    var newSchedule = new Schedule
                    {
                        StartTime = startTime,
                        EndTime = endTime,
                        Semester = schedule.Semester,
                    };
                    _context.Schedules.Add(newSchedule);
                    await _context.SaveChangesAsync();
                    scheduleId = newSchedule.ScheduleId;
                }
                else
                {
                    scheduleId = existingSchedule.ScheduleId;
                }
                foreach (var room in schedule.ExamRooms)
                {
                    // Check if the place exists by PlaceName
                    var place = await _context.Places.FirstOrDefaultAsync(p => p.Address == room.PlaceName);
                    if (place == null)
                    {
                        Console.WriteLine("Bad request due to place null!");
                        return BadRequest($"Place with name {room.PlaceName} does not exist.");
                    }

                    var existingRoom = await _context.ExamRooms.FirstOrDefaultAsync(er => er.RoomName == room.ExamRoomId
                    && er.PlaceId == place.PlaceId && er.Schedule.StartTime == startTime && er.Schedule.EndTime == endTime);

                    uint examRoomId;
                    if (existingRoom == null)
                    {
                        var newRoom = new ExamRoom
                        {
                            PlaceId = place.PlaceId,// place đã mặc định có trong db AP
                            //ProctorId = proctor.UserId,
                            RoomName = room.ExamRoomId,
                            ScheduleId = scheduleId,
                        };
                        _context.ExamRooms.Add(newRoom);
                        await _context.SaveChangesAsync();

                        examRoomId = newRoom.ExamRoomId;
                    }
                    else
                    {
                        examRoomId = existingRoom.ExamRoomId;
                    }
                  
                    foreach (var studentRoomSubject in room.StudentRoomSubjects)
                    {
                        // Check if the student exists
                        //var existingStudent = await _context.Students.FirstOrDefaultAsync(s => s.Email == studentRoomSubject.Student.Email);
                        var existingStudent = await _context.Students
                           .Where(x => x.Email == studentRoomSubject.Student.Email)
                           .Select(x => new
                           {
                               x.StudentId,
                               x.Email,
                               x.StudentIdNumber
                           })
                           .FirstOrDefaultAsync();
                        uint studentId;
                        if (existingStudent == null)
                        {
                            var newStudent = new Student
                            {
                                Email = studentRoomSubject.Student.Email,
                                StudentIdNumber = studentRoomSubject.Student.StudentIdNumber,
                                FullName = studentRoomSubject.Student.FullName,
                                CitizenIdentity = studentRoomSubject.Student.CitizenIdentity,
                                Image = studentRoomSubject.Student.Avatar,
                            };
                            _context.Students.Add(newStudent);
                            await _context.SaveChangesAsync();
                            studentId = newStudent.StudentId;
                            Console.WriteLine("================== studentId =============");
                            Console.WriteLine(studentId);
                        }
                        else
                        {
                            studentId = existingStudent.StudentId;
                        }

                        // Check if the subject exists
                        var existingSubject = await _context.Subjects.FirstOrDefaultAsync(s => s.SubjectCode == studentRoomSubject.Subject.SubjectCode);
                        uint subjectId;
                        if (existingSubject == null)
                        {
                            var newSubject = new Subject
                            {
                                SubjectCode = studentRoomSubject.Subject.SubjectCode,
                                SubjectName = studentRoomSubject.Subject.SubjectName
                            };
                            await _context.Subjects.AddAsync(newSubject);
                            await _context.SaveChangesAsync();
                            subjectId = newSubject.SubjectId;
                            Console.WriteLine("================== subjectId =============");
                            Console.WriteLine(subjectId);
                        }
                        else
                        {
                            subjectId = existingSubject.SubjectId;
                        }
                        var existStudentRoomSubject = await _context.StudentRoomSubjects
                             .Where(x => x.StudentId == studentId && x.SubjectId == subjectId && x.ExamRoomId == examRoomId)
                            .FirstOrDefaultAsync();
                        if (existStudentRoomSubject == null)
                        {
                            var newStudentRoomSubject = new StudentRoomSubject
                            {
                                StudentId = studentId,
                                SubjectId = subjectId,
                                ExamRoomId = examRoomId,
                            };
                            try {
                                Console.WriteLine("--------------1----------------");
                                _context.StudentRoomSubjects.Add(newStudentRoomSubject);
                                await _context.SaveChangesAsync();
                            }
                            catch(Exception ex)
                            {

                                Console.WriteLine("this is studentroomsubject :");
                                _context.Remove(newStudentRoomSubject);
                                //Console.WriteLine(JsonConvert.SerializeObject(newStudentRoomSubject));
                                //throw new Exception(JsonConvert.SerializeObject(newStudentRoomSubject));
                            }
                            // Add StudentRoomSubject
                           
                        }
                    }

                }

            }
            //await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpPost("AddStudentsFromFAP")]
        public async Task<IActionResult> AddStudentsFromFAP([FromBody] List<StudentFromFapDTO> students)
        {
            foreach (var student in students)
            {
                        // Check if the student exists
                        //var existingStudent = await _context.Students.FirstOrDefaultAsync(s => s.Email == studentRoomSubject.Student.Email);
                        var existingStudent = await _context.Students
                           .Where(x => x.StudentIdNumber == student.RollNumber)
                           .FirstOrDefaultAsync();
                        uint studentId;
                        if (existingStudent == null)
                        {
                            var newStudent = new Student
                            {
                                Email = student.Email,
                                StudentIdNumber = student.RollNumber,
                                FullName = student.FullName,
                                CitizenIdentity = student.IDCard, // chua co
                                Image = student.Avatar,
                            };
                            _context.Students.Add(newStudent);
                            await _context.SaveChangesAsync();
                            studentId = newStudent.StudentId;
                            Console.WriteLine("================== studentId =============");
                            Console.WriteLine(studentId);
                        }
                        else
                        {
                            if(!existingStudent.Email.Contains("@fpt.edu.vn"))
                            {
                                existingStudent.Email = student.Email;
                                _context.Students.Update(existingStudent);
                                _context.SaveChanges();
                            }
                        }
             }
                
            await _context.SaveChangesAsync();
            return Ok();
        }
        [HttpPost("Import2NDExamSchedule")]
        public async Task<IActionResult> Import2NDExamSchedule([FromBody] List<Import2NDExamScheduleDTO> secondExamSchedules)
        {
            int count = 0;
            var campusIdString = HttpContext.Items["CampusId"]?.ToString();
            uint.TryParse(campusIdString, out uint campusId);
            if (secondExamSchedules == null || !secondExamSchedules.Any())
            {
                return BadRequest("schedules are added not true ");
            }
            foreach (var schedule in secondExamSchedules)
            {
                count++;
                // check proctor email have existed in the system , if not add to user table with role Proctor 
                var role = await _context.Roles.Where(x => x.RoleName == "Proctor").FirstOrDefaultAsync();
                if (role == null)
                {
                    return BadRequest($"Row {count}, Role Proctor have not existed in the system");
                }
                var existedProctor = await _context.UserRoles
                .Include(x => x.User)
                .Include(x => x.Role)
                .Where(x => x.User.Email == schedule.ProctorMail && x.RoleId == role.RoleId).FirstOrDefaultAsync();

                uint prortorId;
                //get roleid proctor 

                if (existedProctor == null)
                { // mail haven't existed
                    return BadRequest($" Row {count}, Let check Proctor : {schedule.ProctorMail} HAVEN'T EXISTED in the system or haven't not role PROCTOR.");
                }
                else
                {
                    prortorId = existedProctor.UserId;
                }
                var existedSchedule = await _context.Schedules
                   .Where(s => s.StartTime == schedule.StartTime && s.EndTime == schedule.EndTime && s.Semester == schedule.Semester)
                   .Select(s => new
                   {
                       s.ScheduleId,
                       s.Semester
                   })
                   .FirstOrDefaultAsync();
                uint scheduleId;

                if (existedSchedule != null)
                {
                    scheduleId = existedSchedule.ScheduleId;
                }
                else
                {
                    var newSchedule = new Schedule
                    {
                        StartTime = schedule.StartTime,
                        EndTime = schedule.EndTime,
                        Semester = schedule.Semester,
                    };
                    await _context.Schedules.AddAsync(newSchedule);
                    await _context.SaveChangesAsync();
                    scheduleId = newSchedule.ScheduleId;
                }
                // fe sẽ có place name truyền vào đây tương đương với campus code bên get schedule from fap
                var place = await _context.Places.FirstOrDefaultAsync(p => p.Address == schedule.PlaceName);
                if (place == null)
                {
                    Console.WriteLine("Bad request due to place null!");
                    return BadRequest($"Row {count},Place with name {schedule.PlaceName} does not exist.");
                }
                // check exam room by PlaceId, room name and schedule
                var existedRoom = await _context.ExamRooms.FirstOrDefaultAsync(er => er.RoomName == schedule.ExamRoom
                && er.PlaceId == place.PlaceId && er.Schedule.StartTime == schedule.StartTime && er.Schedule.EndTime == schedule.EndTime);

                uint examRoomId;
                // if exam room does not exist 
                if (existedRoom == null)
                {
                    // create new room 
                    var newRoom = new ExamRoom
                    {
                        PlaceId = place.PlaceId,// place đã mặc định có trong db AP
                        ProctorId = prortorId,
                        RoomName = schedule.ExamRoom,
                        ScheduleId = scheduleId,
                        Attempt = schedule.Attempt
                    };
                    await _context.ExamRooms.AddAsync(newRoom);
                    await _context.SaveChangesAsync();

                    examRoomId = newRoom.ExamRoomId;
                }
                else
                {
                    // exam room have existed
                    examRoomId = existedRoom.ExamRoomId;
                    if(existedRoom.ProctorId == null || existedRoom.ProctorId != prortorId){
                    var existedRoomProctor = _context.ExamRoomProctors
                            .Where(x => x.ExamRoomId == examRoomId && x.ProctorId == prortorId).FirstOrDefault();

                            if (existedRoomProctor == null)
                            {
                                var newRoomProctor = new ExamRoomProctor
                                {
                                    ExamRoomId = examRoomId,
                                    ProctorId = prortorId
                                };
                            
                            await _context.ExamRoomProctors.AddAsync(newRoomProctor);
                            await _context.SaveChangesAsync();
                            }
                     }
                }
                // check student have existed
                var existedStudent = await _context.Students.Where(x => x.StudentIdNumber == schedule.RollNo).FirstOrDefaultAsync();
                // if student does not exist
                if (existedStudent == null)
                {
                    return BadRequest($"Row {count}, {schedule.RollNo} have not existed in the system");
                }
                //check subject existed
                var existedSubject = await _context.Subjects.FirstOrDefaultAsync(s => s.SubjectCode == schedule.SubjectCode);
                uint subjectId;
                if (existedSubject == null)
                {
                    var newSubject = new Subject
                    {
                        SubjectCode = schedule.SubjectCode,
                        SubjectName = schedule.SubjectCode
                    };
                    await _context.Subjects.AddAsync(newSubject);
                    await _context.SaveChangesAsync();
                    subjectId = newSubject.SubjectId;
                    Console.WriteLine("================== subjectId =============");
                    Console.WriteLine(subjectId);
                }
                else
                {
                    subjectId = existedSubject.SubjectId;
                }
                // check existed student room subject
                var existedStudentRoomSubject = await _context.StudentRoomSubjects
                    .Where(x => x.StudentId == existedStudent.StudentId && x.SubjectId == subjectId && x.ExamRoomId == examRoomId)
                   .FirstOrDefaultAsync();
                if (existedStudentRoomSubject == null)
                {
                    // Add StudentRoomSubject
                    var newStudentRoomSubject = new StudentRoomSubject
                    {
                        StudentId = existedStudent.StudentId,
                        SubjectId = subjectId,
                        ExamRoomId = examRoomId,
                        Note = schedule.Note
                    };
                    try
                    {
                        Console.WriteLine("--------------1----------------");
                        _context.StudentRoomSubjects.Add(newStudentRoomSubject);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception ex)
                    {

                        Console.WriteLine("this is studentroomsubject :");
                        _context.Remove(newStudentRoomSubject);
                        //Console.WriteLine(JsonConvert.SerializeObject(newStudentRoomSubject));
                        //throw new Exception(JsonConvert.SerializeObject(newStudentRoomSubject));
                    }
                }
            }
            await _context.SaveChangesAsync();
            return Ok("IMPORT 2NDFE SUCCESSFULLY");
        }
       

    }  
}