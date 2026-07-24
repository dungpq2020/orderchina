"use client";

import { useState, type FormEvent } from "react";

interface UnifiedLoginFormProps {
  customerApiBaseUrl: string;
  adminApiBaseUrl: string;
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
 * 1 giao diện, 1 URL login duy nhất (/authen/login) dùng chung cho cả nhân viên và khách hàng —
 * username là duy nhất trên toàn hệ thống (chung 1 bảng users) nên chỉ có thể khớp đúng 1 trong 2:
 * thử CustomerApi trước, nếu bị từ chối chung chung (không phải locked/2FA — tức tài khoản này
 * không thuộc Customer) mới thử tiếp AdminApi.
 *
 * Chưa điều hướng sang admin-web/customer-web sau khi đăng nhập vì 2 app đó chưa có trang
 * dashboard thật (root hiện chỉ redirect ngược lại /authen/login) — điều hướng lúc này sẽ tạo
 * vòng lặp. Kết quả hiển thị ngay tại đây; việc điều hướng sẽ nối vào khi có trang đích thật.
 */
export default function UnifiedLoginForm({ customerApiBaseUrl, adminApiBaseUrl }: UnifiedLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ accountType: "customer" | "admin"; data: LoginSuccess } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const customerResult = await attemptLogin(customerApiBaseUrl, username, password, twoFactorCode);

      if (customerResult.kind === "success") {
        setResult({ accountType: "customer", data: customerResult.data });
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
        setResult({ accountType: "admin", data: adminResult.data });
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

  if (result) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-green-200 bg-green-50 p-6 text-sm dark:border-green-900 dark:bg-green-950">
        <p className="font-medium text-green-800 dark:text-green-300">
          Đăng nhập thành công ({result.accountType === "admin" ? "tài khoản nhân viên" : "tài khoản khách hàng"})
        </p>
        <p className="mt-2 break-all text-xs text-green-700 dark:text-green-400">
          Access token: {result.data.accessToken.slice(0, 40)}...
        </p>
        <p className="mt-1 text-xs text-green-700 dark:text-green-400">
          Hết hạn lúc: {new Date(result.data.expiresAtUtc).toLocaleString()}
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        OrderChina — Đăng nhập
      </h1>

      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Username
        </label>
        <input
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Mật khẩu
        </label>
        <input
          type="password"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {requiresTwoFactor && (
        <div className="space-y-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Mã xác thực 2 lớp
          </label>
          <input
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
          />
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>
    </form>
  );
}
