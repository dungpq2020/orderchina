"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface OrdersListPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface MainOrderListItem {
  id: string;
  orderNumber: number;
  orderCode: string;
  userId: string;
  username: string;
  orderType: number;
  creationType: number;
  firstProductImageUrl: string | null;
  firstProductLink: string | null;
  productAmountCny: number;
  exchangeRateApplied: number;
  productAmount: number;
  purchaseFeeAmount: number;
  shippingFeeCn: number;
  shippingFeeVn: number;
  insuranceFeeAmount: number;
  checkProductFeeAmount: number;
  totalAmount: number;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  vietnamWarehouseName: string | null;
  orderStaffId: string | null;
  orderStaffUsername: string | null;
  salesStaffId: string | null;
  salesStaffUsername: string | null;
  status: number;
  productCount: number;
  createdAtUtc: string;
  createdByUsername: string | null;
  timeline: { status: number; atUtc: string }[];
  shopCodes: string[];
  trackingCodes: string[];
}

interface MainOrderListResult {
  items: MainOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface StaffOption {
  id: string;
  username: string;
  fullName: string;
  role: number;
}

const PAGE_SIZE = 20;
const ROLE_SALES_STAFF = 2;
const ROLE_ORDER_STAFF = 3;

function formatMoney(value: number): string {
  return value.toLocaleString("vi-VN");
}

const STATUS_LABELS: Record<number, string> = {
  1: "Chờ báo giá",
  2: "Chờ đặt cọc",
  3: "Đã cọc",
  4: "Đã mua hàng",
  5: "Chờ shop phát hàng",
  6: "Shop phát hàng",
  7: "Về kho TQ",
  8: "Đang về VN",
  9: "Về kho VN",
  10: "Đã thanh toán",
  11: "Hoàn thành",
  12: "Khiếu nại",
  13: "Đã huỷ",
};

interface Filters {
  keyword: string;
  status: string;
  orderStaffId: string;
  salesStaffId: string;
  fromDate: string;
  toDate: string;
}

const EMPTY_FILTERS: Filters = { keyword: "", status: "", orderStaffId: "", salesStaffId: "", fromDate: "", toDate: "" };

function detectPlatformBadge(link: string | null): string | null {
  if (!link) return null;
  try {
    const host = new URL(link).hostname;
    if (host.includes("1688.com")) return "1688";
    if (host.includes("taobao.com")) return "Taobao";
    if (host.includes("tmall.com")) return "Tmall";
    if (host.includes("pinduoduo.com") || host.includes("yangkeduo.com")) return "PDD";
    if (host.includes("weidian.com")) return "Weidian";
    return null;
  } catch {
    return null;
  }
}

export default function OrdersListPage({ adminApiBaseUrl, loginUrl }: OrdersListPageProps) {
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [savingStaffOrderId, setSavingStaffOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const isFirstFilterRun = useRef(true);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchOrders = useCallback(
    async (targetPage: number, accessToken: string): Promise<MainOrderListResult> => {
      const params = new URLSearchParams({ page: String(targetPage), pageSize: String(PAGE_SIZE) });
      if (filters.keyword.trim()) params.set("search", filters.keyword.trim());
      if (filters.status) params.set("status", filters.status);
      if (filters.orderStaffId) params.set("orderStaffId", filters.orderStaffId);
      if (filters.salesStaffId) params.set("salesStaffId", filters.salesStaffId);
      if (filters.fromDate) params.set("fromDate", filters.fromDate);
      if (filters.toDate) params.set("toDate", filters.toDate);

      const res = await fetch(`${adminApiBaseUrl}/main-orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải danh sách (status ${res.status}).`);
      }

      return (await res.json()) as MainOrderListResult;
    },
    [adminApiBaseUrl, filters],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<MainOrderListResult>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchOrders,
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
    const { accessToken } = state;

    fetch(`${adminApiBaseUrl}/staff`, { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((res) => (res.ok ? res.json() : []))
      .then((rows: StaffOption[]) => setStaffOptions(rows))
      .catch(() => {});
  }, [state, adminApiBaseUrl]);

  async function handleStaffChange(
    orderId: string,
    field: "orderStaffId" | "salesStaffId",
    value: string,
    accessToken: string,
  ) {
    if (state.status !== "ready") return;
    const order = state.data.items.find((o) => o.id === orderId);
    if (!order) return;

    const newOrderStaffId = field === "orderStaffId" ? value || null : order.orderStaffId;
    const newSalesStaffId = field === "salesStaffId" ? value || null : order.salesStaffId;

    setSavingStaffOrderId(orderId);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/staff`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ orderStaffId: newOrderStaffId, salesStaffId: newSalesStaffId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setToast({ message: body?.error ?? "Cập nhật nhân viên thất bại.", type: "error" });
        return;
      }

      const orderStaffUsername = newOrderStaffId
        ? (staffOptions.find((s) => s.id === newOrderStaffId)?.username ?? null)
        : null;
      const salesStaffUsername = newSalesStaffId
        ? (staffOptions.find((s) => s.id === newSalesStaffId)?.username ?? null)
        : null;

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          data: {
            ...prev.data,
            items: prev.data.items.map((o) =>
              o.id === orderId
                ? { ...o, orderStaffId: newOrderStaffId, orderStaffUsername, salesStaffId: newSalesStaffId, salesStaffUsername }
                : o,
            ),
          },
        };
      });
      setToast({ message: "Gán nhân viên thành công.", type: "success" });
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setSavingStaffOrderId(null);
    }
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
      <AdminLayout title="Đơn hàng mua hộ" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const totalPages = Math.max(1, Math.ceil(data.totalCount / data.pageSize));
  const orderStaffOptions = staffOptions.filter((s) => s.role === ROLE_ORDER_STAFF);
  const salesStaffOptions = staffOptions.filter((s) => s.role === ROLE_SALES_STAFF);

  return (
    <AdminLayout title="Đơn hàng mua hộ" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Đơn hàng mua hộ ({data.totalCount})</h1>
        <Link
          href="/createmainorder"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          + Tạo đơn thủ công
        </Link>
      </div>

      <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Từ khoá</label>
            <input
              type="text"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              placeholder="Mã đơn, tài khoản, SĐT, mã vận đơn, mã shop..."
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
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">NV đặt hàng</label>
            <select
              value={filters.orderStaffId}
              onChange={(e) => setFilters((prev) => ({ ...prev, orderStaffId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {orderStaffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">NV kinh doanh</label>
            <select
              value={filters.salesStaffId}
              onChange={(e) => setFilters((prev) => ({ ...prev, salesStaffId: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="">Tất cả</option>
              {salesStaffOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Từ ngày</label>
            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, fromDate: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Đến ngày</label>
            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters((prev) => ({ ...prev, toDate: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-orange-500 focus:outline-none"
            />
          </div>
        </div>

        {Object.values(filters).some((v) => v !== "") && (
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTERS)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition hover:border-zinc-400 hover:bg-zinc-50"
            >
              Xoá bộ lọc
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
            <tr>
              <th className="px-4 py-3 text-center font-medium">Mã đơn</th>
              <th className="px-4 py-3 text-center font-medium">Tài khoản</th>
              <th className="px-4 py-3 text-center font-medium">Ảnh</th>
              <th className="px-4 py-3 text-center font-medium">Thông tin</th>
              <th className="px-4 py-3 text-center font-medium">Nhân viên</th>
              <th className="px-4 py-3 text-center font-medium">Mã shop - Mã vận đơn</th>
              <th className="px-4 py-3 text-center font-medium">Tiến trình</th>
              <th className="px-4 py-3 text-center font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                  Chưa có đơn hàng nào.
                </td>
              </tr>
            )}
            {data.items.map((o) => {
              const badge = detectPlatformBadge(o.firstProductLink);
              return (
                <tr key={o.id} className="border-b border-zinc-100 last:border-0 align-middle">
                  <td className="px-4 py-3 text-center font-semibold text-blue-600">
                    <Link href={`/orderdetail?id=${o.id}`} className="hover:underline">
                      {o.orderCode}
                    </Link>
                    <div className="mt-1 text-xs font-normal text-zinc-400">{formatDateTime(o.createdAtUtc)}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="font-semibold text-red-600">{o.username}</div>
                    {o.vietnamWarehouseName && (
                      <div className="mt-1 text-xs text-zinc-500">
                        Nhận hàng tại: <span className="font-semibold text-zinc-700">{o.vietnamWarehouseName}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                      {o.firstProductImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`${adminApiBaseUrl}${o.firstProductImageUrl}`}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-xs text-zinc-300">Không ảnh</span>
                      )}
                    </div>
                    {badge && (
                      <div className="mt-1 text-center">
                        <span className="inline-block rounded border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          {badge}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-700">
                    <div className="space-y-1">
                      <div>Tỷ giá: {formatMoney(o.exchangeRateApplied)} đ</div>
                      <div>Tiền hàng (¥): {o.productAmountCny.toLocaleString("vi-VN")}</div>
                      <div className="font-semibold text-green-600">Tổng tiền: {formatMoney(o.totalAmount)} đ</div>
                      <div className="font-semibold text-blue-600">Đã trả: {formatMoney(o.amountPaid)} đ</div>
                      <div className="font-semibold text-red-600">Còn lại: {formatMoney(o.remainingAmount)} đ</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-2">
                      <select
                        value={o.orderStaffId ?? ""}
                        disabled={savingStaffOrderId === o.id}
                        onChange={(e) => handleStaffChange(o.id, "orderStaffId", e.target.value, accessToken)}
                        className="mx-auto block w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">— NV đặt hàng —</option>
                        {orderStaffOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.username}
                          </option>
                        ))}
                      </select>
                      <select
                        value={o.salesStaffId ?? ""}
                        disabled={savingStaffOrderId === o.id}
                        onChange={(e) => handleStaffChange(o.id, "salesStaffId", e.target.value, accessToken)}
                        className="mx-auto block w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none disabled:opacity-50"
                      >
                        <option value="">— NV kinh doanh —</option>
                        {salesStaffOptions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-1.5">
                      {o.shopCodes.length > 0 ? (
                        <div className="mx-auto flex w-32 flex-col gap-1">
                          {o.shopCodes.map((code) => (
                            <span
                              key={code}
                              className="truncate rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                              title={code}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="mx-auto h-6 w-32 rounded border border-dashed border-zinc-200 bg-zinc-50"
                          title="Chưa có mã shop (nhập sau)"
                        />
                      )}
                      {o.trackingCodes.length > 0 ? (
                        <div className="mx-auto flex w-32 flex-col gap-1">
                          {o.trackingCodes.map((code) => (
                            <span
                              key={code}
                              className="truncate rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700"
                              title={code}
                            >
                              {code}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div
                          className="mx-auto h-6 w-32 rounded border border-dashed border-zinc-200 bg-zinc-50"
                          title="Chưa có mã vận đơn (nhập sau)"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-zinc-500">
                    <div className="space-y-1.5">
                      {o.timeline.map((entry) => {
                        const isActive = entry.status === o.status;
                        return (
                          <div
                            key={entry.status}
                            className={isActive ? "rounded-md bg-orange-100 px-2 py-1" : "px-2 py-1"}
                          >
                            <span className={`font-semibold ${isActive ? "text-orange-700" : "text-zinc-600"}`}>
                              {STATUS_LABELS[entry.status] ?? entry.status}:
                            </span>{" "}
                            <span className={isActive ? "font-medium text-orange-700" : "text-zinc-500"}>
                              {formatDateTime(entry.atUtc)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/orderdetail?id=${o.id}`}
                      className="inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.totalCount > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
          <span>
            Trang {data.page}/{totalPages} — {data.totalCount} đơn hàng
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

      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
            toast.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {toast.message}
        </div>
      )}
    </AdminLayout>
  );
}
