using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Staff;
using OrderChina.Shared.Application.Staff.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("staff")]
[Authorize]
public class StaffController : ControllerBase
{
    private readonly IStaffDirectoryService _staffDirectoryService;

    public StaffController(IStaffDirectoryService staffDirectoryService)
    {
        _staffDirectoryService = staffDirectoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStaff(CancellationToken cancellationToken)
    {
        var result = await _staffDirectoryService.GetStaffAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetStaffList(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? status = null,
        [FromQuery] int? role = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new StaffListFilter(search, status, role);
        var result = await _staffDirectoryService.GetStaffListAsync(page, pageSize, filter, cancellationToken);
        return Ok(result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateStaff(Guid id, [FromBody] UpdateStaffRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { error = "Vui lòng nhập họ tên." });
        }

        var result = await _staffDirectoryService.UpdateStaffAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Staff);
    }

    [HttpGet("admins")]
    public async Task<IActionResult> GetAdmins(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] int? status = null,
        CancellationToken cancellationToken = default)
    {
        var filter = new StaffListFilter(search, status, null);
        var result = await _staffDirectoryService.GetAdminsAsync(page, pageSize, filter, cancellationToken);
        return Ok(result);
    }

    [HttpPut("admins/{id:guid}")]
    public async Task<IActionResult> UpdateAdmin(Guid id, [FromBody] UpdateStaffRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { error = "Vui lòng nhập họ tên." });
        }

        var result = await _staffDirectoryService.UpdateAdminAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Staff);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
