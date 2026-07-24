using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using OrderChina.Shared.Domain.Auth;
using OrderChina.Shared.Domain.Identity;
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
