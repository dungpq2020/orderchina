"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import CustomerSidebar from "./CustomerSidebar";
import CustomerTopbar from "./CustomerTopbar";

interface CustomerLayoutProps {
  title: string;
  fullName: string | null;
  username: string;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
  onLogout: () => void;
  children: (onComingSoon: (label: string) => void) => React.ReactNode;
}

export default function CustomerLayout({
  title,
  fullName,
  username,
  walletBalance,
  exchangeRate,
  hotline,
  onLogout,
  children,
}: CustomerLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showComingSoon(label: string) {
    setToast(`${label} — sắp có, đang phát triển.`);
    setTimeout(() => setToast(null), 2000);
  }

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {toast && (
        <div className="fixed right-6 top-6 z-50 rounded-lg bg-zinc-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <CustomerSidebar
        currentPath={pathname ?? ""}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onComingSoon={showComingSoon}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <CustomerTopbar
          title={title}
          fullName={fullName}
          username={username}
          walletBalance={walletBalance}
          exchangeRate={exchangeRate}
          hotline={hotline}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onComingSoon={showComingSoon}
          onLogout={onLogout}
        />
        <main className="flex-1 p-6">{children(showComingSoon)}</main>
      </div>
    </div>
  );
}
