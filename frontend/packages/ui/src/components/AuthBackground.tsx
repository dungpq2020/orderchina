import type { ReactNode } from "react";

/**
 * Nền dùng chung cho các trang xác thực (login/register/forgot-password) — gradient nhạt
 * theo tông thương hiệu (xanh + cam) + lưới chấm nhẹ tạo texture, theme-aware sáng/tối.
 */
export default function AuthBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-slate-50 to-orange-50 p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          color: "rgb(100 116 139)",
        }}
      />

      <div className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-[70%] -translate-y-1/3 rounded-full bg-blue-500/30 blur-[100px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/2 h-[32rem] w-[32rem] translate-x-[70%] translate-y-1/3 rounded-full bg-orange-500/30 blur-[100px]" />

      <div className="relative z-10 w-full max-w-sm">{children}</div>
    </div>
  );
}
