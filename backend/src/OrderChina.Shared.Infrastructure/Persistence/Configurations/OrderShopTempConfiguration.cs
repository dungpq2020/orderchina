using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class OrderShopTempConfiguration : IEntityTypeConfiguration<OrderShopTemp>
{
    public void Configure(EntityTypeBuilder<OrderShopTemp> builder)
    {
        builder.ToTable("order_shop_temps");

        builder.Property(s => s.ShopName).HasMaxLength(500).IsRequired();
        builder.Property(s => s.ShopLink).HasMaxLength(2000);
        builder.Property(s => s.Platform).HasMaxLength(50).IsRequired();

        builder.HasIndex(s => s.UserId);

        builder.HasMany(s => s.Products)
            .WithOne()
            .HasForeignKey(p => p.OrderShopTempId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
