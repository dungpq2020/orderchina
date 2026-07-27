using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("fee-weight")]
[Authorize]
public class FeeWeightController : ControllerBase
{
    private readonly IFeeWeightService _feeWeightService;

    public FeeWeightController(IFeeWeightService feeWeightService)
    {
        _feeWeightService = feeWeightService;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default)
    {
        var result = await _feeWeightService.GetListAsync(page, pageSize, cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveFeeWeightRequest request, CancellationToken cancellationToken)
    {
        var result = await _feeWeightService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveFeeWeightRequest request, CancellationToken cancellationToken)
    {
        var result = await _feeWeightService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _feeWeightService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
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
