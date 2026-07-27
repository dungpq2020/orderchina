using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddSystemConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "system_configs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    website_name = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    address = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    phone_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    contact_email = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                    chrome_tool_url = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    purchase_exchange_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    consignment_exchange_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    payment_exchange_rate = table.Column<decimal>(type: "numeric", nullable: false),
                    min_purchase_fee = table.Column<decimal>(type: "numeric", nullable: false),
                    purchase_insurance_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    max_links_per_order = table.Column<int>(type: "integer", nullable: false),
                    cart_auto_delete_days = table.Column<int>(type: "integer", nullable: false),
                    sales_commission_purchase_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    purchasing_staff_commission_purchase_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    sales_commission_consignment_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    sales_commission_payment_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_system_configs", x => x.id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "system_configs");
        }
    }
}
