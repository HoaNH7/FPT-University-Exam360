using System;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Repositories;
using backend.Models;
using System.Linq;

namespace backend.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;

        public UserService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserRoleDTO> CheckUserRoleAsync(UserEmailDTO userEmail)
        {
            var user = await _userRepository.GetUserByEmailAsync(userEmail.Email);
            if (user == null)
            {
                throw new Exception("User not found."); // Or return null, depending on your error handling strategy
            }

            // Assuming User can have multiple roles, we take the first one (or handle it as required)
            var userRole = user.UserRoles.FirstOrDefault();
            if (userRole == null || userRole.Role == null)
            {
                throw new Exception("Role not found for the user."); // Or return null, depending on your error handling strategy
            }

            return new UserRoleDTO { RoleName = userRole.Role.RoleName };
        }
    }
}
