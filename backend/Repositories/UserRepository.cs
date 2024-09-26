using System;
using backend.DTOs;
using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly SEP490_V3Context _context;

        public UserRepository(SEP490_V3Context context)
        {
            _context = context;
        }

        /**
         * hihhhhh
         */
        public async Task<User> GetUserByEmailAsync(string email)
        {

            var userByEmail = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
            if(userByEmail != null)
            {
                return userByEmail;
            }
           
            var userInStudentTable = await _context.Students.Where(x => x.Email == email).Select(x => new
            {
                x.StudentId,
                x.Email,
                x.StudentIdNumber
            }).FirstOrDefaultAsync();
            if (userInStudentTable != null)
            {
                var newUserRoleStudent = new User
                {
                    Email = email,
                    IsActive = true,
                    CampusId = 1

                };
                _context.Users.Add(newUserRoleStudent);
                await _context.SaveChangesAsync();
                var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Student");
                if(studentRole == null)
                {
                    throw new Exception("Role 'Student' not found");
                }
                var userRole = new UserRole
                {
                    RoleId = studentRole.RoleId,
                    UserId = newUserRoleStudent.UserId
                };
                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();
                var userAddedWithRoleStudent = await _context.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
                if (userAddedWithRoleStudent != null)
                {
                    return userAddedWithRoleStudent;
                }

            }

            throw new Exception("User is null");
        }

        public List<string> GetAllRolesByUserId(uint userId)
        {
            List<string> roles = _context.UserRoles.Include(ur => ur.Role)
                .Where(ur => ur.UserId == userId)
                .Select(ur => ur.Role.RoleName)
                .ToList();

            return roles;
        }

        public Campus GetCampusNameByUserId(uint userId)
        {
                var user = _context.Users.FirstOrDefault(u => u.UserId == userId);
                Campus campus =  _context.Campuses.FirstOrDefault(c => c.CampusId == user.CampusId);
                return campus;
            
            

        }
    }
}

