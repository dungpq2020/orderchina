using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using OrderChina.Shared.Application.Auth;
using OrderChina.Shared.Application.Auth.Validators;
using OrderChina.Shared.Application.Fees;
using OrderChina.Shared.Application.Orders;
using OrderChina.Shared.Application.Shipping;
using OrderChina.Shared.Application.Staff;
using OrderChina.Shared.Application.Users;
using OrderChina.Shared.Application.Wallets;
using OrderChina.Shared.Application.Warehouses;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Infrastructure.Auth;
using OrderChina.Shared.Infrastructure.Fees;
using OrderChina.Shared.Infrastructure.Identity;
using OrderChina.Shared.Infrastructure.Orders;
using OrderChina.Shared.Infrastructure.Persistence;
using OrderChina.Shared.Infrastructure.Shipping;
using OrderChina.Shared.Infrastructure.Staff;
using OrderChina.Shared.Infrastructure.Users;
using OrderChina.Shared.Infrastructure.Wallets;
using OrderChina.Shared.Infrastructure.Warehouses;

namespace OrderChina.Shared.Infrastructure.DependencyInjection;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddSharedInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        string dataProtectionApplicationName)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(connectionString)
                   .UseSnakeCaseNamingConvention());

        services.AddOrderChinaIdentity();

        // Persist Data Protection key vào DB thay vì filesystem container (mất khi container restart) —
        // ApplicationName riêng cho từng API vì Admin/Customer không cần chia sẻ payload data-protection với nhau.
        services.AddDataProtection()
            .PersistKeysToDbContext<AppDbContext>()
            .SetApplicationName(dataProtectionApplicationName);

        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICustomerDirectoryService, CustomerDirectoryService>();
        services.AddScoped<IWarehouseDirectoryService, WarehouseDirectoryService>();
        services.AddScoped<IShippingMethodDirectoryService, ShippingMethodDirectoryService>();
        services.AddScoped<IStaffDirectoryService, StaffDirectoryService>();
        services.AddScoped<IFeeBuyProService, FeeBuyProService>();
        services.AddScoped<IUserLevelService, UserLevelService>();
        services.AddScoped<IFeeWeightService, FeeWeightService>();
        services.AddScoped<IFeeCheckProductService, FeeCheckProductService>();
        services.AddScoped<ISystemConfigService, SystemConfigService>();
        services.AddScoped<IBankAccountService, BankAccountService>();
        services.AddScoped<IWalletRechargeService, WalletRechargeService>();
        services.AddScoped<IWalletWithdrawalService, WalletWithdrawalService>();
        services.AddScoped<IMainOrderService, MainOrderService>();

        services.AddSingleton<IAuthorizationPolicyProvider, PermissionPolicyProvider>();
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();

        services.AddValidatorsFromAssemblyContaining<LoginRequestValidator>();

        return services;
    }

    private static IServiceCollection AddOrderChinaIdentity(this IServiceCollection services)
    {
        services
            .AddIdentityCore<ApplicationUser>(options =>
            {
                // Chính sách mật khẩu mạnh — tối thiểu 8 ký tự, đủ 4 loại, hạn chế ký tự lặp.
                options.Password.RequiredLength = 8;
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredUniqueChars = 5;

                // Chống brute-force: khoá 1 phút sau 20 lần sai (đếm tự động qua SignInManager/UserManager).
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(1);
                options.Lockout.MaxFailedAccessAttempts = 20;
                options.Lockout.AllowedForNewUsers = true;

                options.User.RequireUniqueEmail = true;

                // Phase 1 chưa có hạ tầng email — bật lại khi có email service.
                options.SignIn.RequireConfirmedEmail = false;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders()
            .AddSignInManager();

        // Thay PasswordHasher mặc định (PBKDF2) bằng Argon2id — khuyến nghị hàng đầu của OWASP hiện nay.
        services.AddSingleton<IPasswordHasher<ApplicationUser>, Argon2IdPasswordHasher>();

        return services;
    }
}
