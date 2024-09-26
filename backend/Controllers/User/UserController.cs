using System;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization; // Add this library to use DateTime.ParseExact
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Authorization;
using backend.Repositories;

namespace backend.Controllers.UserController
{
    [Authorize]
    [Route("api/User")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        private readonly CookieService _cookieService;
        private readonly IUserRepository _userRepository;

        public UserController(SEP490_V3Context context, CookieService cookieService, IUserRepository userRepository)
        {
            _context = context;
            _cookieService = cookieService;
            _userRepository = userRepository;
        }


        [HttpGet("GetRole")]
        public async Task<IActionResult> GetRole()
        {
            var requestSenderOrNull = HttpContext.Items["RequestSender"];

            if (requestSenderOrNull == null)
            {
                throw new Exception("Cannot extract User from HttpContext.Items");
            }

            backend.Models.User user = (backend.Models.User)requestSenderOrNull;

            List<string> roles = _userRepository.GetAllRolesByUserId(user.UserId);

            return Ok(roles);
        }

        [HttpGet("UserInfo")]
        public async Task<IActionResult> GetUserInfo()
        {
            var requestSenderOrNull = HttpContext.Items["RequestSender"];

            if (requestSenderOrNull == null)
            {
                throw new Exception("Cannot extract User from HttpContext.Items");
            }

            backend.Models.User user = (backend.Models.User)requestSenderOrNull;

            List<string> roles = _userRepository.GetAllRolesByUserId(user.UserId);
            Campus campus = _userRepository.GetCampusNameByUserId(user.UserId);
            UserInfoDTO userInfo = new UserInfoDTO
            {
                UserId = user.UserId,
                Email = user.Email,
                Roles = roles,
                CampusName = campus.CampusName,
            };

            return Ok(userInfo);
        }
    }
}

