using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Identity;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("users");

        builder.Property(u => u.FullName)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(u => u.UserType)
            .HasConversion<int>()
            .IsRequired();
    }
}
