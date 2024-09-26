using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;

namespace backend.Models
{
    public partial class SEP490_V3Context : DbContext
    {
        private readonly string database;
        private readonly string user;
        private readonly string password;
        // public SEP490_V3Context()
        // {
            
        // }

        public SEP490_V3Context(IConfiguration configuration,DbContextOptions<SEP490_V3Context> options)
            : base(options)
        {
            database = configuration["AppSettings:DATABASE"];
            user = configuration["AppSettings:USER"];
            password = configuration["AppSettings:PASSWORD"];
        }

        public virtual DbSet<Campus> Campuses { get; set; } = null!;
        public virtual DbSet<Checkin> Checkins { get; set; } = null!;
        public virtual DbSet<Checkout> Checkouts { get; set; } = null!;
        public virtual DbSet<Class> Classes { get; set; } = null!;
        public virtual DbSet<CommonNotice> CommonNotices { get; set; } = null!;// new
        public virtual DbSet<ExamCode> ExamCodes { get; set; } = null!;
        public virtual DbSet<ExamRoom> ExamRooms { get; set; } = null!;
        public virtual DbSet<MessageContent> MessageContents { get; set; } = null!;
        public virtual DbSet<MessageFromto> MessageFromtos { get; set; } = null!;
        public virtual DbSet<Place> Places { get; set; } = null!;
        public virtual DbSet<Request> Requests { get; set; } = null!;
        public virtual DbSet<Role> Roles { get; set; } = null!;
        public virtual DbSet<Schedule> Schedules { get; set; } = null!;
        public virtual DbSet<Student> Students { get; set; } = null!;
        public virtual DbSet<StudentImage> StudentImages { get; set; } = null!;
        public virtual DbSet<StudentRequest> StudentRequests { get; set; } = null!;
        public virtual DbSet<StudentRoomSubject> StudentRoomSubjects { get; set; } = null!;
        public virtual DbSet<StudentSubmission> StudentSubmissions { get; set; } = null!;
        public virtual DbSet<StudentViolation> StudentViolations { get; set; } = null!;
        public virtual DbSet<Subject> Subjects { get; set; } = null!;
        public virtual DbSet<User> Users { get; set; } = null!;
        public virtual DbSet<UserRole> UserRoles { get; set; } = null!;
        public virtual DbSet<Violation> Violations { get; set; } = null!;
        public virtual DbSet<ExamRoomProctor> ExamRoomProctors { get; set; } = null!;


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see http://go.microsoft.com/fwlink/?LinkId=723263.
                optionsBuilder.UseMySql($"server=localhost;database={database};user={user};password={password}", Microsoft.EntityFrameworkCore.ServerVersion.Parse("8.0.37-mysql"))
                    .EnableSensitiveDataLogging();
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.UseCollation("utf8mb4_0900_ai_ci")
                .HasCharSet("utf8mb4");

            modelBuilder.Entity<Campus>(entity =>
            {
                entity.ToTable("campus");

                entity.Property(e => e.CampusId).HasColumnName("campus_id");

                entity.Property(e => e.Address)
                    .HasMaxLength(255)
                    .HasColumnName("address");

                entity.Property(e => e.CampusName)
                    .HasMaxLength(255)
                    .HasColumnName("campus_name");

                entity.Property(e => e.Contact)
                    .HasMaxLength(255)
                    .HasColumnName("contact");
            });

            modelBuilder.Entity<Checkin>(entity =>
            {
                entity.ToTable("checkins");

                entity.HasIndex(e => e.ProctorId, "proctor_id");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.Property(e => e.CheckinId).HasColumnName("checkin_id");

                entity.Property(e => e.CheckinTime)
                    .HasColumnType("datetime")
                    .HasColumnName("checkin_time")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.Property(e => e.IsCheckin).HasColumnName("is_checkin");

                entity.Property(e => e.Note)
                    .HasMaxLength(255)
                    .HasColumnName("note");

                entity.Property(e => e.ProctorId).HasColumnName("proctor_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.HasOne(d => d.Proctor)
                    .WithMany(p => p.Checkins)
                    .HasForeignKey(d => d.ProctorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("checkins_ibfk_1");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.Checkins)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("checkins_ibfk_2");
            });

            modelBuilder.Entity<Checkout>(entity =>
            {
                entity.ToTable("checkouts");

                entity.HasIndex(e => e.ProctorId, "proctor_id");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.Property(e => e.CheckoutId).HasColumnName("checkout_id");

                entity.Property(e => e.CheckoutTime)
                    .HasColumnType("datetime")
                    .HasColumnName("checkout_time")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.Property(e => e.IsCheckout).HasColumnName("is_checkout");

                entity.Property(e => e.IsSubmit)
                    .IsRequired()
                    .HasColumnName("is_submit")
                    .HasDefaultValueSql("'1'");

                entity.Property(e => e.Note)
                    .HasMaxLength(255)
                    .HasColumnName("note");

                entity.Property(e => e.ProctorId).HasColumnName("proctor_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.HasOne(d => d.Proctor)
                    .WithMany(p => p.Checkouts)
                    .HasForeignKey(d => d.ProctorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("checkouts_ibfk_1");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.Checkouts)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("checkouts_ibfk_2");
            });

            modelBuilder.Entity<Class>(entity =>
            {
                entity.ToTable("classes");

                entity.Property(e => e.ClassId).HasColumnName("class_id");

                entity.Property(e => e.ClassName)
                    .HasMaxLength(255)
                    .HasColumnName("class_name");
            });

            // new
             modelBuilder.Entity<CommonNotice>(entity =>
            {
                entity.ToTable("common_notices");

                entity.HasIndex(e => e.SenderId, "sender_id");

                entity.Property(e => e.CommonNoticeId).HasColumnName("common_notice_id");

                entity.Property(e => e.Content).HasColumnName("content");

                entity.Property(e => e.FileAttach)
                    .HasMaxLength(2000)
                    .HasColumnName("file_attach");

                entity.Property(e => e.SendTime)
                    .HasColumnType("datetime")
                    .HasColumnName("send_time")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.SenderId).HasColumnName("sender_id");

                entity.Property(e => e.Title)
                    .HasMaxLength(2000)
                    .HasColumnName("title");

                entity.HasOne(d => d.Sender)
                    .WithMany(p => p.CommonNotices)
                    .HasForeignKey(d => d.SenderId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("common_notices_ibfk_1");
            });

            modelBuilder.Entity<ExamCode>(entity =>
            {
                entity.ToTable("exam_codes");

                entity.HasIndex(e => e.Code, "exam_code")
                    .IsUnique();

                entity.HasIndex(e => e.ScheduleId, "schedule_id");

                entity.HasIndex(e => e.SubjectId, "subject_id");

                entity.Property(e => e.ExamCodeId).HasColumnName("exam_code_id");

                entity.Property(e => e.Code).HasColumnName("exam_code");

                entity.Property(e => e.OpenCode)
                    .HasMaxLength(255)
                    .HasColumnName("open_code");

                entity.Property(e => e.ScheduleId).HasColumnName("schedule_id");

                entity.Property(e => e.Section)
                    .HasMaxLength(255)
                    .HasColumnName("section");

                entity.Property(e => e.Status).HasColumnName("status");

                entity.Property(e => e.SubjectId).HasColumnName("subject_id");

                entity.Property(e => e.Title)
                    .HasMaxLength(255)
                    .HasColumnName("title");

                entity.HasOne(d => d.Schedule)
                    .WithMany(p => p.ExamCodes)
                    .HasForeignKey(d => d.ScheduleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_codes_ibfk_2");

                entity.HasOne(d => d.Subject)
                    .WithMany(p => p.ExamCodes)
                    .HasForeignKey(d => d.SubjectId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_codes_ibfk_1");
            });

            modelBuilder.Entity<ExamRoom>(entity =>
            {
                entity.ToTable("exam_rooms");

                entity.HasIndex(e => e.ProctorId, "exam_rooms_ibfk_2");

                entity.HasIndex(e => e.PlaceId, "place_id");

                entity.HasIndex(e => e.ScheduleId, "schedule_id");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.Property(e => e.PlaceId).HasColumnName("place_id");

                entity.Property(e => e.ProctorId).HasColumnName("proctor_id");

                entity.Property(e => e.RoomName)
                    .HasMaxLength(100)
                    .HasColumnName("room_name");
                entity.Property(e => e.Attempt)
                   .HasMaxLength(1000)
                   .HasColumnName("attempt");

                entity.Property(e => e.ScheduleId).HasColumnName("schedule_id");

                entity.HasOne(d => d.Place)
                    .WithMany(p => p.ExamRooms)
                    .HasForeignKey(d => d.PlaceId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_rooms_ibfk_1");

                entity.HasOne(d => d.Proctor)
                    .WithMany(p => p.ExamRooms)
                    .HasForeignKey(d => d.ProctorId)
                    .HasConstraintName("exam_rooms_ibfk_2");

                entity.HasOne(d => d.Schedule)
                    .WithMany(p => p.ExamRooms)
                    .HasForeignKey(d => d.ScheduleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_rooms_ibfk_3");
            });

            modelBuilder.Entity<MessageContent>(entity =>
            {
                entity.ToTable("message_content");

                entity.Property(e => e.MessageContentId).HasColumnName("message_content_id");

                entity.Property(e => e.Content)
                    .HasMaxLength(255)
                    .HasColumnName("content");

                entity.Property(e => e.FileAttachment)
                    .HasMaxLength(255)
                    .HasColumnName("file_attachment");
            });

            modelBuilder.Entity<MessageFromto>(entity =>
            {
                entity.ToTable("message_fromto");

                entity.HasIndex(e => e.FromUserId, "from_user_id");

                entity.HasIndex(e => e.MessageContentId, "message_content_id");

                entity.HasIndex(e => e.ToUserId, "to_user_id");

                entity.Property(e => e.MessageFromtoId).HasColumnName("message_fromto_id");

                entity.Property(e => e.FromUserId).HasColumnName("from_user_id");

                entity.Property(e => e.MessageContentId).HasColumnName("message_content_id");

                entity.Property(e => e.Time)
                    .HasColumnType("datetime")
                    .HasColumnName("time")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ToUserId).HasColumnName("to_user_id");

                entity.HasOne(d => d.FromUser)
                    .WithMany(p => p.MessageFromtoFromUsers)
                    .HasForeignKey(d => d.FromUserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("message_fromto_ibfk_1");

                entity.HasOne(d => d.MessageContent)
                    .WithMany(p => p.MessageFromtos)
                    .HasForeignKey(d => d.MessageContentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("message_fromto_ibfk_3");

                entity.HasOne(d => d.ToUser)
                    .WithMany(p => p.MessageFromtoToUsers)
                    .HasForeignKey(d => d.ToUserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("message_fromto_ibfk_2");
            });

            modelBuilder.Entity<Place>(entity =>
            {
                entity.ToTable("places");

                entity.Property(e => e.PlaceId).HasColumnName("place_id");

                entity.Property(e => e.Address)
                    .HasMaxLength(255)
                    .HasColumnName("address");
            });

            modelBuilder.Entity<Request>(entity =>
            {
                entity.ToTable("requests");

                entity.HasIndex(e => e.RequestById, "request_by_id");

                entity.HasIndex(e => e.ResolveById, "resolve_by_id");

                entity.Property(e => e.RequestId).HasColumnName("request_id");

                entity.Property(e => e.Note)
                    .HasMaxLength(255)
                    .HasColumnName("note");

                entity.Property(e => e.RequestById).HasColumnName("request_by_id");

                entity.Property(e => e.RequestDate)
                    .HasColumnType("datetime")
                    .HasColumnName("request_date")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.RequestTitle)
                    .HasMaxLength(255)
                    .HasColumnName("request_title");

                entity.Property(e => e.ResolveById).HasColumnName("resolve_by_id");

                entity.Property(e => e.ResolveDate)
                    .HasColumnType("datetime")
                    .HasColumnName("resolve_date");

                entity.Property(e => e.ResolveStatus)
                    .HasColumnType("enum('pending','submitted','rejected','not submitted','default password : 123456789','custom password','not reassigned','reassigned','resolved','rejected'")
                    .HasColumnName("resolve_status")
                    .HasDefaultValueSql("'pending'");

                entity.Property(e => e.ResponseNote)
                    .HasMaxLength(1000)
                    .HasColumnName("response_note");

                entity.HasOne(d => d.RequestBy)
                    .WithMany(p => p.RequestRequestBies)
                    .HasForeignKey(d => d.RequestById)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("requests_ibfk_1");

                entity.HasOne(d => d.ResolveBy)
                    .WithMany(p => p.RequestResolveBies)
                    .HasForeignKey(d => d.ResolveById)
                    .HasConstraintName("requests_ibfk_2");
            });

            modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");

                entity.Property(e => e.RoleId).HasColumnName("role_id");

                entity.Property(e => e.RoleName)
                    .HasMaxLength(100)
                    .HasColumnName("role_name");
            });

            modelBuilder.Entity<Schedule>(entity =>
            {
                entity.ToTable("schedules");

                entity.Property(e => e.ScheduleId).HasColumnName("schedule_id");

                entity.Property(e => e.EndTime)
                    .HasColumnType("datetime")
                    .HasColumnName("end_time");

                entity.Property(e => e.Semester)
                    .HasMaxLength(255)
                    .HasColumnName("semester");

                entity.Property(e => e.StartTime)
                    .HasColumnType("datetime")
                    .HasColumnName("start_time");
            });

            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("students");

                entity.HasIndex(e => e.CitizenIdentity, "citizen_identity")
                    .IsUnique();

                entity.HasIndex(e => e.ClassId, "class_id");

                entity.HasIndex(e => e.Email, "email")
                    .IsUnique();

                entity.HasIndex(e => e.StudentIdNumber, "student_id_number")
                    .IsUnique();

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.CitizenIdentity).HasColumnName("citizen_identity");

                entity.Property(e => e.ClassId).HasColumnName("class_id");

                entity.Property(e => e.Email).HasColumnName("email");

                entity.Property(e => e.FullName)
                    .HasMaxLength(255)
                    .HasColumnName("full_name");

                entity.Property(e => e.Image)
                    .HasMaxLength(1000)
                    .HasColumnName("image");

                entity.Property(e => e.StudentIdNumber).HasColumnName("student_id_number");

                entity.HasOne(d => d.Class)
                    .WithMany(p => p.Students)
                    .HasForeignKey(d => d.ClassId)
                    .HasConstraintName("students_ibfk_1");
            });

            modelBuilder.Entity<StudentImage>(entity =>
            {
                entity.ToTable("student_images");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.Property(e => e.StudentImageId).HasColumnName("student_image_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.UploadDate)
                    .HasColumnType("datetime")
                    .HasColumnName("upload_date")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.UploadImage)
                    .HasMaxLength(1000)
                    .HasColumnName("upload_image");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.StudentImages)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_images_ibfk_1");
            });

            modelBuilder.Entity<StudentRequest>(entity =>
            {
                entity.HasKey(e => new { e.StudentId, e.RequestId })
                    .HasName("PRIMARY")
                    .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

                entity.ToTable("student_requests");

                entity.HasIndex(e => e.RequestId, "request_id");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.RequestId).HasColumnName("request_id");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.HasOne(d => d.Request)
                    .WithMany(p => p.StudentRequests)
                    .HasForeignKey(d => d.RequestId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_requests_ibfk_2");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.StudentRequests)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_requests_ibfk_1");
            });

            modelBuilder.Entity<StudentRoomSubject>(entity =>
            {
                entity.HasKey(e => new { e.StudentId, e.ExamRoomId })
                    .HasName("PRIMARY")
                    .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

                entity.ToTable("student_room_subjects");

                entity.HasIndex(e => e.ExamRoomId, "exam_room_id");

                entity.HasIndex(e => e.SubjectId, "subject_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.Property(e => e.SubjectId).HasColumnName("subject_id");

                entity.Property(e => e.Note)
                    .HasMaxLength(1000)
                    .HasColumnName("note");

                entity.HasOne(d => d.ExamRoom)
                    .WithMany(p => p.StudentRoomSubjects)
                    .HasForeignKey(d => d.ExamRoomId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_room_subjects_ibfk_2");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.StudentRoomSubjects)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_room_subjects_ibfk_1");

                entity.HasOne(d => d.Subject)
                    .WithMany(p => p.StudentRoomSubjects)
                    .HasForeignKey(d => d.SubjectId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_room_subjects_ibfk_3");
            });

            modelBuilder.Entity<StudentSubmission>(entity =>
            {
                entity.HasKey(e => e.SubmissionId)
                    .HasName("PRIMARY");

                entity.ToTable("student_submissions");

                entity.HasIndex(e => e.ScheduleId, "schedule_id");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.HasIndex(e => e.SubjectId, "subject_id");

                entity.Property(e => e.SubmissionId).HasColumnName("submission_id");

                entity.Property(e => e.FilePath)
                    .HasMaxLength(255)
                    .HasColumnName("file_path");

                entity.Property(e => e.ScheduleId).HasColumnName("schedule_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.SubjectId).HasColumnName("subject_id");

                entity.Property(e => e.SubmissionDate)
                    .HasColumnType("datetime")
                    .HasColumnName("submission_date")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.HasOne(d => d.Schedule)
                    .WithMany(p => p.StudentSubmissions)
                    .HasForeignKey(d => d.ScheduleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_submissions_ibfk_3");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.StudentSubmissions)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_submissions_ibfk_1");

                entity.HasOne(d => d.Subject)
                    .WithMany(p => p.StudentSubmissions)
                    .HasForeignKey(d => d.SubjectId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_submissions_ibfk_2");
            });

            modelBuilder.Entity<StudentViolation>(entity =>
            {
                entity.HasKey(e => new { e.StudentId, e.ViolationId })
                    .HasName("PRIMARY")
                    .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

                entity.ToTable("student_violations");

                entity.HasIndex(e => e.StudentId, "student_id");

                entity.HasIndex(e => e.ViolationId, "violation_id");

                entity.Property(e => e.StudentId).HasColumnName("student_id");

                entity.Property(e => e.ViolationId).HasColumnName("violation_id");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.HasOne(d => d.Student)
                    .WithMany(p => p.StudentViolations)
                    .HasForeignKey(d => d.StudentId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_violations_ibfk_1");

                entity.HasOne(d => d.Violation)
                    .WithMany(p => p.StudentViolations)
                    .HasForeignKey(d => d.ViolationId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("student_violations_ibfk_2");
            });

            modelBuilder.Entity<Subject>(entity =>
            {
                entity.ToTable("subjects");

                entity.Property(e => e.SubjectId).HasColumnName("subject_id");

                entity.Property(e => e.SubjectCode)
                    .HasMaxLength(255)
                    .HasColumnName("subject_code");

                entity.Property(e => e.SubjectName)
                    .HasMaxLength(255)
                    .HasColumnName("subject_name");
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("users");

                entity.HasIndex(e => e.CampusId, "campus_id");

                entity.HasIndex(e => e.Email, "email")
                    .IsUnique();

                entity.Property(e => e.UserId).HasColumnName("user_id");

                entity.Property(e => e.CampusId).HasColumnName("campus_id");

                entity.Property(e => e.Email).HasColumnName("email");

                 entity.Property(e => e.EmailFe)
                    .HasMaxLength(255)
                    .HasColumnName("email_fe");

                entity.Property(e => e.IsActive)
                    .IsRequired()
                    .HasColumnName("is_active")
                    .HasDefaultValueSql("'1'");

                entity.HasOne(d => d.Campus)
                    .WithMany(p => p.Users)
                    .HasForeignKey(d => d.CampusId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("users_ibfk_1");


            });
 modelBuilder.Entity<Role>(entity =>
            {
                entity.ToTable("roles");

                entity.Property(e => e.RoleId).HasColumnName("role_id");

                entity.Property(e => e.RoleName)
                    .HasMaxLength(100)
                    .HasColumnName("role_name");
            });


            modelBuilder.Entity<Violation>(entity =>
            {
                entity.ToTable("violations");

                entity.HasIndex(e => e.ReportById, "report_by_id");

                entity.HasIndex(e => e.ResolveById, "resolve_by_id");

                entity.Property(e => e.ViolationId).HasColumnName("violation_id");

                entity.Property(e => e.Note)
                    .HasMaxLength(255)
                    .HasColumnName("note");

                entity.Property(e => e.ReportById).HasColumnName("report_by_id");

                entity.Property(e => e.ReportDate)
                    .HasColumnType("datetime")
                    .HasColumnName("report_date")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.ResolveById).HasColumnName("resolve_by_id");

                entity.Property(e => e.ResolveDate)
                    .HasColumnType("datetime")
                    .HasColumnName("resolve_date");

                entity.Property(e => e.ResolveStatus)
                    .HasColumnType("enum('pending','Warning','Exam suspension','Academic suspension','rejected')")
                    .HasColumnName("resolve_status")
                    .HasDefaultValueSql("'pending'");

                entity.Property(e => e.ResponseNote)
                    .HasMaxLength(1000)
                    .HasColumnName("response_note");

                entity.Property(e => e.ViolationTitle)
                    .HasMaxLength(255)
                    .HasColumnName("violation_title");

                entity.HasOne(d => d.ReportBy)
                    .WithMany(p => p.ViolationReportBies)
                    .HasForeignKey(d => d.ReportById)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("violations_ibfk_1");

                entity.HasOne(d => d.ResolveBy)
                    .WithMany(p => p.ViolationResolveBies)
                    .HasForeignKey(d => d.ResolveById)
                    .HasConstraintName("violations_ibfk_2");
            });
            modelBuilder.Entity<UserRole>(entity =>
            {
                entity.HasKey(e => new { e.UserId, e.RoleId })
                    .HasName("PRIMARY");

                entity.ToTable("user_roles");

                entity.HasIndex(e => e.RoleId, "role_id");

                entity.Property(e => e.UserId)
                    .HasColumnName("user_id");

                entity.Property(e => e.RoleId)
                    .HasColumnName("role_id");

                entity.HasOne(d => d.Role)
                    .WithMany(p => p.UserRoles)
                    .HasForeignKey(d => d.RoleId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("user_roles_ibfk_1");

                entity.HasOne(d => d.User)
                    .WithMany(p => p.UserRoles)
                    .HasForeignKey(d => d.UserId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("user_roles_ibfk_2");
            });
            modelBuilder.Entity<ExamRoomProctor>(entity =>
            {
                entity.HasKey(e => new { e.ExamRoomId, e.ProctorId })
                    .HasName("PRIMARY")
                    .HasAnnotation("MySql:IndexPrefixLength", new[] { 0, 0 });

                entity.ToTable("exam_room_protors");

                entity.HasIndex(e => e.ExamRoomId, "exam_room_id");

                entity.HasIndex(e => e.ProctorId, "proctor_id");

                entity.Property(e => e.ExamRoomId).HasColumnName("exam_room_id");

                entity.Property(e => e.ProctorId).HasColumnName("proctor_id");

                entity.HasOne(d => d.ExamRoom)
                    .WithMany(p => p.ExamRoomProctors)
                    .HasForeignKey(d => d.ExamRoomId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_room_protors_ibfk_1");

                entity.HasOne(d => d.Proctor)
                    .WithMany(p => p.ExamRoomProctors)
                    .HasForeignKey(d => d.ProctorId)
                    .OnDelete(DeleteBehavior.ClientSetNull)
                    .HasConstraintName("exam_room_protors_ibfk_2");
            });

            OnModelCreatingPartial(modelBuilder);
        }

        partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    }
}
