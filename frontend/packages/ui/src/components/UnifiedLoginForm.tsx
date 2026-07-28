"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import logo from "../assets/logo.png";
import PasswordInput from "./PasswordInput";

const REMEMBERED_LOGIN_STORAGE_KEY = "orderchina.rememberedLogin";

interface RememberedLogin {
  username: string;
  password: string;
}

function readRememberedLogin(): RememberedLogin | null {
  try {
    const raw = window.localStorage.getItem(REMEMBERED_LOGIN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RememberedLogin) : null;
  } catch {
    return null;
  }
}

interface UnifiedLoginFormProps {
  customerApiBaseUrl: string;
  adminApiBaseUrl: string;
  /** Trang danh sách khách hàng của admin-web — điều hướng sang đây khi đăng nhập tài khoản nhân viên thành công. */
  adminUserListUrl: string;
  /** Trang dashboard của customer-web — điều hướng sang đây khi đăng nhập tài khoản khách hàng thành công. */
  customerDashboardUrl: string;
}

interface LoginSuccess {
  accessToken: string;
  expiresAtUtc: string;
}

interface LoginErrorBody {
  error?: string;
  requiresTwoFactor?: boolean;
}

type LoginAttemptResult =
  | { kind: "success"; data: LoginSuccess }
  | { kind: "locked" | "requires2fa"; error: string }
  | { kind: "rejected"; error: string };

async function attemptLogin(
  apiBaseUrl: string,
  username: string,
  password: string,
  twoFactorCode: string,
): Promise<LoginAttemptResult> {
  const res = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username, password, twoFactorCode: twoFactorCode || null }),
  });

  if (res.ok) {
    return { kind: "success", data: (await res.json()) as LoginSuccess };
  }

  const data = (await res.json().catch(() => ({}))) as LoginErrorBody;

  if (res.status === 423) {
    return data.requiresTwoFactor
      ? { kind: "requires2fa", error: data.error ?? "Cần mã xác thực 2 lớp." }
      : { kind: "locked", error: data.error ?? "Tài khoản bị khoá." };
  }

  return { kind: "rejected", error: data.error ?? "Đăng nhập thất bại." };
}

/**
 * 1 giao diện, 1 URL login duy nhất (/login) dùng chung cho cả nhân viên và khách hàng —
 * username là duy nhất trên toàn hệ thống (chung 1 bảng users) nên chỉ có thể khớp đúng 1 trong 2:
 * thử CustomerApi trước, nếu bị từ chối chung chung (không phải locked/2FA — tức tài khoản này
 * không thuộc Customer) mới thử tiếp AdminApi.
 *
 * Đăng nhập thành công (cả nhân viên lẫn khách hàng) -> điều hướng full-page sang trang tương ứng
 * (admin-web hoặc dashboard customer-web) — trang đó tự refresh bằng cookie, không cần truyền access
 * token qua URL.
 */
export default function UnifiedLoginForm({
  customerApiBaseUrl,
  adminApiBaseUrl,
  adminUserListUrl,
  customerDashboardUrl,
}: UnifiedLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ accountType: "customer" | "admin"; data: LoginSuccess } | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Chỉ đọc localStorage sau khi mount (tránh lệch nội dung server-render/client-render của Next.js).
  useEffect(() => {
    const remembered = readRememberedLogin();
    if (remembered) {
      setUsername(remembered.username);
      setPassword(remembered.password);
      setRememberMe(true);
    }
  }, []);

  function persistRememberedLogin() {
    if (rememberMe) {
      window.localStorage.setItem(
        REMEMBERED_LOGIN_STORAGE_KEY,
        JSON.stringify({ username, password } satisfies RememberedLogin),
      );
    } else {
      window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const customerResult = await attemptLogin(customerApiBaseUrl, username, password, twoFactorCode);

      if (customerResult.kind === "success") {
        persistRememberedLogin();
        setResult({ accountType: "customer", data: customerResult.data });
        setRedirecting(true);
        window.location.href = customerDashboardUrl;
        return;
      }

      if (customerResult.kind === "locked" || customerResult.kind === "requires2fa") {
        setRequiresTwoFactor(customerResult.kind === "requires2fa");
        setError(customerResult.error);
        return;
      }

      // customerResult.kind === "rejected" -> có thể là tài khoản Staff, thử tiếp AdminApi.
      const adminResult = await attemptLogin(adminApiBaseUrl, username, password, twoFactorCode);

      if (adminResult.kind === "success") {
        persistRememberedLogin();
        setResult({ accountType: "admin", data: adminResult.data });
        setRedirecting(true);
        window.location.href = adminUserListUrl;
        return;
      }

      if (adminResult.kind === "locked" || adminResult.kind === "requires2fa") {
        setRequiresTwoFactor(adminResult.kind === "requires2fa");
        setError(adminResult.error);
        return;
      }

      setError("Username hoặc mật khẩu không đúng.");
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  if (result && redirecting) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-green-200 bg-green-50 p-6 text-sm">
        <p className="font-medium text-green-800">
          Đăng nhập thành công — đang chuyển sang {result.accountType === "admin" ? "trang quản trị" : "trang chủ"}...
        </p>
      </div>
    );
  }

  const inputClasses =
    "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10"
    >
      {/* Dải màu thương hiệu (xanh -> cam theo logo) làm điểm nhấn phía trên card */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-orange-500" />

      <div className="space-y-6 p-8">
        <div className="flex justify-center">
          {/* Logo có chữ tối màu, luôn đặt trên nền trắng riêng để đọc được kể cả ở dark mode */}
          <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
            <Image src={logo} alt="Logo" priority className="h-10 w-auto" />
          </div>
        </div>

        <h1 className="text-center text-lg font-semibold text-zinc-900">
          Đăng nhập
        </h1>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600">
              Tài khoản
            </label>
            <input
              className={inputClasses}
              value={username}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setUsername(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập tài khoản")}
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600">
              Mật khẩu
            </label>
            <PasswordInput
              className={inputClasses}
              value={password}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setPassword(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập mật khẩu")}
              autoComplete="current-password"
              required
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500/30"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            Lưu tài khoản
          </label>

          {requiresTwoFactor && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-600">
                Mã xác thực 2 lớp
              </label>
              <input
                className={inputClasses}
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value)}
              />
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/30 transition hover:shadow-md hover:shadow-blue-600/40 disabled:opacity-50"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <div className="flex items-center justify-between text-sm">
          <Link href="/register" className="font-medium text-blue-600 hover:underline">
            Đăng ký tài khoản
          </Link>
          <Link href="/forgot-password" className="text-zinc-500 hover:underline">
            Quên mật khẩu
          </Link>
        </div>
      </div>
    </form>
  );
}
