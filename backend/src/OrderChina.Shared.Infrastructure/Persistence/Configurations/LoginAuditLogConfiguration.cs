using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class LoginAuditLogConfiguration : IEntityTypeConfiguration<LoginAuditLog>
{
    public void Configure(EntityTypeBuilder<LoginAuditLog> builder)
    {
        builder.ToTable("login_audit_logs");

        builder.Property(l => l.Username)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(l => l.Audience)
            .HasConversion<int>()
            .IsRequired();

        builder.HasIndex(l => new { l.Username, l.CreatedAtUtc });
    }
}
