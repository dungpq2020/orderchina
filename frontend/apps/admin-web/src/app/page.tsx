import { redirect } from "next/navigation";

export default function Home() {
  // Login dùng chung 1 giao diện/1 URL duy nhất (/login, đặt ở customer-web vì là app gốc
  // domain) — admin-web không còn form login riêng, chỉ redirect người chưa đăng nhập sang đó.
  redirect(process.env.NEXT_PUBLIC_LOGIN_URL ?? "/login");
}
