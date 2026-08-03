import type { Metadata } from "next";
import ChinaWarehouseCheckInPage from "@/components/ChinaWarehouseCheckInPage";

export const metadata: Metadata = {
  title: "Kiểm hàng kho Trung Quốc",
};

export default function WarehouseChinaRoute() {
  return (
    <ChinaWarehouseCheckInPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
