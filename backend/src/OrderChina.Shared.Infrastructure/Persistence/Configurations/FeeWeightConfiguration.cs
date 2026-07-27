using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class FeeWeightConfiguration : IEntityTypeConfiguration<FeeWeight>
{
    public void Configure(EntityTypeBuilder<FeeWeight> builder)
    {
        builder.ToTable("fee_weights");

        builder.Property(f => f.OrderType)
            .HasConversion<int>()
            .IsRequired();
    }
}
