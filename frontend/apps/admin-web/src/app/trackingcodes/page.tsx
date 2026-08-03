import type { Metadata } from "next";
import TrackingCodeListPage from "@/components/TrackingCodeListPage";

export const metadata: Metadata = {
  title: "Quản lý mã vận đơn",
};

export default function TrackingCodesRoute() {
  return (
    <TrackingCodeListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
