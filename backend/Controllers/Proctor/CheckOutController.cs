using backend.Authorization;
using backend.DTOs;
using backend.Models;
using DocumentFormat.OpenXml.Spreadsheet;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static backend.Controllers.MockAPI.MockExamScheduleController;

namespace backend.Controllers.Proctor
{
    [Authorize(Authorization.Role.Proctor)]
    public class CheckOutController : Controller
    {
        private readonly SEP490_V3Context _context;

        public CheckOutController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetCheckoutDetails/{proctorId}")]
        public async Task<IActionResult> GetCheckoutDetails(
    uint proctorId,
    [FromQuery] string startTime,
    [FromQuery] string endTime,
    [FromQuery] string roomName)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            // Validate date format
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

            if (examRoomIds == null)
            {
                return NotFound("Exam room not found.");
            }

            var query = _context.StudentRoomSubjects
                .Include(srs => srs.Student)
                .Include(srs => srs.ExamRoom)
                .Include(srs => srs.Student.Checkins)
                .Include(srs => srs.ExamRoom.Schedule)
                .Include(srs => srs.Student.Checkouts)
                .Where(x => examRoomIds.Contains(x.ExamRoomId));

            var checkoutDetails = await query
                .Where(x => x.Student.Checkins.Any(c => c.ExamRoomId == x.ExamRoomId && c.IsCheckin))
                .Select(x => new
                {
                    StudentId = x.StudentId,
                    RollNo = x.Student.StudentIdNumber,
                    FullName = x.Student.FullName,
                    CitizenIdentity = x.Student.CitizenIdentity,
                    ProctorName = x.ExamRoom.Proctor.Email,
                    SubjectCode = x.Subject.SubjectCode ?? string.Empty,
                    SubjectId = x.SubjectId,
                    ScheduleId = x.ExamRoom.Schedule.ScheduleId,
                    IsCheckin = x.Student.Checkins.Any(c => c.ExamRoomId == x.ExamRoomId && c.IsCheckin)
        ? x.Student.Checkins.First(c => c.ExamRoomId == x.ExamRoomId && c.IsCheckin).IsCheckin
        : false,
                    TTime = x.Student.Checkins
            .Where(c => c.ExamRoomId == x.ExamRoomId)
            .Select(c => c.CheckinTime)
            .FirstOrDefault(),
                    IsCheckout = x.Student.Checkouts
            .Where(c => c.ExamRoomId == x.ExamRoomId)
            .Select(c => (bool?)c.IsCheckout)
            .FirstOrDefault(),
                    CheckoutTime = x.Student.Checkouts
            .Where(c => c.ExamRoomId == x.ExamRoomId)
            .Select(c => c.CheckoutTime)
            .FirstOrDefault(),
                    Image = x.Student.Image,
                    Note = x.Student.Checkouts
            .Where(c => c.ExamRoomId == x.ExamRoomId && c.Note != null)
            .Select(c => c.Note)
            .ToList()
                }).ToListAsync();

            return Ok(checkoutDetails);
        }

        //  [HttpGet("GetCheckoutDetails/{proctorId}")]
        //    public async Task<IActionResult> GetCheckoutDetails(
        //uint proctorId,
        //[FromQuery] string startTime,
        //[FromQuery] string endTime,
        //[FromQuery] string roomName)
        //    {
        //        var userIdString = HttpContext.Items["UserId"]?.ToString();
        //        uint.TryParse(userIdString, out uint userId);

        //        // Validate date format
        //        if (!DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startDateTime) ||
        //            !DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endDateTime))
        //        {
        //            return BadRequest("Invalid date format. Please use 'yyyy-MM-dd HH:mm'.");
        //        }

        //        var examroom = await _context.ExamRooms
        //            .Include(er => er.Schedule)
        //            .Where(srs => srs.Schedule.StartTime == startDateTime && srs.Schedule.EndTime == endDateTime && srs.RoomName == roomName)
        //            .FirstOrDefaultAsync();

        //        if (examroom == null)
        //        {
        //            return NotFound("Exam room not found.");
        //        }

        //        var query = from s in _context.Students
        //                    join ssb in _context.StudentSubmissions on s.StudentId equals ssb.StudentId into StudentSubmissions
        //                    from ssb in StudentSubmissions.DefaultIfEmpty()
        //                    join cin in _context.Checkins on s.StudentId equals cin.StudentId
        //                    join co in _context.Checkouts on s.StudentId equals co.StudentId into checkouts
        //                    from cout in checkouts.DefaultIfEmpty()
        //                    join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
        //                    join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
        //                    join usr in _context.Users on cin.ProctorId equals usr.UserId
        //                    join exr in _context.ExamRooms on srs.ExamRoomId equals exr.ExamRoomId
        //                    join sch in _context.Schedules on exr.ScheduleId equals sch.ScheduleId
        //                    join erp in _context.ExamRoomProctors on exr.ExamRoomId equals erp.ExamRoomId into ExamRoomProctors
        //                    from erp in ExamRoomProctors.DefaultIfEmpty()
        //                    where (cin.ProctorId == proctorId || erp.ProctorId == proctorId) &&
        //                          cin.IsCheckin &&
        //                          sch.StartTime == startDateTime &&
        //                          sch.EndTime == endDateTime &&
        //                          exr.RoomName == roomName
        //                    group new { s, ssb, cin, cout, usr, sub, sch, exr } by new { s.StudentId, s.StudentIdNumber, s.FullName, s.CitizenIdentity, usr.Email, sub.SubjectCode, sub.SubjectId, sch.ScheduleId, s.Image } into g
        //                    select new CheckOutDTO
        //                    {
        //                        StudentId = g.Key.StudentId,
        //                        RollNo = g.Key.StudentIdNumber,
        //                        FullName = g.Key.FullName,
        //                        CitizenIdentity = g.Key.CitizenIdentity,
        //                        ProctorName = g.Key.Email,
        //                        SubjectCode = g.Key.SubjectCode ?? string.Empty,
        //                        SubjectId = g.Key.SubjectId,
        //                        ScheduleId = g.Key.ScheduleId,
        //                        IsCheckin = g.First().cin.IsCheckin,
        //                        Time = g.First().cin.CheckinTime,
        //                        IsCheckout = g.Any(x => x.cout != null && x.cout.ExamRoomId == examroom.ExamRoomId)
        //                    ? g.Where(x => x.cout != null && x.cout.ExamRoomId == examroom.ExamRoomId).Select(x => x.cout.IsCheckout).FirstOrDefault()
        //                    : (bool?)null,
        //                        CheckoutTime = g.First().cout != null ? g.First().cout.CheckoutTime : DateTime.MinValue,
        //                        IsSubmit = g.First().cout != null ? g.First().cout.IsSubmit : (bool?)null,
        //                        Image = g.Key.Image,
        //                        IsSubmitFileDat = g.First().ssb != null ? true : false,
        //                        Note = g.Where(x => x.cout != null).Select(x => x.cout.Note).ToList()
        //                    };

        //        var checkoutDetails = await query.ToListAsync();

        //        if (!checkoutDetails.Any())
        //        {
        //            return NotFound("No checkout details found for the provided criteria.");
        //        }

        //        return Ok(checkoutDetails);
        //    }

        //    [HttpGet("GetCheckoutDetails/{proctorId}")]
        //    public async Task<IActionResult> GetCheckoutDetails(
        //uint proctorId,
        //[FromQuery] string startTime,
        //[FromQuery] string endTime,
        //[FromQuery] string roomName)
        //    {
        //        var userIdString = HttpContext.Items["UserId"]?.ToString();
        //        uint.TryParse(userIdString, out uint userId);

        //        // Validate date format
        //        if (!DateTime.TryParseExact(startTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime startDateTime) ||
        //            !DateTime.TryParseExact(endTime, "yyyy-MM-dd HH:mm", null, System.Globalization.DateTimeStyles.None, out DateTime endDateTime))
        //        {
        //            return BadRequest("Invalid date format. Please use 'yyyy-MM-dd HH:mm'.");
        //        }

        //        var examroom = await _context.ExamRooms
        //            .Include(er => er.Schedule)
        //            .Where(srs => srs.Schedule.StartTime == startDateTime && srs.Schedule.EndTime == endDateTime && srs.RoomName == roomName)
        //            .FirstOrDefaultAsync();

        //        if (examroom == null)
        //        {
        //            return NotFound("Exam room not found.");
        //        }

        //        var examRoomId = examroom.ExamRoomId;

        //        var query = from s in _context.Students
        //                    join cin in _context.Checkins on s.StudentId equals cin.StudentId
        //                    join co in _context.Checkouts on s.StudentId equals co.StudentId into checkouts
        //                    from cout in checkouts.DefaultIfEmpty()
        //                    join srs in _context.StudentRoomSubjects on s.StudentId equals srs.StudentId
        //                    join sub in _context.Subjects on srs.SubjectId equals sub.SubjectId
        //                    join usr in _context.Users on cin.ProctorId equals usr.UserId
        //                    join exr in _context.ExamRooms on srs.ExamRoomId equals exr.ExamRoomId
        //                    join sch in _context.Schedules on exr.ScheduleId equals sch.ScheduleId
        //                    where (cin.ProctorId == proctorId || (exr.ExamRoomProctors.Any(erp => erp.ProctorId == proctorId))) &&
        //                          cin.IsCheckin &&
        //                          sch.StartTime == startDateTime &&
        //                          sch.EndTime == endDateTime &&
        //                          exr.RoomName == roomName &&
        //                          cin.IsCheckin
        //                    group new { s, cin, cout, usr, sub, sch, exr } by new
        //                    {
        //                        s.StudentId,
        //                        s.StudentIdNumber,
        //                        s.FullName,
        //                        s.CitizenIdentity,
        //                        usr.Email,
        //                        sub.SubjectCode,
        //                        sub.SubjectId,
        //                        sch.ScheduleId,
        //                        s.Image,
        //                        exr.ExamRoomId
        //                    } into g
        //                    where g.Any(x => x.cin.IsCheckin)
        //                    select new CheckOutDTO
        //                    {
        //                        StudentId = g.Key.StudentId,
        //                        RollNo = g.Key.StudentIdNumber,
        //                        FullName = g.Key.FullName,
        //                        CitizenIdentity = g.Key.CitizenIdentity,
        //                        ProctorName = g.Key.Email,
        //                        SubjectCode = g.Key.SubjectCode ?? string.Empty,
        //                        SubjectId = g.Key.SubjectId,
        //                        ScheduleId = g.Key.ScheduleId,
        //                        IsCheckin = g.Any(x => x.cin.ExamRoomId == examRoomId && x.cin.IsCheckin)
        //                            ? g.First(x => x.cin.ExamRoomId == examRoomId).cin.IsCheckin
        //                            : false,
        //                        Time = g.Any(x => x.cin.ExamRoomId == examRoomId)
        //                            ? g.First(x => x.cin.ExamRoomId == examRoomId).cin.CheckinTime
        //                            : DateTime.MinValue,
        //                        IsCheckout = g.Any(x => x.cout != null && x.cout.ExamRoomId == examRoomId)
        //                            ? g.Where(x => x.cout != null && x.cout.ExamRoomId == examRoomId).Select(x => x.cout.IsCheckout).FirstOrDefault()
        //                            : (bool?)null,
        //                        CheckoutTime = g.Any(x => x.cout != null && x.cout.ExamRoomId == examRoomId)
        //                            ? g.First(x => x.cout.ExamRoomId == examRoomId).cout.CheckoutTime
        //                            : DateTime.MinValue,
        //                        IsSubmit = g.Any(x => x.cout != null && x.cout.ExamRoomId == examRoomId)
        //                            ? g.First(x => x.cout.ExamRoomId == examRoomId).cout.IsSubmit
        //                            : (bool?)null,
        //                        Image = g.Key.Image,
        //                        Note = g.Where(x => x.cout != null && x.cout.ExamRoomId == examRoomId).Select(x => x.cout.Note).ToList()
        //                    };


        //        var checkoutDetails = await query.ToListAsync();

        //        if (!checkoutDetails.Any())
        //        {
        //            return NotFound("No checkout details found for the provided criteria.");
        //        }

        //        return Ok(checkoutDetails);
        //    }

        [HttpGet("GetCheckedOutStudentsCountByProctorId/{proctorId}")]
        public async Task<IActionResult> GetCheckedOutStudentsCountByProctorId(
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

            var checkedOutStudentsCount = await _context.Checkouts
       .Where(c => examRoomIds.Contains(c.ExamRoomId) &&
                   c.IsCheckout &&
                   _context.StudentRoomSubjects.Any(srs => srs.StudentId == c.StudentId && srs.ExamRoomId == c.ExamRoomId))
       .Select(c => c.StudentId)
       .Distinct()
       .CountAsync();

            return Ok(new { CheckedOutStudentsCount = checkedOutStudentsCount });
        }


        [HttpGet("CheckStudentSubmitFileDat")]
        public async Task<IActionResult> CheckStudentSubmitFileDat(
[FromQuery] uint studentId,
[FromQuery] uint subjectId,
[FromQuery] uint scheduleId)
        {
            // Query to check for student submissions
            var hasSubmission = await _context.StudentSubmissions
                .AnyAsync(ss => ss.StudentId == studentId &&
                                ss.SubjectId == subjectId &&
                                ss.ScheduleId == scheduleId);
            var response = new
            {
                isSubmitFileDat = hasSubmission
            };
            return Ok(response);
        }

        [HttpPost("UpdateIsCheckOut")]
        public async Task<IActionResult> UpdateIsSubmitAndCheckOut([FromBody] List<StudentCheckOutStatusDTO> studentCheckOutStatuses)
        {
            var gmtPlus7 = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            var currentTime = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, gmtPlus7);
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            if (studentCheckOutStatuses == null || !studentCheckOutStatuses.Any())
            {
                return BadRequest(new { Message = "No student check-out status data provided." });
            }

            var updateResults = new List<string>();

            foreach (var studentCheckOutStatus in studentCheckOutStatuses)
            {
                // Get student information using RollNo
                var student = await _context.Students
                    .Where(x => x.StudentIdNumber == studentCheckOutStatus.RollNo)
                    .Select(x => new
                    {
                        x.StudentId,
                        x.Email,
                        x.StudentIdNumber
                    })
                    .FirstOrDefaultAsync();

                if (student == null)
                {
                    updateResults.Add($"No student found with RollNo: {studentCheckOutStatus.RollNo}");
                    continue;
                }

                // Get the latest check-in record
                var latestCheckin = await _context.Checkins
                    .Where(c => c.StudentId == student.StudentId)
                    .OrderByDescending(c => c.CheckinTime)
                    .FirstOrDefaultAsync();

                if (latestCheckin == null || !latestCheckin.IsCheckin)
                {
                    updateResults.Add($"Student with RollNo: {studentCheckOutStatus.RollNo} is not checked in.");
                    continue;
                }

                // Get the student's room subject information
                var studentRoomSubject = await _context.StudentRoomSubjects
                   .Include(srs => srs.ExamRoom)
                   .ThenInclude(er => er.Schedule)
                   .Where(srs => srs.StudentId == student.StudentId)
                   .Where(srs => srs.ExamRoom.Schedule.StartTime == studentCheckOutStatus.StartTime && srs.ExamRoom.Schedule.EndTime == studentCheckOutStatus.EndTime && srs.ExamRoom.RoomName == studentCheckOutStatus.RoomName)
                   .FirstOrDefaultAsync();

                if (studentRoomSubject == null)
                {
                    updateResults.Add($"No exam room found for student with RollNo: {studentCheckOutStatus.RollNo} at the current time");
                    continue;
                }

                var examRoom = studentRoomSubject.ExamRoom;

                // Check if the proctor is associated with the exam room or in the ExamRoomProctor table
                var isProctorAuthorized = await _context.ExamRooms
                    .Where(er => er.ExamRoomId == examRoom.ExamRoomId && (er.ProctorId == userId || _context.ExamRoomProctors.Any(erp => erp.ExamRoomId == er.ExamRoomId && erp.ProctorId == userId)))
                    .AnyAsync();

                if (!isProctorAuthorized)
                {
                    updateResults.Add($"Proctor is not authorized to check out for student with RollNo: {studentCheckOutStatus.RollNo}");
                    continue;
                }

                // Retrieve existing checkout record or create a new one
                var checkoutRecord = await _context.Checkouts
                    .Where(c => c.StudentId == student.StudentId && c.ExamRoomId == examRoom.ExamRoomId)
                    .FirstOrDefaultAsync();

                DateTime parsedCheckoutTime;
                if (!DateTime.TryParse(studentCheckOutStatus.CheckoutTime, out parsedCheckoutTime))
                {
                    parsedCheckoutTime = currentTime;
                }

                if (checkoutRecord == null)
                {
                    // Create new checkout record
                    var newCheckOut = new Checkout
                    {
                        ProctorId = userId,
                        StudentId = student.StudentId,
                        CheckoutTime = parsedCheckoutTime,
                        ExamRoomId = examRoom.ExamRoomId,
                        IsCheckout = studentCheckOutStatus.IsCheckout,
                        Note = studentCheckOutStatus.Note != null ? string.Join(", ", studentCheckOutStatus.Note) : null,
                    };

                    _context.Checkouts.Add(newCheckOut);
                    updateResults.Add($"Checkout completed successfully for student with RollNo: {studentCheckOutStatus.RollNo}");
                }
                else
                {
                    // Update existing checkout record
                    checkoutRecord.IsCheckout = studentCheckOutStatus.IsCheckout;
                    checkoutRecord.Note = studentCheckOutStatus.Note != null ? string.Join(", ", studentCheckOutStatus.Note) : null;
                    checkoutRecord.CheckoutTime = parsedCheckoutTime;

                    _context.Checkouts.Update(checkoutRecord);
                    updateResults.Add($"Checkout updated successfully for student with RollNo: {studentCheckOutStatus.RollNo}");
                }

                await _context.SaveChangesAsync();
            }

            return Ok(new { Message = "Process completed.", Details = updateResults });
        }

        [HttpPost("SendRequestCheckSubmit")]
        public async Task<ActionResult> SendRequestCheckSubmit([FromBody] RequestCheckSubmitDto requestSubmitDto)
        {
            try
            {
                if (requestSubmitDto == null || string.IsNullOrWhiteSpace(requestSubmitDto.StudentIdNumber))
                {
                    return BadRequest("Invalid request data.");
                }

                var student = await _context.Students
                    .Where(x => x.StudentIdNumber == requestSubmitDto.StudentIdNumber)
                    .Select(x => new
                    {
                        x.StudentId,
                        x.Email,
                        x.StudentIdNumber
                    })
                    .FirstOrDefaultAsync();

                if (student == null)
                {
                    return NotFound($"Student not found for StudentIdNumber: {requestSubmitDto.StudentIdNumber}");
                }

                var request = new Request
                {
                    RequestById = requestSubmitDto.ProctorId,
                    RequestTitle = "Check Submit",
                    RequestDate = DateTime.Now,
                    ResolveStatus = "pending"
                };

                _context.Requests.Add(request);
                await _context.SaveChangesAsync();

                var studentRequest = new StudentRequest
                {
                    RequestId = request.RequestId,
                    StudentId = student.StudentId
                };

                _context.StudentRequests.Add(studentRequest);
                await _context.SaveChangesAsync();

                return Ok("Request submitted successfully.");
            }
            catch (InvalidCastException ex)
            {
                Console.WriteLine($"InvalidCastException: {ex.Message}");
                return StatusCode(500, $"An error occurred while adding the request. Invalid data type: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Exception: {ex.Message}");
                return StatusCode(500, $"An error occurred while adding the request: {ex.Message}");
            }
        }


        //    [HttpPut("Checkout")]
        //    public async Task<IActionResult> Checkout([FromBody] List<StudentCheckOutStatus> studentCheckOutStatuses)
        //    {
        //        if (studentCheckOutStatuses == null || !studentCheckOutStatuses.Any())
        //        {
        //            return BadRequest(new { Message = "No student check-out status data provided." });
        //        }

        //        // Lists to track successful and unsuccessful checkouts
        //        var successfulCheckouts = new List<string>();
        //        var failedCheckouts = new List<string>();

        //        foreach (var studentCheckOutStatus in studentCheckOutStatuses)
        //        {
        //            var student = await _context.Students
        //                    .Include(s => s.Checkins)
        //                    .FirstOrDefaultAsync(s => s.StudentIdNumber == studentCheckOutStatus.RollNo);

        //            if (student == null)
        //            {
        //                failedCheckouts.Add($"No student found with RollNo: {studentCheckOutStatus.RollNo}");
        //                continue;
        //            }

        //            // Check if the student is already checked in
        //            var latestCheckin = student.Checkins.OrderByDescending(c => c.CheckinTime).FirstOrDefault();
        //            if (latestCheckin == null || !latestCheckin.IsCheckin)
        //            {
        //                failedCheckouts.Add($"Student with RollNo: {studentCheckOutStatus.RollNo} is not checked in.");
        //                continue;
        //            }

        //            // Check if the student has already submitted
        //            var checkoutRecord = await _context.Checkouts
        //                .FirstOrDefaultAsync(c => c.StudentId == student.StudentId);

        //            if (checkoutRecord != null && checkoutRecord.IsSubmit != true)
        //            {
        //                failedCheckouts.Add($"Student with RollNo: {studentCheckOutStatus.RollNo} has not submitted yet.");
        //                continue;
        //            }

        //            if (checkoutRecord != null)
        //            {
        //                // Update existing checkout record
        //                checkoutRecord.IsCheckout = studentCheckOutStatus.IsCheckout;
        //                checkoutRecord.CheckoutTime = DateTime.UtcNow;
        //                _context.Checkouts.Update(checkoutRecord);
        //            }
        //            else
        //            {
        //                // Create new checkout record
        //                var newCheckout = new Checkout
        //                {
        //                    StudentId = student.StudentId,
        //                    IsCheckout = studentCheckOutStatus.IsCheckout,
        //                    CheckoutTime = DateTime.UtcNow,
        //                    IsSubmit = true // Assuming always true for checkout
        //                };
        //                _context.Checkouts.Add(newCheckout);
        //            }

        //            successfulCheckouts.Add($"Checkout completed successfully for student with RollNo: {studentCheckOutStatus.RollNo}");
        //        }

        //        // Save changes to the database
        //        await _context.SaveChangesAsync();

        //        // Return success and failure messages
        //        return Ok(new { SuccessfulCheckouts = successfulCheckouts, FailedCheckouts = failedCheckouts });
        //    }


    }
}

