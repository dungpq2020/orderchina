import type { Metadata } from "next";
import BankAccountListPage from "@/components/BankAccountListPage";

export const metadata: Metadata = {
  title: "Danh sách ngân hàng",
};

export default function BankAccountRoute() {
  return (
    <BankAccountListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
