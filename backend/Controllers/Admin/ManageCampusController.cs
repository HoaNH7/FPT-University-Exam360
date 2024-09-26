using backend.Authorization;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers.Admin
{
    [Authorize(Authorization.Role.Admin)]
    [Route("Admin/[controller]")]
    [ApiController]
    public class ManageCampusController : Controller
    {
        private readonly SEP490_V3Context _context;

        public ManageCampusController(SEP490_V3Context context)
        {
            _context = context;


        }

        [AllowAnonymous]
        [HttpGet("GetAllCampuses")]
        public async Task<IActionResult> GetAllCampuses()
        {
            var campuses = await _context.Campuses.ToListAsync();
            return Ok(campuses);
        }

       

        // POST: Admin/ManageCampus/AddCampus
        [HttpPost("AddCampus")]
        public async Task<IActionResult> AddCampus([FromBody] CampusDTO newCampusDto)
        {
            if (newCampusDto == null || string.IsNullOrEmpty(newCampusDto.Name))
            {
                return BadRequest("Invalid campus data.");
            }

            var newCampus = new Campus
            {
                CampusName = newCampusDto.Name,
                Address = newCampusDto.Address,
                Contact = newCampusDto.Contact
            };

            _context.Campuses.Add(newCampus);
            await _context.SaveChangesAsync();

            return Ok(newCampus);
        }

        // PUT: Admin/ManageCampus/UpdateCampus/{campusId}
        [HttpPut("UpdateCampus/{campusId}")]
        public async Task<IActionResult> UpdateCampus(uint campusId, [FromBody] CampusDTO updatedCampusDto)
        {
            var campus = await _context.Campuses.FindAsync(campusId);

            if (campus == null)
            {
                return NotFound("Campus not found.");
            }

            campus.CampusName = updatedCampusDto.Name;
            campus.Address = updatedCampusDto.Address;
            campus.Contact = updatedCampusDto.Contact;

            await _context.SaveChangesAsync();

            return Ok(campus);
        }

        // DELETE: Admin/ManageCampus/DeleteCampus/{campusId}
        [HttpDelete("DeleteCampus/{campusId}")]
        public async Task<IActionResult> DeleteCampus(uint campusId)
        {
            var campus = await _context.Campuses.FindAsync(campusId);

            if (campus == null)
            {
                return NotFound("Campus not found.");
            }

            _context.Campuses.Remove(campus);
            await _context.SaveChangesAsync();

            return Ok("Campus deleted successfully.");
        }

        [HttpGet("SearchCampuses")]
        public async Task<IActionResult> SearchUsers([FromQuery] string searchString)
        {
            var allCampuses = await _context.Campuses
                .Where(u => u.CampusName.ToLower().Contains(searchString.ToLower()))
                .ToListAsync();

            if (allCampuses != null && allCampuses.Any())
            {
                var result = allCampuses.Select(u => new
                {
                    u.CampusName,
                    u.Address,
                    u.Contact
                    
                });

                return Ok(result);
            }
            else
            {
                return NotFound("No users found");
            }
        }
        [AllowAnonymous]
        [HttpGet("GetCampusById/{id}")]
        public async Task<IActionResult> GetCampusById(uint id)
        {
            var campus = _context.Campuses.Where(x => x.CampusId == id);
            return Ok(campus);
        }

    }
}

