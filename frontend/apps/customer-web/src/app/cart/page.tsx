import type { Metadata } from "next";
import CartPage from "@/components/CartPage";

export const metadata: Metadata = {
  title: "Giỏ hàng",
};

export default function CartRoute() {
  return (
    <CartPage
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
