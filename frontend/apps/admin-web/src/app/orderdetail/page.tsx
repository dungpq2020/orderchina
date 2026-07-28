import { Suspense } from "react";
import type { Metadata } from "next";
import OrderDetailPage from "@/components/OrderDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng mua hộ",
};

export default function OrderDetailRoute() {
  return (
    <Suspense fallback={null}>
      <OrderDetailPage
        adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
        loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
      />
    </Suspense>
  );
}
