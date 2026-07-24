using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Warehouses;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class WarehouseConfiguration : IEntityTypeConfiguration<Warehouse>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("warehouses");

        builder.Property(w => w.Name)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(w => w.Type)
            .HasConversion<int>()
            .IsRequired();
    }
}
