using System;
using backend.Models;

namespace backend.Repositories
{
	public interface IUserRepository
	{
        Task<User> GetUserByEmailAsync(string email);
        List<string> GetAllRolesByUserId(uint userId);
        Campus GetCampusNameByUserId(uint userId);
    }
}

