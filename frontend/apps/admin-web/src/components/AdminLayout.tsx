"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

interface AdminLayoutProps {
  title: string;
  adminApiBaseUrl: string;
  accessToken: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export default function AdminLayout({ title, adminApiBaseUrl, accessToken, onLogout, children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <AdminSidebar
        currentPath={pathname ?? ""}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={title}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
