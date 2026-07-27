import type { Metadata } from "next";
import WalletWithdrawalRequestListPage from "@/components/WalletWithdrawalRequestListPage";

export const metadata: Metadata = {
  title: "Yêu cầu rút ví",
};

export default function WalletWithdrawalRequestRoute() {
  return (
    <WalletWithdrawalRequestListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
