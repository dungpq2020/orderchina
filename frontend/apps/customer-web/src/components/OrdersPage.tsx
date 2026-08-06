"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";
import CustomerLayout from "./CustomerLayout";

interface OrdersPageProps {
  customerApiBaseUrl: string;
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface MainOrderListItem {
  id: string;
  orderCode: string;
  creationType: number;
  firstProductImageUrl: string | null;
  firstProductLink: string | null;
  productAmountCny: number;
  exchangeRateApplied: number;
  totalAmount: number;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  vietnamWarehouseName: string | null;
  status: number;
  productCount: number;
  createdAtUtc: string;
  timeline: { status: number; atUtc: string }[];
}

interface MainOrderListResult {
  items: MainOrderListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

interface MeInfo {
  username: string;
  fullName: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
}

interface DepositResult {
  succeeded: boolean;
  error: string | null;
  newWalletBalance: number | null;
  status: number | null;
  amountPaid: number | null;
  remainingAmount: number | null;
}

interface CancelResult {
  succeeded: boolean;
  error: string | null;
  status: number | null;
}

interface PayResult {
  succeeded: boolean;
  error: string | null;
  newWalletBalance: number | null;
  status: number | null;
  amountPaid: number | null;
  remainingAmount: number | null;
}

const PAGE_SIZE = 20;
const STATUS_AWAITING_QUOTE = 1;
const STATUS_AWAITING_DEPOSIT = 2;
const STATUS_ARRIVED_VIETNAM_WAREHOUSE = 9;

function formatMoney(value: number): string {
  return value.toLocaleString("vi-VN");
}

// Khớp OrderChina.Shared.Domain.Orders.MainOrderCreationType — Extension = khách tạo qua extension lúc
// mua hàng (đã có giá thực), Manual = staff tự tạo hộ (cần bước Chờ báo giá trước khi khách đặt cọc).
const CREATION_TYPE_LABELS: Record<number, string> = {
  1: "Đơn hàng mua hộ",
  2: "Đơn mua thủ công",
};

const CREATION_TYPE_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-700",
  2: "bg-purple-100 text-purple-700",
};

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

export default function OrdersPage({ customerApiBaseUrl, adminApiBaseUrl, loginUrl }: OrdersPageProps) {
  const fetchMe = useCallback(async (accessToken: string): Promise<MeInfo> => {
    const res = await fetch(`${customerApiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
    }
    return (await res.json()) as MeInfo;
  }, [customerApiBaseUrl]);

  const fetchOrders = useCallback(
    async (targetPage: number, accessToken: string): Promise<{ me: MeInfo; orders: MainOrderListResult }> => {
      const [me, orders] = await Promise.all([
        fetchMe(accessToken),
        fetch(`${customerApiBaseUrl}/orders?page=${targetPage}&pageSize=${PAGE_SIZE}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }).then((res) => {
          if (!res.ok) {
            throw new Error(`Lỗi tải danh sách đơn hàng (status ${res.status}).`);
          }
          return res.json() as Promise<MainOrderListResult>;
        }),
      ]);
      return { me, orders };
    },
    [customerApiBaseUrl, fetchMe],
  );

  const { state, page, goToPage, logout, setState } = useAuthenticatedList<{ me: MeInfo; orders: MainOrderListResult }>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchOrders,
  });

  const [depositingOrderId, setDepositingOrderId] = useState<string | null>(null);
  const [depositConfirmOrder, setDepositConfirmOrder] = useState<MainOrderListItem | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<string | null>(null);
  const [cancelConfirmOrder, setCancelConfirmOrder] = useState<MainOrderListItem | null>(null);
  const [payingOrderId, setPayingOrderId] = useState<string | null>(null);
  const [payConfirmOrder, setPayConfirmOrder] = useState<MainOrderListItem | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleDeposit(orderId: string) {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    setDepositingOrderId(orderId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/orders/${orderId}/deposit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = (await res.json().catch(() => null)) as DepositResult | { error: string } | null;

      if (!res.ok || !body || !("succeeded" in body) || !body.succeeded) {
        const message = body && "error" in body ? body.error : null;
        setToast({ message: message ?? "Đặt cọc thất bại.", type: "error" });
        return;
      }

      // Tải lại nguyên trang thay vì tự vá state — timeline trả về từ server tính lại theo status mới
      // (thêm mốc "Đã cọc"), tự vá tay sẽ để timeline cũ thiếu mốc này.
      await fetchOrders(page, accessToken).then((data) => setState({ status: "ready", data, accessToken }));
      setToast({ message: "Đặt cọc thành công.", type: "success" });
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setDepositingOrderId(null);
      setDepositConfirmOrder(null);
    }
  }

  async function handlePay(orderId: string) {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    setPayingOrderId(orderId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/orders/${orderId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = (await res.json().catch(() => null)) as PayResult | { error: string } | null;

      if (!res.ok || !body || !("succeeded" in body) || !body.succeeded) {
        const message = body && "error" in body ? body.error : null;
        setToast({ message: message ?? "Thanh toán thất bại.", type: "error" });
        return;
      }

      await fetchOrders(page, accessToken).then((data) => setState({ status: "ready", data, accessToken }));
      setToast({ message: "Thanh toán thành công.", type: "success" });
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setPayingOrderId(null);
      setPayConfirmOrder(null);
    }
  }

  async function handleCancel(orderId: string) {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    setCancelingOrderId(orderId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const body = (await res.json().catch(() => null)) as CancelResult | { error: string } | null;

      if (!res.ok || !body || !("succeeded" in body) || !body.succeeded) {
        const message = body && "error" in body ? body.error : null;
        setToast({ message: message ?? "Huỷ đơn thất bại.", type: "error" });
        return;
      }

      await fetchOrders(page, accessToken).then((data) => setState({ status: "ready", data, accessToken }));
      setToast({ message: "Đã huỷ đơn hàng.", type: "success" });
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setCancelingOrderId(null);
      setCancelConfirmOrder(null);
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 p-6">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </div>
    );
  }

  const { me, orders } = state.data;
  const totalPages = Math.max(1, Math.ceil(orders.totalCount / orders.pageSize));

  return (
    <CustomerLayout
      title="Đơn hàng mua hộ"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {() => (
        <div>
          <h1 className="mb-4 text-xl font-semibold text-zinc-900">Đơn hàng của tôi ({orders.totalCount})</h1>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-blue-700 font-semibold text-white">
                <tr>
                  <th className="px-4 py-3 text-center font-medium">Mã đơn</th>
                  <th className="px-4 py-3 text-center font-medium">Ảnh</th>
                  <th className="px-4 py-3 text-center font-medium">Thông tin</th>
                  <th className="px-4 py-3 text-center font-medium">Tổng tiền</th>
                  <th className="px-4 py-3 text-center font-medium">Đã trả</th>
                  <th className="px-4 py-3 text-center font-medium">Còn lại</th>
                  <th className="px-4 py-3 text-center font-medium">Tiến trình</th>
                  <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {orders.items.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-zinc-400">
                      Bạn chưa có đơn hàng nào.
                    </td>
                  </tr>
                )}
                {orders.items.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 align-middle last:border-0">
                    <td className="px-4 py-3 text-center">
                      <div className="font-semibold text-blue-600">{o.orderCode}</div>
                      <span
                        className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          CREATION_TYPE_COLORS[o.creationType] ?? "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {CREATION_TYPE_LABELS[o.creationType] ?? "—"}
                      </span>
                      <div className="mt-1 text-xs text-zinc-500">{formatDateTime(o.createdAtUtc)}</div>
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
                      <div className="mt-1 text-xs text-zinc-500">{o.productCount} sản phẩm</div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-zinc-700">
                      <div className="space-y-1">
                        <div>Tỷ giá: {formatMoney(o.exchangeRateApplied)} đ</div>
                        <div>Tiền hàng (¥): {o.productAmountCny.toLocaleString("vi-VN")}</div>
                        <div>Tiền cần đặt cọc: {formatMoney(o.depositAmount)} đ</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                      {formatMoney(o.totalAmount)} đ
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">
                      {formatMoney(o.amountPaid)} đ
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-red-600">
                      {formatMoney(o.remainingAmount)} đ
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-zinc-500">
                      <div className="space-y-1.5">
                        {o.timeline.map((entry) => {
                          const isActive = entry.status === o.status;
                          return (
                            <div key={entry.status} className={isActive ? "rounded-md bg-orange-100 px-2 py-1" : "px-2 py-1"}>
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
                      <div className="flex flex-col items-center gap-1.5">
                        {o.status === STATUS_AWAITING_DEPOSIT && (
                          <button
                            onClick={() => setDepositConfirmOrder(o)}
                            disabled={depositingOrderId === o.id}
                            className="inline-block rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500"
                          >
                            {depositingOrderId === o.id ? "Đang xử lý..." : "Đặt cọc"}
                          </button>
                        )}
                        {o.status === STATUS_ARRIVED_VIETNAM_WAREHOUSE && (
                          <button
                            onClick={() => setPayConfirmOrder(o)}
                            disabled={payingOrderId === o.id}
                            className="inline-block rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-green-600"
                          >
                            {payingOrderId === o.id ? "Đang xử lý..." : "Thanh toán"}
                          </button>
                        )}
                        {(o.status === STATUS_AWAITING_QUOTE || o.status === STATUS_AWAITING_DEPOSIT) && (
                          <button
                            onClick={() => setCancelConfirmOrder(o)}
                            disabled={cancelingOrderId === o.id}
                            className="inline-block rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {cancelingOrderId === o.id ? "Đang xử lý..." : "Huỷ đơn"}
                          </button>
                        )}
                        <Link
                          href={`/orders/${o.id}`}
                          className="inline-block rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-100"
                        >
                          Chi tiết
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {orders.totalCount > 0 && (
            <div className="mt-4 flex items-center justify-between text-sm text-zinc-600">
              <span>
                Trang {orders.page}/{totalPages} — {orders.totalCount} đơn hàng
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
              className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          )}

          {depositConfirmOrder && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">Xác nhận đặt cọc</h2>
                <p className="text-sm text-zinc-600">
                  Đơn hàng <span className="font-semibold text-blue-600">{depositConfirmOrder.orderCode}</span>
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Số tiền bạn cần đặt cọc là:{" "}
                  <span className="text-base font-semibold text-orange-600">
                    {formatMoney(depositConfirmOrder.depositAmount)} đ
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">Số dư ví hiện tại: {formatMoney(me.walletBalance)} đ</p>

                <div className="mt-6 flex justify-end gap-2 border-t border-zinc-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setDepositConfirmOrder(null)}
                    disabled={depositingOrderId === depositConfirmOrder.id}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeposit(depositConfirmOrder.id)}
                    disabled={depositingOrderId === depositConfirmOrder.id}
                    className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {depositingOrderId === depositConfirmOrder.id ? "Đang xử lý..." : "Xác nhận đặt cọc"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {payConfirmOrder && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">Xác nhận thanh toán</h2>
                <p className="text-sm text-zinc-600">
                  Đơn hàng <span className="font-semibold text-blue-600">{payConfirmOrder.orderCode}</span>
                </p>
                <p className="mt-2 text-sm text-zinc-600">
                  Số tiền cần thanh toán (Tổng tiền - Đã trả) là:{" "}
                  <span className="text-base font-semibold text-green-600">
                    {formatMoney(payConfirmOrder.remainingAmount)} đ
                  </span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">Số dư ví hiện tại: {formatMoney(me.walletBalance)} đ</p>
                {me.walletBalance < payConfirmOrder.remainingAmount && (
                  <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    Số dư ví không đủ để thanh toán, vui lòng nạp thêm tiền.
                  </p>
                )}

                <div className="mt-6 flex justify-end gap-2 border-t border-zinc-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setPayConfirmOrder(null)}
                    disabled={payingOrderId === payConfirmOrder.id}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePay(payConfirmOrder.id)}
                    disabled={payingOrderId === payConfirmOrder.id || me.walletBalance < payConfirmOrder.remainingAmount}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {payingOrderId === payConfirmOrder.id ? "Đang xử lý..." : "Xác nhận thanh toán"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {cancelConfirmOrder && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
                <h2 className="mb-4 text-lg font-semibold text-zinc-900">Xác nhận huỷ đơn</h2>
                <p className="text-sm text-zinc-600">
                  Bạn có chắc muốn huỷ đơn hàng{" "}
                  <span className="font-semibold text-blue-600">{cancelConfirmOrder.orderCode}</span>? Hành động này
                  không thể hoàn tác.
                </p>

                <div className="mt-6 flex justify-end gap-2 border-t border-zinc-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setCancelConfirmOrder(null)}
                    disabled={cancelingOrderId === cancelConfirmOrder.id}
                    className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Trở về
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCancel(cancelConfirmOrder.id)}
                    disabled={cancelingOrderId === cancelConfirmOrder.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {cancelingOrderId === cancelConfirmOrder.id ? "Đang xử lý..." : "Xác nhận huỷ đơn"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </CustomerLayout>
  );
}
