using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class UserGroupMembershipConfiguration : IEntityTypeConfiguration<UserGroupMembership>
{
    public void Configure(EntityTypeBuilder<UserGroupMembership> builder)
    {
        builder.ToTable("user_group_memberships");

        builder.HasIndex(x => new { x.UserId, x.UserGroupId }).IsUnique();

        builder.HasOne(x => x.User)
            .WithMany()
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.UserGroup)
            .WithMany(g => g.Memberships)
            .HasForeignKey(x => x.UserGroupId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
