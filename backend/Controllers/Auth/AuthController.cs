using System;
using backend.DTOs;
using backend.Services;
using Microsoft.AspNetCore.Mvc;
using static backend.Controllers.Admin.ManageUserController;
using backend.Authorization;
using Google.Apis.Auth;
using Google.Apis.Auth.OAuth2;
using backend.Repositories;
using backend.Models;
using backend.DTOs.Auth;

namespace backend.Controllers.Auth
{
    [Authorize]
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IUserRepository _userRepository;
        private readonly IJwtUtils _jwtUtils;
        private readonly CookieService _cookieService;
        private string MYAPP_DOMAIN ;

        public AuthController(IConfiguration configuration,IUserService userService, IUserRepository userRepository, IJwtUtils jwtUtils, CookieService cookieService)
        {
            _userService = userService;
            _userRepository = userRepository;
            _jwtUtils = jwtUtils;
            _cookieService = cookieService;
            MYAPP_DOMAIN = configuration["AppSettings:MYAPP_DOMAIN"];
        }
        

        [AllowAnonymous]
        [HttpPost("googleLogin")]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDTO token)
        {

            User user;
            try
            {
                GoogleJsonWebSignature.Payload payload = await GoogleJsonWebSignature.ValidateAsync(token.Token);
                string userEmail = payload.Email;
                user = await _userRepository.GetUserByEmailAsync(userEmail);
            }
            catch
            {
                return NotFound();
            }

            var newAccessToken = _jwtUtils.GenerateAccessJwtToken(user);
            var newRefreshToken = _jwtUtils.GenerateRefreshJwtToken(user);

            var cookieOptions = new CookieOptions
            {
                Secure = true, // if secure is impossible , change to false
                HttpOnly = true,
                Path = "/",
                IsEssential = true,
                Domain = MYAPP_DOMAIN,
                SameSite = SameSiteMode.Strict,
            };

            Response.Cookies.Append("jid", newRefreshToken, cookieOptions);


            return Ok(new RefreshAccessTokenResponseDTO
            {
                Token = newAccessToken
            });

        }

        [AllowAnonymous]
        [HttpGet("refresh-access-token")]
        public async Task<IActionResult> RefreshAccessToken()
        {
            string refreshToken = Request.Cookies["jid"] ?? "";
            Console.WriteLine("This is refresh token ----------------------------------");
            Console.WriteLine(refreshToken);

            if (refreshToken == "")
            {
                Console.WriteLine("Unauthorized return 1");
                return Unauthorized();
            }

            User user = await _jwtUtils.ValidateRefreshTokenAndReturnUser(refreshToken);

            if (user == null)
            {
                Console.WriteLine("Unauthorized return 2");
                return Unauthorized();
            }

            var newAccessToken = _jwtUtils.GenerateAccessJwtToken(user);
            var newRefreshToken = _jwtUtils.GenerateRefreshJwtToken(user);

            var cookieOptions = new CookieOptions
            {
                Secure = true, // if secure is impossible , change to false
                HttpOnly = true,
                Path = "/",
                IsEssential = true,
                Domain = MYAPP_DOMAIN,
                SameSite = SameSiteMode.Strict,
            };

            Response.Cookies.Append("jid", newRefreshToken, cookieOptions);

            RefreshAccessTokenResponseDTO response = new RefreshAccessTokenResponseDTO
            {
                Token = newAccessToken,
            };


            Console.WriteLine("Send back access token");
            return Ok(response);
        }

        [HttpGet("logout")]
        public async Task<IActionResult> Logout()
        {
            var cookieOptions = new CookieOptions
            {
                Secure = true, // if secure is impossible , change to false
                HttpOnly = true,
                Path = "/",
                IsEssential = true,
                Domain = MYAPP_DOMAIN,
                SameSite = SameSiteMode.Strict,
            };

            Response.Cookies.Append("jid", "", cookieOptions);

            return Ok();
        }
    }
}

