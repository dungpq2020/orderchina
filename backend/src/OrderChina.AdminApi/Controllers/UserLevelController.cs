using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("user-level")]
[Authorize]
public class UserLevelController : ControllerBase
{
    private readonly IUserLevelService _userLevelService;

    public UserLevelController(IUserLevelService userLevelService)
    {
        _userLevelService = userLevelService;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await _userLevelService.GetListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserLevelRequest request, CancellationToken cancellationToken)
    {
        var result = await _userLevelService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserLevelRequest request, CancellationToken cancellationToken)
    {
        var result = await _userLevelService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _userLevelService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
        if (!deleted)
        {
            return NotFound();
        }

        return NoContent();
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
