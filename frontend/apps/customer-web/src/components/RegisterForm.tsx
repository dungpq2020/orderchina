"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "@orderchina/ui/assets/logo.png";
import PasswordInput from "@orderchina/ui/components/PasswordInput";
import { useState, type FormEvent } from "react";

interface RegisterFormProps {
  customerApiBaseUrl: string;
}

interface RegisterSuccess {
  accessToken: string;
  expiresAtUtc: string;
}

interface RegisterErrorBody {
  error?: string;
  errors?: Record<string, string[]>;
}

const inputClasses =
  "w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-50 dark:focus:border-blue-400 dark:focus:bg-zinc-800";

export default function RegisterForm({ customerApiBaseUrl }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<RegisterSuccess | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${customerApiBaseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, email, fullName, phoneNumber, password }),
      });

      if (res.ok) {
        setSuccess((await res.json()) as RegisterSuccess);
        return;
      }

      const data = (await res.json().catch(() => ({}))) as RegisterErrorBody;
      const firstFieldError = data.errors ? Object.values(data.errors)[0]?.[0] : undefined;
      setError(firstFieldError ?? data.error ?? "Đăng ký thất bại.");
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm rounded-lg border border-green-200 bg-green-50 p-6 text-sm dark:border-green-900 dark:bg-green-950">
        <p className="font-medium text-green-800 dark:text-green-300">Đăng ký thành công</p>
        <p className="mt-2 break-all text-xs text-green-700 dark:text-green-400">
          Access token: {success.accessToken.slice(0, 40)}...
        </p>
        <Link href="/login" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
          Về trang đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/50"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-orange-500" />

      <div className="space-y-6 p-8">
        <div className="flex justify-center">
          <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
            <Image src={logo} alt="Logo" priority className="h-10 w-auto" />
          </div>
        </div>

        <h1 className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-50">Đăng ký tài khoản</h1>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Tài khoản</label>
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
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Họ tên</label>
            <input
              className={inputClasses}
              value={fullName}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setFullName(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập họ tên")}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Email</label>
            <input
              type="email"
              className={inputClasses}
              value={email}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setEmail(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập email hợp lệ")}
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Số điện thoại</label>
            <input
              type="tel"
              className={inputClasses}
              value={phoneNumber}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setPhoneNumber(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập số điện thoại")}
              autoComplete="tel"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Mật khẩu</label>
            <PasswordInput
              className={inputClasses}
              value={password}
              onChange={(e) => {
                e.target.setCustomValidity("");
                setPassword(e.target.value);
              }}
              onInvalid={(e) => e.currentTarget.setCustomValidity("Vui lòng nhập mật khẩu")}
              autoComplete="new-password"
              required
            />
            <p className="text-xs text-zinc-400">Tối thiểu 8 ký tự, gồm hoa, thường, số và ký tự đặc biệt.</p>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/30 transition hover:shadow-md hover:shadow-blue-600/40 disabled:opacity-50"
        >
          {loading ? "Đang đăng ký..." : "Đăng ký"}
        </button>

        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Đã có tài khoản?{" "}
          <Link href="/login" className="font-medium text-blue-600 hover:underline dark:text-blue-400">
            Đăng nhập
          </Link>
        </p>
      </div>
    </form>
  );
}
