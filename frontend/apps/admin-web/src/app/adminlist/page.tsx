import type { Metadata } from "next";
import AdminListPage from "@/components/AdminListPage";

export const metadata: Metadata = {
  title: "Danh sách admin",
};

export default function AdminListRoute() {
  return (
    <AdminListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
