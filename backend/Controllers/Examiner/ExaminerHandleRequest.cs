using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Examiner
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class ExaminerHandleRequest : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public ExaminerHandleRequest(SEP490_V3Context context)
        {
            _context = context;


        }
        [HttpGet("GetAllStudents")]
        public async Task<IActionResult> GetAllStudents(
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            // Ensure pageSize is a positive number
            if (pageSize <= 0)
            {
                return BadRequest("Page size must be greater than zero.");
            }

            var query = _context.StudentRoomSubjects
                                 .Include(c => c.ExamRoom)
                                     .ThenInclude(c => c.Proctor)
                                     .ThenInclude(c => c.RequestRequestBies)
                                 .Include(c => c.Subject)
                                 .Include(c => c.Student)
                                 .Select(s => new StudentDTO
                                 {
                                     RollNo = s.Student.StudentIdNumber,
                                     FullName = s.Student.FullName,
                                     Subject = s.Subject.SubjectCode,
                                     Hall = s.ExamRoom.RoomName,
                                     Proctor = s.ExamRoom.Proctor.Email,
                                     // Include other properties as needed
                                 });

            var totalRecords = await query.CountAsync();

            var students = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (!students.Any())
            {
                return NotFound("No students found.");
            }

            return Ok(students); // Return list directly without "Data" wrapper
        }


        [HttpGet("GetSearchStudents")]
        public async Task<IActionResult> GetSearchStudents(
    [FromQuery] string? searchTerm,
    [FromQuery] int pageNumber = 1,
    [FromQuery] int pageSize = 10)
        {
            var query = _context.StudentRoomSubjects
                                 .Include(c => c.ExamRoom)
                                     .ThenInclude(c => c.Proctor)
                                     .ThenInclude(c => c.RequestRequestBies)
                                 .Include(c => c.Subject)
                                 .Include(c => c.Student)
                                 .AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                searchTerm = searchTerm.ToLower();
                query = query.Where(s => s.Subject.SubjectName.ToLower().Contains(searchTerm) ||
                                         s.Subject.SubjectCode.ToLower().Contains(searchTerm) ||
                                         s.Student.StudentIdNumber.ToLower().Contains(searchTerm) ||
                                         s.Student.FullName.ToLower().Contains(searchTerm));
            }

            var totalRecords = await query.CountAsync();

            var students = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new StudentDTO
                {
                    RollNo = s.Student.StudentIdNumber,
                    FullName = s.Student.FullName,
                    Subject = s.Subject.SubjectCode,
                    Hall = s.ExamRoom.RoomName,
                    Proctor = s.ExamRoom.Proctor.Email,

                    // ExamForm = s.ExamRoom.ExamForm,
                    // Request = s.ExamRoom.Proctor.Request,
                })
                .ToListAsync();

            return Ok(students); // Return list directly without "Data" wrapper
        }
    }
    }
