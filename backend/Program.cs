using backend.App.Extentions;
using backend.Authorization;
using backend.Helpers;
using backend.Models;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using backend;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.HttpOverrides;

internal class Program
{
    private static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddAppServices();

        builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(options =>
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore
);
        builder.Services.AddCors();
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddDbContext<SEP490_V3Context>();
        builder.Services.AddSwaggerGen();
        builder.Services.AddAppServices();

        // configure strongly typed settings object
        builder.Services.Configure<AppSettings>(builder.Configuration.GetSection("AppSettings"));

        var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

        builder.Services.AddCors(options =>
        {
            options.AddPolicy(name: MyAllowSpecificOrigins,
                              policy =>
                              {
                                  policy.WithOrigins("http://localhost:3000")
                                  .AllowAnyHeader()
                                  .AllowAnyMethod()
                                  .AllowCredentials(); // add the allowed origins  
                              });
        });
        //'DbContextOptionsBuilder.EnableSensitiveDataLogging'
        builder.Services.AddControllers();
        builder.Services.Configure<AzureBlobStorageSettings>(builder.Configuration.GetSection("AzureBlobStorage"));


        // Register the FileService
        var basePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "file-storage");
        if (!Directory.Exists(basePath))
       {
           Directory.CreateDirectory(basePath);
       }
        builder.Services.AddSingleton(new FileService(basePath));

        builder.Services.AddSingleton(sp =>
        {
            var settings = sp.GetRequiredService<IOptions<AzureBlobStorageSettings>>().Value;
            return new BlobServiceClient(settings.ConnectionString);
        });


        var app = builder.Build();
        app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

        app.UseCors(MyAllowSpecificOrigins);

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors(builder =>
        {
            builder.WithOrigins("*")
                                    .AllowAnyHeader()
                                    .AllowAnyMethod();
        });

        //using (var scope = app.Services.CreateScope())
        //{
        //    var services = scope.ServiceProvider;

        //    try
        //    {
        //        var scheduleService = services.GetRequiredService<ScheduleService>();
        //         await scheduleService.FetchAndSaveScheduleAsync();
        //    }
        //    catch (Exception ex)
        //    {
        //        var logger = services.GetRequiredService<ILogger<Program>>();
        //        logger.LogError(ex, "An error occurred while fetching and saving schedules.");
        //    }
        //}
        //app.UseHttpsRedirection();

        app.UseAuthorization();

        app.UseMiddleware<JwtMiddleware>();

        app.MapControllers();

        app.Run();
    }
}
