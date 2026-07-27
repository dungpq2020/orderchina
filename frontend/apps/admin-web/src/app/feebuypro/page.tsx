import type { Metadata } from "next";
import FeeBuyProListPage from "@/components/FeeBuyProListPage";

export const metadata: Metadata = {
  title: "Phí mua hàng",
};

export default function FeeBuyProRoute() {
  return (
    <FeeBuyProListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
