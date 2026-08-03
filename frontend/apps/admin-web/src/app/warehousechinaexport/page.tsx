import type { Metadata } from "next";
import ChinaWarehouseExportPage from "@/components/ChinaWarehouseExportPage";

export const metadata: Metadata = {
  title: "Xuất kho Trung Quốc",
};

export default function WarehouseChinaExportRoute() {
  return (
    <ChinaWarehouseExportPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
