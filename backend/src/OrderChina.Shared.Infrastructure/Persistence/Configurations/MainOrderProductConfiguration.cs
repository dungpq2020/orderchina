using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderProductConfiguration : IEntityTypeConfiguration<MainOrderProduct>
{
    public void Configure(EntityTypeBuilder<MainOrderProduct> builder)
    {
        builder.ToTable("main_order_products");

        builder.Property(p => p.ImageUrl).HasMaxLength(500);
        builder.Property(p => p.ProductLink).HasMaxLength(2000);
        builder.Property(p => p.ProductName).HasMaxLength(500).IsRequired();
        builder.Property(p => p.Attributes).HasMaxLength(500);
        builder.Property(p => p.Note).HasMaxLength(500);

        builder.HasIndex(p => p.MainOrderId);
    }
}
