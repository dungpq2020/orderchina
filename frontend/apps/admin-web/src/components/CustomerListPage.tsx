"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditCustomerModal from "./EditCustomerModal";
import RechargeWalletModal from "./RechargeWalletModal";
import WithdrawWalletModal from "./WithdrawWalletModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface CustomerListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

const ROLE_SALES_STAFF = 2;
const ROLE_PURCHASING_STAFF = 3;

interface StaffOption {
  id: string;
  username: string;
  fullName: string;
  role: number;
}

interface WarehouseOption {
  id: string;
  name: string;
  type: string;
}

interface ShippingMethodOption {
  id: string;
  name: string;
}

interface UserLevelOption {
  id: string;
  name: string;
  rank: number;
}

interface CustomerFilters {
  keyword: string;
  status: string;
  tier: string;
  salesStaffId: string;
  orderStaffId: string;
  chinaWarehouseId: string;
  vietnamWarehouseId: string;
  shippingMethodId: string;
}

const EMPTY_FILTERS: CustomerFilters = {
  keyword: "",
  status: "",
  tier: "",
  salesStaffId: "",
  orderStaffId: "",
  chinaWarehouseId: "",
  vietnamWarehouseId: "",
  shippingMethodId: "",
};

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM2 18a8 8 0 1116 0H2z" />
    </svg>
  );
}

function CoinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 00-1.5 0v.318a2.75 2.75 0 00-1.75 2.557c0 1.19.7 1.966 2.058 2.376l1.184.358c.687.208.758.51.758.681 0 .372-.41.68-1 .68-.61 0-1.036-.313-1.126-.68a.75.75 0 00-1.457.363c.222.906.98 1.523 1.833 1.71v.317a.75.75 0 001.5 0v-.318a2.75 2.75 0 001.75-2.556c0-1.19-.7-1.967-2.058-2.376l-1.184-.359c-.687-.208-.758-.51-.758-.68 0-.373.41-.68 1-.68.61 0 1.036.312 1.126.68a.75.75 0 101.457-.364c-.222-.905-.98-1.522-1.833-1.71v-.317z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-.836 1.66l-1.03.515a11.06 11.06 0 005.516 5.516l.515-1.03a1.5 1.5 0 011.66-.836l3.223.716A1.5 1.5 0 0117 14.352V15.5a1.5 1.5 0 01-1.5 1.5H14C7.373 17 2 11.627 2 5V3.5z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M3 4a2 2 0 00-2 2v.4l9 5.4 9-5.4V6a2 2 0 00-2-2H3z" />
      <path d="M18 8.6l-8.55 5.13a1 1 0 01-.9 0L1 8.6V14a2 2 0 002 2h14a2 2 0 002-2V8.6z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
    </svg>
  );
}

function PlusCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MinusCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function statusLabel(status: number): string {
  if (status === 1) return "Chưa kích hoạt";
  if (status === 2) return "Khoá tài khoản";
  return "Đã kích hoạt";
}

function statusDotClass(status: number): string {
  if (status === 1) return "bg-zinc-400";
  if (status === 2) return "bg-red-500";
  return "bg-green-500";
}

function statusTextClass(status: number): string {
  if (status === 1) return "text-zinc-500";
  if (status === 2) return "text-red-600";
  return "text-green-600";
}

export interface CustomerListItem {
  id: string;
  username: string;
  email: string | null;
  phoneNumber: string | null;
  fullName: string;
  address: string | null;
  tier: number;
  walletBalance: number;
  customExchangeRate: number | null;
  customPurchaseFeePercent: number | null;
  customWeightFeePerKg: number | null;
  customVolumeFeePerCbm: number | null;
  customMinDepositPercent: number | null;
  salesStaffId: string | null;
  salesStaffName: string | null;
  orderStaffId: string | null;
  orderStaffName: string | null;
  chinaWarehouseId: string | null;
  chinaWarehouseName: string | null;
  vietnamWarehouseId: string | null;
  vietnamWarehouseName: string | null;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  userType: string;
  status: number;
  role: number;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

interface CustomerListResult {
  items: CustomerListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

export default function CustomerListPage({ adminApiBaseUrl, loginUrl }: CustomerListPageProps) {
  const [editing, setEditing] = useState<CustomerListItem | null>(null);
  const [recharging, setRecharging] = useState<CustomerListItem | null>(null);
  const [withdrawing, setWithdrawing] = useState<CustomerListItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [levelNameByRank, setLevelNameByRank] = useState<Record<number, string>>({});
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const menuTriggerRectRef = useRef<{ top: number; right: number } | null>(null);

  const [filters, setFilters] = useState<CustomerFilters>(EMPTY_FILTERS);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [chinaWarehouses, setChinaWarehouses] = useState<WarehouseOption[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<WarehouseOption[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [userLevels, setUserLevels] = useState<UserLevelOption[]>([]);
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!openMenuId) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    function handleScroll() {
      setOpenMenuId(null);
    }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openMenuId]);

  useLayoutEffect(() => {
    if (!openMenuId || !menuRef.current || !menuTriggerRectRef.current) return;
    const { top, right } = menuTriggerRectRef.current;
    const width = menuRef.current.offsetWidth;
    menuRef.current.style.top = `${top}px`;
    menuRef.current.style.left = `${right - width}px`;
  }, [openMenuId]);

  function toggleActionsMenu(id: string, e: React.MouseEvent<HTMLButtonElement>) {
    if (openMenuId === id) {
      setOpenMenuId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    menuTriggerRectRef.current = { top: rect.bottom + 6, right: rect.right };
    setOpenMenuId(id);
  }

  const fetchCustomers = useCallback(
    async (targetPage: number, accessToken: string): Promise<CustomerListResult> => {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (filters.keyword.trim()) params.set("search", filters.keyword.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.tier) params.set("tier", filters.tier);
      if (filters.salesStaffId) params.set("salesStaffId", filters.salesStaffId);
      if (filters.orderStaffId) params.set("orderStaffId", filters.orderStaffId);
      if (filters.chinaWarehouseId) params.set("chinaWarehouseId", filters.chinaWarehouseId);
      if (filters.vietnamWarehouseId) params.set("vietnamWarehouseId", filters.vietnamWarehouseId);
      if (filters.shippingMethodId) params.set("shippingMethodId", filters.shippingMethodId);

      const res = await fetch(`${adminApiBaseUrl}/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as CustomerListResult;
    },
    [adminApiBaseUrl, filters],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<CustomerListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchCustomers,
  });

  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    if (state.status !== "ready") return;
    const timer = setTimeout(() => goToPage(1), 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const headers = { Authorization: `Bearer ${state.accessToken}` };

    Promise.all([
      fetch(`${adminApiBaseUrl}/user-level/list`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${adminApiBaseUrl}/staff`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${adminApiBaseUrl}/warehouses?type=China`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${adminApiBaseUrl}/warehouses?type=Vietnam`, { headers }).then((res) => (res.ok ? res.json() : [])),
      fetch(`${adminApiBaseUrl}/shipping-methods`, { headers }).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([levels, staff, china, vietnam, shipping]: [UserLevelOption[], StaffOption[], WarehouseOption[], WarehouseOption[], ShippingMethodOption[]]) => {
        setLevelNameByRank(Object.fromEntries(levels.map((l) => [l.rank, l.name])));
        setUserLevels(levels);
        setStaffOptions(staff);
        setChinaWarehouses(china);
        setVietnamWarehouses(vietnam);
        setShippingMethods(shipping);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminApiBaseUrl, state.status === "ready" ? state.accessToken : null]);

  function handleCustomerSaved(updated: Partial<CustomerListItem> & { id: string }) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
        },
      };
    });
    setEditing(null);
    setToast("Cập nhật thành công");
  }

  function handleWalletRecharged(customerId: string, newWalletBalance: number, status: number) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((c) => (c.id === customerId ? { ...c, walletBalance: newWalletBalance } : c)),
        },
      };
    });
    setRecharging(null);
    setToast(status === 2 ? "Nạp ví thành công" : "Đã tạo yêu cầu, chờ duyệt");
  }

  function handleWalletWithdrawn(customerId: string, newWalletBalance: number, status: number) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      return {
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.map((c) => (c.id === customerId ? { ...c, walletBalance: newWalletBalance } : c)),
        },
      };
    });
    setWithdrawing(null);
    setToast(status === 2 ? "Rút ví thành công" : "Đã tạo yêu cầu, chờ duyệt");
  }

  if (state.status === "loading" || state.status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <p className="text-sm text-zinc-500">Đang tải...</p>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <AdminLayout title="Danh sách khách hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <AdminLayout title="Danh sách khách hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">
        Danh sách khách hàng ({data.totalCount})
      </h1>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Từ khoá</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Tài khoản, họ tên, SĐT, email..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              <option value="1">Chưa kích hoạt</option>
              <option value="2">Khoá tài khoản</option>
              <option value="3">Đã kích hoạt</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Cấp bậc</label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters((prev) => ({ ...prev, tier: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {[...userLevels]
                .sort((a, b) => a.rank - b.rank)
                .map((level) => (
                  <option key={level.id} value={level.rank}>
                    {level.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Nhân viên kinh doanh</label>
            <select
              value={filters.salesStaffId}
              onChange={(e) => setFilters((prev) => ({ ...prev, salesStaffId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {staffOptions
                .filter((s) => s.role === ROLE_SALES_STAFF)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Nhân viên đặt hàng</label>
            <select
              value={filters.orderStaffId}
              onChange={(e) => setFilters((prev) => ({ ...prev, orderStaffId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {staffOptions
                .filter((s) => s.role === ROLE_PURCHASING_STAFF)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.username}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Kho Trung Quốc</label>
            <select
              value={filters.chinaWarehouseId}
              onChange={(e) => setFilters((prev) => ({ ...prev, chinaWarehouseId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {chinaWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Kho Việt Nam</label>
            <select
              value={filters.vietnamWarehouseId}
              onChange={(e) => setFilters((prev) => ({ ...prev, vietnamWarehouseId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {vietnamWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Phương thức vận chuyển</label>
            <select
              value={filters.shippingMethodId}
              onChange={(e) => setFilters((prev) => ({ ...prev, shippingMethodId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {shippingMethods.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Xoá lọc
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 font-medium">Thông tin tài khoản</th>
              <th className="px-4 py-3 font-medium">Thông tin cá nhân</th>
              <th className="px-4 py-3 font-medium">Nhân viên</th>
              <th className="px-4 py-3 font-medium">Thông tin kho</th>
              <th className="px-4 py-3 font-medium">Ngày tạo</th>
              <th className="px-4 py-3 font-medium">Ngày cập nhật</th>
              <th className="px-4 py-3 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có khách hàng nào.
                </td>
              </tr>
            )}
            {data.items.map((c) => (
              <tr key={c.id} className="border-b border-zinc-100 last:border-0 align-top">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-blue-600">
                    <PersonIcon className="h-3.5 w-3.5 text-blue-500" />
                    {c.username}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusDotClass(c.status)}`} />
                    <span className={`font-medium ${statusTextClass(c.status)}`}>{statusLabel(c.status)}</span>
                    <span className="text-zinc-300">·</span>
                    <span className="font-medium text-orange-500">{levelNameByRank[c.tier] ?? "Chưa xếp hạng"}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-600">
                    <CoinIcon className="h-3.5 w-3.5 text-amber-500" />
                    {c.walletBalance.toLocaleString("vi-VN")} VNĐ
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-900">
                    <PersonIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {c.fullName}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-600">
                    <PhoneIcon className="h-3.5 w-3.5 text-green-500" />
                    {c.phoneNumber ?? "—"}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-zinc-500">
                    <MailIcon className="h-3.5 w-3.5 text-zinc-400" />
                    {c.email ?? "—"}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">
                  <div>Đặt hàng: {c.orderStaffName ?? "—"}</div>
                  <div className="mt-1.5">Kinh doanh: {c.salesStaffName ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-700">
                  <div>Kho TQ: {c.chinaWarehouseName ?? "—"}</div>
                  <div className="mt-1.5">Kho VN: {c.vietnamWarehouseName ?? "—"}</div>
                  <div className="mt-1.5">PPVC: {c.shippingMethodName ?? "—"}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  <div>{formatDateTime(c.createdAtUtc)}</div>
                  <div className="mt-1 text-zinc-400">{c.createdByUsername ?? c.username}</div>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {c.updatedAtUtc ? (
                    <>
                      <div>{formatDateTime(c.updatedAtUtc)}</div>
                      <div className="mt-1 text-zinc-400">{c.updatedByUsername ?? "—"}</div>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={(e) => toggleActionsMenu(c.id, e)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 shadow-sm transition hover:bg-orange-100"
                  >
                    <InfoIcon className="h-3.5 w-3.5" />
                    Thao tác
                  </button>
                  {openMenuId === c.id &&
                    createPortal(
                      <div
                        ref={menuRef}
                        style={{ position: "fixed", top: 0, left: 0 }}
                        className="z-50 w-max overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg"
                      >
                        <button
                          onClick={() => {
                            setEditing(c);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          <PencilIcon className="h-4 w-4 text-zinc-400" />
                          Cập nhật
                        </button>
                        <div className="border-t border-zinc-100" />
                        <button
                          onClick={() => {
                            setRecharging(c);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          <PlusCircleIcon className="h-4 w-4 text-zinc-400" />
                          Nạp ví
                        </button>
                        <div className="border-t border-zinc-100" />
                        <button
                          onClick={() => {
                            setWithdrawing(c);
                            setOpenMenuId(null);
                          }}
                          className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          <MinusCircleIcon className="h-4 w-4 text-zinc-400" />
                          Rút ví
                        </button>
                        <div className="border-t border-zinc-100" />
                        <Link
                          href={`/wallettransactions?userId=${c.id}`}
                          onClick={() => setOpenMenuId(null)}
                          className="flex w-full items-center gap-2 whitespace-nowrap px-4 py-2.5 text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                        >
                          <ClockIcon className="h-4 w-4 text-zinc-400" />
                          Lịch sử giao dịch
                        </Link>
                      </div>,
                      document.body,
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} khách hàng
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Trước
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              Sau
            </button>
          </div>
        </div>
      )}

      {editing && (
        <EditCustomerModal
          customer={editing}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditing(null)}
          onSaved={handleCustomerSaved}
        />
      )}

      {recharging && (
        <RechargeWalletModal
          customerId={recharging.id}
          customerUsername={recharging.username}
          currentWalletBalance={recharging.walletBalance}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setRecharging(null)}
          onSaved={handleWalletRecharged}
        />
      )}

      {withdrawing && (
        <WithdrawWalletModal
          customerId={withdrawing.id}
          customerUsername={withdrawing.username}
          currentWalletBalance={withdrawing.walletBalance}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setWithdrawing(null)}
          onSaved={handleWalletWithdrawn}
        />
      )}

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
