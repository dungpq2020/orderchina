using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderConfiguration : IEntityTypeConfiguration<MainOrder>
{
    public void Configure(EntityTypeBuilder<MainOrder> builder)
    {
        builder.ToTable("main_orders");

        builder.Property(o => o.OrderNumber).UseIdentityAlwaysColumn();
        builder.Property(o => o.OrderCode).HasMaxLength(32).IsRequired();
        builder.Property(o => o.OrderType).HasConversion<int>().IsRequired();
        builder.Property(o => o.CreationType).HasConversion<int>().IsRequired();
        builder.Property(o => o.Status).HasConversion<int>().IsRequired();
        builder.Property(o => o.Note).HasMaxLength(1000);

        builder.HasIndex(o => o.OrderNumber).IsUnique();
        builder.HasIndex(o => o.OrderCode).IsUnique();
        builder.HasIndex(o => o.UserId);

        builder.HasMany(o => o.Products)
            .WithOne()
            .HasForeignKey(p => p.MainOrderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
