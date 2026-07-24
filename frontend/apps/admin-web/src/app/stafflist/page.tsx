import type { Metadata } from "next";
import StaffListPage from "@/components/StaffListPage";

export const metadata: Metadata = {
  title: "Danh sách nhân viên",
};

export default function StaffListRoute() {
  return (
    <StaffListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
