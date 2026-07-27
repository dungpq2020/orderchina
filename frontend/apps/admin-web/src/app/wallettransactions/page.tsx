import type { Metadata } from "next";
import { Suspense } from "react";
import WalletTransactionHistoryPage from "@/components/WalletTransactionHistoryPage";

export const metadata: Metadata = {
  title: "Lịch sử giao dịch",
};

export default function WalletTransactionHistoryRoute() {
  return (
    <Suspense fallback={null}>
      <WalletTransactionHistoryPage
        adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
        loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
      />
    </Suspense>
  );
}
