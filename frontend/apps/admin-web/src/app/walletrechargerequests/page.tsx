import type { Metadata } from "next";
import WalletRechargeRequestListPage from "@/components/WalletRechargeRequestListPage";

export const metadata: Metadata = {
  title: "Yêu cầu nạp ví",
};

export default function WalletRechargeRequestRoute() {
  return (
    <WalletRechargeRequestListPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
