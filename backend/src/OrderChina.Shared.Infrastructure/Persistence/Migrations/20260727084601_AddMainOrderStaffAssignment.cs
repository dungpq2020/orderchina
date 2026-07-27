using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMainOrderStaffAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "order_staff_id",
                table: "main_orders",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "sales_staff_id",
                table: "main_orders",
                type: "uuid",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "order_staff_id",
                table: "main_orders");

            migrationBuilder.DropColumn(
                name: "sales_staff_id",
                table: "main_orders");
        }
    }
}
