import type { Metadata } from "next";
import AuthBackground from "@orderchina/ui/components/AuthBackground";
import UnifiedLoginForm from "@orderchina/ui/components/UnifiedLoginForm";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

export default function LoginPage() {
  return (
    <AuthBackground>
      <UnifiedLoginForm
        customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""}
        adminApiBaseUrl={process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? ""}
        adminUserListUrl={process.env.NEXT_PUBLIC_ADMIN_USER_LIST_URL ?? "/admin/userlist"}
        customerDashboardUrl="/dashboard"
      />
    </AuthBackground>
  );
}
