using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class UserLevelConfiguration : IEntityTypeConfiguration<UserLevel>
{
    public void Configure(EntityTypeBuilder<UserLevel> builder)
    {
        builder.ToTable("user_levels");

        builder.Property(l => l.Name)
            .HasMaxLength(100)
            .IsRequired();

        builder.HasIndex(l => l.Rank).IsUnique();
    }
}
