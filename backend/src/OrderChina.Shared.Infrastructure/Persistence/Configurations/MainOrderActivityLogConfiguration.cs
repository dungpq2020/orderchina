using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class MainOrderActivityLogConfiguration : IEntityTypeConfiguration<MainOrderActivityLog>
{
    public void Configure(EntityTypeBuilder<MainOrderActivityLog> builder)
    {
        builder.ToTable("main_order_activity_logs");

        builder.Property(a => a.Description).HasMaxLength(500).IsRequired();

        builder.HasIndex(a => a.MainOrderId);
    }
}
