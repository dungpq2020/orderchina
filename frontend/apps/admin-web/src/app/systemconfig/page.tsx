import type { Metadata } from "next";
import SystemConfigPage from "@/components/SystemConfigPage";

export const metadata: Metadata = {
  title: "Hệ thống",
};

export default function SystemConfigRoute() {
  return (
    <SystemConfigPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
