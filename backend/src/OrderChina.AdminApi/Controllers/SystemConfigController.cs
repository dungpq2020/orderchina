using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("system-config")]
[Authorize]
public class SystemConfigController : ControllerBase
{
    private readonly ISystemConfigService _systemConfigService;

    public SystemConfigController(ISystemConfigService systemConfigService)
    {
        _systemConfigService = systemConfigService;
    }

    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var result = await _systemConfigService.GetAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSystemConfigRequest request, CancellationToken cancellationToken)
    {
        var result = await _systemConfigService.UpdateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Config);
    }

    private Guid GetCurrentUserId()
    {
        var sub = User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new InvalidOperationException("Missing sub claim.");
        return Guid.Parse(sub);
    }
}
