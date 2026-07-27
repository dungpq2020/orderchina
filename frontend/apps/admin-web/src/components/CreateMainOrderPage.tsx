"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";

interface CreateMainOrderPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface BootstrapData {
  maxLinksPerOrder: number;
}

interface ProductRow {
  key: string;
  imageUrl: string | null;
  uploading: boolean;
  productLink: string;
  productName: string;
  attributes: string;
  unitPriceCny: string;
  quantity: string;
  note: string;
}

interface CustomerSearchItem {
  id: string;
  username: string;
  fullName: string;
  walletBalance: number;
  chinaWarehouseId: string | null;
  vietnamWarehouseId: string | null;
  shippingMethodId: string | null;
}

interface OptionItem {
  id: string;
  name: string;
}

interface ServiceOptions {
  requestPackaging: boolean;
  requestInsurance: boolean;
  requestCheckProduct: boolean;
  requestHomeDelivery: boolean;
}

interface PreviewResult {
  exchangeRateApplied: number;
  productAmount: number;
  purchaseFeePercentApplied: number;
  purchaseFeeAmount: number;
  shippingFeeCn: number;
  shippingFeeVn: number;
  insuranceFeeAmount: number;
  checkProductFeeAmount: number;
  totalAmount: number;
  minDepositPercentApplied: number;
  depositAmount: number;
}

function newRow(): ProductRow {
  return {
    key: crypto.randomUUID(),
    imageUrl: null,
    uploading: false,
    productLink: "",
    productName: "",
    attributes: "",
    unitPriceCny: "",
    quantity: "1",
    note: "",
  };
}

function formatMoney(value: number): string {
  return value.toLocaleString("vi-VN");
}

export default function CreateMainOrderPage({ adminApiBaseUrl, loginUrl }: CreateMainOrderPageProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [rows, setRows] = useState<ProductRow[]>([newRow()]);
  const [error, setError] = useState<string | null>(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customerResults, setCustomerResults] = useState<CustomerSearchItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchItem | null>(null);
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [chinaWarehouses, setChinaWarehouses] = useState<OptionItem[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<OptionItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<OptionItem[]>([]);
  const [chinaWarehouseId, setChinaWarehouseId] = useState("");
  const [vietnamWarehouseId, setVietnamWarehouseId] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState("");

  const [services, setServices] = useState<ServiceOptions>({
    requestPackaging: false,
    requestInsurance: false,
    requestCheckProduct: false,
    requestHomeDelivery: false,
  });

  const fetchConfig = useCallback(
    async (_page: number, accessToken: string): Promise<BootstrapData> => {
      const res = await fetch(`${adminApiBaseUrl}/system-config`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Lỗi tải cấu hình hệ thống (status ${res.status}).`);
      }
      const body = await res.json();
      return { maxLinksPerOrder: body.maxLinksPerOrder ?? 50 };
    },
    [adminApiBaseUrl],
  );

  const { state, logout } = useAuthenticatedList<BootstrapData>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchConfig,
  });

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

  function updateRow(key: string, patch: Partial<ProductRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addRow() {
    if (state.status !== "ready") return;
    if (rows.length >= state.data.maxLinksPerOrder) {
      setError(`Chỉ được thêm tối đa ${state.data.maxLinksPerOrder} sản phẩm trong 1 đơn.`);
      return;
    }
    setRows((prev) => [...prev, newRow()]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  async function handleImageChange(key: string, file: File, accessToken: string) {
    updateRow(key, { uploading: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${adminApiBaseUrl}/uploads/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Upload ảnh thất bại.");
        updateRow(key, { uploading: false });
        return;
      }
      const body = (await res.json()) as { url: string };
      updateRow(key, { imageUrl: body.url, uploading: false });
    } catch {
      setError("Không kết nối được tới máy chủ khi upload ảnh.");
      updateRow(key, { uploading: false });
    }
  }

  function buildProductsPayload() {
    return rows.map((r) => ({
      imageUrl: r.imageUrl,
      productLink: r.productLink.trim() === "" ? null : r.productLink.trim(),
      productName: r.productName.trim(),
      attributes: r.attributes.trim() === "" ? null : r.attributes.trim(),
      unitPriceCny: Number(r.unitPriceCny || 0),
      quantity: Number(r.quantity || 0),
      note: r.note.trim() === "" ? null : r.note.trim(),
    }));
  }

  function handleContinue() {
    setError(null);
    for (const r of rows) {
      if (r.productName.trim() === "") {
        setError("Vui lòng nhập tên sản phẩm cho tất cả các dòng.");
        return;
      }
      if (Number(r.unitPriceCny || 0) <= 0) {
        setError(`Vui lòng nhập giá hợp lệ cho sản phẩm "${r.productName}".`);
        return;
      }
      if (Number(r.quantity || 0) <= 0) {
        setError(`Vui lòng nhập số lượng hợp lệ cho sản phẩm "${r.productName}".`);
        return;
      }
    }
    setStep(2);
  }

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleCustomerQueryChange(value: string, accessToken: string) {
    setCustomerQuery(value);
    setSelectedCustomer(null);
    setPreview(null);

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (value.trim() === "") {
      setCustomerResults([]);
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${adminApiBaseUrl}/customers/search?q=${encodeURIComponent(value.trim())}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        setCustomerResults(await res.json());
      } catch {
        // Bỏ qua lỗi tìm kiếm — người dùng có thể gõ lại.
      }
    }, 300);
  }

  async function refreshPreview(customerId: string, accessToken: string, servicesOverride: ServiceOptions) {
    setPreviewLoading(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ customerId, products: buildProductsPayload(), services: servicesOverride }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Tính phí thất bại.");
        return;
      }
      setPreview(await res.json());
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSelectCustomer(customer: CustomerSearchItem, accessToken: string) {
    setSelectedCustomer(customer);
    setCustomerResults([]);
    setCustomerQuery(customer.username);
    setChinaWarehouseId(customer.chinaWarehouseId ?? "");
    setVietnamWarehouseId(customer.vietnamWarehouseId ?? "");
    setShippingMethodId(customer.shippingMethodId ?? "");
    await refreshPreview(customer.id, accessToken, services);
  }

  function toggleService(key: keyof ServiceOptions, accessToken: string) {
    const next = { ...services, [key]: !services[key] };
    setServices(next);
    if (selectedCustomer) {
      // Phí bảo hiểm/kiểm hàng phụ thuộc lựa chọn dịch vụ — tính lại ngay khi đổi, dùng giá trị
      // `next` vừa tính (KHÔNG đọc lại `services` từ closure vì state chưa kịp cập nhật).
      refreshPreview(selectedCustomer.id, accessToken, next);
    }
  }

  async function handleCreate(accessToken: string) {
    if (!selectedCustomer) return;
    if (!chinaWarehouseId || !vietnamWarehouseId || !shippingMethodId) {
      setError("Vui lòng chọn Phương thức vận chuyển, Kho Trung Quốc và Kho đích.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          customerId: selectedCustomer.id,
          products: buildProductsPayload(),
          chinaWarehouseId,
          vietnamWarehouseId,
          shippingMethodId,
          services,
          note: note.trim() === "" ? null : note,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Tạo đơn thất bại.");
        return;
      }
      router.push("/orders");
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setCreating(false);
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
      <AdminLayout title="Tạo đơn thủ công" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { accessToken } = state;

  return (
    <AdminLayout title="Tạo đơn thủ công" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Tạo đơn thủ công</h1>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {step === 1 && (
        <>
          <div className="mb-4 flex items-center justify-end gap-2">
            <button
              onClick={addRow}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              + Thêm
            </button>
            <button
              onClick={handleContinue}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Tiếp tục
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
                <tr>
                  <th className="px-3 py-3 text-center font-medium">STT</th>
                  <th className="px-3 py-3 text-center font-medium">Hình ảnh</th>
                  <th className="px-3 py-3 text-center font-medium">Link sản phẩm</th>
                  <th className="px-3 py-3 text-center font-medium">Tên sản phẩm</th>
                  <th className="px-3 py-3 text-center font-medium">Thuộc tính</th>
                  <th className="px-3 py-3 text-center font-medium">Giá (¥)</th>
                  <th className="px-3 py-3 text-center font-medium">Số lượng</th>
                  <th className="px-3 py-3 text-center font-medium">Ghi chú</th>
                  <th className="px-3 py-3 text-center font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.key} className="border-b border-zinc-100 last:border-0 align-middle">
                    <td className="px-3 py-3 text-center text-zinc-500">{index + 1}</td>
                    <td className="px-3 py-3 text-center">
                      <label className="mx-auto flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 hover:border-zinc-400">
                        {row.uploading ? (
                          <span className="text-xs">...</span>
                        ) : row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={`${adminApiBaseUrl}${row.imageUrl}`} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl">+</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageChange(row.key, file, accessToken);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="text"
                        value={row.productLink}
                        onChange={(e) => updateRow(row.key, { productLink: e.target.value })}
                        className="mx-auto block w-40 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="text"
                        value={row.productName}
                        onChange={(e) => updateRow(row.key, { productName: e.target.value })}
                        className="mx-auto block w-36 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="text"
                        value={row.attributes}
                        onChange={(e) => updateRow(row.key, { attributes: e.target.value })}
                        className="mx-auto block w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={row.unitPriceCny}
                        onChange={(e) => updateRow(row.key, { unitPriceCny: e.target.value })}
                        className="mx-auto block w-24 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="number"
                        min={1}
                        step="1"
                        value={row.quantity}
                        onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
                        className="mx-auto block w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <input
                        type="text"
                        value={row.note}
                        onChange={(e) => updateRow(row.key, { note: e.target.value })}
                        className="mx-auto block w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-40"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="relative">
                <label className="mb-1 block text-sm font-medium text-zinc-700">Khách hàng</label>
                <input
                  type="text"
                  value={customerQuery}
                  onChange={(e) => handleCustomerQueryChange(e.target.value, accessToken)}
                  placeholder="Tìm theo username hoặc họ tên..."
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                {customerResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                    {customerResults.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleSelectCustomer(c, accessToken)}
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-zinc-50"
                      >
                        <span className="font-medium text-zinc-900">{c.username}</span>
                        <span className="ml-2 text-zinc-500">{c.fullName}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedCustomer && (
                  <p className="mt-1 text-xs text-zinc-500">
                    Ví hiện tại: {formatMoney(selectedCustomer.walletBalance)} đ
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Ghi chú đơn hàng</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Phương thức vận chuyển <span className="text-red-500">*</span>
                </label>
                <select
                  value={shippingMethodId}
                  onChange={(e) => setShippingMethodId(e.target.value)}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Kho Trung Quốc <span className="text-red-500">*</span>
                </label>
                <select
                  value={chinaWarehouseId}
                  onChange={(e) => setChinaWarehouseId(e.target.value)}
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

              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">
                  Kho đích <span className="text-red-500">*</span>
                </label>
                <select
                  value={vietnamWarehouseId}
                  onChange={(e) => setVietnamWarehouseId(e.target.value)}
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
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-zinc-200 pt-4 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={services.requestPackaging}
                  onChange={() => toggleService("requestPackaging", accessToken)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Đóng gỗ
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={services.requestInsurance}
                  onChange={() => toggleService("requestInsurance", accessToken)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Bảo hiểm
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={services.requestCheckProduct}
                  onChange={() => toggleService("requestCheckProduct", accessToken)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Kiểm hàng
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={services.requestHomeDelivery}
                  onChange={() => toggleService("requestHomeDelivery", accessToken)}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                Giao hàng
              </label>
            </div>
          </div>

          {previewLoading && <p className="text-sm text-zinc-500">Đang tính phí...</p>}

          {preview && (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-zinc-900">Chi tiết phí</h2>
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <dt className="text-zinc-500">Tỉ giá áp dụng</dt>
                  <dd className="font-medium text-zinc-900">1¥ = {formatMoney(preview.exchangeRateApplied)} đ</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <dt className="text-zinc-500">Tiền hàng</dt>
                  <dd className="font-medium text-zinc-900">{formatMoney(preview.productAmount)} đ</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <dt className="text-zinc-500">Phí mua hàng ({preview.purchaseFeePercentApplied}%)</dt>
                  <dd className="font-medium text-zinc-900">{formatMoney(preview.purchaseFeeAmount)} đ</dd>
                </div>
                {services.requestCheckProduct && (
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <dt className="text-zinc-500">Phí kiểm hàng</dt>
                    <dd className="font-medium text-zinc-900">{formatMoney(preview.checkProductFeeAmount)} đ</dd>
                  </div>
                )}
                {services.requestInsurance && (
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <dt className="text-zinc-500">Phí bảo hiểm</dt>
                    <dd className="font-medium text-zinc-900">{formatMoney(preview.insuranceFeeAmount)} đ</dd>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <dt className="text-zinc-500">Phí ship TQ</dt>
                  <dd className="text-zinc-400">{formatMoney(preview.shippingFeeCn)} đ (nhập sau)</dd>
                </div>
                <div className="flex justify-between border-b border-zinc-100 pb-2">
                  <dt className="text-zinc-500">Phí vận chuyển TQ-VN</dt>
                  <dd className="text-zinc-400">{formatMoney(preview.shippingFeeVn)} đ (tính khi có mã vận đơn)</dd>
                </div>
                {(services.requestPackaging || services.requestHomeDelivery) && (
                  <div className="flex justify-between border-b border-zinc-100 pb-2">
                    <dt className="text-zinc-500">Phí phát sinh khác nếu có</dt>
                    <dd className="text-zinc-400">Cập nhật sau</dd>
                  </div>
                )}
                <div className="flex justify-between border-b border-zinc-100 pb-2 sm:col-span-2">
                  <dt className="font-semibold text-zinc-900">Tổng tiền đơn hàng</dt>
                  <dd className="text-lg font-semibold text-orange-600">{formatMoney(preview.totalAmount)} đ</dd>
                </div>
                <div className="flex justify-between pb-2 sm:col-span-2">
                  <dt className="text-zinc-500">Tiền đặt cọc yêu cầu ({preview.minDepositPercentApplied}%)</dt>
                  <dd className="font-semibold text-blue-600">{formatMoney(preview.depositAmount)} đ</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Quay lại
            </button>
            <button
              onClick={() => handleCreate(accessToken)}
              disabled={!selectedCustomer || !preview || creating}
              className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {creating ? "Đang tạo..." : "Tạo đơn"}
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
