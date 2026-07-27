using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace OrderChina.Shared.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddMainOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "main_orders",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_code = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    order_number = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityAlwaysColumn),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    order_type = table.Column<int>(type: "integer", nullable: false),
                    exchange_rate_applied = table.Column<decimal>(type: "numeric", nullable: false),
                    product_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    purchase_fee_percent_applied = table.Column<decimal>(type: "numeric", nullable: false),
                    purchase_fee_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    shipping_fee_cn = table.Column<decimal>(type: "numeric", nullable: false),
                    shipping_fee_vn = table.Column<decimal>(type: "numeric", nullable: false),
                    total_amount = table.Column<decimal>(type: "numeric", nullable: false),
                    status = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    created_by_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    updated_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_by_user_id = table.Column<Guid>(type: "uuid", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_main_orders", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "main_order_products",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    main_order_id = table.Column<Guid>(type: "uuid", nullable: false),
                    image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    product_link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    product_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    attributes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    unit_price_cny = table.Column<decimal>(type: "numeric", nullable: false),
                    quantity = table.Column<int>(type: "integer", nullable: false),
                    note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at_utc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_main_order_products", x => x.id);
                    table.ForeignKey(
                        name: "fk_main_order_products_main_orders_main_order_id",
                        column: x => x.main_order_id,
                        principalTable: "main_orders",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_main_order_products_main_order_id",
                table: "main_order_products",
                column: "main_order_id");

            migrationBuilder.CreateIndex(
                name: "ix_main_orders_order_code",
                table: "main_orders",
                column: "order_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_main_orders_order_number",
                table: "main_orders",
                column: "order_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_main_orders_user_id",
                table: "main_orders",
                column: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "main_order_products");

            migrationBuilder.DropTable(
                name: "main_orders");
        }
    }
}
