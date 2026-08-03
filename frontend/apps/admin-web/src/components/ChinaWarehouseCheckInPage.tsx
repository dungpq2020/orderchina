"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface ChinaWarehouseCheckInPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

interface BootstrapData {
  volumetricWeightDivisor: number;
}

function BarcodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <rect x="2" y="4" width="2" height="16" rx="0.5" />
      <rect x="6" y="4" width="1" height="16" rx="0.5" />
      <rect x="9" y="4" width="3" height="16" rx="0.5" />
      <rect x="14" y="4" width="1" height="16" rx="0.5" />
      <rect x="17" y="4" width="2" height="16" rx="0.5" />
      <rect x="21" y="4" width="1" height="16" rx="0.5" />
    </svg>
  );
}

const TRACKING_CODE_STATUS_LABELS: Record<number, string> = {
  1: "Mới tạo",
  2: "Về kho Trung Quốc",
  3: "Đang vận chuyển về Việt Nam",
  4: "Về kho Việt Nam",
  5: "Đã giao khách",
};

const TRACKING_CODE_STATUS_COLORS: Record<number, string> = {
  1: "text-zinc-500",
  2: "text-blue-600",
  3: "text-amber-600",
  4: "text-purple-600",
  5: "text-green-600",
};

interface LookupData {
  code: string;
  status: number;
  weightKg: number;
  lengthCm: number;
  widthCm: number;
  heightCm: number;
  note: string | null;
  orderId: string;
  orderCode: string;
  orderType: number;
  username: string;
  phoneNumber: string | null;
  requestCheckProduct: boolean;
  requestPackaging: boolean;
  requestInsurance: boolean;
  requestHomeDelivery: boolean;
  productTypeCount: number;
  productQuantityTotal: number;
}

interface ScanRow {
  key: string;
  code: string;
  data: LookupData;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  note: string;
  saving: boolean;
  saveError: string | null;
  savedAtLocal: string | null;
}

function formatWeight(value: number): string {
  return value.toLocaleString("vi-VN", { maximumFractionDigits: 2 });
}

function numOrZero(value: string): number {
  return value.trim() === "" ? 0 : Number(value);
}

function serviceBadges(data: LookupData): { label: string; title: string; active: boolean }[] {
  return [
    { label: "KĐ", title: "Kiểm đếm", active: data.requestCheckProduct },
    { label: "ĐG", title: "Đóng gỗ", active: data.requestPackaging },
    { label: "BH", title: "Bảo hiểm", active: data.requestInsurance },
    { label: "GH", title: "Giao hàng tận nơi", active: data.requestHomeDelivery },
  ];
}

export default function ChinaWarehouseCheckInPage({ adminApiBaseUrl, loginUrl }: ChinaWarehouseCheckInPageProps) {
  const [scanCode, setScanCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const scanInputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    scanInputRef.current?.focus();
  }, []);

  const fetchConfig = useCallback(
    async (_page: number, accessToken: string): Promise<BootstrapData> => {
      const res = await fetch(`${adminApiBaseUrl}/system-config`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Lỗi tải cấu hình hệ thống (status ${res.status}).`);
      }
      const body = await res.json();
      return { volumetricWeightDivisor: body.volumetricWeightDivisor ?? 5000 };
    },
    [adminApiBaseUrl],
  );

  const { state, logout } = useAuthenticatedList<BootstrapData>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchConfig,
  });

  function updateRow(key: string, patch: Partial<ScanRow>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  async function scanNewCode(accessToken: string) {
    const trimmed = scanCode.trim();
    if (trimmed === "" || scanning) return;
    setScanCode("");

    const existing = rowsRef.current.find((r) => r.code.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      document.getElementById(`row-${existing.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      scanInputRef.current?.focus();
      return;
    }

    setScanning(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/tracking-codes/${encodeURIComponent(trimmed)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setToast({ message: body?.error ?? `Không tra được mã (status ${res.status}).`, type: "error" });
        return;
      }
      const data = (await res.json()) as LookupData;
      const newRow: ScanRow = {
        key: crypto.randomUUID(),
        code: trimmed,
        data,
        weightKg: data.weightKg > 0 ? String(data.weightKg) : "",
        lengthCm: data.lengthCm > 0 ? String(data.lengthCm) : "",
        widthCm: data.widthCm > 0 ? String(data.widthCm) : "",
        heightCm: data.heightCm > 0 ? String(data.heightCm) : "",
        note: data.note ?? "",
        saving: false,
        saveError: null,
        savedAtLocal: null,
      };
      setRows((prev) => [newRow, ...prev]);
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setScanning(false);
      scanInputRef.current?.focus();
    }
  }

  async function saveRow(row: ScanRow, accessToken: string) {
    if (row.saving) return;
    if (numOrZero(row.weightKg) <= 0) {
      updateRow(row.key, { saveError: "Vui lòng nhập cân nặng." });
      return;
    }

    updateRow(row.key, { saving: true, saveError: null });
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/tracking-codes/check-in-china-warehouse`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          code: row.code,
          weightKg: numOrZero(row.weightKg),
          lengthCm: numOrZero(row.lengthCm),
          widthCm: numOrZero(row.widthCm),
          heightCm: numOrZero(row.heightCm),
          note: row.note.trim() === "" ? null : row.note.trim(),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        updateRow(row.key, { saving: false, saveError: body?.error ?? `Cập nhật thất bại (status ${res.status}).` });
        return;
      }

      updateRow(row.key, {
        saving: false,
        saveError: null,
        savedAtLocal: new Date().toISOString(),
        data: { ...row.data, status: 2 },
      });
    } catch {
      updateRow(row.key, { saving: false, saveError: "Không kết nối được tới máy chủ." });
    }
  }

  async function saveAll(accessToken: string) {
    // Lưu tuần tự (không Promise.all) — nhiều mã có thể cùng thuộc 1 đơn, lưu song song dễ đụng
    // concurrency conflict (xmin) trên MainOrder do 2 request cùng sửa 1 đơn gần như đồng thời.
    for (const row of rowsRef.current) {
      if (row.saving || numOrZero(row.weightKg) <= 0) continue;
      await saveRow(row, accessToken);
    }
    setToast({ message: "Đã cập nhật tất cả", type: "success" });
  }

  function hideRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  function hideAll() {
    setRows([]);
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
      <AdminLayout title="Kiểm hàng kho Trung Quốc" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data: config, accessToken } = state;

  return (
    <AdminLayout title="Kiểm hàng kho Trung Quốc" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <h1 className="mb-1 text-xl font-semibold text-zinc-900">Kiểm hàng kho Trung Quốc</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Quét mã vận đơn bằng máy bắn mã (hoặc gõ tay rồi nhấn Enter) — mỗi mã quét xong sẽ thêm 1 dòng bên dưới để nhập cân
        nặng, kích thước rồi bấm Cập nhật.
      </p>

      <div className="mb-6 flex max-w-2xl items-stretch overflow-hidden rounded-lg border border-zinc-300 bg-white shadow-sm transition focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
        <div className="flex flex-1 items-center gap-3 px-4 py-3">
          <BarcodeIcon className="h-6 w-6 shrink-0 text-zinc-400" />
          <div className="h-6 w-px shrink-0 bg-zinc-200" />
          <input
            ref={scanInputRef}
            type="text"
            value={scanCode}
            onChange={(e) => setScanCode(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              scanNewCode(accessToken);
            }}
            disabled={scanning}
            placeholder="Nhập mã vận đơn"
            className="w-full text-lg text-zinc-900 placeholder:font-normal placeholder:text-zinc-400 focus:outline-none disabled:bg-zinc-50"
            autoComplete="off"
          />
        </div>
        <button
          onClick={() => scanNewCode(accessToken)}
          disabled={scanning}
          className="flex shrink-0 items-center gap-2 bg-orange-500 px-6 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"
        >
          <BarcodeIcon className="h-5 w-5" />
          {scanning ? "Đang tra..." : "Quét mã"}
        </button>
      </div>

      {rows.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
            <h2 className="font-semibold">Đang kiểm hàng ({rows.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={hideAll}
                className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800"
              >
                Ẩn tất cả
              </button>
              <button
                onClick={() => saveAll(accessToken)}
                className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-orange-600 hover:bg-orange-50"
              >
                Cập nhật tất cả
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-3 py-2.5">Đơn hàng</th>
                  <th className="px-3 py-2.5">Dịch vụ</th>
                  <th className="px-3 py-2.5">Mã vận đơn</th>
                  <th className="px-3 py-2.5">Kiểm đếm</th>
                  <th className="px-3 py-2.5">Cân nặng (kg)</th>
                  <th className="px-3 py-2.5">Kích thước</th>
                  <th className="px-3 py-2.5">Ghi chú</th>
                  <th className="px-3 py-2.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => {
                  const volumetricWeightKg =
                    config.volumetricWeightDivisor > 0
                      ? (numOrZero(row.lengthCm) * numOrZero(row.widthCm) * numOrZero(row.heightCm)) /
                        config.volumetricWeightDivisor
                      : 0;
                  const blocked = row.data ? row.data.status !== 1 && row.data.status !== 2 : false;

                  return (
                    <tr
                      id={`row-${row.key}`}
                      key={row.key}
                      className={`align-middle ${row.savedAtLocal && !row.saveError ? "bg-green-50" : ""}`}
                    >
                      <td className="px-3 py-2">
                            <div className="font-medium text-red-600">{row.data.username}</div>
                            <div className="text-base font-bold text-blue-600">{row.data.orderCode}</div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex flex-col items-start gap-1">
                              {serviceBadges(row.data).map((b) => (
                                <span
                                  key={b.label}
                                  title={b.title}
                                  className={`flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs font-medium ${
                                    b.active ? "bg-blue-50 text-blue-600" : "bg-zinc-100 text-zinc-400"
                                  }`}
                                >
                                  {b.active ? (
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L3.3 9.5a1 1 0 111.4-1.4l3.6 3.6 6.7-6.7a1 1 0 011.4 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  ) : (
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                                      <path
                                        fillRule="evenodd"
                                        d="M5.3 5.3a1 1 0 011.4 0L10 8.6l3.3-3.3a1 1 0 111.4 1.4L11.4 10l3.3 3.3a1 1 0 01-1.4 1.4L10 11.4l-3.3 3.3a1 1 0 01-1.4-1.4L8.6 10 5.3 6.7a1 1 0 010-1.4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  {b.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="font-mono font-medium text-zinc-900">{row.code}</div>
                            <div className={`mt-1 text-xs font-medium ${TRACKING_CODE_STATUS_COLORS[row.data.status] ?? "text-zinc-500"}`}>
                              {TRACKING_CODE_STATUS_LABELS[row.data.status] ?? row.data.status}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-xs text-zinc-600">
                            <div>Số loại: {row.data.productTypeCount}</div>
                            <div>Số lượng: {row.data.productQuantityTotal}</div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min={0}
                              step="any"
                              disabled={blocked}
                              value={row.weightKg}
                              onChange={(e) => updateRow(row.key, { weightKg: e.target.value })}
                              className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-orange-500 focus:outline-none disabled:bg-zinc-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <span className="w-4 text-xs text-zinc-400">D</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={blocked}
                                value={row.lengthCm}
                                onChange={(e) => updateRow(row.key, { lengthCm: e.target.value })}
                                className="w-16 rounded-lg border border-zinc-300 px-1.5 py-1 text-xs focus:border-orange-500 focus:outline-none disabled:bg-zinc-100"
                              />
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="w-4 text-xs text-zinc-400">R</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={blocked}
                                value={row.widthCm}
                                onChange={(e) => updateRow(row.key, { widthCm: e.target.value })}
                                className="w-16 rounded-lg border border-zinc-300 px-1.5 py-1 text-xs focus:border-orange-500 focus:outline-none disabled:bg-zinc-100"
                              />
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <span className="w-4 text-xs text-zinc-400">C</span>
                              <input
                                type="number"
                                min={0}
                                step="any"
                                disabled={blocked}
                                value={row.heightCm}
                                onChange={(e) => updateRow(row.key, { heightCm: e.target.value })}
                                className="w-16 rounded-lg border border-zinc-300 px-1.5 py-1 text-xs focus:border-orange-500 focus:outline-none disabled:bg-zinc-100"
                              />
                            </div>
                            <div className="mt-1 text-xs text-zinc-400">{formatWeight(volumetricWeightKg)} Kg quy đổi</div>
                          </td>
                          <td className="px-3 py-2">
                            <textarea
                              disabled={blocked}
                              value={row.note}
                              onChange={(e) => updateRow(row.key, { note: e.target.value })}
                              rows={2}
                              className="w-32 rounded-lg border border-zinc-300 px-2 py-1.5 text-xs focus:border-orange-500 focus:outline-none disabled:bg-zinc-100"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex w-fit flex-col gap-1.5">
                              <button
                                onClick={() => saveRow(row, accessToken)}
                                disabled={blocked || row.saving}
                                className="whitespace-nowrap rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-orange-600 disabled:opacity-50"
                              >
                                {row.saving ? "Đang lưu..." : "Cập nhật"}
                              </button>
                              <button
                                onClick={() => hideRow(row.key)}
                                className="whitespace-nowrap rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-300"
                              >
                                Ẩn đi
                              </button>
                              {blocked && (
                                <div className="text-xs text-red-600">Đã qua kho TQ, không sửa được.</div>
                              )}
                              {row.saveError && <div className="text-xs text-red-600">{row.saveError}</div>}
                              {row.savedAtLocal && !row.saveError && (
                                <div className="text-xs text-green-600">Đã lưu {formatDateTime(row.savedAtLocal)}</div>
                              )}
                            </div>
                          </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className={`pointer-events-auto max-w-lg rounded-xl px-6 py-4 text-center text-base font-semibold text-white shadow-2xl ${
              toast.type === "error" ? "bg-red-600" : "bg-green-600"
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
