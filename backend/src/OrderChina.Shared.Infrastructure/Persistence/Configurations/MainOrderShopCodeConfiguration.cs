using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderShopCodeConfiguration : IEntityTypeConfiguration<MainOrderShopCode>
{
    public void Configure(EntityTypeBuilder<MainOrderShopCode> builder)
    {
        builder.ToTable("main_order_shop_codes");

        builder.Property(s => s.Code).HasMaxLength(100).IsRequired();

        builder.HasIndex(s => s.MainOrderId);
    }
}
