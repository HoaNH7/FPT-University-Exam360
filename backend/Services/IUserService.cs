using System;
using backend.DTOs;

namespace backend.Services
{
    public interface IUserService
    {
        Task<UserRoleDTO> CheckUserRoleAsync(UserEmailDTO userEmail);
    }
}

