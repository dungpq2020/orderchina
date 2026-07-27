using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using OrderChina.Shared.Domain.Wallets;

namespace OrderChina.Shared.Infrastructure.Persistence.Configurations;

public class WalletWithdrawalConfiguration : IEntityTypeConfiguration<WalletWithdrawal>
{
    public void Configure(EntityTypeBuilder<WalletWithdrawal> builder)
    {
        builder.ToTable("wallet_withdrawals");

        builder.Property(w => w.BankName).HasMaxLength(256);
        builder.Property(w => w.BankAccountNumber).HasMaxLength(64);
        builder.Property(w => w.BankAccountHolderName).HasMaxLength(256);
        builder.Property(w => w.Note).HasMaxLength(500);
        builder.Property(w => w.Status).HasConversion<int>().IsRequired();

        builder.HasIndex(w => w.UserId);
    }
}
