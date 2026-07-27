using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletWithdrawal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wallet_withdrawals",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    bank_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    bank_account_number = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    bank_account_holder_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    approved_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    approved_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wallet_withdrawals", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wallet_withdrawals_user_id",
                table: "wallet_withdrawals",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wallet_withdrawals");
        }
    }
}
