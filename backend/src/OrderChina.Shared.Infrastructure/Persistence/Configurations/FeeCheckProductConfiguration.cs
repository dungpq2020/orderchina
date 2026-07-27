using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class FeeCheckProductConfiguration : IEntityTypeConfiguration<FeeCheckProduct>
{
    public void Configure(EntityTypeBuilder<FeeCheckProduct> builder)
    {
        builder.ToTable("fee_check_products");

        builder.Property(f => f.PriceTier)
            .HasConversion<int>()
            .IsRequired();
    }
}
