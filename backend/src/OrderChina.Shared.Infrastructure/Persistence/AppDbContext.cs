using Microsoft.AspNetCore.DataProtection.EntityFrameworkCore;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Fees;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Domain.Orders;
using OrderChina.Shared.Domain.Shipping;
using OrderChina.Shared.Domain.Wallets;
using OrderChina.Shared.Domain.Warehouses;

namespace OrderChina.Shared.Infrastructure.Persistence;

/// <summary>
/// Kế thừa IdentityUserContext (KHÔNG có Role/UserRole/RoleClaim) vì phân quyền chi tiết
/// dùng model UserGroup/PermitObject/Permission riêng, không dùng Identity Role.
/// </summary>
public class AppDbContext : IdentityUserContext<ApplicationUser, Guid>, IDataProtectionKeyContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<UserGroup> UserGroups => Set<UserGroup>();
    public DbSet<PermitObject> PermitObjects => Set<PermitObject>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserGroupPermission> UserGroupPermissions => Set<UserGroupPermission>();
    public DbSet<UserGroupMembership> UserGroupMemberships => Set<UserGroupMembership>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<LoginAuditLog> LoginAuditLogs => Set<LoginAuditLog>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<ShippingMethod> ShippingMethods => Set<ShippingMethod>();
    public DbSet<FeeBuyPro> FeeBuyPros => Set<FeeBuyPro>();
    public DbSet<UserLevel> UserLevels => Set<UserLevel>();
    public DbSet<FeeWeight> FeeWeights => Set<FeeWeight>();
    public DbSet<FeeCheckProduct> FeeCheckProducts => Set<FeeCheckProduct>();
    public DbSet<SystemConfig> SystemConfigs => Set<SystemConfig>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<WalletRecharge> WalletRecharges => Set<WalletRecharge>();
    public DbSet<WalletTransaction> WalletTransactions => Set<WalletTransaction>();
    public DbSet<WalletWithdrawal> WalletWithdrawals => Set<WalletWithdrawal>();
    public DbSet<MainOrder> MainOrders => Set<MainOrder>();
    public DbSet<MainOrderProduct> MainOrderProducts => Set<MainOrderProduct>();
    public DbSet<MainOrderPaymentHistory> MainOrderPaymentHistories => Set<MainOrderPaymentHistory>();

    public DbSet<Microsoft.AspNetCore.DataProtection.EntityFrameworkCore.DataProtectionKey> DataProtectionKeys => Set<Microsoft.AspNetCore.DataProtection.EntityFrameworkCore.DataProtectionKey>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
