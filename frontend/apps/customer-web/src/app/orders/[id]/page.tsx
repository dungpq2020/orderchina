import type { Metadata } from "next";
import OrderDetailPage from "@/components/OrderDetailPage";

export const metadata: Metadata = {
  title: "Chi tiết đơn hàng",
};

export default async function OrderDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <OrderDetailPage
      orderId={id}
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
