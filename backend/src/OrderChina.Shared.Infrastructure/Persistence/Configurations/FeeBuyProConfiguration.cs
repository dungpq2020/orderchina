using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Fees;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class FeeBuyProConfiguration : IEntityTypeConfiguration<FeeBuyPro>
{
    public void Configure(EntityTypeBuilder<FeeBuyPro> builder)
    {
        builder.ToTable("fee_buy_pros");
    }
}
