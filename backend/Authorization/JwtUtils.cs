namespace backend.Authorization;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Helpers;
using backend.Models;
using backend.Repositories;

public interface IJwtUtils
{
    public string GenerateAccessJwtToken(User user);
    public string GenerateRefreshJwtToken(User user);
    public Task<User> ValidateAccessTokenAndReturnUser(string token);
    public Task<User> ValidateRefreshTokenAndReturnUser(string token);
}

public class JwtUtils : IJwtUtils
{
    private readonly AppSettings _appSettings;
    private readonly IUserRepository _userRepository;

    public JwtUtils(IOptions<AppSettings> appSettings, IUserRepository userRepository)
    {
        _appSettings = appSettings.Value;
        _userRepository = userRepository;
    }

    public string GenerateAccessJwtToken(User user)
    {
        if (_userRepository == null)
        {
            Console.WriteLine("Stupid code");
        }
        // generate access token that is valid for 15 mins
        var tokenHandler = new JwtSecurityTokenHandler();
        Console.WriteLine("cccccccccccccccccccc");

        Console.WriteLine(_appSettings.AccessTokenSecret);
        var key = Encoding.ASCII.GetBytes(_appSettings.AccessTokenSecret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim("email", user.Email.ToString()) }),
            Expires = DateTime.UtcNow.AddMinutes(15),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public string GenerateRefreshJwtToken(User user)
    {
        // generate access token that is valid for 15 mins
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_appSettings.AccessTokenSecret);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[] { new Claim("email", user.Email.ToString()) }),
            Expires = DateTime.UtcNow.AddDays(7),
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<User> ValidateAccessTokenAndReturnUser(string token)
    {
        if (token == null)
            throw new Exception("Invalid jwt token");

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_appSettings.AccessTokenSecret);
        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var requestEmail = jwtToken.Claims.First(x => x.Type == "email").Value;

            var requestSender = await _userRepository.GetUserByEmailAsync(requestEmail);

            // return User: request sender
            return requestSender;
        }
        catch
        {
            throw new Exception("Invalid jwt token");
        }
    }

    public async Task<User> ValidateRefreshTokenAndReturnUser(string token)
    {

        if (token == null)
            throw new Exception("Invalid jwt token");

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_appSettings.RefreshTokenSecret);
        try
        {
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = false,
                ValidateAudience = false,
                // set clockskew to zero so tokens expire exactly at token expiration time (instead of 5 minutes later)
                ClockSkew = TimeSpan.Zero
            }, out SecurityToken validatedToken);

            var jwtToken = (JwtSecurityToken)validatedToken;
            var requestEmail = jwtToken.Claims.First(x => x.Type == "email").Value;

            var requestSender = await _userRepository.GetUserByEmailAsync(requestEmail);
         

            // return User: request sender
            return requestSender;
        }
        catch
        {
            throw new Exception("Invalid jwt token");
        }

    }
}
