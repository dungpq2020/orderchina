using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMainOrderWarehouseAndServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "check_product_fee_amount",
                table: "main_orders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "china_warehouse_id",
                table: "main_orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "insurance_fee_amount",
                table: "main_orders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "request_check_product",
                table: "main_orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_home_delivery",
                table: "main_orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_insurance",
                table: "main_orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "request_packaging",
                table: "main_orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "shipping_method_id",
                table: "main_orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "vietnam_warehouse_id",
                table: "main_orders",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "check_product_fee_amount",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "china_warehouse_id",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "insurance_fee_amount",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "request_check_product",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "request_home_delivery",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "request_insurance",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "request_packaging",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "shipping_method_id",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "vietnam_warehouse_id",
                table: "main_orders");
        }
    }
}
