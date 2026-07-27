using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddDepositFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "custom_min_deposit_percent",
                table: "users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "deposit_amount",
                table: "main_orders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "min_deposit_percent_applied",
                table: "main_orders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "custom_min_deposit_percent",
                table: "users");

            migrationBuilder.DropColumn(
                name: "deposit_amount",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "min_deposit_percent_applied",
                table: "main_orders");
        }
    }
}
