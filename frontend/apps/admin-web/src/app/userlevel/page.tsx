import type { Metadata } from "next";
import UserLevelListPage from "@/components/UserLevelListPage";

export const metadata: Metadata = {
  title: "Ưu đãi khách",
};

export default function UserLevelRoute() {
  return (
    <UserLevelListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
