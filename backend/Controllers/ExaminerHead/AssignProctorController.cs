using backend.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.DTOs;
using backend.DTOs.Auth;
using backend.Authorization;

namespace backend.Controllers.ExaminerHead
{
    [Authorize(Authorization.Role.ExaminerHead)]
    [Route("api/[controller]")]
    [ApiController]
    public class AssignProctorController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        public AssignProctorController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetProctorsByCampus/{campusId}")]
        public async Task<IActionResult> GetProctorsByCampus(int campusId)
        {
            try
            {
                var proctors = await _context.Users
                    .Where(u => u.CampusId == campusId && u.UserRoles.Any(ur => ur.RoleId == 5))
                    .Select(u => new
                    {
                        u.UserId,
                        u.Email,
                        CampusName = u.Campus.CampusName
                    })
                    .ToListAsync();

                return Ok(proctors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }

        [HttpPost("ImportProctorIntoSchedule")]
        public async Task<IActionResult> ImportProctorIntoSchedule([FromBody] List<ImportProctorIntoScheduleDTO> ExcelDatas)
        {
            var campusIdString = HttpContext.Items["CampusId"]?.ToString();
            uint.TryParse(campusIdString, out uint campusId);
            if (ExcelDatas == null || !ExcelDatas.Any())
            {
                return BadRequest("File Excel have no data to import");
            }

            try
            {
                int count = 0;
                foreach (var data in ExcelDatas)
                {
                    count ++;
                    // Check for existing proctor
                    var existedProctor = await _context.UserRoles
                        .Include(x => x.User)
                        .Include(x => x.Role)
                        .FirstOrDefaultAsync(x => x.User.Email == data.ProctorEmail);

                    uint proctorId;
                    if (existedProctor != null)
                    {
                        proctorId = existedProctor.UserId;
                    }
                    else
                    {
                        // var newProctor = new User
                        // {
                        //     Email = data.ProctorEmail,
                        //     IsActive = true,
                        //     CampusId = campusId,
                        // };
                        // _context.Users.Add(newProctor);
                        // await _context.SaveChangesAsync();
                        // proctorId = newProctor.UserId;
                        return BadRequest($"Row {count},Let check Proctor : {data.ProctorEmail} HAVEN'T EXISTED in the system or haven't not role PROCTOR.");
                    }

                    // Get role id of proctor
                    var role = await _context.Roles.FirstOrDefaultAsync(x => x.RoleName == "Proctor");
                    if (role == null)
                    {
                        return BadRequest("Proctor role not found");
                    }
                    uint roleId = role.RoleId;

                    // Check existed userRole
                    var existedUserRole = await _context.UserRoles.FirstOrDefaultAsync(x => x.UserId == proctorId && x.RoleId == roleId);
                    if (existedUserRole == null)
                    {
                        var newUserRole = new UserRole
                        {
                            UserId = proctorId,
                            RoleId = roleId
                        };
                        _context.UserRoles.Add(newUserRole);
                        await _context.SaveChangesAsync();
                    }

                    // Check existed schedule
                    var existedSchedule = await _context.Schedules.FirstOrDefaultAsync(es =>
                        es.StartTime == data.startTime && es.EndTime == data.EndTime && es.Semester == data.Semester);

                    if (existedSchedule == null)
                    {
                        return BadRequest(new { message = $"Không tìm thấy lịch với StartTime: {data.startTime}, EndTime: {data.EndTime}, và Semester: {data.Semester}" });
                    }

                    uint scheduleId = existedSchedule.ScheduleId;

                    // Check existed ExamRoom
                    var existedExamRoom = await _context.ExamRooms.FirstOrDefaultAsync(er =>
                        er.ScheduleId == scheduleId && er.RoomName == data.RoomName);
                    
                    uint examRoomId;

                    if (existedExamRoom != null)
                    {
                        // exam room have existed
                    examRoomId = existedExamRoom.ExamRoomId;
                    if(existedExamRoom.ProctorId == null || existedExamRoom.ProctorId != proctorId){
                            var existedRoomProctor = _context.ExamRoomProctors
                                                    .Where(x => x.ExamRoomId == examRoomId && x.ProctorId == proctorId)
                                                    .FirstOrDefault();

                            if (existedRoomProctor == null)
                            {
                                var newRoomProctor = new ExamRoomProctor
                                {
                                    ExamRoomId = examRoomId,
                                    ProctorId = proctorId
                                };
                            
                            await _context.ExamRoomProctors.AddAsync(newRoomProctor);
                            await _context.SaveChangesAsync();
                            }
                     }
                    }
                    else
                    {
                        //var newExamRoom = new ExamRoom
                        //{
                        //    PlaceId = 2,
                        //    ScheduleId = scheduleId,
                        //    RoomName = data.RoomName,
                        //    ProctorId = proctorId
                        //};
                        //_context.ExamRooms.Add(newExamRoom);
                        //await _context.SaveChangesAsync();
                        return BadRequest($"The exam room {data.RoomName} with start time :{data.startTime} and end time : {data.EndTime}");

                    }
                }
                return Ok("Success");
            }
            catch (Exception e)
            {
                // Log the exception here
                return StatusCode(500, "Internal server error");
            }
        }

        //[HttpPost("ImportProctorIntoSchedule")]
        //public async Task<IActionResult> ImportProctorIntoSchedule([FromBody] List<ImportProctorIntoScheduleDTO> ExcelDatas)
        //{

        //    if (ExcelDatas == null || !ExcelDatas.Any())
        //    {
        //        return BadRequest("File Excel have no data to import");
        //    }
        //    foreach (var data in ExcelDatas)
        //    {
        //        // check proctor in user table
        //        var existedProctor = _context.UserRoles.Include(x => x.User).Include(x => x.Role)
        //            .Where(x => x.User.Email == data.ProctorEmail)
        //            .FirstOrDefault();
        //        uint proctorId;
        //        if (existedProctor != null)
        //        {
        //            proctorId = existedProctor.UserId;
        //        }
        //        else
        //        {
        //            var newProctor = new User
        //            {
        //                Email = data.ProctorEmail,
        //                IsActive = true,
        //                CampusId = 1,
        //            };
        //            _context.Users.Add(newProctor);
        //            _context.SaveChanges();
        //            proctorId = newProctor.UserId;

        //        }
        //        // get role if of protor
        //        var role = _context.Roles.Where(x => x.RoleName == "Proctor").FirstOrDefault();
        //        uint roleId = role.RoleId;
        //        Console.WriteLine("this role id api import protor to schedule");
        //        Console.WriteLine(roleId);

        //        Console.WriteLine("this user  id api import protor to schedule");
        //        Console.WriteLine(proctorId);
        //        // check existed userRole
        //        var existedUserRole = _context.UserRoles.Where(x => x.UserId == proctorId && x.RoleId == roleId).FirstOrDefault();

        //        if (existedUserRole == null)
        //        {
        //            var newUserRole = new UserRole
        //            {
        //                UserId = proctorId,
        //                RoleId = roleId

        //            };
        //            _context.UserRoles.Add(newUserRole);
        //            _context.SaveChanges();

        //        }

        //        // check existed schedule
        //        var exsistedSchedule = _context.Schedules
        //            .Where(es => es.StartTime == data.startTime && es.EndTime == data.EndTime && es.Semester == data.Semester)
        //            .FirstOrDefault();
        //        uint scheduleId;
        //        if (exsistedSchedule != null)
        //        {
        //            scheduleId = exsistedSchedule.ScheduleId;
        //        }
        //        else
        //        {
        //            var newSchedule = new Schedule
        //            {
        //                StartTime = data.startTime,
        //                EndTime = data.EndTime,
        //                Semester = data.Semester
        //            };
        //            _context.Schedules.Add(newSchedule);
        //            _context.SaveChanges();
        //            scheduleId = newSchedule.ScheduleId;
        //        }
        //        // check existed ExamRoom
        //        var existedExamRoom = _context.ExamRooms
        //             .Where(er => er.ScheduleId == scheduleId && er.RoomName == data.RoomName)
        //             .FirstOrDefault();
        //        uint examRoomId;
        //        if (existedExamRoom != null)
        //        {
        //            if (existedExamRoom.ProctorId != proctorId)
        //            {

        //                existedExamRoom.ProctorId = proctorId;

        //                _context.ExamRooms.Update(existedExamRoom);
        //                _context.SaveChanges();
        //            }

        //        }
        //        else
        //        {
        //            var newExamRoom = new ExamRoom
        //            {
        //                PlaceId = 6,
        //                ScheduleId = scheduleId,
        //                RoomName = data.RoomName,
        //                ProctorId = proctorId
        //            };
        //            _context.ExamRooms.Add(newExamRoom);
        //            _context.SaveChanges();
        //        }
        //        _context.SaveChanges();
        //    }
        //    return Ok("Success");
        //}


        //[HttpPost("ImportProctorIntoSchedule")]
        //public async Task<IActionResult> ImportProctorIntoSchedule([FromBody]List<ImportProctorIntoScheduleDTO> ExcelDatas)
        //{

        //    if(ExcelDatas == null||!ExcelDatas.Any())
        //    {
        //        return BadRequest("File Excel have no data to import");
        //    }
        //    foreach(var data in ExcelDatas)
        //    {
        //        // check proctor in user table
        //        var existedProctor = _context.UserRoles.Include(x => x.User).Include(x => x.Role)
        //            .Where(x => x.User.Email == data.ProctorEmail)
        //            .FirstOrDefault();
        //        uint proctorId;
        //        if (existedProctor != null)
        //        {
        //            proctorId = existedProctor.UserId;
        //        }
        //        else
        //        {
        //            var newProctor = new User
        //            {
        //                Email =data.ProctorEmail,
        //                IsActive = true,
        //                CampusId =1,
        //            };
        //            _context.Users.Add(newProctor);
        //            _context.SaveChanges();
        //            proctorId = newProctor.UserId;

        //        }
        //        // get role if of protor
        //        var role = _context.Roles.Where(x => x.RoleName == "Proctor").FirstOrDefault();
        //        uint roleId = role.RoleId;
        //        Console.WriteLine("this role id api import protor to schedule");
        //        Console.WriteLine(roleId);

        //        Console.WriteLine("this user  id api import protor to schedule");
        //        Console.WriteLine(proctorId);
        //        // check existed userRole
        //        var existedUserRole = _context.UserRoles.Where(x => x.UserId == proctorId && x.RoleId == roleId).FirstOrDefault();

        //        if(existedUserRole == null)
        //        {
        //            var newUserRole = new UserRole
        //            {
        //                UserId = proctorId,
        //                RoleId = roleId

        //            };
        //            _context.UserRoles.Add(newUserRole);
        //            _context.SaveChanges();

        //        }

        //        // check existed schedule
        //        var existedSchedule = _context.Schedules
        //    .Where(es => es.StartTime == data.startTime && es.EndTime == data.EndTime && es.Semester == data.Semester)
        //    .FirstOrDefault();

        //        if (existedSchedule == null)
        //        {
        //            return BadRequest($"Không tìm thấy lịch với StartTime: {data.startTime}, EndTime: {data.EndTime}, và Semester: {data.Semester}");
        //        }

        //        uint scheduleId = existedSchedule.ScheduleId;
        //        // check existed ExamRoom
        //        var existingExamRoom = await _context.ExamRooms
        //    .Where(er => er.ScheduleId == scheduleId && er.RoomName == data.RoomName)
        //    .FirstOrDefaultAsync();

        //        if (existingExamRoom == null)
        //        {
        //            return BadRequest($"Không tìm thấy phòng thi với RoomName: {data.RoomName} trong lịch thi đã chọn.");
        //        }

        //        // check existed ExamRoom
        //        var existingProctorInRoom = await _context.ExamRooms
        //            .Where(er => er.ScheduleId == scheduleId && er.RoomName == data.RoomName && er.ProctorId == proctorId)
        //            .FirstOrDefaultAsync();

        //        if (existingProctorInRoom == null)
        //        {
        //            // add proctor in examroom
        //            var newProctorAssignment = new ExamRoom
        //            {
        //                PlaceId = 6, 
        //                ScheduleId = scheduleId,
        //                RoomName = data.RoomName,
        //                ProctorId = proctorId
        //            };
        //            _context.ExamRooms.Add(newProctorAssignment);
        //            await _context.SaveChangesAsync();
        //        }
        //    }
        //    return Ok("Success");
        //} 
    }
}

