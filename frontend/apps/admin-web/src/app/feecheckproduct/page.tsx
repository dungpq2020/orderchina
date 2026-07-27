import type { Metadata } from "next";
import FeeCheckProductListPage from "@/components/FeeCheckProductListPage";

export const metadata: Metadata = {
  title: "Phí kiểm hàng",
};

export default function FeeCheckProductRoute() {
  return (
    <FeeCheckProductListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
