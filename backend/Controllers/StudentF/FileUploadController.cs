using System.Net;
using Azure.Storage.Blobs;
using backend;
using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
namespace backend.Controllers.StudentF
{

    [Authorize(Authorization.Role.Student)]
    [ApiController]
    [Route("api/[controller]")]
    public class FileUploadController : ControllerBase
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureBlobStorageSettings _settings;
        private readonly SEP490_V3Context _context;

        public FileUploadController(BlobServiceClient blobServiceClient, IOptions<AzureBlobStorageSettings> settings, SEP490_V3Context context)
        {
            _blobServiceClient = blobServiceClient;
            _settings = settings.Value;
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file, [FromForm] uint scheduleId, [FromForm] uint subjectId)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }
            var EmailUser = HttpContext.Items["Email"]?.ToString();
            //uint.TryParse(EmailRaw, out uint EmailUser);
            var student = await _context.Students
                          .Where(x => x.Email == EmailUser)
                          .Select(x => new
                          {
                              x.StudentId,
                              x.Email,
                              x.StudentIdNumber
                          })
                          .FirstOrDefaultAsync();

            var containerClient = _blobServiceClient.GetBlobContainerClient(_settings.ContainerName);
            var blobClient = containerClient.GetBlobClient(file.FileName);
            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, true);
            }
            string fileUrl = blobClient.Uri.ToString();

            // Save file URL to the database
            var submission = new StudentSubmission
            {
                ScheduleId = scheduleId,
                SubjectId = subjectId,
                StudentId = student.StudentId,
                FilePath = fileUrl,
                SubmissionDate = DateTime.Now
            };
            await _context.StudentSubmissions.AddAsync(submission);
            await _context.SaveChangesAsync();

            return Ok(new { fileUrl });
        }
        [HttpGet("GetSubjectsOfTheStudentTested")]
        public async Task<IActionResult> GetSubjectsOfTheStudentTested()
        {
            var studentEmailString = HttpContext.Items["Email"]?.ToString();
            var subjectsStudentTested = await _context.StudentRoomSubjects.Include(x => x.Student).Include(x => x.Subject)
                .Include(x => x.ExamRoom).ThenInclude(x => x.Schedule)
                .Where(x => x.Student.Email == studentEmailString).Select(
                s => new
                {
                    s.Student.FullName,
                    s.Subject.SubjectCode,
                    Date = s.ExamRoom.Schedule.StartTime.ToString("yyyy-MM-dd"),
                    Slot = s.ExamRoom.Schedule.StartTime.ToString("HH:mm") + "-" + s.ExamRoom.Schedule.EndTime.ToString("HH:mm"),
                    s.Subject.SubjectId,
                    s.ExamRoom.Schedule.ScheduleId
                }
                ).ToListAsync();
            return Ok(subjectsStudentTested);
        }
        [HttpGet("GetAllSubmissionByStudentId")]
        public async Task<IActionResult> GetAllSubmissionByStudentId()
        {
            var EmailUser = HttpContext.Items["Email"]?.ToString();
            var student = await _context.Students
                           .Where(x => x.Email == EmailUser)
                           .Select(x => new
                           {
                               x.StudentId,
                               x.Email,
                               x.StudentIdNumber
                           })
                           .FirstOrDefaultAsync();
            Console.WriteLine("this is student id :", student.StudentId);
            var submissionsByStudentId = await _context.StudentSubmissions
                .Include(x => x.Student)
                .Include(x => x.Subject)
                .Include(x => x.Schedule)
                .ThenInclude(x => x.ExamRooms).
                Where(x => x.StudentId == student.StudentId)
                .Select(x => new
                {
                    x.Student.StudentIdNumber,
                    x.Student.FullName,
                    Date = x.Schedule.StartTime.ToString("yyyy-MM-dd"),
                    Slot = x.Schedule.StartTime.ToString("HH:mm") + "-" + x.Schedule.EndTime.ToString("HH:mm"),
                    x.Subject.SubjectCode,
                    file = x.FilePath,
                    uploadDate = x.SubmissionDate.ToString("yyyy-MM-dd HH:mm")


                }).ToListAsync();
            return Ok(submissionsByStudentId);
        }
        [HttpGet("GetAllSubmissions")]
        public async Task<IActionResult> GetAllSubmissions()
        {
            var submissionsByStudentId =
                await _context.StudentSubmissions
                .Include(x => x.Student)
                .Include(x => x.Subject)
                .Include(x => x.Schedule)
                .ThenInclude(x => x.ExamRooms)
                .Select(x => new
                {
                    x.Student.StudentIdNumber,
                    x.Student.FullName,
                    Date = x.Schedule.StartTime.ToString("yyyy-MM-dd"),
                    Slot = x.Schedule.StartTime.ToString("HH:mm") + "-" + x.Schedule.EndTime.ToString("HH:mm"),
                    x.Subject.SubjectCode,
                    file = x.FilePath,
                    uploadDate = x.SubmissionDate.ToString("yyyy-MM-dd HH:mm")

                })
                .ToListAsync();
            return Ok(submissionsByStudentId);
        }
    }
}
    

    
    