import type { Metadata } from "next";
import AccountPage from "@/components/AccountPage";

export const metadata: Metadata = {
  title: "Tài khoản",
};

export default function AccountRoute() {
  return (
    <AccountPage
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
