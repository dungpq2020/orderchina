using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWalletRechargeAndTransaction : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "wallet_recharges",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    bank_account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wallet_recharges", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "wallet_transactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    amount = table.Column<decimal>(type: "numeric", nullable: false),
                    balance_after = table.Column<decimal>(type: "numeric", nullable: false),
                    type = table.Column<int>(type: "integer", nullable: false),
                    reference_id = table.Column<Guid>(type: "uuid", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_wallet_transactions", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_wallet_recharges_user_id",
                table: "wallet_recharges",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "ix_wallet_transactions_user_id",
                table: "wallet_transactions",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "wallet_recharges");

            migrationBuilder.DropTable(
                name: "wallet_transactions");
        }
    }
}
