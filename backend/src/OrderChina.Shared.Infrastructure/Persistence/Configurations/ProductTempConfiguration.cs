using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class ProductTempConfiguration : IEntityTypeConfiguration<ProductTemp>
{
    public void Configure(EntityTypeBuilder<ProductTemp> builder)
    {
        builder.ToTable("product_temps");

        builder.Property(p => p.ImageUrl).HasMaxLength(500);
        builder.Property(p => p.ProductLink).HasMaxLength(2000);
        builder.Property(p => p.ProductName).HasMaxLength(500).IsRequired();
        builder.Property(p => p.Attributes).HasMaxLength(500);
        builder.Property(p => p.Note).HasMaxLength(500);

        builder.HasIndex(p => p.OrderShopTempId);
    }
}
