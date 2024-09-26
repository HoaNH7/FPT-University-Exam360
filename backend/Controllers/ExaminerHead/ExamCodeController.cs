using System;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Authorization;
using System.Globalization;

namespace backend.Controllers.ExaminerHead
{
    [Authorize(Authorization.Role.ExaminerHead)]
    [Route("ExaminerHead/[controller]")]
    [ApiController]
    public class ExamCodeController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ExamCodeController(SEP490_V3Context context)
        {
            _context = context;


        }

        [HttpGet("GetAllExamCodes")]
        public async Task<IActionResult> GetAllExamCodes(string? semester, int? pageNumber = 1, int? pageSize = null)
        {
            var currentDate = DateTime.Now;

            var query = from e in _context.ExamCodes
                        join s in _context.Subjects on e.SubjectId equals s.SubjectId
                        join sch in _context.Schedules on e.ScheduleId equals sch.ScheduleId
                        select new ExamCodeSubjectScheduleDTO
                        {
                            ExamCodeId = e.ExamCodeId,
                            ExamCode = e.Code,
                            OpenCode = e.OpenCode,
                            Title = e.Title,
                            SubjectName = s.SubjectName,
                            SubjectCode = s.SubjectCode,
                            StartTime = sch.StartTime,
                            EndTime = sch.EndTime,
                            Semester = sch.Semester,
                            Status = e.Status,
                            Section = e.Section,
                        };

            if (!string.IsNullOrEmpty(semester))
            {
                query = query.Where(x => x.Semester == semester);
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

            if (pageNumber.HasValue && pageNumber.Value > totalPages)
            {
                pageNumber = totalPages;
            }

            var itemsQuery = query;

            if (pageSize.HasValue && pageSize.Value > 0)
            {
                itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var examCodes = await itemsQuery.ToListAsync();

            foreach (var examCode in examCodes)
            {
                if (currentDate > examCode.EndTime)
                {
                    examCode.Status = true;
                }
                else
                {
                    examCode.Status = false;
                }
            }

            var result = new
            {
                TotalCount = totalCount,
                ExamCodes = examCodes
            };

            return Ok(result);
        }


        [HttpPost("AddExamCode")]
        public async Task<IActionResult> AddExamCode([FromBody] List<ExamCodeSubjectScheduleDTO> data)
        {
            if (data == null || !data.Any())
            {
                return BadRequest("No data provided");
            }
            foreach (var item in data)
            {
                // Get schedule Id
                var existedSchedule = await _context.Schedules
                    .Where(s => s.StartTime == item.StartTime && s.EndTime == item.EndTime)
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
                        StartTime = item.StartTime,
                        EndTime = item.EndTime,
                        Semester = item.Semester,
                    };
                    _context.Schedules.Add(newSchedule);
                    _context.SaveChanges();
                    scheduleId = newSchedule.ScheduleId;
                }

                // Get subject Id
                var existedSubject = _context.Subjects.FirstOrDefault(s => s.SubjectCode == item.SubjectCode);
                uint subjectId;

                if (existedSubject != null)
                {
                    subjectId = existedSubject.SubjectId;
                }
                else
                {
                    var newSubject = new Subject
                    {
                        SubjectCode = item.SubjectCode,
                        SubjectName = item.SubjectName,
                    };
                    _context.Subjects.Add(newSubject);
                    _context.SaveChanges();
                    subjectId = newSubject.SubjectId;
                }

                // Insert exam code into DB
                var existedExamCode = await _context.ExamCodes.Where(x => x.Code.Contains(item.ExamCode)).FirstOrDefaultAsync();
                if (existedExamCode == null)
                {
                    var newExamCode = new ExamCode
                    {
                        Code = item.ExamCode,
                        OpenCode = item.OpenCode,
                        Title = item.Title,
                        Status = item.Status,
                        Section = item.Section,
                        SubjectId = subjectId,
                        ScheduleId = scheduleId,
                    };
                    _context.ExamCodes.Add(newExamCode);
                    await _context.SaveChangesAsync();
                }
                await _context.SaveChangesAsync();
            }

            return Ok("Success");
        }

        [HttpPut("EditExamCode")]// không được sửa môn thi , chỉ được sửa code -> sửa được mã code với , lịch t
        public async Task<IActionResult> EditExamCode([FromBody] List<ExamCodeSubjectScheduleDTO> data)
        {
            if (data == null || !data.Any())
            {
                return BadRequest("Invalid data provided");
            }
            foreach (var item in data)
            {
                // examCode need to c
                var existingExamCode = await _context.ExamCodes.FirstOrDefaultAsync(e => e.ExamCodeId == item.ExamCodeId);
                if (existingExamCode == null)
                {
                    return NotFound("Exam Code not found");
                }

                // Handle schedule
                var existedSchedule = await _context.Schedules.FirstOrDefaultAsync(s => s.StartTime == item.StartTime && s.EndTime == item.EndTime);
                uint scheduleId;
                if (existedSchedule == null)//schedule chưa có data
                {
                    var newSchedule = new Schedule
                    {
                        StartTime = item.StartTime,
                        EndTime = item.EndTime,
                        Semester = item.Semester,
                    };// tạo mới 
                    _context.Schedules.Add(newSchedule);
                    await _context.SaveChangesAsync();//
                    scheduleId = newSchedule.ScheduleId;

                }
                else// schedule đã có  data
                {
                    scheduleId = existedSchedule.ScheduleId;
                    existedSchedule.StartTime = item.StartTime;
                    existedSchedule.EndTime = item.EndTime;
                    existedSchedule.Semester = item.Semester;

                }
                var existedExamCode = await _context.ExamCodes.Where(x => x.Code.Contains(item.ExamCode)).FirstOrDefaultAsync();
                existingExamCode.Code = item.ExamCode;
                existingExamCode.OpenCode = item.OpenCode;
                existingExamCode.Title = item.Title;
                existingExamCode.Status = item.Status;
                existingExamCode.Section = item.Section;
                existingExamCode.ScheduleId = scheduleId;

                DateTime currentDate = DateTime.Now;
                if (item.StartTime > currentDate)
                {
                    existingExamCode.Status = false;
                }
                else if (item.EndTime < currentDate)
                {
                    existingExamCode.Status = true;
                }

                _context.ExamCodes.Update(existingExamCode);

                _context.SaveChanges();
            }
            return Ok(data);


        }

        [HttpPost("AddSingleExamCode")]
        public async Task<IActionResult> AddSingleExamCode([FromBody] ExamCodeSubjectScheduleDTO data)
        {
            if (data == null)
            {
                return BadRequest("No data provided");
            }
            // Get schedule Id
            var existedSchedule = _context.Schedules.FirstOrDefault(s => s.StartTime == data.StartTime && s.EndTime == data.EndTime);
            uint scheduleId;

            if (existedSchedule != null)
            {
                scheduleId = existedSchedule.ScheduleId;
            }
            else
            {
                var newSchedule = new Schedule
                {
                    StartTime = data.StartTime,
                    EndTime = data.EndTime,
                };
                _context.Schedules.Add(newSchedule);
                _context.SaveChanges();
                scheduleId = newSchedule.ScheduleId;
            }

            // Get subject Id
            var existedSubject = _context.Subjects.FirstOrDefault(s => s.SubjectCode == data.SubjectCode);
            uint subjectId;

            if (existedSubject != null)
            {
                subjectId = existedSubject.SubjectId;
            }
            else
            {
                var newSubject = new Subject
                {
                    SubjectCode = data.SubjectCode,
                    SubjectName = data.SubjectName,
                };
                _context.Subjects.Add(newSubject);
                _context.SaveChanges();
                subjectId = newSubject.SubjectId;
            }

            // Insert exam code into DB
            var existedExamCode = await _context.ExamCodes.Where(x => x.Code.Contains(data.ExamCode)).FirstOrDefaultAsync();
            if (existedExamCode == null)
            {
                var newExamCode = new ExamCode
                {
                    Code = data.ExamCode,
                    OpenCode = data.OpenCode,
                    Title = data.Title,
                    Status = data.Status,
                    SubjectId = subjectId,
                    ScheduleId = scheduleId,
                };
                _context.ExamCodes.Add(newExamCode);
                await _context.SaveChangesAsync();
            }

            await _context.SaveChangesAsync();
            return Ok("Success");
        }


        [HttpGet("SearchExamCode")]
        public async Task<IActionResult> SearchExamCode(string? subjectCode, bool? status, string? date, string? subjectName)
        {
            try
            {
                var examCodesQuery = from e in _context.ExamCodes
                                     join s in _context.Subjects on e.SubjectId equals s.SubjectId
                                     join sch in _context.Schedules on e.ScheduleId equals sch.ScheduleId
                                     select new
                                     {
                                         e.SubjectId,
                                         e.Code,
                                         e.OpenCode,
                                         e.Title,
                                         e.Status,
                                         s.SubjectName,
                                         s.SubjectCode,
                                         sch.StartTime,
                                         sch.EndTime,
                                         //sch.Semester
                                     };

                if (!string.IsNullOrEmpty(subjectCode))
                {
                    examCodesQuery = examCodesQuery.Where(ec => ec.SubjectCode.Contains(subjectCode));
                }

                //if (!string.IsNullOrEmpty(semester))
                //{
                //    examCodesQuery = examCodesQuery.Where(ec => ec.Semester == semester);
                //}

                if (status.HasValue)
                {
                    examCodesQuery = examCodesQuery.Where(ec => ec.Status == status);
                }

                if (!string.IsNullOrEmpty(date))
                {
                    if (DateTime.TryParseExact(date, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime parsedDate))
                    {
                        examCodesQuery = examCodesQuery.Where(ec => ec.StartTime.Date == parsedDate.Date);
                    }
                    else
                    {
                        return BadRequest("Invalid date format. Please use yyyy-MM-dd.");
                    }
                }

                if (!string.IsNullOrEmpty(subjectName))
                {
                    examCodesQuery = examCodesQuery.Where(ec => ec.SubjectName.Contains(subjectName));
                }

                var subjectCodes = await examCodesQuery.Select(ec => new
                {
                    ec.SubjectId,
                    ec.Code,
                    ec.OpenCode,
                    ec.Title,
                    ec.Status,
                    ec.SubjectName,
                    ec.SubjectCode,
                    Date = ec.StartTime.ToString("yyyy-MM-dd"),
                    StartTime = ec.StartTime.ToString("HH:mm"),
                    EndTime = ec.EndTime.ToString("HH:mm"),
                    //Semester = ec.Semester
                }).ToListAsync();

                if (!subjectCodes.Any())
                {
                    return NotFound("No exam codes found");
                }

                return Ok(subjectCodes);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server error: {ex.Message}");
            }
        }


        [HttpDelete("DeleteByExamCodeId/{examCodeId}")]
        public async Task<IActionResult> DeleteByExamCodeId(uint examCodeId)
        {
            var examCode = await _context.ExamCodes.FirstOrDefaultAsync(s => s.ExamCodeId == examCodeId);
            if (examCode == null)
            {
                return NotFound("Subject not found");
            }

            var examCodes = _context.ExamCodes.Where(e => e.ExamCodeId == examCodeId).ToList();
            if (!examCodes.Any())
            {
                return NotFound("No exam codes found for the given examCode ID");
            }

            _context.ExamCodes.RemoveRange(examCodes);
            await _context.SaveChangesAsync();

            return Ok("Exam codes deleted successfully");
        }
    }
}





