using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class UserGroupConfiguration : IEntityTypeConfiguration<UserGroup>
{
    public void Configure(EntityTypeBuilder<UserGroup> builder)
    {
        builder.ToTable("user_groups");

        builder.Property(g => g.Name)
            .HasMaxLength(128)
            .IsRequired();

        builder.HasIndex(g => g.Name).IsUnique();
    }
}
