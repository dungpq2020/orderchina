import type { Metadata } from "next";
import TransactionsPage from "@/components/TransactionsPage";

export const metadata: Metadata = {
  title: "Lịch sử giao dịch",
};

export default function TransactionsRoute() {
  return (
    <TransactionsPage
      customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
      loginUrl="/login"
    />
  );
}
