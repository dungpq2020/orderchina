import type { Metadata } from "next";
import OrdersListPage from "@/components/OrdersListPage";

export const metadata: Metadata = {
  title: "Đơn hàng mua hộ",
};

export default function OrdersRoute() {
  return (
    <OrdersListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
