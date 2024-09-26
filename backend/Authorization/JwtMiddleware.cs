namespace backend.Authorization;

using Microsoft.Extensions.Options;
using backend.Helpers;
using backend.Services;
using backend.Models;

public class JwtMiddleware
{
    private readonly RequestDelegate _next;
    private readonly AppSettings _appSettings;

    public JwtMiddleware(RequestDelegate next, IOptions<AppSettings> appSettings)
    {
        _next = next;
        _appSettings = appSettings.Value;
    }

    public async Task Invoke(HttpContext context, IUserService userService, IJwtUtils jwtUtils)
    {
        var accessToken = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
        if (accessToken != null)
        {
            try
            {
                User requestSender = await jwtUtils.ValidateAccessTokenAndReturnUser(accessToken);
                uint userid = requestSender.UserId;
                string email = requestSender.Email;
                uint campusId = requestSender.CampusId;

                // attach request sender roles to context (request)
                // this will be passed to OnAuthorization in AuthorizeAttribute file
                context.Items["UserId"] = userid;
                context.Items["Email"] = email;
                context.Items["RequestSender"] = requestSender;
                context.Items["CampusId"] = campusId;

                Console.WriteLine("this is userid in jwtMiddleware :");
                Console.WriteLine(email);
                Console.WriteLine(userid);
            }
            catch
            {
            }
        }
        await _next(context);
    }
}
