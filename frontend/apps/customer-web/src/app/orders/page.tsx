import type { Metadata } from "next";
import OrdersPage from "@/components/OrdersPage";

export const metadata: Metadata = {
  title: "Đơn hàng",
};

export default function OrdersRoute() {
  return (
    <OrdersPage
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
