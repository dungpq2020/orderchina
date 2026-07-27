using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "china_warehouse_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "custom_exchange_rate",
                table: "users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "custom_purchase_fee_percent",
                table: "users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "custom_volume_fee_per_cbm",
                table: "users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "custom_weight_fee_per_kg",
                table: "users",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "order_staff_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "sales_staff_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "shipping_method_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "tier",
                table: "users",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "vietnam_warehouse_id",
                table: "users",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "wallet_balance",
                table: "users",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "china_warehouse_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "custom_exchange_rate",
                table: "users");

            migrationBuilder.DropColumn(
                name: "custom_purchase_fee_percent",
                table: "users");

            migrationBuilder.DropColumn(
                name: "custom_volume_fee_per_cbm",
                table: "users");

            migrationBuilder.DropColumn(
                name: "custom_weight_fee_per_kg",
                table: "users");

            migrationBuilder.DropColumn(
                name: "order_staff_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "sales_staff_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "shipping_method_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "tier",
                table: "users");

            migrationBuilder.DropColumn(
                name: "vietnam_warehouse_id",
                table: "users");

            migrationBuilder.DropColumn(
                name: "wallet_balance",
                table: "users");
        }
    }
}
