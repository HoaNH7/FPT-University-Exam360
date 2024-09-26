using System.Globalization;
using Azure.Storage.Blobs;
using backend.DTOs;
using backend.Models;
using DocumentFormat.OpenXml.Wordprocessing;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Globalization;
using backend.Authorization;
using static backend.Controllers.MockAPI.MockExamScheduleController;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    [Route("api/[controller]")]
    [ApiController]
    public class CheckInController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        private readonly BlobServiceClient _blobServiceClient;
        private readonly AzureBlobStorageSettings _settings;
        private readonly FileService _fileService;
        private readonly string _BACKEND_URL;

        public CheckInController(IConfiguration configuration,BlobServiceClient blobServiceClient, IOptions<AzureBlobStorageSettings> settings, SEP490_V3Context context, FileService fileService)
        {
            _blobServiceClient = blobServiceClient;
            _settings = settings.Value;
            _context = context;
            _fileService = fileService;
            _BACKEND_URL = configuration["AppSettings:BACKEND_URL"];
        }

         [HttpGet("GetAllStudentsToCheckinByProctorId/{proctorId}")]
        public async Task<IActionResult> GetAllStudentsToCheckinByProctorId(
     uint proctorId,
     [FromQuery] string? startTime,
     [FromQuery] string? endTime,
     [FromQuery] string? roomName,
     [FromQuery] string? rollNo,
     [FromQuery] bool? status,
     [FromQuery] int pageNumber = 1,
     [FromQuery] int? pageSize = null)
        {
            var gmtPlus7 = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

            if (!DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, DateTimeStyles.None, out DateTime startDateTime) ||
                !DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, DateTimeStyles.None, out DateTime endDateTime))
            {
                return BadRequest("Invalid date format. Please use 'yyyy-MM-dd HH:mm'.");
            }

            // Fetch ExamRoom IDs where the proctor is associated either directly or through ExamRoomProctor
            var examRoomIds = await _context.ExamRooms
                .Where(er => (er.ProctorId == proctorId || er.ExamRoomProctors.Any(erP => erP.ProctorId == proctorId)) &&
                             er.Schedule.StartTime >= startDateTime &&
                             er.Schedule.EndTime <= endDateTime &&
                             (string.IsNullOrEmpty(roomName) || er.RoomName == roomName))
                .Select(er => er.ExamRoomId)
                .ToListAsync();

            if (!examRoomIds.Any())
            {
                return Ok(new
                {
                    TotalCount = 0,
                    studentRequests = new List<object>()
                });
            }

            var query = _context.StudentRoomSubjects
                .Include(srs => srs.Student)
                .Include(srs => srs.ExamRoom)
                .Include(srs => srs.Student.Class)
                .Include(srs => srs.Student.Checkins)
                .Include(srs => srs.ExamRoom.Schedule)
                .Include(srs => srs.Student.StudentImages)
                .Where(x => examRoomIds.Contains(x.ExamRoomId));

            // Filter by RollNo if provided
            if (!string.IsNullOrEmpty(rollNo))
            {
                query = query.Where(x => x.Student.StudentIdNumber.Contains(rollNo));
            }

            // Filter by Status if provided
            if (status.HasValue)
            {
                query = query.Where(x => x.Student.Checkins.Any(c => c.ExamRoomId == x.ExamRoomId && c.IsCheckin == status.Value));
            }

            var totalCount = await query.CountAsync();
            var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

            if (pageNumber > totalPages)
            {
                pageNumber = totalPages;
            }

            if (pageSize.HasValue && pageSize.Value > 0)
            {
                query = query.Skip((pageNumber - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var studentRequests = await query.Select(x => new
            {
                x.ExamRoom.Schedule.StartTime,
                x.ExamRoom.Schedule.EndTime,
                StudentId = x.StudentId,
                RollNo = x.Student.StudentIdNumber,
                FullName = x.Student.FullName,
                CitizenIdentity = x.Student.CitizenIdentity,
                ProctorName = x.ExamRoom.Proctor.Email,
                SubjectCode = x.Subject.SubjectCode ?? string.Empty,
                Image = x.Student.Image,
                ImageStudent = x.Student.StudentImages,
                CheckinTime = x.Student.Checkins.Where(c => c.ExamRoomId == x.ExamRoomId).Select(c => c.CheckinTime).FirstOrDefault(),
                IsCheckin = x.Student.Checkins
        .Where(c => c.ExamRoomId == x.ExamRoomId)
        .Select(c => (bool?)c.IsCheckin)
                .FirstOrDefault(),
                Note = x.Student.Checkins
        .Where(c => c.ExamRoomId == x.ExamRoomId)
        .Select(c => c.Note)
        .FirstOrDefault(),
            }).ToListAsync();

            return Ok(new
            {
                TotalCount = totalCount,
                studentRequests = studentRequests
            });
        }


        [HttpGet("GetCheckedInStudentsCountByProctorId/{proctorId}")]
        public async Task<IActionResult> GetCheckedInStudentsCountByProctorId(
     uint proctorId,
     [FromQuery] string startTime,
     [FromQuery] string endTime,
     [FromQuery] string roomName)
        {
            if (!DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startDateTime) ||
                !DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endDateTime))
            {
                return BadRequest("Invalid date format. Please use 'yyyy-MM-dd HH:mm'.");
            }

            var examRoomIds = await _context.ExamRooms
                .Where(er => (er.ProctorId == proctorId || er.ExamRoomProctors.Any(erP => erP.ProctorId == proctorId)) &&
                             er.Schedule.StartTime >= startDateTime &&
                             er.Schedule.EndTime <= endDateTime &&
                             (string.IsNullOrEmpty(roomName) || er.RoomName == roomName))
                .Select(er => er.ExamRoomId)
                .ToListAsync();

            if (!examRoomIds.Any())
            {
                return Ok(new List<object>());
            }

            var checkedInStudentsCount = await _context.Checkins
       .Where(c => examRoomIds.Contains(c.ExamRoomId) &&
                   c.IsCheckin == true &&
                   _context.StudentRoomSubjects.Any(srs => srs.StudentId == c.StudentId && srs.ExamRoomId == c.ExamRoomId))
       .Select(c => c.StudentId)
       .Distinct()
       .CountAsync();

            return Ok(new { checkedInStudentsCount = checkedInStudentsCount });
        }


        [HttpPost("UploadImageStudent")]
        public async Task<IActionResult> UploadImageStudent(IFormFile image, [FromForm] uint studentid)
        {
            if (image == null || image.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            DateTimeOffset currentTime = DateTimeOffset.Now;
            long unixEpochTime = currentTime.ToUnixTimeSeconds();

            var fileName = $"{studentid}" + unixEpochTime + image.FileName.Replace(" ", "_");
            string filePath;
            using (var stream = image.OpenReadStream())
            {
                filePath = await _fileService.WriteToFileAsync(fileName, stream);
            }

            string fileUrl = _BACKEND_URL+"/api/CheckIn/getAsset?fileName=" + fileName;
            var newStudentImage = new StudentImage
            {
                StudentId = studentid,
                UploadImage = fileUrl

            };
            await _context.StudentImages.AddAsync(newStudentImage);
            await _context.SaveChangesAsync();


            return Ok(new { fileUrl });
        }
        [AllowAnonymous]
        [HttpGet("getAsset")]
        public IActionResult DownloadFile([FromQuery] string fileName)
        {
            var basePath = _fileService.basePath;

            string filePath = basePath + "/" + fileName;
            Console.WriteLine(filePath);
            try
            {
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound("File not found.");
                }

                var mimeType = GetMimeType(fileName);

                return PhysicalFile(filePath, mimeType, fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        private string GetMimeType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                _ => "application/octet-stream", // Default for unknown types
            };
        }
        // có như chỉ dùng add
        [HttpPost("AddStudentsIntoCheckIn")]
        public async Task<IActionResult> AddStudentsIntoCheckIn([FromBody] List<StudentCheckInStatusDTO> studentCheckInStatuses)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            var gmtPlus7 = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var currentTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, gmtPlus7);

            if (studentCheckInStatuses == null || !studentCheckInStatuses.Any())
            {
                return BadRequest(new { Message = "No student check-in status data provided." });
            }

            var updateResults = new List<string>();

            foreach (var studentCheckInStatus in studentCheckInStatuses)
            {
                var student = await _context.Students
                    .Where(x => x.StudentIdNumber == studentCheckInStatus.RollNo)
                    .Select(x => new
                    {
                        x.StudentId,
                        x.Email,
                        x.StudentIdNumber
                    })
                    .FirstOrDefaultAsync();

                if (student == null)
                {
                    updateResults.Add($"No student found with RollNo: {studentCheckInStatus.RollNo}");
                    continue;
                }

                var examRoom = await _context.ExamRooms
                    .Include(er => er.Schedule)
                    .FirstOrDefaultAsync(er =>
                        er.Schedule.StartTime == studentCheckInStatus.StartTime &&
                        er.Schedule.EndTime == studentCheckInStatus.EndTime &&
                        er.RoomName == studentCheckInStatus.RoomName &&
                        (er.ProctorId == userId || er.ExamRoomProctors.Any(erP => erP.ProctorId == userId)));

                if (examRoom == null)
                {
                    updateResults.Add($"No exam room found for student with RollNo: {studentCheckInStatus.RollNo} at the specified time and room.");
                    continue;
                }

                var checkInRecord = await _context.Checkins
                    .Where(c => c.StudentId == student.StudentId && c.ExamRoomId == examRoom.ExamRoomId)
                    .FirstOrDefaultAsync();

                if (checkInRecord != null)
                {
                    checkInRecord.IsCheckin = studentCheckInStatus.IsCheckin;
                    checkInRecord.CheckinTime = currentTime;
                    checkInRecord.Note = studentCheckInStatus.Note;
                    checkInRecord.CheckinTime = studentCheckInStatus.CheckinTime;
                    _context.Checkins.Update(checkInRecord);

                    // Update IsCheckout if IsCheckin is set to false
                    if (!studentCheckInStatus.IsCheckin)
                    {
                        var checkoutRecord = await _context.Checkouts
                            .Where(co => co.StudentId == student.StudentId && co.ExamRoomId == examRoom.ExamRoomId)
                            .FirstOrDefaultAsync();

                        if (checkoutRecord != null)
                        {
                            checkoutRecord.IsCheckout = false;
                            _context.Checkouts.Update(checkoutRecord);
                        }
                        else
                        {
                            // Optionally handle the case where no checkout record is found
                            updateResults.Add($"No checkout record found for student with RollNo: {studentCheckInStatus.RollNo} to update.");
                        }
                    }
                }
                else
                {
                    var newCheckIn = new Checkin
                    {
                        ProctorId = userId,
                        StudentId = student.StudentId,
                        CheckinTime = currentTime,
                        IsCheckin = studentCheckInStatus.IsCheckin,
                        Note = studentCheckInStatus.Note,
                        ExamRoomId = examRoom.ExamRoomId
                    };
                    _context.Checkins.Add(newCheckIn);

                    // Optionally handle the case where no checkout record is found
                    if (!studentCheckInStatus.IsCheckin)
                    {
                        var checkoutRecord = await _context.Checkouts
                            .Where(co => co.StudentId == student.StudentId && co.ExamRoomId == examRoom.ExamRoomId)
                            .FirstOrDefaultAsync();

                        if (checkoutRecord != null)
                        {
                            checkoutRecord.IsCheckout = false;
                            _context.Checkouts.Update(checkoutRecord);
                        }
                        else
                        {
                            // Optionally handle the case where no checkout record is found
                            updateResults.Add($"No checkout record found for student with RollNo: {studentCheckInStatus.RollNo} to update.");
                        }
                    }
                }

                await _context.SaveChangesAsync();
                updateResults.Add($"Check-in status updated for student with RollNo: {studentCheckInStatus.RollNo}");
            }

            return Ok(new { Message = "Success", Details = updateResults });
        }


        [HttpPut("UpdateCheckInStatusByRollNo")]
        public async Task<IActionResult> UpdateCheckInStatusByRollNo([FromBody] List<StudentCheckInStatusDTO> studentCheckInStatuses)
        {
            // Find the time zone for GMT+7
            var gmtPlus7 = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");

            // Validate the input
            if (studentCheckInStatuses == null || !studentCheckInStatuses.Any())
            {
                return BadRequest(new { Message = "No student check-in status data provided." });
            }

            // Track overall success and details of each update
            var updateResults = new List<string>();

            // Loop through each studentCheckInStatus in the list
            foreach (var studentCheckInStatus in studentCheckInStatuses)
            {
                // Retrieve the student by RollNo
                var student = await _context.Students
                        .Where(x => x.StudentIdNumber == studentCheckInStatus.RollNo)
                        .Select(x => new
                        {
                            x.StudentId,
                            x.Email,
                            x.StudentIdNumber
                        })
                        .FirstOrDefaultAsync();

                if (student == null)
                {
                    updateResults.Add($"No student found with RollNo: {studentCheckInStatus.RollNo}");
                    continue;
                }

                // Retrieve the check-in records for the student using LINQ query syntax
                var checkInsToUpdate = await (from c in _context.Checkins
                                              where c.StudentId == student.StudentId && c.IsCheckin != studentCheckInStatus.IsCheckin
                                              select c).ToListAsync();

                if (!checkInsToUpdate.Any())
                {
                    updateResults.Add($"No check-in records found to update for student with RollNo: {studentCheckInStatus.RollNo}");
                    continue;
                }

                // Update the IsCheckin value to the provided isCheckin parameter
                foreach (var checkin in checkInsToUpdate)
                {
                    var utcTime = TimeZoneInfo.ConvertTimeToUtc(checkin.CheckinTime, gmtPlus7);
                    checkin.CheckinTime = studentCheckInStatus.IsCheckin ? TimeZoneInfo.ConvertTime(DateTime.UtcNow, TimeZoneInfo.Utc, gmtPlus7) : DateTime.MinValue;
                    checkin.IsCheckin = studentCheckInStatus.IsCheckin;

                    // Update IsCheckout based on IsCheckin
                    if (!studentCheckInStatus.IsCheckin)
                    {
                        var checkout = await _context.Checkouts
                            .FirstOrDefaultAsync(co => co.StudentId == student.StudentId && co.ExamRoomId != null);

                        if (checkout != null)
                        {
                            checkout.IsCheckout = false;
                            _context.Checkouts.Update(checkout);
                        }
                    }
                }

                updateResults.Add($"Check-in status updated for student with RollNo: {studentCheckInStatus.RollNo}");
            }

            // Save changes to the database
            await _context.SaveChangesAsync();

            // Return a summary of the update results
            return Ok(new { Message = "Check-in status update completed.", Details = updateResults });
        }


    }

}


