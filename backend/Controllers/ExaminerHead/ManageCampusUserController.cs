using backend.DTOs;
using backend.Models;
using backend.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Security.Claims;
using backend.Authorization;
using System.Net.Http;

namespace backend.Controllers.ExaminerHead
{
    [Authorize(Authorization.Role.ExaminerHead)]
    [Route("api/[controller]")]
    [ApiController]
    public class ManageCampusUserController : ControllerBase
    {
        private readonly SEP490_V3Context _context;
        private readonly IUserRepository _userRepository;
        //private readonly HttpContext _httpcontext;

        public ManageCampusUserController(SEP490_V3Context context, IUserRepository userRepository)
        {
            _context = context;
            _userRepository = userRepository;
            //_httpcontext = httpcontext;

        }
        [HttpGet("GetAllCampusUsers")]
        public async Task<IActionResult> GetAllCampusUsers(int? pageNumber = 1, int? pageSize = null)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            if (userIdString == null)
            {
                return Unauthorized(); // Handle unauthorized access
            }

            Campus campus = _userRepository.GetCampusNameByUserId(userId);

            var query = _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.Campus)
                .Where(u => u.UserId != userId)
                .Where(u => u.Campus.CampusName == campus.CampusName)
                .Where(u => u.UserRoles.Any(ur => ur.Role.RoleName != "ExaminerHead" && ur.Role.RoleName != "Admin"))
                .AsQueryable();

            var totalCount = await query.CountAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)(pageSize ?? totalCount));

            if (pageNumber.HasValue && pageNumber.Value > totalPages)
            {
                pageNumber = totalPages;
            }

            var itemsQuery = query
                .Select(u => new
                {
                    u.UserId,
                    u.Email,
                    Campus = new
                    {
                        u.Campus.CampusId,
                        u.Campus.CampusName,
                    },
                    Roles = u.UserRoles.Select(ur => new
                    {
                        ur.Role.RoleId,
                        ur.Role.RoleName
                    }).ToList(),
                    u.IsActive
                });

            if (pageSize.HasValue && pageSize.Value > 0)
            {
                itemsQuery = itemsQuery.Skip((pageNumber.Value - 1) * pageSize.Value).Take(pageSize.Value);
            }

            var allUsers = await itemsQuery.ToListAsync();

            var result = new
            {
                TotalCount = totalCount,
                Users = allUsers
            };

            return Ok(result);
        }


        [HttpGet("GetOnlyCampusByExaminerHead")]
        public async Task<IActionResult> GetAllCampusesByUserId()
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

             Campus campus = _userRepository.GetCampusNameByUserId(userId);
            if (userIdString == null)
            {
                return Unauthorized(); // Handle unauthorized access
            }
            return Ok(campus);
        }

        [HttpGet("GetUserById/{id}")]
        public async Task<IActionResult> GetUserById(uint id)
        {
            var user = await _context.Users
                             .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                             .Include(u => u.Campus)
                             .FirstOrDefaultAsync(u => u.UserId == id);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            var result = new
            {
                user.UserId,
                user.Email,
                Campus = new
                {
                    user.Campus.CampusId,
                    user.Campus.CampusName,
                },
                Roles = user.UserRoles.Select(ur => new
                {
                    ur.Role.RoleId,
                    ur.Role.RoleName
                }).ToList(),
                user.IsActive
            };

            return Ok(result);
        }
        [HttpGet("GetRolesManageByEH")]
        public async Task<IActionResult> GetAllRoles()
        {
            var allRoles = await _context.Roles
                .Where(u => u.RoleName != "Admin" && u.RoleName != "ExaminerHead")
                .ToListAsync();
            var result = allRoles.Select(r => new
            {
                r.RoleId,
                r.RoleName
            });

            return Ok(result);
        }

        [HttpPost("AddCampusUser")]
        public async Task<IActionResult> AddCampusUser([FromBody] UserDTO newUserDto)
        {
            if (newUserDto == null || string.IsNullOrEmpty(newUserDto.Email))
            {
                return BadRequest("Invalid user data.");
            }

            var emailExists = await _context.Users.FirstOrDefaultAsync(x => x.Email == newUserDto.Email);
            if (emailExists != null)
            {
                return StatusCode(500, new { message = "An existing account requires a different email address." });
            }

            var validRoles = new List<uint> { 3, 4, 5 };
            if (newUserDto.RoleId == null || !newUserDto.RoleId.Any() || !newUserDto.RoleId.All(roleId => validRoles.Contains(roleId)))
            {
                return BadRequest("Invalid roles. Only Examiner, Proctor, and IT roles are allowed.");
            }

            var newUser = new User
            {
                Email = newUserDto.Email,
                IsActive = newUserDto.IsActive,
                CampusId = newUserDto.CampusId,
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            var userRoles = newUserDto.RoleId.Select(roleId => new UserRole
            {
                RoleId = roleId,
                UserId = newUser.UserId
            }).ToList();

            _context.UserRoles.AddRange(userRoles);
            await _context.SaveChangesAsync();

            return Ok(newUser);
        }
        [HttpPost("ImportUserByExcelRoleEH")]
        public async Task<IActionResult> ImportUserByExcelRoleEH([FromBody] List<ImportExcelUserDTO> importExcelUsers)
        {
            var CampusIdString = HttpContext.Items["CampusId"]?.ToString();
            uint.TryParse(CampusIdString, out uint CampusId);
            int count = 0;

            foreach (var data in importExcelUsers)
            {
                count++;
                if (data.RoleName == "Admin" || data.RoleName == "ExaminerHead")
                {
                    return BadRequest($"Examiner Head cannot add role Admin or ExaminerHead");
                }

                // Handle email and emailFe logic
                string email = data.Email;
                string? emailFe = null;

                if (email.EndsWith("@fe.edu.vn"))
                {
                    emailFe = email;
                    email = email.Replace("@fe.edu.vn", "@fpt.edu.vn");
                }

                var existedProctor = _context.UserRoles
                    .Include(x => x.User)
                    .Include(x => x.Role)
                    .Where(x => x.User.Email == email || x.User.EmailFe == email)
                    .FirstOrDefault();

                uint proctorId;
                if (existedProctor != null)
                {
                    proctorId = existedProctor.UserId;
                }
                else
                {
                    var newProctor = new User
                    {
                        Email = email,
                        EmailFe = emailFe,
                        IsActive = true,
                        CampusId = CampusId,
                    };
                    _context.Users.Add(newProctor);
                    _context.SaveChanges();
                    proctorId = newProctor.UserId;
                }

                var role = _context.Roles.Where(x => x.RoleName == data.RoleName).FirstOrDefault();
                if (role == null)
                {
                    return NotFound("RoleName does not exist in the database");
                }
                uint roleId = role.RoleId;

                // Check if the user already has the role
                var existedUserRole = _context.UserRoles
                    .Where(x => x.UserId == proctorId && x.RoleId == roleId)
                    .FirstOrDefault();

                if (existedUserRole == null)
                {
                    var newUserRole = new UserRole
                    {
                        UserId = proctorId,
                        RoleId = roleId
                    };
                    _context.UserRoles.Add(newUserRole);
                    _context.SaveChanges();
                }
            }

            return Ok("Success");
        }



        [HttpPut("UpdateCampusUser/{userId}")]
        public async Task<IActionResult> UpdateUser(uint userId, [FromBody] UserUpdateDTO updatedUserDto)
        {
            if (updatedUserDto == null || string.IsNullOrEmpty(updatedUserDto.Email) || updatedUserDto.RoleId == null || !updatedUserDto.RoleId.Any())
            {
                return BadRequest("Invalid user data.");
            }

            var user = await _context.Users
                                     .Include(u => u.UserRoles)
                                     .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            try
            {
                using (var transaction = await _context.Database.BeginTransactionAsync())
                {
                    user.Email = updatedUserDto.Email;
                    user.IsActive = updatedUserDto.IsActive;
                    user.CampusId = updatedUserDto.CampusId;

                    // Remove existing roles
                    _context.UserRoles.RemoveRange(user.UserRoles);
                    await _context.SaveChangesAsync();

                    // Add new roles
                    foreach (var roleId in updatedUserDto.RoleId)
                    {
                        var userRole = new UserRole
                        {
                            RoleId = roleId,
                            UserId = user.UserId
                        };
                        _context.UserRoles.Add(userRole);
                    }
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();
                }



                return Ok("");
            }
            catch (Exception ex)
            {
                // Log the exception
                // For example: _logger.LogError(ex, "Error updating user");
                return StatusCode(500, new { message = "An error occurred while updating the user.", details = ex.Message });
            }
        }

        [HttpDelete("DeleteCampusUser/{userId}")]
        public async Task<IActionResult> DeleteUser(uint userId)
        {
            var userRoles = await _context.UserRoles.Where(ur => ur.UserId == userId).ToListAsync();
            _context.UserRoles.RemoveRange(userRoles);
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
            {
                return NotFound("User not found.");
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return Ok("User deleted successfully.");
        }

        [HttpGet("SearchCampusUser")]
        public async Task<IActionResult> SearchUsers([FromQuery] string searchString)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            Campus campus = _userRepository.GetCampusNameByUserId(userId);
            if (userIdString == null)
            {
                return Unauthorized(); // Handle unauthorized access
            }
            var allUsers = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.Campus)
                .Where(u => u.UserRoles.Any(ur => ur.Role.RoleName != "ExaminerHead" && ur.Role.RoleName != "Admin"))
                .Where(u=>u.Campus.CampusName == campus.CampusName)
                .Where(u => u.Email.ToLower().Contains(searchString.ToLower()))
                .ToListAsync();

            if (allUsers != null && allUsers.Any())
            {
                var result = allUsers.Select(u => new
                {
                    u.UserId,
                    u.Email,
                    Campus = new
                    {
                        u.Campus.CampusId,
                        u.Campus.CampusName,
                    },
                    Role = u.UserRoles.Select(ur => new
                    {
                        ur.Role.RoleId,
                        ur.Role.RoleName
                    }).FirstOrDefault(),
                    u.IsActive
                });

                return Ok(result);
            }
            else
            {
                return NotFound("No users found");
            }
        }
    }
}
