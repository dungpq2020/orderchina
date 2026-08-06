"use client";

import { useCallback } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";
import CustomerLayout from "./CustomerLayout";

interface OrderDetailPageProps {
  orderId: string;
  customerApiBaseUrl: string;
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface ProductDetail {
  id: string;
  imageUrl: string | null;
  productLink: string | null;
  productName: string;
  attributes: string | null;
  unitPriceCny: number;
  quantity: number;
  note: string | null;
}

interface PaymentHistoryItem {
  id: string;
  type: number;
  method: number;
  amount: number;
  paidAtUtc: string;
}

interface ShopCodeItem {
  id: string;
  code: string;
  createdAtUtc: string;
}

interface TrackingCodeItem {
  id: string;
  code: string;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  volumetricWeightKg: number;
  status: number;
  note: string | null;
}

interface TimelineEntry {
  status: number;
  atUtc: string;
}

interface MeInfo {
  username: string;
  fullName: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
}

interface OrderDetail {
  id: string;
  orderCode: string;
  username: string;
  creationType: number;
  status: number;
  chinaWarehouseName: string | null;
  vietnamWarehouseName: string | null;
  shippingMethodName: string | null;
  products: ProductDetail[];
  exchangeRateApplied: number;
  productAmountCny: number;
  productAmount: number;
  purchaseFeeAmount: number;
  shippingFeeCn: number;
  totalWeightKg: number;
  shippingFeeVn: number;
  requestCheckProduct: boolean;
  checkProductFeeAmount: number;
  requestPackaging: boolean;
  packagingFeeAmount: number;
  requestInsurance: boolean;
  insuranceFeeAmount: number;
  requestHomeDelivery: boolean;
  homeDeliveryFeeAmount: number;
  totalAmount: number;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  note: string | null;
  createdAtUtc: string;
  paymentHistories: PaymentHistoryItem[];
  shopCodes: ShopCodeItem[];
  trackingCodes: TrackingCodeItem[];
  timeline: TimelineEntry[];
}

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

const PAYMENT_TYPE_LABELS: Record<number, string> = {
  1: "Đặt cọc",
  2: "Thanh toán",
  3: "Hoàn tiền",
};

const PAYMENT_METHOD_LABELS: Record<number, string> = {
  1: "Ví điện tử",
};

const TRACKING_CODE_STATUS_LABELS: Record<number, string> = {
  1: "Mới tạo",
  2: "Về kho TQ",
  3: "Đang về VN",
  4: "Về kho VN",
  5: "Đã giao khách",
};

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-zinc-800">{value}</span>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
        <h2 className="font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function OrderDetailPage({ orderId, customerApiBaseUrl, adminApiBaseUrl, loginUrl }: OrderDetailPageProps) {
  const fetchMe = useCallback(async (accessToken: string): Promise<MeInfo> => {
    const res = await fetch(`${customerApiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
    }
    return (await res.json()) as MeInfo;
  }, [customerApiBaseUrl]);

  const fetchOrder = useCallback(
    async (_page: number, accessToken: string): Promise<{ me: MeInfo; order: OrderDetail }> => {
      const [me, orderRes] = await Promise.all([
        fetchMe(accessToken),
        fetch(`${customerApiBaseUrl}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);
      if (!orderRes.ok) {
        const body = await orderRes.json().catch(() => null);
        throw new Error(body?.error ?? `Lỗi tải đơn hàng (status ${orderRes.status}).`);
      }
      return { me, order: (await orderRes.json()) as OrderDetail };
    },
    [customerApiBaseUrl, orderId, fetchMe],
  );

  const { state, logout } = useAuthenticatedList<{ me: MeInfo; order: OrderDetail }>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchOrder,
  });

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

  const { me, order } = state.data;

  return (
    <CustomerLayout
      title="Chi tiết đơn hàng"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {() => (
        <div>
          <div className="mb-6">
            <Link href="/orders" className="text-sm text-blue-600 hover:underline">
              ← Quay lại danh sách
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-zinc-900">Đơn {order.orderCode}</h1>
              <span
                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  CREATION_TYPE_COLORS[order.creationType] ?? "bg-zinc-100 text-zinc-600"
                }`}
              >
                {CREATION_TYPE_LABELS[order.creationType] ?? "—"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">Đặt lúc {formatDateTime(order.createdAtUtc)}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr] lg:items-start">
            <aside className="space-y-6">
              <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <InfoRow
                  label="Tổng tiền"
                  value={<span className="font-semibold text-green-600">{formatMoney(order.totalAmount)} đ</span>}
                />
                <InfoRow
                  label="Đã trả"
                  value={<span className="font-semibold text-blue-600">{formatMoney(order.amountPaid)} đ</span>}
                />
                <InfoRow
                  label="Còn lại"
                  value={<span className="font-semibold text-red-600">{formatMoney(order.remainingAmount)} đ</span>}
                />
                <div className="space-y-2 border-t border-zinc-200 pt-3">
                  <InfoRow label="Kho Trung Quốc" value={order.chinaWarehouseName ?? "—"} />
                  <InfoRow label="Kho nhận (VN)" value={order.vietnamWarehouseName ?? "—"} />
                  <InfoRow label="Phương thức vận chuyển" value={order.shippingMethodName ?? "—"} />
                  <InfoRow
                    label="Trạng thái"
                    value={<span className="font-semibold text-orange-600">{STATUS_LABELS[order.status] ?? order.status}</span>}
                  />
                </div>
                {order.note && (
                  <div className="border-t border-zinc-200 pt-3">
                    <div className="text-sm font-medium text-zinc-700">Ghi chú</div>
                    <div className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-600">{order.note}</div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-zinc-900">Tiến trình</h2>
                <div className="space-y-1.5 text-xs">
                  {order.timeline.map((entry) => {
                    const isActive = entry.status === order.status;
                    return (
                      <div
                        key={entry.status}
                        className={`flex items-center justify-between gap-2 ${isActive ? "rounded-md bg-orange-100 px-2 py-1" : "px-2 py-1"}`}
                      >
                        <span className={`font-semibold ${isActive ? "text-orange-700" : "text-zinc-600"}`}>
                          {STATUS_LABELS[entry.status] ?? entry.status}
                        </span>
                        <span className={isActive ? "font-medium text-orange-700" : "text-zinc-500"}>
                          {formatDateTime(entry.atUtc)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>

            <div className="min-w-0 space-y-6">
              <SectionCard title={`Danh sách sản phẩm (${order.products.length})`}>
                <div className="divide-y divide-zinc-100">
                  {order.products.map((p) => {
                    const unitPriceVnd = p.unitPriceCny * order.exchangeRateApplied;
                    const lineTotalVnd = unitPriceVnd * p.quantity;
                    return (
                      <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <a
                          href={p.productLink || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!p.productLink) e.preventDefault();
                          }}
                          className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 ${
                            p.productLink ? "cursor-pointer hover:border-zinc-300" : "cursor-default"
                          }`}
                        >
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={`${adminApiBaseUrl}${p.imageUrl}`} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs">Không ảnh</span>
                          )}
                        </a>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-zinc-800">{p.productName}</p>
                          {p.attributes && <p className="mt-0.5 break-words text-xs text-zinc-500">{p.attributes}</p>}
                          {p.note && <p className="mt-0.5 break-words text-xs text-zinc-400">Ghi chú: {p.note}</p>}
                        </div>

                        <div className="grid w-full grid-cols-3 gap-2 text-center sm:w-72 sm:shrink-0 sm:gap-4">
                          <div>
                            <p className="text-xs text-zinc-400">Số lượng</p>
                            <p className="text-sm font-medium text-zinc-700">{p.quantity}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Đơn giá</p>
                            <p className="text-sm font-medium text-zinc-700">¥{p.unitPriceCny.toLocaleString("vi-VN")}</p>
                            <p className="text-xs text-zinc-400">{formatMoney(unitPriceVnd)} đ</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Thành tiền</p>
                            <p className="text-sm font-semibold text-zinc-800">{formatMoney(lineTotalVnd)} đ</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Chi phí đơn hàng">
                <div className="space-y-2 p-4 text-sm">
                  <InfoRow label="Tỷ giá" value={`${formatMoney(order.exchangeRateApplied)} đ`} />
                  <InfoRow label="Tiền hàng (¥)" value={order.productAmountCny.toLocaleString("vi-VN")} />
                  <InfoRow label="Tiền cần đặt cọc" value={`${formatMoney(order.depositAmount)} đ`} />
                  <div className="border-t border-zinc-200 pt-2" />
                  <InfoRow label="Tiền hàng" value={`${formatMoney(order.productAmount)} đ`} />
                  <InfoRow label="Phí mua hộ" value={`${formatMoney(order.purchaseFeeAmount)} đ`} />
                  <InfoRow label="Phí ship nội địa TQ" value={`${formatMoney(order.shippingFeeCn)} đ`} />
                  <InfoRow
                    label="Phí vận chuyển TQ - VN"
                    value={`${order.totalWeightKg.toLocaleString("vi-VN")} kg - ${formatMoney(order.shippingFeeVn)} đ`}
                  />
                  {order.requestCheckProduct && (
                    <InfoRow label="Phí kiểm hàng" value={`${formatMoney(order.checkProductFeeAmount)} đ`} />
                  )}
                  {order.requestPackaging && (
                    <InfoRow label="Phí đóng gói" value={`${formatMoney(order.packagingFeeAmount)} đ`} />
                  )}
                  {order.requestInsurance && (
                    <InfoRow label="Phí bảo hiểm" value={`${formatMoney(order.insuranceFeeAmount)} đ`} />
                  )}
                  {order.requestHomeDelivery && (
                    <InfoRow label="Phí giao tận nhà" value={`${formatMoney(order.homeDeliveryFeeAmount)} đ`} />
                  )}
                  <div className="border-t border-zinc-200 pt-2">
                    <InfoRow
                      label="Tổng tiền"
                      value={<span className="text-base font-semibold text-green-600">{formatMoney(order.totalAmount)} đ</span>}
                    />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title={`Mã vận đơn (${order.trackingCodes.length})`}>
                {order.trackingCodes.length === 0 ? (
                  <p className="p-4 text-center text-sm text-zinc-400">Chưa có mã vận đơn nào.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                        <tr>
                          <th className="px-3 py-2.5">Mã vận đơn</th>
                          <th className="px-3 py-2.5">Cân nặng</th>
                          <th className="px-3 py-2.5">Cân quy đổi</th>
                          <th className="px-3 py-2.5">Kích thước (D×R×C)</th>
                          <th className="px-3 py-2.5">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {order.trackingCodes.map((t) => (
                          <tr key={t.id}>
                            <td className="px-3 py-2 font-medium text-zinc-700">{t.code}</td>
                            <td className="px-3 py-2 text-zinc-600">{t.weightKg} kg</td>
                            <td className="px-3 py-2 text-zinc-600">{t.volumetricWeightKg} kg</td>
                            <td className="px-3 py-2 text-zinc-600">
                              {t.lengthCm}×{t.widthCm}×{t.heightCm} cm
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                {TRACKING_CODE_STATUS_LABELS[t.status] ?? t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>

              <SectionCard title={`Lịch sử thanh toán (${order.paymentHistories.length})`}>
                {order.paymentHistories.length === 0 ? (
                  <p className="p-4 text-center text-sm text-zinc-400">Chưa có giao dịch nào.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                        <tr>
                          <th className="px-3 py-2.5">Loại</th>
                          <th className="px-3 py-2.5">Phương thức</th>
                          <th className="px-3 py-2.5">Số tiền</th>
                          <th className="px-3 py-2.5">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {order.paymentHistories.map((h) => (
                          <tr key={h.id}>
                            <td className="px-3 py-2 text-zinc-700">{PAYMENT_TYPE_LABELS[h.type] ?? h.type}</td>
                            <td className="px-3 py-2 text-zinc-600">{PAYMENT_METHOD_LABELS[h.method] ?? h.method}</td>
                            <td className={`px-3 py-2 font-medium ${h.type === 3 ? "text-green-600" : "text-red-600"}`}>
                              {h.type === 3 ? "+" : "-"}
                              {formatMoney(h.amount)} đ
                            </td>
                            <td className="px-3 py-2 text-xs text-zinc-500">{formatDateTime(h.paidAtUtc)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}
