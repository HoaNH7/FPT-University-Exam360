using System;
using backend.Authorization;
using backend.MockData;
using backend.Repositories;
using backend.Services;

namespace backend.App.Extentions
{
	public static class AppServiceExtentions
	{
        public static void AddAppServices(this IServiceCollection services)
        {
            services.AddHttpClient();
            services.AddScoped<ScheduleService>();
            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IUserRepository, UserRepository>();
            // configure DI for application services
            services.AddScoped<IJwtUtils, JwtUtils>();
            services.AddScoped<CookieService>();
        }
    }
}

