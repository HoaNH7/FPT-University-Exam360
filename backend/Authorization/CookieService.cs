using Microsoft.AspNetCore.Http;
using backend.Models;

namespace backend.Authorization;

public class CookieService
{
    private readonly IJwtUtils _jwtUtils;
     private readonly string MYAPP_DOMAIN ;

    public CookieService(IJwtUtils jwtUtils,IConfiguration configuration)
    {
        _jwtUtils = jwtUtils;
        MYAPP_DOMAIN = configuration["AppSettings:MYAPP_DOMAIN"];
    }

    public void SetRefreshCookie(HttpContext context)
    {
        var requestSender = context.Items["RequestSender"];

       if (requestSender == null)
    {
    throw new ArgumentNullException(nameof(requestSender), "Error: Attempted to set refresh cookie for null User");
    }

        User user = (User)requestSender;

        string refreshToken = _jwtUtils.GenerateRefreshJwtToken(user);

        var cookieOptions = new CookieOptions
        {
                Secure = true, // if secure is impossible , change to false
                HttpOnly = true,
                Path = "/",
                IsEssential = true,
                Domain = MYAPP_DOMAIN,
                SameSite = SameSiteMode.Strict,
        };

        context.Response.Cookies.Append("jid", refreshToken, cookieOptions);
    }
}
