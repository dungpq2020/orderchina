"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import EditWarehouseModal from "./EditWarehouseModal";
import EditShippingMethodModal from "./EditShippingMethodModal";
import { formatDateTime } from "@orderchina/ui/utils/formatDateTime";

interface WarehouseTransportPageProps {
  adminApiBaseUrl: string;
  loginUrl: string;
}

export interface WarehouseListItem {
  id: string;
  name: string;
  address: string | null;
  type: string;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

export interface ShippingMethodListItem {
  id: string;
  name: string;
  isActive: boolean;
  createdAtUtc: string;
  createdByUsername: string | null;
  updatedAtUtc: string | null;
  updatedByUsername: string | null;
}

type Tab = "china" | "vietnam" | "shipping";

const TABS: { key: Tab; label: string }[] = [
  { key: "china", label: "Kho Trung Quốc" },
  { key: "vietnam", label: "Kho Việt Nam" },
  { key: "shipping", label: "Phương thức vận chuyển" },
];

export default function WarehouseTransportPage({ adminApiBaseUrl, loginUrl }: WarehouseTransportPageProps) {
  const [tab, setTab] = useState<Tab>("china");
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseListItem | null>(null);
  const [creatingWarehouse, setCreatingWarehouse] = useState(false);
  const [editingShipping, setEditingShipping] = useState<ShippingMethodListItem | null>(null);
  const [creatingShipping, setCreatingShipping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchData = useCallback(
    async (_page: number, accessToken: string): Promise<{ warehouses: WarehouseListItem[]; shippingMethods: ShippingMethodListItem[] }> => {
      const headers = { Authorization: `Bearer ${accessToken}` };
      const [chinaRes, vnRes, shippingRes] = await Promise.all([
        fetch(`${adminApiBaseUrl}/warehouses/admin-list?type=China`, { headers }),
        fetch(`${adminApiBaseUrl}/warehouses/admin-list?type=Vietnam`, { headers }),
        fetch(`${adminApiBaseUrl}/shipping-methods/admin-list`, { headers }),
      ]);

      if (!chinaRes.ok || !vnRes.ok || !shippingRes.ok) {
        throw new Error("Lỗi tải danh sách.");
      }

      const china = (await chinaRes.json()) as WarehouseListItem[];
      const vietnam = (await vnRes.json()) as WarehouseListItem[];
      const shippingMethods = (await shippingRes.json()) as ShippingMethodListItem[];

      return { warehouses: [...china, ...vietnam], shippingMethods };
    },
    [adminApiBaseUrl],
  );

  const { state, logout, setState } = useAuthenticatedList<{
    warehouses: WarehouseListItem[];
    shippingMethods: ShippingMethodListItem[];
  }>({
    adminApiBaseUrl,
    loginUrl,
    fetchPage: fetchData,
  });

  function handleWarehouseSaved(saved: WarehouseListItem, isNew: boolean) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const warehouses = isNew
        ? [saved, ...prev.data.warehouses]
        : prev.data.warehouses.map((w) => (w.id === saved.id ? saved : w));
      return { ...prev, data: { ...prev.data, warehouses } };
    });
    setCreatingWarehouse(false);
    setEditingWarehouse(null);
    setToast(isNew ? "Thêm kho thành công" : "Cập nhật thành công");
  }

  function handleShippingSaved(saved: ShippingMethodListItem, isNew: boolean) {
    setState((prev) => {
      if (prev.status !== "ready") return prev;
      const shippingMethods = isNew
        ? [saved, ...prev.data.shippingMethods]
        : prev.data.shippingMethods.map((s) => (s.id === saved.id ? saved : s));
      return { ...prev, data: { ...prev.data, shippingMethods } };
    });
    setCreatingShipping(false);
    setEditingShipping(null);
    setToast(isNew ? "Thêm phương thức thành công" : "Cập nhật thành công");
  }

  async function handleDeleteWarehouse(id: string, accessToken: string) {
    if (!window.confirm("Xoá kho này?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/warehouses/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        setToast(`Xoá thất bại (status ${res.status}).`);
        return;
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return { ...prev, data: { ...prev.data, warehouses: prev.data.warehouses.filter((w) => w.id !== id) } };
      });
      setToast("Đã xoá");
    } catch {
      setToast("Không kết nối được tới máy chủ.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteShipping(id: string, accessToken: string) {
    if (!window.confirm("Xoá phương thức vận chuyển này?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`${adminApiBaseUrl}/shipping-methods/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok && res.status !== 404) {
        setToast(`Xoá thất bại (status ${res.status}).`);
        return;
      }

      setState((prev) => {
        if (prev.status !== "ready") return prev;
        return {
          ...prev,
          data: { ...prev.data, shippingMethods: prev.data.shippingMethods.filter((s) => s.id !== id) },
        };
      });
      setToast("Đã xoá");
    } catch {
      setToast("Không kết nối được tới máy chủ.");
    } finally {
      setDeletingId(null);
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
      <AdminLayout title="Kho vận chuyển" adminApiBaseUrl={adminApiBaseUrl} accessToken="" onLogout={logout}>
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{state.message}</p>
      </AdminLayout>
    );
  }

  const { data, accessToken } = state;
  const warehousesForTab = data.warehouses.filter((w) => w.type === (tab === "china" ? "China" : "Vietnam"));

  return (
    <AdminLayout title="Kho vận chuyển" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900">Quản lý kho Trung Quốc - Việt Nam</h1>
        {tab === "shipping" ? (
          <button
            onClick={() => setCreatingShipping(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Thêm phương thức
          </button>
        ) : (
          <button
            onClick={() => setCreatingWarehouse(true)}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            Thêm kho
          </button>
        )}
      </div>

      <div className="mb-4 flex gap-6 border-b border-zinc-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-1 pb-3 text-sm font-medium transition ${
              tab === t.key ? "border-orange-500 text-orange-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "shipping" ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Tên phương thức</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Nhân viên cập nhật</th>
                <th className="px-4 py-3 font-medium">Cập nhật mới nhất</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.shippingMethods.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-zinc-400">
                    Chưa có phương thức vận chuyển nào.
                  </td>
                </tr>
              )}
              {data.shippingMethods.map((s) => (
                <tr key={s.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(s.createdAtUtc)}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${s.isActive ? "text-blue-600" : "text-zinc-400"}`}>
                      • {s.isActive ? "Hiện" : "Ẩn"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{s.updatedByUsername ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {s.updatedAtUtc ? formatDateTime(s.updatedAtUtc) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingShipping(s)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteShipping(s.id, accessToken)}
                        disabled={deletingId === s.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-orange-400 text-white font-semibold">
              <tr>
                <th className="px-4 py-3 font-medium">Ngày tạo</th>
                <th className="px-4 py-3 font-medium">Tên kho</th>
                <th className="px-4 py-3 font-medium">Địa chỉ</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Nhân viên cập nhật</th>
                <th className="px-4 py-3 font-medium">Cập nhật mới nhất</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {warehousesForTab.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-zinc-400">
                    Chưa có kho nào.
                  </td>
                </tr>
              )}
              {warehousesForTab.map((w) => (
                <tr key={w.id} className="border-b border-zinc-100 last:border-0 align-top">
                  <td className="px-4 py-3 text-xs text-zinc-500">{formatDateTime(w.createdAtUtc)}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900">{w.name}</td>
                  <td className="px-4 py-3 text-zinc-700">{w.address ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${w.isActive ? "text-blue-600" : "text-zinc-400"}`}>
                      • {w.isActive ? "Hiện" : "Ẩn"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-500">{w.updatedByUsername ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-zinc-500">
                    {w.updatedAtUtc ? formatDateTime(w.updatedAtUtc) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingWarehouse(w)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-200"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteWarehouse(w.id, accessToken)}
                        disabled={deletingId === w.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50"
                      >
                        Xoá
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {creatingWarehouse && (
        <EditWarehouseModal
          type={tab === "vietnam" ? "Vietnam" : "China"}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreatingWarehouse(false)}
          onSaved={(saved) => handleWarehouseSaved(saved, true)}
        />
      )}

      {editingWarehouse && (
        <EditWarehouseModal
          warehouse={editingWarehouse}
          type={editingWarehouse.type}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditingWarehouse(null)}
          onSaved={(saved) => handleWarehouseSaved(saved, false)}
        />
      )}

      {creatingShipping && (
        <EditShippingMethodModal
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setCreatingShipping(false)}
          onSaved={(saved) => handleShippingSaved(saved, true)}
        />
      )}

      {editingShipping && (
        <EditShippingMethodModal
          shippingMethod={editingShipping}
          adminApiBaseUrl={adminApiBaseUrl}
          accessToken={accessToken}
          onClose={() => setEditingShipping(null)}
          onSaved={(saved) => handleShippingSaved(saved, false)}
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
