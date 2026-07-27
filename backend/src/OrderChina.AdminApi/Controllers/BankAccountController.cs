using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Fees.Dtos;

namespace OrderChina.AdminApi.Controllers;

[ApiController]
[Route("bank-account")]
[Authorize]
public class BankAccountController : ControllerBase
{
    private readonly IBankAccountService _bankAccountService;

    public BankAccountController(IBankAccountService bankAccountService)
    {
        _bankAccountService = bankAccountService;
    }

    [HttpGet("list")]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await _bankAccountService.GetListAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SaveBankAccountRequest request, CancellationToken cancellationToken)
    {
        var result = await _bankAccountService.CreateAsync(request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SaveBankAccountRequest request, CancellationToken cancellationToken)
    {
        var result = await _bankAccountService.UpdateAsync(id, request, GetCurrentUserId(), cancellationToken);
        if (!result.Succeeded)
        {
            return BadRequest(new { error = result.Error });
        }

        return Ok(result.Item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var deleted = await _bankAccountService.DeleteAsync(id, GetCurrentUserId(), cancellationToken);
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
