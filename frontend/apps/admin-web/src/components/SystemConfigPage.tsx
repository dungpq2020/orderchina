"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface SystemConfigPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface SystemConfigDto {
  id: string;
  websiteName: string;
  address: string | null;
  phoneNumber: string | null;
  contactEmail: string | null;
  chromeToolUrl: string | null;
  purchaseExchangeRate: number;
  consignmentExchangeRate: number;
  paymentExchangeRate: number;
  minPurchaseFee: number;
  purchaseInsurancePercent: number;
  maxLinksPerOrder: number;
  cartAutoDeleteDays: number;
  salesCommissionPurchasePercent: number;
  purchasingStaffCommissionPurchasePercent: number;
  salesCommissionConsignmentPercent: number;
  salesCommissionPaymentPercent: number;
  volumetricWeightDivisor: number;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
      <div className="relative">
        <input
          type="number"
          min={0}
          step="any"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-zinc-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SystemConfigPage({ adminApiBaseUrl, loginUrl }: SystemConfigPageProps) {
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [websiteName, setWebsiteName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [chromeToolUrl, setChromeToolUrl] = useState("");
  const [purchaseExchangeRate, setPurchaseExchangeRate] = useState("0");
  const [consignmentExchangeRate, setConsignmentExchangeRate] = useState("0");
  const [paymentExchangeRate, setPaymentExchangeRate] = useState("0");
  const [minPurchaseFee, setMinPurchaseFee] = useState("0");
  const [purchaseInsurancePercent, setPurchaseInsurancePercent] = useState("0");
  const [maxLinksPerOrder, setMaxLinksPerOrder] = useState("0");
  const [cartAutoDeleteDays, setCartAutoDeleteDays] = useState("0");
  const [salesCommissionPurchasePercent, setSalesCommissionPurchasePercent] = useState("0");
  const [purchasingStaffCommissionPurchasePercent, setPurchasingStaffCommissionPurchasePercent] = useState("0");
  const [salesCommissionConsignmentPercent, setSalesCommissionConsignmentPercent] = useState("0");
  const [salesCommissionPaymentPercent, setSalesCommissionPaymentPercent] = useState("0");
  const [volumetricWeightDivisor, setVolumetricWeightDivisor] = useState("5000");
  const [meta, setMeta] = useState<{ updatedAtUtc: string | null; updatedByUsername: string | null }>({
    updatedAtUtc: null,
    updatedByUsername: null,
  });

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  function applyConfig(config: SystemConfigDto) {
    setWebsiteName(config.websiteName);
    setAddress(config.address ?? "");
    setPhoneNumber(config.phoneNumber ?? "");
    setContactEmail(config.contactEmail ?? "");
    setChromeToolUrl(config.chromeToolUrl ?? "");
    setPurchaseExchangeRate(String(config.purchaseExchangeRate));
    setConsignmentExchangeRate(String(config.consignmentExchangeRate));
    setPaymentExchangeRate(String(config.paymentExchangeRate));
    setMinPurchaseFee(String(config.minPurchaseFee));
    setPurchaseInsurancePercent(String(config.purchaseInsurancePercent));
    setMaxLinksPerOrder(String(config.maxLinksPerOrder));
    setCartAutoDeleteDays(String(config.cartAutoDeleteDays));
    setSalesCommissionPurchasePercent(String(config.salesCommissionPurchasePercent));
    setPurchasingStaffCommissionPurchasePercent(String(config.purchasingStaffCommissionPurchasePercent));
    setSalesCommissionConsignmentPercent(String(config.salesCommissionConsignmentPercent));
    setSalesCommissionPaymentPercent(String(config.salesCommissionPaymentPercent));
    setVolumetricWeightDivisor(String(config.volumetricWeightDivisor));
    setMeta({ updatedAtUtc: config.updatedAtUtc, updatedByUsername: config.updatedByUsername });
  }

  const fetchConfig = useCallback(
    async (_page: number, accessToken: string): Promise<SystemConfigDto> => {
      const res = await fetch(`${adminApiBaseUrl}/system-config`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Lỗi tải cấu hình (status ${res.status}).`);
      }

      const config = (await res.json()) as SystemConfigDto;
      applyConfig(config);
      return config;
    },
    [adminApiBaseUrl],
  );

  const { state, logout } = useAuthenticatedList<SystemConfigDto>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchConfig,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state.status !== "ready") return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`${adminApiBaseUrl}/system-config`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${state.accessToken}`,
        },
        body: JSON.stringify({
          websiteName,
          address: address.trim() === "" ? null : address,
          phoneNumber: phoneNumber.trim() === "" ? null : phoneNumber,
          contactEmail: contactEmail.trim() === "" ? null : contactEmail,
          chromeToolUrl: chromeToolUrl.trim() === "" ? null : chromeToolUrl,
          purchaseExchangeRate: Number(purchaseExchangeRate),
          consignmentExchangeRate: Number(consignmentExchangeRate),
          paymentExchangeRate: Number(paymentExchangeRate),
          minPurchaseFee: Number(minPurchaseFee),
          purchaseInsurancePercent: Number(purchaseInsurancePercent),
          maxLinksPerOrder: Number(maxLinksPerOrder),
          cartAutoDeleteDays: Number(cartAutoDeleteDays),
          salesCommissionPurchasePercent: Number(salesCommissionPurchasePercent),
          purchasingStaffCommissionPurchasePercent: Number(purchasingStaffCommissionPurchasePercent),
          salesCommissionConsignmentPercent: Number(salesCommissionConsignmentPercent),
          salesCommissionPaymentPercent: Number(salesCommissionPaymentPercent),
          volumetricWeightDivisor: Number(volumetricWeightDivisor),
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Phiên đăng nhập đã hết hạn. Vui lòng tải lại trang rồi thử lại.");
          return;
        }
        const body = await res.json().catch(() => null);
        setError(body?.error ?? `Lưu thất bại (status ${res.status}).`);
        return;
      }

      const saved = (await res.json()) as SystemConfigDto;
      applyConfig(saved);
      setToast("Cập nhật thành công");
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSaving(false);
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
      <AdminLayout title="Hệ thống" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Hệ thống" adminApiBaseUrl={adminApiBaseUrl} accessToken={state.accessToken} onLogout={logout}>
      <h1 className="mb-6 text-xl font-semibold text-zinc-900">Cấu hình hệ thống</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Thông tin chung</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Tên website" value={websiteName} onChange={setWebsiteName} />
            <TextField label="Email liên hệ" value={contactEmail} onChange={setContactEmail} />
            <TextField label="Số điện thoại" value={phoneNumber} onChange={setPhoneNumber} />
            <TextField label="Địa chỉ" value={address} onChange={setAddress} />
            <div className="sm:col-span-2">
              <TextField
                label="Đường dẫn đến công cụ (Chrome)"
                value={chromeToolUrl}
                onChange={setChromeToolUrl}
                placeholder="https://chrome.google.com/webstore/detail/..."
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Tỉ giá</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <NumberField label="Tỉ giá mua hộ" value={purchaseExchangeRate} onChange={setPurchaseExchangeRate} suffix="đ" />
            <NumberField
              label="Tỉ giá ký gửi"
              value={consignmentExchangeRate}
              onChange={setConsignmentExchangeRate}
              suffix="đ"
            />
            <NumberField
              label="Tỉ giá thanh toán hộ"
              value={paymentExchangeRate}
              onChange={setPaymentExchangeRate}
              suffix="đ"
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Phí &amp; giới hạn</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField label="Phí mua hàng thấp nhất" value={minPurchaseFee} onChange={setMinPurchaseFee} suffix="đ" />
            <NumberField
              label="Phần trăm bảo hiểm mua hộ"
              value={purchaseInsurancePercent}
              onChange={setPurchaseInsurancePercent}
              suffix="%"
            />
            <NumberField label="Số lượng link trong 1 đơn" value={maxLinksPerOrder} onChange={setMaxLinksPerOrder} />
            <NumberField
              label="Số ngày tự động xoá giỏ hàng"
              value={cartAutoDeleteDays}
              onChange={setCartAutoDeleteDays}
            />
            <NumberField
              label="Số chia tính cân quy đổi (Dài×Rộng×Cao/số này)"
              value={volumetricWeightDivisor}
              onChange={setVolumetricWeightDivisor}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Hoa hồng nhân viên</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NumberField
              label="% hoa hồng NV kinh doanh — mua hộ"
              value={salesCommissionPurchasePercent}
              onChange={setSalesCommissionPurchasePercent}
              suffix="%"
            />
            <NumberField
              label="% hoa hồng NV mua hàng — mua hộ"
              value={purchasingStaffCommissionPurchasePercent}
              onChange={setPurchasingStaffCommissionPurchasePercent}
              suffix="%"
            />
            <NumberField
              label="% hoa hồng NV kinh doanh — ký gửi"
              value={salesCommissionConsignmentPercent}
              onChange={setSalesCommissionConsignmentPercent}
              suffix="%"
            />
            <NumberField
              label="% hoa hồng NV kinh doanh — thanh toán hộ"
              value={salesCommissionPaymentPercent}
              onChange={setSalesCommissionPaymentPercent}
              suffix="%"
            />
          </div>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-between">
          <p className="text-xs text-zinc-500">
            {meta.updatedAtUtc
              ? `Cập nhật lần cuối: ${formatDateTime(meta.updatedAtUtc)} — ${meta.updatedByUsername ?? "—"}`
              : "Chưa có cập nhật nào."}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Đang lưu..." : "Lưu"}
          </button>
        </div>
      </form>

      {toast && (
        <div className="fixed top-6 right-6 z-50 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}
    </AdminLayout>
  );
}
