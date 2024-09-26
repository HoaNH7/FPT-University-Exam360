using System;
using backend.Authorization;
using backend.DTOs.ScheduleProctorDTO;
using backend.Models;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class GetScheduleOfProctor : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        public GetScheduleOfProctor(SEP490_V3Context context)
        {
            _context = context;
        }
        [HttpGet]
        public ActionResult<List<SchedulexDTO>> GetScheduleByEmailProctor([FromQuery] string? startTime, [FromQuery] string? endTime)
        {
            DateTime startDateTime;
            DateTime endDateTime;

            bool isStartTimeValid = DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out startDateTime);
            bool isEndTimeValid = DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out endDateTime);

            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            // Query to get schedules where the proctor is associated with the exam room either directly or via ExamRoomProctor
            var schedulesQuery = _context.Schedules
                .Where(s => s.ExamRooms
                    .Any(er => er.ExamRoomProctors
                        .Any(erP => erP.ProctorId == userId) ||
                        er.ProctorId == userId)
                )
                .Select(s => new SchedulexDTO
                {
                    ScheduleId = s.ScheduleId,
                    Semester = s.Semester,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    ExamRooms = s.ExamRooms
                        .Where(er => er.ExamRoomProctors
                            .Any(erP => erP.ProctorId == userId) ||
                            er.ProctorId == userId)
                        .Select(er => new ExamRoomxDTO
                        {
                            ExamRoomId = er.ExamRoomId,
                            ScheduleId = er.ScheduleId,
                            RoomName = er.RoomName,
                            ProctorId = er.ProctorId,
                            Attempt = er.Attempt,
                            StudentRoomSubjects = er.StudentRoomSubjects.Select(srs => new StudentRoomSubjectxDTO
                            {
                                StudentId = srs.StudentId,
                                ExamRoomId = srs.ExamRoomId,
                                SubjectId = srs.SubjectId,
                                Student = new StudentxDTO
                                {
                                    StudentId = srs.Student.StudentId,
                                    FullName = srs.Student.FullName,
                                    Email = srs.Student.Email,
                                    StudentIdNumber = srs.Student.StudentIdNumber,
                                    ClassId = srs.Student.ClassId ?? 0,
                                    CitizenIdentity = srs.Student.CitizenIdentity
                                },
                                Subject = new SubjectxDTO
                                {
                                    SubjectId = srs.Subject.SubjectId,
                                    SubjectCode = srs.Subject.SubjectCode,
                                    SubjectName = srs.Subject.SubjectName
                                }
                            }).ToList()
                        }).ToList()
                });

            if (isStartTimeValid || isEndTimeValid)
            {
                schedulesQuery = schedulesQuery.Where(s => s.StartTime >= startDateTime && s.EndTime <= endDateTime);
            }

            var schedules = schedulesQuery.ToList();

            return Ok(schedules);
        }

    }
}

