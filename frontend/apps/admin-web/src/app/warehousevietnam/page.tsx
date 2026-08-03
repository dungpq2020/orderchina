import type { Metadata } from "next";
import VietnamWarehouseCheckInPage from "@/components/VietnamWarehouseCheckInPage";

export const metadata: Metadata = {
  title: "Kiểm kho Việt Nam",
};

export default function WarehouseVietnamRoute() {
  return (
    <VietnamWarehouseCheckInPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
