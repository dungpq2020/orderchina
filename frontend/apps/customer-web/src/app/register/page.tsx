import type { Metadata } from "next";
import AuthBackground from "@orderchina/ui/components/AuthBackground";
import RegisterForm from "@/components/RegisterForm";

export const metadata: Metadata = {
  title: "Đăng ký",
};

export default function RegisterPage() {
  return (
    <AuthBackground>
      <RegisterForm customerApiBaseUrl={process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? ""} />
    </AuthBackground>
  );
}
