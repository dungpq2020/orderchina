using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddWarehouseAddressAndAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "address",
                table: "warehouses",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at_utc",
                table: "warehouses",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<Guid>(
                name: "created_by_user_id",
                table: "warehouses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at_utc",
                table: "warehouses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "updated_by_user_id",
                table: "warehouses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "created_at_utc",
                table: "shipping_methods",
                type: "timestamp with time zone",
                nullable: false,
                defaultValueSql: "now()");

            migrationBuilder.AddColumn<Guid>(
                name: "created_by_user_id",
                table: "shipping_methods",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "updated_at_utc",
                table: "shipping_methods",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "updated_by_user_id",
                table: "shipping_methods",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "address",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "created_at_utc",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "updated_at_utc",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "warehouses");

            migrationBuilder.DropColumn(
                name: "created_at_utc",
                table: "shipping_methods");

            migrationBuilder.DropColumn(
                name: "created_by_user_id",
                table: "shipping_methods");

            migrationBuilder.DropColumn(
                name: "updated_at_utc",
                table: "shipping_methods");

            migrationBuilder.DropColumn(
                name: "updated_by_user_id",
                table: "shipping_methods");
        }
    }
}
