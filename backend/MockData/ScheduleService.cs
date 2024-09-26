using System;
using System.Text.Json;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.MockData
{
	public class ScheduleService
	{
		private readonly HttpClient _httpClient;
		private readonly SEP490_V3Context _context;
		public ScheduleService(HttpClient httpClient,SEP490_V3Context context)
		{
			_httpClient = httpClient;
			_context = context;
		}
		public async Task FetchAndSaveScheduleAsync()
		{
            //_httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", "your_token_here");
            Console.WriteLine("running in here 1");
            var response = await _httpClient.GetAsync("http://localhost:5000/mockApi/MockExamSchedule");
			response.EnsureSuccessStatusCode();
			Console.WriteLine("running in here 2");
			var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine("running in here 3");
            var schedules = JsonSerializer.Deserialize<List<Schedule>>(json);
            Console.WriteLine("running in here 4");
            if (schedules != null)
			{
                Console.WriteLine("running in here 5");
                foreach (var schedule in schedules)
				{
					// save schedule if it doesn't already exist
					var existSchedule = await _context.Schedules
						.Include(s => s.ExamRooms)
						.ThenInclude(er => er.StudentRoomSubjects)
						.FirstOrDefaultAsync(s => s.ScheduleId == schedule.ScheduleId);
					if (existSchedule == null)
					{
						_context.Schedules.Add(schedule); 
						await _context.SaveChangesAsync();// Ensure schedule is set
                    }
					else
					{
						schedule.ScheduleId = existSchedule.ScheduleId;
					}

					// save examroom in schedule
					foreach(var examroom in schedule.ExamRooms)
					{
						examroom.ScheduleId = schedule.ScheduleId;
						// save examroom if it doesn't already exist
						var existingRoom = await _context.ExamRooms
							.Include(er => er.StudentRoomSubjects)
							.FirstOrDefaultAsync(er=> er.ExamRoomId == examroom.ExamRoomId);
						if(existingRoom == null)
						{

							_context.ExamRooms.Add(examroom);
                            await _context.SaveChangesAsync();
                        }
						else
						{
							examroom.ExamRoomId = existingRoom.ExamRoomId;
						}

					
						//save student in room
						foreach(var srs in examroom.StudentRoomSubjects)
						{
							// save student if it already exist
							var existingStudents = await _context.Students.FindAsync(srs.StudentId);

							if(existingStudents == null)
							{
								
								_context.Students.Add(srs.Student);
                                await _context.SaveChangesAsync();

							}
							else
							{
								srs.StudentId = existingStudents.StudentId;
							}
							// save StudentRoomSubject if it doesn't already exist

							var existStudentRoomSubject = _context.StudentRoomSubjects
								.FirstOrDefaultAsync(x=>x.StudentId == srs.StudentId
								&& x.ExamRoomId==examroom.ExamRoomId
								&& x.SubjectId ==srs.SubjectId);
							if(existStudentRoomSubject == null)
							{
                                _context.StudentRoomSubjects.Add(
                                new StudentRoomSubject
                                {
                                    StudentId = srs.StudentId,
                                    ExamRoomId = examroom.ExamRoomId,
                                    SubjectId = srs.ExamRoomId

                                });
                            }
							
						}
					}
				}

			}
			await _context.SaveChangesAsync();
        } 
	}
}

