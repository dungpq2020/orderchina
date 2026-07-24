using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Shipping;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class ShippingMethodConfiguration : IEntityTypeConfiguration<ShippingMethod>
{
    public void Configure(EntityTypeBuilder<ShippingMethod> builder)
    {
        builder.ToTable("shipping_methods");

        builder.Property(s => s.Name)
            .HasMaxLength(256)
            .IsRequired();
    }
}
