using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace backend.Controllers.Admin
{
    [Authorize(Authorization.Role.Admin)]
    [Route("Admin/[controller]")]
    [ApiController]
    public class ManageUserController : Controller
    {
        private readonly SEP490_V3Context _context;

        public ManageUserController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetAllUsers")]
        public async Task<IActionResult> GetAllUsers(int? pageNumber = 1, int? pageSize = null)
        {
            var userIdString = HttpContext.Items["UserId"]?.ToString();
            uint.TryParse(userIdString, out uint userId);

            var query = _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.Campus)
                .Where(u => u.UserId != userId)
                .Where(u => u.UserRoles.Any(ur => ur.Role.RoleName == "ExaminerHead" || ur.Role.RoleName == "Admin"))
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
                Role = user.UserRoles.Select(ur => new
                {
                    ur.Role.RoleId,
                    ur.Role.RoleName
                }).ToList(),
                user.IsActive
            };

            return Ok(result);
        }

        [HttpGet("GetAllCampuses")]
        public async Task<IActionResult> GetAllCampuses()
        {
            var allCampuses = await _context.Campuses.ToListAsync();
            var result = allCampuses.Select(c => new
            {
                c.CampusId,
                c.CampusName
            });

            return Ok(result);
        }

        [HttpGet("GetAllRoles")]
        public async Task<IActionResult> GetAllRoles()
        {
            var allRoles = await _context.Roles
                .Where(u=>u.RoleName=="Admin"|| u.RoleName=="ExaminerHead")
                .ToListAsync();
            var result = allRoles.Select(r => new
            {
                r.RoleId,
                r.RoleName
            });

            return Ok(result);
        }

        [HttpPost("AddUser")]
        public async Task<IActionResult> AddUser([FromBody] UserDTO newUserDto)
        {
            if (newUserDto == null || string.IsNullOrEmpty(newUserDto.Email))
            {
                return BadRequest("Invalid user data.");
            }

            try
            {
                var emailExists = await _context.Users.FirstOrDefaultAsync(x => x.Email == newUserDto.Email);
                if (emailExists != null)
                {
                    return StatusCode(500, new { message = "An existing account requires a different email address." });
                }

                var newUser = new User
                {
                    Email = newUserDto.Email,
                    IsActive = newUserDto.IsActive,
                    CampusId = newUserDto.CampusId,
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                foreach (var roleId in newUserDto.RoleId)
                {
                    var userRole = new UserRole
                    {
                        RoleId = roleId,
                        UserId = newUser.UserId
                    };

                    _context.UserRoles.Add(userRole);
                    await _context.SaveChangesAsync();
                }

                await _context.SaveChangesAsync();

                return Ok(newUser);
            }
            catch (Exception ex)
            {
                // Log the exception (consider using a logging library like Serilog)
                // For simplicity, returning the error message in the response
                return StatusCode(500, new { message = ex.Message });
            }
        }
        [HttpPost("ImportUserByExcel")]
        public async Task<IActionResult> ImportUserByExcel([FromBody] List<ImportExcelUserDTO> importExcelUsers)
        {
            int count = 0;

            foreach (var data in importExcelUsers)
            {
                count++;
                var existedCampus = _context.Campuses.Where(x => x.CampusName == data.CampusName).FirstOrDefault();
                if (existedCampus == null)
                {
                    return NotFound($"Campus not found for user at index {count}: {data.Email}");
                }

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
                        CampusId = existedCampus.CampusId,
                    };
                    _context.Users.Add(newProctor);
                    _context.SaveChanges();
                    proctorId = newProctor.UserId;
                }

                var role = _context.Roles.Where(x => x.RoleName == data.RoleName).FirstOrDefault();
                if (role == null)
                {
                    return NotFound($"Role not found for user at index {count}: {data.Email}");
                }
                uint roleId = role.RoleId;

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

        [HttpPut("UpdateUser/{userId}")]
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

        [HttpDelete("DeleteUser/{userId}")]
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

        [HttpGet("SearchUsers")]
        public async Task<IActionResult> SearchUsers([FromQuery] string searchString)
        {
            var allUsers = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.Campus)
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
