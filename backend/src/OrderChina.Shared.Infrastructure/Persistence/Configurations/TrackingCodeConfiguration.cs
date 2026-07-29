using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Orders;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class TrackingCodeConfiguration : IEntityTypeConfiguration<TrackingCode>
{
    public void Configure(EntityTypeBuilder<TrackingCode> builder)
    {
        builder.ToTable("tracking_codes");

        builder.Property(t => t.Code).HasMaxLength(100).IsRequired();
        builder.Property(t => t.Status).HasConversion<int>().IsRequired();
        builder.Property(t => t.Note).HasMaxLength(500);

        builder.HasIndex(t => t.MainOrderId);
        builder.HasIndex(t => t.TransportOrderId);
    }
}
