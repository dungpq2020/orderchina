import type { Metadata } from "next";
import CreateMainOrderPage from "@/components/CreateMainOrderPage";

export const metadata: Metadata = {
  title: "Tạo đơn thủ công",
};

export default function CreateMainOrderRoute() {
  return (
    <CreateMainOrderPage
      adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
      loginUrl={process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login"}
    />
  );
}
