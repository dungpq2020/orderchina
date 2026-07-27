using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("fee-buy-pro")]
[Authorize]
public class FeeBuyProController : ControllerBase
{
    private readonly IFeeBuyProService _feeBuyProService;

    public FeeBuyProController(IFeeBuyProService feeBuyProService)
    {
        _feeBuyProService = feeBuyProService;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _feeBuyProService.GetListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveFeeBuyProRequest request, CancellationToken cancellationToken)
    {
        var result = await _feeBuyProService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveFeeBuyProRequest request, CancellationToken cancellationToken)
    {
        var result = await _feeBuyProService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _feeBuyProService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
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
