using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Authorization;

namespace backend.Controllers.MakeCommonNotice
{
    [Authorize(Authorization.Role.Examiner)]
    [Route("Examiner/[controller]")]
    [ApiController]
    public class MakeCommonNoticeController : ControllerBase
    {
        private readonly SEP490_V3Context _context;

        public MakeCommonNoticeController(SEP490_V3Context context)
        {
            _context = context;
        }

        [HttpGet("GetAllNotices")]
        public async Task<IActionResult> GetAllNotices()
        {
            var notices = await _context.CommonNotices
            .Select(x => new {
                x.CommonNoticeId,
                x.SenderId,
                x.Title,
                x.Content,
                x.SendTime,
                x.FileAttach,
                x.Sender.Email
            })
            .ToListAsync();
            return Ok(notices);
        }

        [HttpGet("GetNoticeById/{id}")]
        public async Task<IActionResult> GetNoticeById(uint id)
        {
            var notice = await _context.CommonNotices.FindAsync(id);
            if (notice == null)
            {
                return NotFound("Notice not found.");
            }
            return Ok(notice);
        }

        [HttpPost("AddNotice")]
        public async Task<IActionResult> AddNotice([FromBody] CommonNoticeDTO newNoticeDto)
        {
            if (newNoticeDto == null || string.IsNullOrEmpty(newNoticeDto.Title))
            {
                return BadRequest("Invalid notice data.");
            }

            var newNotice = new CommonNotice
            {
                SenderId = newNoticeDto.SenderId,
                Title = newNoticeDto.Title,
                Content = newNoticeDto.Content,
                SendTime = DateTime.UtcNow,
                FileAttach = newNoticeDto.FileAttach
            };

            _context.CommonNotices.Add(newNotice);
            await _context.SaveChangesAsync();

            return Ok(newNotice);
        }

        [HttpPut("UpdateNotice/{id}")]
        public async Task<IActionResult> UpdateNotice(uint id, [FromBody] CommonNoticeDTO updatedNoticeDto)
        {
            var notice = await _context.CommonNotices.FindAsync(id);

            if (notice == null)
            {
                return NotFound("Notice not found.");
            }

            notice.Title = updatedNoticeDto.Title;
            notice.Content = updatedNoticeDto.Content;
            notice.SendTime = DateTime.UtcNow;
            notice.FileAttach = updatedNoticeDto.FileAttach;

            await _context.SaveChangesAsync();

            return Ok(notice);
        }

        [HttpDelete("DeleteNotice/{id}")]
        public async Task<IActionResult> DeleteNotice(uint id)
        {
            var notice = await _context.CommonNotices.FindAsync(id);

            if (notice == null)
            {
                return NotFound("Notice not found.");
            }

            _context.CommonNotices.Remove(notice);
            await _context.SaveChangesAsync();

            return Ok("Notice deleted successfully.");
        }
    }
}
