import type { Metadata } from "next";
import WarehouseTransportPage from "@/components/WarehouseTransportPage";

export const metadata: Metadata = {
  title: "Kho vận chuyển",
};

export default function WarehouseTransportRoute() {
  return (
    <WarehouseTransportPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
