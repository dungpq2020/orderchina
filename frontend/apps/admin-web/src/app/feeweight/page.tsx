import type { Metadata } from "next";
import FeeWeightListPage from "@/components/FeeWeightListPage";

export const metadata: Metadata = {
  title: "Phí vận chuyển",
};

export default function FeeWeightRoute() {
  return (
    <FeeWeightListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
