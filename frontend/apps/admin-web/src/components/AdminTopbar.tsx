"use client";

import { useEffect, useState } from "react";

interface AdminTopbarProps {
  title: string;
  adminApiBaseUrl: string;
  accessToken: string;
  onOpenMobileMenu: () => void;
}

export default function AdminTopbar({ title, adminApiBaseUrl, accessToken, onOpenMobileMenu }: AdminTopbarProps) {
  const [purchaseExchangeRate, setPurchaseExchangeRate] = useState<number | null>(null);

  useEffect(() => {
    fetch(`${adminApiBaseUrl}/system-config`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : null))
      .then((config: { purchaseExchangeRate: number } | null) => {
        if (config) setPurchaseExchangeRate(config.purchaseExchangeRate);
      })
      .catch(() => {});
  }, [adminApiBaseUrl, accessToken]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 lg:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
        </button>
        <h1 className="text-sm font-semibold text-zinc-900">{title}</h1>
      </div>

      {purchaseExchangeRate !== null && (
        <p className="text-sm text-zinc-700">
          Tỉ giá:{" "}
          <span className="font-semibold text-orange-600">
            1¥ = {purchaseExchangeRate.toLocaleString("vi-VN")} VNĐ
          </span>
        </p>
      )}
    </header>
  );
}
