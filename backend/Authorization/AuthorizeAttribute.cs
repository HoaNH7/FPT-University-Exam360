namespace backend.Authorization;

using System;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using backend.Models;
using backend.Repositories;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class AuthorizeAttribute : Attribute, IAuthorizationFilter
{
    // This is list of allowed roles attached to an api endpoint
    // User will be able to use the api endpoint if they have a role that is in _allowedRoles
    private readonly IList<Role> _allowedRoles;

    public AuthorizeAttribute(params Role[] roles)
    {
        _allowedRoles = roles ?? new Role[] { };
    }

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        // skip authorization if action is decorated with [AllowAnonymous] attribute
        var allowAnonymous = context.ActionDescriptor.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any();
        if (allowAnonymous)
            return;

        var requestSender = (User)context.HttpContext.Items["RequestSender"]!;

        // If there is no request sender => no access token => return 401
        if (requestSender == null)
        {
            context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
            return;
        }

        var userRepository = context.HttpContext.RequestServices.GetService<IUserRepository>();

        if (userRepository == null)
        {
            throw new Exception("userRepository is null");
        }

        List<string> requestSenderRolesString = userRepository.GetAllRolesByUserId(requestSender.UserId);

        Console.WriteLine("--------------------------------");
        string output = "This is roles:";
        foreach (var role in requestSenderRolesString)
        {
            output += " " + role + " ";
        }
        Console.WriteLine(output);

        IList<Role> requestSenderRolesEnum = parseRolesStringToRoleEnum(requestSenderRolesString);

        // Whether the sender have a role that is in _allowedRoles
        bool hasCommonElement = _allowedRoles.Intersect(requestSenderRolesEnum).Any();

        // If auth attribute specify particular roles, requestSenderRolesEnum have to have a common element with allowed role
        if (_allowedRoles.Any() && !hasCommonElement)
        {
            context.Result = new JsonResult(new { message = "Unauthorized" }) { StatusCode = StatusCodes.Status401Unauthorized };
        }
    }

    private static IList<Role> parseRolesStringToRoleEnum(List<string> roles)
    {
        var finalList = new List<Role>();

        foreach (var roleString in roles)
        {
            try
            {
                Enum.TryParse(roleString, true, out Role roleEnum);
                finalList.Add(roleEnum);
            }
            catch
            {
                throw new Exception("Cannot convert queried role from DB to Role Enum");
            }

        }

        return finalList;
    }
}
