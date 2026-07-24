using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class UserGroupPermissionConfiguration : IEntityTypeConfiguration<UserGroupPermission>
{
    public void Configure(EntityTypeBuilder<UserGroupPermission> builder)
    {
        builder.ToTable("user_group_permissions");

        builder.HasIndex(x => new { x.UserGroupId, x.PermitObjectId, x.PermissionId }).IsUnique();

        builder.HasOne(x => x.UserGroup)
            .WithMany(g => g.UserGroupPermissions)
            .HasForeignKey(x => x.UserGroupId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.PermitObject)
            .WithMany(p => p.UserGroupPermissions)
            .HasForeignKey(x => x.PermitObjectId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Permission)
            .WithMany(p => p.UserGroupPermissions)
            .HasForeignKey(x => x.PermissionId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
