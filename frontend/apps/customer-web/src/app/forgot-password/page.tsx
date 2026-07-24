import type { Metadata } from "next";
import Link from "next/link";
import AuthBackground from "@orderchina/ui/components/AuthBackground";

export const metadata: Metadata = {
  title: "Quên mật khẩu",
};

// Placeholder — backend chưa có hạ tầng gửi email (SMTP/email service) để reset mật khẩu thật.
// Sẽ nối API thật vào đây khi tính năng gửi email được xây dựng.
export default function ForgotPasswordPage() {
  return (
    <AuthBackground>
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-orange-500" />
        <div className="space-y-4 p-8 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">Quên mật khẩu</h1>
          <p className="text-sm text-zinc-500">
            Tính năng khôi phục mật khẩu qua email đang được phát triển. Vui lòng liên hệ bộ phận
            hỗ trợ để được đặt lại mật khẩu trong thời gian này.
          </p>
          <Link href="/login" className="inline-block text-sm font-medium text-blue-600 hover:underline">
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </AuthBackground>
  );
}
