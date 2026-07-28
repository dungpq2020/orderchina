"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface OrderDetailPageProps {
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

interface OrderDetail {
  id: string;
  orderNumber: number;
  orderCode: string;
  userId: string;
  username: string;
  status: number;
  creationType: number;
  chinaWarehouseId: string | null;
  chinaWarehouseName: string | null;
  vietnamWarehouseId: string | null;
  vietnamWarehouseName: string | null;
  shippingMethodId: string | null;
  shippingMethodName: string | null;
  products: ProductDetail[];
  exchangeRateApplied: number;
  productAmountCny: number;
  productAmount: number;
  purchaseFeePercentApplied: number;
  purchaseFeeAmount: number;
  shippingFeeCnCny: number;
  shippingFeeCn: number;
  shippingFeeVn: number;
  requestCheckProduct: boolean;
  checkProductFeeAmount: number;
  requestPackaging: boolean;
  packagingFeeAmount: number;
  requestInsurance: boolean;
  insuranceFeeAmount: number;
  requestHomeDelivery: boolean;
  homeDeliveryFeeAmount: number;
  actualPurchaseAmountCny: number;
  actualPurchaseAmountVnd: number;
  commissionAmount: number;
  totalAmount: number;
  minDepositPercentApplied: number;
  depositAmount: number;
  amountPaid: number;
  remainingAmount: number;
  note: string | null;
  createdAtUtc: string;
}

interface ProductRow {
  key: string;
  id: string | null;
  imageUrl: string | null;
  productLink: string;
  productName: string;
  attributes: string;
  unitPriceCny: string;
  quantity: string;
  note: string;
  /** Dòng sản phẩm gốc của đơn — khoá Tên/Link/Thuộc tính để mua đúng thông tin khách đã đặt, không cho sửa nhầm. */
  locked: boolean;
  /** Đánh dấu hết hàng thay vì xoá dòng gốc — số lượng ép về 0 để tự động trừ khỏi tổng tiền đơn. */
  outOfStock: boolean;
}

interface OptionItem {
  id: string;
  name: string;
}

interface InfoForm {
  status: string;
  chinaWarehouseId: string;
  vietnamWarehouseId: string;
  shippingMethodId: string;
  depositAmount: string;
  amountPaid: string;
}

interface FeesForm {
  /** Backend lưu cả ¥ lẫn đ (shippingFeeCnCny + shippingFeeCn) — đ luôn tự tính lại từ ¥ × tỷ giá phía server. */
  shippingFeeCnCny: string;
  /** Cùng cơ chế với shippingFeeCnCny — backend lưu cả ¥ (actualPurchaseAmountCny) lẫn đ (actualPurchaseAmountVnd). */
  actualPurchaseAmountCny: string;
  shippingFeeVn: string;
  requestCheckProduct: boolean;
  requestPackaging: boolean;
  packagingFeeAmount: string;
  requestInsurance: boolean;
  requestHomeDelivery: boolean;
  homeDeliveryFeeAmount: string;
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

// Khớp OrderChina.Shared.Domain.Orders.MainOrderCreationType — Extension = khách tạo qua extension lúc
// mua hàng (đã có giá thực), Manual = staff tự tạo hộ (cần bước Chờ báo giá trước khi khách đặt cọc).
const CREATION_TYPE_LABELS: Record<number, string> = {
  1: "Đơn hàng mua hộ",
  2: "Đơn mua thủ công",
};

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

function toProductRows(products: ProductDetail[]): ProductRow[] {
  return products.map((p) => ({
    key: p.id,
    id: p.id,
    imageUrl: p.imageUrl,
    productLink: p.productLink ?? "",
    productName: p.productName,
    attributes: p.attributes ?? "",
    unitPriceCny: String(p.unitPriceCny),
    quantity: String(p.quantity),
    note: p.note ?? "",
    locked: true,
    outOfStock: p.quantity === 0,
  }));
}

function newProductRow(): ProductRow {
  return {
    key: crypto.randomUUID(),
    id: null,
    imageUrl: null,
    productLink: "",
    productName: "",
    attributes: "",
    unitPriceCny: "",
    quantity: "1",
    note: "",
    locked: false,
    outOfStock: false,
  };
}

function toFeesForm(order: OrderDetail): FeesForm {
  return {
    shippingFeeCnCny: String(order.shippingFeeCnCny),
    actualPurchaseAmountCny: String(order.actualPurchaseAmountCny),
    shippingFeeVn: String(Math.round(order.shippingFeeVn)),
    requestCheckProduct: order.requestCheckProduct,
    requestPackaging: order.requestPackaging,
    packagingFeeAmount: String(Math.round(order.packagingFeeAmount)),
    requestInsurance: order.requestInsurance,
    requestHomeDelivery: order.requestHomeDelivery,
    homeDeliveryFeeAmount: String(Math.round(order.homeDeliveryFeeAmount)),
  };
}

function toInfoForm(order: OrderDetail): InfoForm {
  return {
    status: String(order.status),
    chinaWarehouseId: order.chinaWarehouseId ?? "",
    vietnamWarehouseId: order.vietnamWarehouseId ?? "",
    shippingMethodId: order.shippingMethodId ?? "",
    depositAmount: String(Math.round(order.depositAmount)),
    amountPaid: String(Math.round(order.amountPaid)),
  };
}

export default function OrderDetailPage({ adminApiBaseUrl, loginUrl }: OrderDetailPageProps) {
  const orderId = useSearchParams().get("id");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchOrder = useCallback(
    async (_page: number, accessToken: string): Promise<OrderDetail> => {
      if (!orderId) {
        throw new Error("Thiếu mã đơn hàng.");
      }
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `Lỗi tải đơn hàng (status ${res.status}).`);
      }
      return (await res.json()) as OrderDetail;
    },
    [adminApiBaseUrl, orderId],
  );

  const { state, logout, setState } = useAuthenticatedList<OrderDetail>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchOrder,
  });

  const [productRows, setProductRows] = useState<ProductRow[]>([]);
  const [feesForm, setFeesForm] = useState<FeesForm | null>(null);
  const [infoForm, setInfoForm] = useState<InfoForm | null>(null);
  const [exchangeRateInput, setExchangeRateInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingProducts, setSavingProducts] = useState(false);
  const [savingExchangeRate, setSavingExchangeRate] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);

  const [chinaWarehouses, setChinaWarehouses] = useState<OptionItem[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<OptionItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<OptionItem[]>([]);

  const seededRef = useRef(false);
  useEffect(() => {
    if (state.status !== "ready" || seededRef.current) return;
    seededRef.current = true;
    setProductRows(toProductRows(state.data.products));
    setFeesForm(toFeesForm(state.data));
    setInfoForm(toInfoForm(state.data));
    setExchangeRateInput(String(state.data.exchangeRateApplied));
  }, [state]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    async function loadOptions() {
      try {
        const [chinaRes, vietnamRes, shippingRes] = await Promise.all([
          fetch(`${adminApiBaseUrl}/warehouses?type=China`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${adminApiBaseUrl}/warehouses?type=Vietnam`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${adminApiBaseUrl}/shipping-methods`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        if (chinaRes.ok) setChinaWarehouses(await chinaRes.json());
        if (vietnamRes.ok) setVietnamWarehouses(await vietnamRes.json());
        if (shippingRes.ok) setShippingMethods(await shippingRes.json());
      } catch {
        // Bỏ qua — dropdown sẽ rỗng, staff vẫn có thể thử tải lại trang.
      }
    }

    loadOptions();
  }, [state, adminApiBaseUrl]);

  function applyUpdatedOrder(order: OrderDetail, accessToken: string) {
    setState({ status: "ready", data: order, accessToken });
    setProductRows(toProductRows(order.products));
    setFeesForm(toFeesForm(order));
    setInfoForm(toInfoForm(order));
    setExchangeRateInput(String(order.exchangeRateApplied));
  }

  function updateRow(key: string, patch: Partial<ProductRow>) {
    setProductRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    setProductRows((prev) => [...prev, newProductRow()]);
  }

  function removeRow(key: string) {
    setProductRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  function toggleOutOfStock(key: string) {
    setProductRows((prev) =>
      prev.map((r) => {
        if (r.key !== key) return r;
        // Bấm "Còn hàng" để trống Số lượng cho staff tự nhập lại — không đoán/khôi phục số cũ.
        return r.outOfStock ? { ...r, outOfStock: false, quantity: "" } : { ...r, outOfStock: true, quantity: "0" };
      }),
    );
  }

  async function handleSaveProducts(accessToken: string) {
    if (!orderId) return;
    setError(null);

    for (const r of productRows) {
      if (r.productName.trim() === "") {
        setError("Vui lòng nhập tên sản phẩm cho tất cả các dòng.");
        return;
      }
      if (Number(r.unitPriceCny || 0) <= 0) {
        setError(`Vui lòng nhập giá hợp lệ cho sản phẩm "${r.productName}".`);
        return;
      }
      if (!r.outOfStock && Number(r.quantity || 0) <= 0) {
        setError(`Vui lòng nhập số lượng hợp lệ cho sản phẩm "${r.productName}".`);
        return;
      }
    }

    setSavingProducts(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          products: productRows.map((r) => ({
            imageUrl: r.imageUrl,
            productLink: r.productLink.trim() === "" ? null : r.productLink.trim(),
            productName: r.productName.trim(),
            attributes: r.attributes.trim() === "" ? null : r.attributes.trim(),
            unitPriceCny: Number(r.unitPriceCny || 0),
            quantity: Number(r.quantity || 0),
            note: r.note.trim() === "" ? null : r.note.trim(),
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Lưu sản phẩm thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã lưu danh sách sản phẩm", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingProducts(false);
    }
  }

  async function handleUpdateExchangeRate(accessToken: string) {
    if (!orderId) return;

    const newRate = Number(exchangeRateInput);
    if (!newRate || newRate <= 0) {
      setError("Tỷ giá không hợp lệ.");
      return;
    }

    setError(null);
    setSavingExchangeRate(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/exchange-rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ exchangeRateApplied: newRate }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Cập nhật tỷ giá thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã cập nhật tỷ giá", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingExchangeRate(false);
    }
  }

  async function handleUpdateInfo(accessToken: string) {
    if (!orderId || !infoForm || !feesForm) return;

    if (!infoForm.chinaWarehouseId || !infoForm.vietnamWarehouseId || !infoForm.shippingMethodId) {
      setError("Vui lòng chọn đầy đủ Kho Trung, Kho nhận và Line vc.");
      return;
    }

    setError(null);
    setSavingInfo(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/info`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          status: Number(infoForm.status),
          chinaWarehouseId: infoForm.chinaWarehouseId,
          vietnamWarehouseId: infoForm.vietnamWarehouseId,
          shippingMethodId: infoForm.shippingMethodId,
          shippingFeeCnCny: Number(feesForm.shippingFeeCnCny || 0),
          shippingFeeVn: Number(feesForm.shippingFeeVn || 0),
          actualPurchaseAmountCny: Number(feesForm.actualPurchaseAmountCny || 0),
          requestCheckProduct: feesForm.requestCheckProduct,
          requestPackaging: feesForm.requestPackaging,
          packagingFeeAmount: Number(feesForm.packagingFeeAmount || 0),
          requestInsurance: feesForm.requestInsurance,
          requestHomeDelivery: feesForm.requestHomeDelivery,
          homeDeliveryFeeAmount: Number(feesForm.homeDeliveryFeeAmount || 0),
          depositAmount: Number(infoForm.depositAmount || 0),
          amountPaid: Number(infoForm.amountPaid || 0),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Cập nhật thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã cập nhật thông tin đơn hàng", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingInfo(false);
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
      <AdminLayout title="Chi tiết đơn hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data: order, accessToken } = state;
  const totalQuantity = productRows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totalCny = productRows.reduce((sum, r) => sum + Number(r.unitPriceCny || 0) * Number(r.quantity || 0), 0);
  const totalVnd = totalCny * order.exchangeRateApplied;

  return (
    <AdminLayout title="Chi tiết đơn hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6">
        <Link href="/orders" className="text-sm text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
        <h1 className="mt-1 text-xl font-semibold text-zinc-900">
          Đơn {order.orderCode} — <span className="text-red-600">{order.username}</span>
        </h1>
      </div>

      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <div className="space-y-3 rounded-xl border border-zinc-200 bg-white p-5 text-sm shadow-sm">
            <InfoRow label="Thời gian" value={formatDateTime(order.createdAtUtc)} />
            <InfoRow label="Loại đơn" value={CREATION_TYPE_LABELS[order.creationType] ?? "—"} />
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
              value={
                <span className="font-semibold text-red-600">
                  {formatMoney(order.remainingAmount)} đ
                </span>
              }
            />

            {infoForm && (
              <div className="space-y-3 border-t border-zinc-200 pt-4">
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-sm font-medium text-zinc-700">
                    Trạng thái <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={infoForm.status}
                    onChange={(e) => setInfoForm({ ...infoForm, status: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-sm font-medium text-zinc-700">
                    Kho Trung <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={infoForm.chinaWarehouseId}
                    onChange={(e) => setInfoForm({ ...infoForm, chinaWarehouseId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn --</option>
                    {chinaWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-sm font-medium text-zinc-700">
                    Kho nhận <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={infoForm.vietnamWarehouseId}
                    onChange={(e) => setInfoForm({ ...infoForm, vietnamWarehouseId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn --</option>
                    {vietnamWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <label className="w-24 shrink-0 text-sm font-medium text-zinc-700">
                    Line vc <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={infoForm.shippingMethodId}
                    onChange={(e) => setInfoForm({ ...infoForm, shippingMethodId: e.target.value })}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Chọn --</option>
                    {shippingMethods.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => handleUpdateInfo(accessToken)}
                  disabled={savingInfo}
                  className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {savingInfo ? "Đang cập nhật..." : "✎ Cập nhật"}
                </button>
              </div>
            )}
          </div>
        </aside>

        <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Danh sách sản phẩm ({productRows.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
            >
              + Thêm
            </button>
            <button
              onClick={() => handleSaveProducts(accessToken)}
              disabled={savingProducts}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50 disabled:opacity-50"
            >
              {savingProducts ? "Đang lưu..." : "Lưu sản phẩm"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 border-b border-zinc-200 px-4 py-3 text-sm">
          <p>
            Tổng số lượng: <span className="font-semibold text-red-600">{totalQuantity}</span>
          </p>
          <p>
            Tổng tiền sản phẩm:{" "}
            <span className="font-semibold text-red-600">
              {formatMoney(totalVnd)} đ - ¥{totalCny.toLocaleString("vi-VN")}
            </span>
          </p>
        </div>

        <div className="divide-y divide-zinc-100">
          {productRows.map((row, index) => {
            const unitPriceVnd = Number(row.unitPriceCny || 0) * order.exchangeRateApplied;
            const lineTotalVnd = unitPriceVnd * Number(row.quantity || 0);
            return (
              <div key={row.key} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm text-zinc-400">{index + 1}</span>
                  <a
                    href={row.productLink || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      if (!row.productLink) e.preventDefault();
                    }}
                    className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 ${
                      row.productLink ? "cursor-pointer hover:border-zinc-300" : "cursor-default"
                    }`}
                    title={row.productLink ? "Mở link sản phẩm" : undefined}
                  >
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`${adminApiBaseUrl}${row.imageUrl}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs">Không ảnh</span>
                    )}
                  </a>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-2 sm:max-w-2xl sm:grid-cols-2">
                  {row.outOfStock && (
                    <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 sm:col-span-2">
                      Hết hàng
                    </span>
                  )}
                  <input
                    type="text"
                    placeholder="Tên sản phẩm"
                    value={row.productName}
                    readOnly={row.locked}
                    onChange={(e) => updateRow(row.key, { productName: e.target.value })}
                    title={row.locked ? "Khoá để mua đúng thông tin khách đã đặt" : undefined}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm sm:col-span-2 ${
                      row.locked
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                        : "border-zinc-300 focus:border-blue-500 focus:outline-none"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Link sản phẩm"
                    value={row.productLink}
                    readOnly={row.locked}
                    onChange={(e) => updateRow(row.key, { productLink: e.target.value })}
                    title={row.locked ? "Khoá để mua đúng thông tin khách đã đặt" : undefined}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm sm:col-span-2 ${
                      row.locked
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                        : "border-zinc-300 text-zinc-500 focus:border-blue-500 focus:outline-none"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Thuộc tính"
                    value={row.attributes}
                    readOnly={row.locked}
                    onChange={(e) => updateRow(row.key, { attributes: e.target.value })}
                    title={row.locked ? "Khoá để mua đúng thông tin khách đã đặt" : undefined}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                      row.locked
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                        : "border-zinc-300 focus:border-blue-500 focus:outline-none"
                    }`}
                  />
                  <input
                    type="text"
                    placeholder="Ghi chú"
                    value={row.note}
                    onChange={(e) => updateRow(row.key, { note: e.target.value })}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid shrink-0 grid-cols-3 gap-3 sm:w-80">
                  <div>
                    <label className="mb-1 block text-center text-xs text-zinc-400">Số lượng</label>
                    <input
                      type="number"
                      min={1}
                      step="1"
                      value={row.quantity}
                      readOnly={row.outOfStock}
                      onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                      className={`w-full rounded-lg border px-2 py-1.5 text-center text-sm ${
                        row.outOfStock
                          ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-400"
                          : "border-zinc-300 focus:border-blue-500 focus:outline-none"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-center text-xs text-zinc-400">Đơn giá (¥)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={row.unitPriceCny}
                      onChange={(e) => updateRow(row.key, { unitPriceCny: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-center text-xs text-zinc-400">{formatMoney(unitPriceVnd)} đ</p>
                  </div>
                  <div className="text-center">
                    <label className="mb-1 block text-xs text-zinc-400">Thành tiền</label>
                    <p className="pt-1.5 text-sm font-semibold text-zinc-700">{formatMoney(lineTotalVnd)} đ</p>
                  </div>
                </div>

                {row.locked ? (
                  <button
                    onClick={() => {
                      if (
                        row.outOfStock ||
                        window.confirm(`Đánh dấu "${row.productName || "sản phẩm này"}" hết hàng — số lượng sẽ về 0 và trừ khỏi tổng tiền đơn?`)
                      ) {
                        toggleOutOfStock(row.key);
                      }
                    }}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white ${
                      row.outOfStock ? "bg-zinc-500 hover:bg-zinc-600" : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {row.outOfStock ? "Còn hàng" : "Hết hàng"}
                  </button>
                ) : (
                  <button
                    onClick={() => removeRow(row.key)}
                    disabled={productRows.length <= 1}
                    className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-40"
                  >
                    Xoá
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {feesForm && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="font-semibold text-zinc-900">Phí cố định</h2>
            </div>
            <div className="space-y-4 p-4">
              <FeeRow label="Tỷ giá">
                <div className="flex flex-1 gap-2">
                  <MoneyInput
                    value={exchangeRateInput}
                    onChange={setExchangeRateInput}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateExchangeRate(accessToken)}
                    disabled={savingExchangeRate}
                    className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                  >
                    {savingExchangeRate ? "Đang lưu..." : "Sửa tỷ giá"}
                  </button>
                </div>
              </FeeRow>
              <FeeRow label="Tiền hàng trên web">
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  ¥{totalCny.toLocaleString("vi-VN")} — {formatMoney(totalVnd)} đ
                </div>
              </FeeRow>
              <FeeRow label="Tiền mua thật">
                <div className="flex flex-1 gap-2">
                  <div className="relative w-full">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={feesForm.actualPurchaseAmountCny}
                      onChange={(e) => setFeesForm({ ...feesForm, actualPurchaseAmountCny: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex w-full items-center rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                    {formatMoney(Number(feesForm.actualPurchaseAmountCny || 0) * order.exchangeRateApplied)} đ
                  </div>
                </div>
              </FeeRow>
              <FeeRow label="Phí ship Trung Quốc">
                <div className="flex flex-1 gap-2">
                  <div className="relative w-full">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                      ¥
                    </span>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={feesForm.shippingFeeCnCny}
                      onChange={(e) => setFeesForm({ ...feesForm, shippingFeeCnCny: e.target.value })}
                      className="w-full rounded-lg border border-zinc-300 py-2 pl-7 pr-3 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex w-full items-center rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                    {formatMoney(Number(feesForm.shippingFeeCnCny || 0) * order.exchangeRateApplied)} đ
                  </div>
                </div>
              </FeeRow>
              <FeeRow label="Tiền hoa hồng">
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  {formatMoney(order.commissionAmount)} đ
                </div>
              </FeeRow>
              <FeeRow label={`Phí mua hàng (${order.purchaseFeePercentApplied}%)`}>
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  {formatMoney(order.purchaseFeeAmount)} đ
                </div>
              </FeeRow>
              <FeeRow label="Phí vc TQ-VN">
                <MoneyInput
                  value={feesForm.shippingFeeVn}
                  onChange={(v) => setFeesForm({ ...feesForm, shippingFeeVn: v })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </FeeRow>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-3">
              <h2 className="font-semibold text-zinc-900">Phí tùy chọn</h2>
            </div>
            <div className="space-y-4 p-4">
              <FeeRow
                label="Kiểm đếm"
                checked={feesForm.requestCheckProduct}
                onCheck={(v) => setFeesForm({ ...feesForm, requestCheckProduct: v })}
              >
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  {formatMoney(order.checkProductFeeAmount)} đ (tính tự động theo bậc phí kiểm hàng)
                </div>
              </FeeRow>
              <FeeRow
                label="Đóng gỗ"
                checked={feesForm.requestPackaging}
                onCheck={(v) => setFeesForm({ ...feesForm, requestPackaging: v })}
              >
                <MoneyInput
                  disabled={!feesForm.requestPackaging}
                  value={feesForm.packagingFeeAmount}
                  onChange={(v) => setFeesForm({ ...feesForm, packagingFeeAmount: v })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                />
              </FeeRow>
              <FeeRow
                label="Bảo hiểm"
                checked={feesForm.requestInsurance}
                onCheck={(v) => setFeesForm({ ...feesForm, requestInsurance: v })}
              >
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  {formatMoney(order.insuranceFeeAmount)} đ (tính tự động theo % cấu hình)
                </div>
              </FeeRow>
              <FeeRow
                label="Giao hàng tại nhà"
                checked={feesForm.requestHomeDelivery}
                onCheck={(v) => setFeesForm({ ...feesForm, requestHomeDelivery: v })}
              >
                <MoneyInput
                  disabled={!feesForm.requestHomeDelivery}
                  value={feesForm.homeDeliveryFeeAmount}
                  onChange={(v) => setFeesForm({ ...feesForm, homeDeliveryFeeAmount: v })}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                />
              </FeeRow>

              <div className="space-y-3 border-t border-zinc-200 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Tổng tiền đơn:</span>
                  <span className="font-semibold text-orange-600">{formatMoney(order.totalAmount)} đ</span>
                </div>
                {infoForm && (
                  <>
                    <FeeRow label={`Tiền cọc (${order.minDepositPercentApplied}%)`}>
                      <MoneyInput
                        value={infoForm.depositAmount}
                        onChange={(v) => setInfoForm({ ...infoForm, depositAmount: v })}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </FeeRow>
                    <FeeRow label="Tiền đã trả">
                      <MoneyInput
                        value={infoForm.amountPaid}
                        onChange={(v) => setInfoForm({ ...infoForm, amountPaid: v })}
                        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </FeeRow>
                  </>
                )}
                <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                  ⚠️ Bấm <span className="font-semibold">"Cập nhật"</span> ở khung bên trái để lưu các thay đổi phí.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </AdminLayout>
  );
}

function FeeRow({
  label,
  children,
  checked,
  onCheck,
}: {
  label: string;
  children: React.ReactNode;
  checked?: boolean;
  onCheck?: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex w-40 shrink-0 items-center gap-2 text-sm font-medium text-zinc-700">
        {onCheck && (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onCheck(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300"
          />
        )}
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}

/** Input số tiền VNĐ — hiển thị có dấu chấm phân cách nghìn (vd "100.000") trong lúc gõ, value/onChange vẫn làm việc với chuỗi số thô không dấu chấm. */
function MoneyInput({
  value,
  onChange,
  disabled,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const formatted = value === "" ? "" : Number(value).toLocaleString("vi-VN");

  return (
    <div className="relative w-full">
      <input
        type="text"
        inputMode="numeric"
        disabled={disabled}
        value={formatted}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className={`${className ?? ""} pr-8`}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">đ</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-medium text-zinc-500">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
