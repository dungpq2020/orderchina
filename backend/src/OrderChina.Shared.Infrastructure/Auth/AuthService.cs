using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Application.Auth;
using OrderChina.Shared.Application.Auth.Dtos;
using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Infrastructure.Persistence;

namespace OrderChina.Shared.Infrastructure.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly AppDbContext _dbContext;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        ITokenService tokenService,
        AppDbContext dbContext)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _dbContext = dbContext;
    }

    public async Task<AuthResult> LoginAsync(LoginRequest request, TokenAudience audience, CancellationToken cancellationToken = default)
    {
        var expectedUserType = ToUserType(audience);
        var user = await _userManager.FindByNameAsync(request.Username);

        if (user is null || user.UserType != expectedUserType)
        {
            await LogAttemptAsync(null, request.Username, audience, succeeded: false, "user_not_found", cancellationToken);
            return new AuthResult(false, null, "Username hoặc mật khẩu không đúng.");
        }

        var passwordCheck = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

        if (passwordCheck.IsLockedOut)
        {
            await LogAttemptAsync(user.Id, request.Username, audience, succeeded: false, "locked_out", cancellationToken);
            return new AuthResult(false, null, "Tài khoản tạm khoá do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau.", IsLockedOut: true);
        }

        if (!passwordCheck.Succeeded)
        {
            await LogAttemptAsync(user.Id, request.Username, audience, succeeded: false, "wrong_password", cancellationToken);
            return new AuthResult(false, null, "Username hoặc mật khẩu không đúng.");
        }

        if (user.TwoFactorEnabled)
        {
            if (string.IsNullOrWhiteSpace(request.TwoFactorCode))
            {
                return new AuthResult(false, null, "Cần mã xác thực 2 lớp.", RequiresTwoFactor: true);
            }

            var isValidCode = await _userManager.VerifyTwoFactorTokenAsync(
                user, TokenOptions.DefaultAuthenticatorProvider, request.TwoFactorCode);

            if (!isValidCode)
            {
                await LogAttemptAsync(user.Id, request.Username, audience, succeeded: false, "invalid_2fa_code", cancellationToken);
                return new AuthResult(false, null, "Mã xác thực 2 lớp không đúng.", RequiresTwoFactor: true);
            }
        }

        var tokens = await IssueTokensAsync(user, audience, request.IpAddress, cancellationToken);
        await LogAttemptAsync(user.Id, request.Username, audience, succeeded: true, null, cancellationToken);

        return new AuthResult(true, tokens, null);
    }

    public async Task<AuthResult> RefreshAsync(RefreshRequest request, TokenAudience audience, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.ComputeTokenHash(request.RefreshToken);

        var existingToken = await _dbContext.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.Audience == audience, cancellationToken);

        if (existingToken is null)
        {
            return new AuthResult(false, null, "Refresh token không hợp lệ.");
        }

        if (existingToken.RevokedAtUtc is not null)
        {
            // Token đã bị revoke/dùng rồi mà vẫn được gửi lên lần nữa → dấu hiệu bị đánh cắp.
            await RevokeAllSessionsAsync(existingToken.UserId, "reuse_detected", cancellationToken);
            return new AuthResult(false, null, "Refresh token không hợp lệ. Toàn bộ phiên đăng nhập đã bị thu hồi vì lý do bảo mật.");
        }

        if (existingToken.ExpiresAtUtc <= DateTime.UtcNow)
        {
            return new AuthResult(false, null, "Refresh token đã hết hạn.");
        }

        var user = existingToken.User;

        if (existingToken.SecurityStampAtIssuance != user.SecurityStamp)
        {
            // Mật khẩu đã đổi hoặc phiên đã bị thu hồi kể từ lúc token này được cấp.
            existingToken.RevokedAtUtc = DateTime.UtcNow;
            existingToken.ReasonRevoked = "security_stamp_mismatch";
            await _dbContext.SaveChangesAsync(cancellationToken);
            return new AuthResult(false, null, "Phiên đăng nhập đã hết hiệu lực, vui lòng đăng nhập lại.");
        }

        var newTokens = await IssueTokensAsync(user, audience, request.IpAddress, cancellationToken, existingToken);

        return new AuthResult(true, newTokens, null);
    }

    public async Task LogoutAsync(string refreshToken, TokenAudience audience, CancellationToken cancellationToken = default)
    {
        var tokenHash = _tokenService.ComputeTokenHash(refreshToken);

        var existingToken = await _dbContext.RefreshTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.Audience == audience, cancellationToken);

        if (existingToken is null || existingToken.RevokedAtUtc is not null)
        {
            return;
        }

        existingToken.RevokedAtUtc = DateTime.UtcNow;
        existingToken.ReasonRevoked = "logout";
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task RevokeAllSessionsAsync(Guid userId, string reason, CancellationToken cancellationToken = default)
    {
        var activeTokens = await _dbContext.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAtUtc == null)
            .ToListAsync(cancellationToken);

        foreach (var token in activeTokens)
        {
            token.RevokedAtUtc = DateTime.UtcNow;
            token.ReasonRevoked = reason;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthResult> RegisterCustomerAsync(RegisterCustomerRequest request, CancellationToken cancellationToken = default)
    {
        var existingByUsername = await _userManager.FindByNameAsync(request.Username);
        if (existingByUsername is not null)
        {
            return new AuthResult(false, null, "Username đã được sử dụng.");
        }

        var existingByEmail = await _userManager.FindByEmailAsync(request.Email);
        if (existingByEmail is not null)
        {
            return new AuthResult(false, null, "Email đã được sử dụng.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Username,
            Email = request.Email,
            FullName = request.FullName,
            UserType = UserType.Customer,
            CreatedAtUtc = DateTime.UtcNow
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            var error = string.Join("; ", createResult.Errors.Select(e => e.Description));
            return new AuthResult(false, null, error);
        }

        var tokens = await IssueTokensAsync(user, TokenAudience.CustomerApi, request.IpAddress, cancellationToken);
        return new AuthResult(true, tokens, null);
    }

    public async Task<Enable2faResponse> EnableTwoFactorAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString())
            ?? throw new InvalidOperationException("User not found.");

        var key = await _userManager.GetAuthenticatorKeyAsync(user);
        if (string.IsNullOrEmpty(key))
        {
            await _userManager.ResetAuthenticatorKeyAsync(user);
            key = await _userManager.GetAuthenticatorKeyAsync(user);
        }

        var authenticatorUri = $"otpauth://totp/OrderChina:{Uri.EscapeDataString(user.Email ?? user.Id.ToString())}" +
                                $"?secret={key}&issuer={Uri.EscapeDataString("OrderChina")}&digits=6";

        return new Enable2faResponse(key!, authenticatorUri);
    }

    public async Task<bool> VerifyTwoFactorAsync(Verify2faRequest request, CancellationToken cancellationToken = default)
    {
        var user = await _userManager.FindByIdAsync(request.UserId.ToString());
        if (user is null)
        {
            return false;
        }

        var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultAuthenticatorProvider, request.Code);
        if (!isValid)
        {
            return false;
        }

        await _userManager.SetTwoFactorEnabledAsync(user, true);
        return true;
    }

    private async Task<TokenResponse> IssueTokensAsync(
        ApplicationUser user,
        TokenAudience audience,
        string? ipAddress,
        CancellationToken cancellationToken,
        RefreshToken? tokenBeingRotated = null)
    {
        var permissionCodes = user.UserType == UserType.Staff
            ? await GetPermissionCodesAsync(user.Id, cancellationToken)
            : Array.Empty<string>();

        var accessToken = _tokenService.CreateAccessToken(user, audience, permissionCodes);
        var newRefreshToken = _tokenService.CreateRefreshToken(user.Id, audience, user.SecurityStamp ?? string.Empty, ipAddress);

        if (tokenBeingRotated is not null)
        {
            tokenBeingRotated.RevokedAtUtc = DateTime.UtcNow;
            tokenBeingRotated.ReasonRevoked = "rotated";
            tokenBeingRotated.ReplacedByTokenHash = newRefreshToken.Entity.TokenHash;
        }

        _dbContext.RefreshTokens.Add(newRefreshToken.Entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return new TokenResponse(
            accessToken.Token,
            accessToken.ExpiresAtUtc,
            newRefreshToken.RawToken,
            newRefreshToken.Entity.ExpiresAtUtc);
    }

    private async Task<IReadOnlyCollection<string>> GetPermissionCodesAsync(Guid userId, CancellationToken cancellationToken)
    {
        var groupIds = await _dbContext.UserGroupMemberships
            .Where(m => m.UserId == userId)
            .Select(m => m.UserGroupId)
            .ToListAsync(cancellationToken);

        if (groupIds.Count == 0)
        {
            return Array.Empty<string>();
        }

        var codes = await _dbContext.UserGroupPermissions
            .Where(p => groupIds.Contains(p.UserGroupId))
            .Select(p => p.PermitObject.Code + "." + p.Permission.Code)
            .Distinct()
            .ToListAsync(cancellationToken);

        return codes;
    }

    private async Task LogAttemptAsync(Guid? userId, string username, TokenAudience audience, bool succeeded, string? failureReason, CancellationToken cancellationToken)
    {
        _dbContext.LoginAuditLogs.Add(new LoginAuditLog
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Username = username,
            Audience = audience,
            Succeeded = succeeded,
            FailureReason = failureReason,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private static UserType ToUserType(TokenAudience audience) => audience switch
    {
        TokenAudience.AdminApi => UserType.Staff,
        TokenAudience.CustomerApi => UserType.Customer,
        _ => throw new ArgumentOutOfRangeException(nameof(audience))
    };
}
