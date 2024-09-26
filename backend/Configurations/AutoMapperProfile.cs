using System;
using AutoMapper;
using backend.DTOs;
using backend.Models;

namespace backend.Configurations
{
	public class AutoMapperProfile:Profile
	{
		public AutoMapperProfile()
		{
            CreateMap<UserEmailDTO, User>();
            CreateMap<User, UserEmailDTO>();
            CreateMap<Role, UserRoleDTO>();
            CreateMap<UserRoleDTO, Role>();

        }
	}
}

