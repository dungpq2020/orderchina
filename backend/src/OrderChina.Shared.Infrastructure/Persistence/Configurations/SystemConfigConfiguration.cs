using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class SystemConfigConfiguration : IEntityTypeConfiguration<SystemConfig>
{
    public void Configure(EntityTypeBuilder<SystemConfig> builder)
    {
        builder.ToTable("system_configs");

        builder.Property(c => c.WebsiteName)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(c => c.Address).HasMaxLength(500);
        builder.Property(c => c.PhoneNumber).HasMaxLength(50);
        builder.Property(c => c.ContactEmail).HasMaxLength(256);
        builder.Property(c => c.ChromeToolUrl).HasMaxLength(1000);
    }
}
