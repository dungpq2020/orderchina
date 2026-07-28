using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderPaymentHistoryConfiguration : IEntityTypeConfiguration<MainOrderPaymentHistory>
{
    public void Configure(EntityTypeBuilder<MainOrderPaymentHistory> builder)
    {
        builder.ToTable("main_order_payment_histories");

        builder.Property(p => p.Type).HasConversion<int>().IsRequired();
        builder.Property(p => p.Method).HasConversion<int>().IsRequired();

        builder.HasIndex(p => p.MainOrderId);
    }
}
