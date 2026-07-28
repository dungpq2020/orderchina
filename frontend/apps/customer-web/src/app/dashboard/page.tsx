import type { Metadata } from "next";
import DashboardPage from "@/components/DashboardPage";

export const metadata: Metadata = {
  title: "Bảng điều khiển",
};

export default function DashboardRoute() {
  return (
    <DashboardPage
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
