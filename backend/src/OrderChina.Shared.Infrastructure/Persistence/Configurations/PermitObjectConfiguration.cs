using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Auth;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class PermitObjectConfiguration : IEntityTypeConfiguration<PermitObject>
{
    public void Configure(EntityTypeBuilder<PermitObject> builder)
    {
        builder.ToTable("permit_objects");

        builder.Property(p => p.Code)
            .HasMaxLength(128)
            .IsRequired();

        builder.Property(p => p.Name)
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(p => p.Code).IsUnique();
    }
}
