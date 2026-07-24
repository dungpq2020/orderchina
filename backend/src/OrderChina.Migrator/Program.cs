using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Identity;
using OrderChina.Shared.Domain.Shipping;
using OrderChina.Shared.Domain.Warehouses;
using OrderChina.Shared.Infrastructure.DependencyInjection;
using OrderChina.Shared.Infrastructure.Persistence;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddSharedInfrastructure(builder.Configuration, dataProtectionApplicationName: "OrderChina.Migrator");

using var host = builder.Build();
using var scope = host.Services.CreateScope();

var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

Console.WriteLine("Applying EF Core migrations...");
await dbContext.Database.MigrateAsync();
Console.WriteLine("Migrations applied successfully.");

await SeedAsync(scope.ServiceProvider, dbContext);
await SeedMasterDataAsync(dbContext);
await SeedStaffAsync(scope.ServiceProvider);
await FixupRolesAsync(dbContext);

static async Task SeedAsync(IServiceProvider services, AppDbContext dbContext)
{
    const string superAdminGroupName = "SuperAdmin";

    var superAdminGroup = await dbContext.UserGroups.FirstOrDefaultAsync(g => g.Name == superAdminGroupName);
    if (superAdminGroup is null)
    {
        superAdminGroup = new UserGroup
        {
            Id = Guid.NewGuid(),
            Name = superAdminGroupName,
            Description = "Toàn quyền hệ thống",
            IsActive = true
        };
        dbContext.UserGroups.Add(superAdminGroup);
        await dbContext.SaveChangesAsync();
        Console.WriteLine($"Đã seed UserGroup '{superAdminGroupName}'.");
    }

    var seedUsername = Environment.GetEnvironmentVariable("SEED_ADMIN_USERNAME");
    var seedEmail = Environment.GetEnvironmentVariable("SEED_ADMIN_EMAIL");
    var seedPassword = Environment.GetEnvironmentVariable("SEED_ADMIN_PASSWORD");

    if (string.IsNullOrWhiteSpace(seedUsername) || string.IsNullOrWhiteSpace(seedEmail) || string.IsNullOrWhiteSpace(seedPassword))
    {
        Console.WriteLine("SEED_ADMIN_USERNAME/SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD chưa được cấu hình đầy đủ — bỏ qua seed tài khoản Staff đầu tiên.");
        return;
    }

    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

    var existingUser = await userManager.FindByNameAsync(seedUsername);
    if (existingUser is not null)
    {
        Console.WriteLine($"Tài khoản Staff '{seedUsername}' đã tồn tại — bỏ qua seed.");
        return;
    }

    var user = new ApplicationUser
    {
        Id = Guid.NewGuid(),
        UserName = seedUsername,
        Email = seedEmail,
        FullName = "Super Admin",
        UserType = UserType.Staff,
        Role = Role.Admin,
        CreatedAtUtc = DateTime.UtcNow,
        EmailConfirmed = true
    };

    var createResult = await userManager.CreateAsync(user, seedPassword);
    if (!createResult.Succeeded)
    {
        var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
        Console.WriteLine($"Seed tài khoản Staff thất bại: {errors}");
        return;
    }

    dbContext.UserGroupMemberships.Add(new UserGroupMembership
    {
        Id = Guid.NewGuid(),
        UserId = user.Id,
        UserGroupId = superAdminGroup.Id,
        AssignedAtUtc = DateTime.UtcNow
    });
    await dbContext.SaveChangesAsync();

    Console.WriteLine($"Đã seed tài khoản Staff đầu tiên: {seedUsername} (thuộc nhóm {superAdminGroupName}).");
}

static async Task SeedMasterDataAsync(AppDbContext dbContext)
{
    if (!await dbContext.Warehouses.AnyAsync())
    {
        dbContext.Warehouses.AddRange(
            new Warehouse { Id = Guid.NewGuid(), Name = "Bằng Tường", Type = WarehouseType.China, IsActive = true },
            new Warehouse { Id = Guid.NewGuid(), Name = "Hà Nội", Type = WarehouseType.Vietnam, IsActive = true });
        await dbContext.SaveChangesAsync();
        Console.WriteLine("Đã seed danh sách Kho Trung Quốc/Việt Nam.");
    }

    if (!await dbContext.ShippingMethods.AnyAsync())
    {
        dbContext.ShippingMethods.Add(
            new ShippingMethod { Id = Guid.NewGuid(), Name = "Line TMĐT", IsActive = true });
        await dbContext.SaveChangesAsync();
        Console.WriteLine("Đã seed danh sách Phương thức vận chuyển.");
    }
}

static async Task SeedStaffAsync(IServiceProvider services)
{
    var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
    const string seedStaffPassword = "Staff@12345678";

    var staffToSeed = new (string Username, string FullName, Role Role)[]
    {
        ("sale1", "Nhân viên Kinh doanh 1", Role.SalesStaff),
        ("sale2", "Nhân viên Kinh doanh 2", Role.SalesStaff),
        ("sale3", "Nhân viên Kinh doanh 3", Role.SalesStaff),
        ("order1", "Nhân viên Đặt hàng 1", Role.PurchasingStaff),
        ("order2", "Nhân viên Đặt hàng 2", Role.PurchasingStaff),
        ("order3", "Nhân viên Đặt hàng 3", Role.PurchasingStaff),
    };

    foreach (var (username, fullName, role) in staffToSeed)
    {
        var existing = await userManager.FindByNameAsync(username);
        if (existing is not null)
        {
            continue;
        }

        var staffUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = username,
            Email = $"{username}@orderchina.internal",
            FullName = fullName,
            UserType = UserType.Staff,
            Role = role,
            CreatedAtUtc = DateTime.UtcNow,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(staffUser, seedStaffPassword);
        if (!createResult.Succeeded)
        {
            var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
            Console.WriteLine($"Seed nhân viên '{username}' thất bại: {errors}");
            continue;
        }

        Console.WriteLine($"Đã seed nhân viên: {username}.");
    }
}

static async Task FixupRolesAsync(AppDbContext dbContext)
{
    // Backfill Role cho các tài khoản đã tạo trước khi cột Role tồn tại (mặc định về Customer).
    var fixups = new (string Username, Role Role)[]
    {
        ("sale1", Role.SalesStaff),
        ("sale2", Role.SalesStaff),
        ("sale3", Role.SalesStaff),
        ("order1", Role.PurchasingStaff),
        ("order2", Role.PurchasingStaff),
        ("order3", Role.PurchasingStaff),
    };

    var seedAdminUsername = Environment.GetEnvironmentVariable("SEED_ADMIN_USERNAME");
    if (!string.IsNullOrWhiteSpace(seedAdminUsername))
    {
        fixups = fixups.Append((seedAdminUsername, Role.Admin)).ToArray();
    }

    var changed = false;
    foreach (var (username, role) in fixups)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.UserName == username);
        if (user is not null && user.Role != role)
        {
            user.Role = role;
            changed = true;
        }
    }

    if (changed)
    {
        await dbContext.SaveChangesAsync();
        Console.WriteLine("Đã cập nhật Role cho các tài khoản Staff đã tồn tại.");
    }
}
