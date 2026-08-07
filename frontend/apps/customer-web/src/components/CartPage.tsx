"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import CustomerLayout from "./CustomerLayout";

interface CartPageProps {
  customerApiBaseUrl: string;
  loginUrl: string;
}

interface MeInfo {
  username: string;
  fullName: string | null;
  walletBalance: number;
  exchangeRate: number;
  hotline: string | null;
}

interface CartProductItem {
  id: string;
  imageUrl: string | null;
  productLink: string | null;
  productName: string;
  attributes: string | null;
  unitPriceCny: number;
  quantity: number;
  note: string | null;
}

interface CartShopItem {
  id: string;
  shopName: string;
  shopLink: string | null;
  platform: string;
  products: CartProductItem[];
  totalAmountCny: number;
  services: ServiceOptions;
}

interface CartResult {
  shops: CartShopItem[];
  cartAutoDeleteDays: number;
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

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

export default function CartPage({ customerApiBaseUrl, loginUrl }: CartPageProps) {
  const fetchMe = useCallback(async (accessToken: string): Promise<MeInfo> => {
    const res = await fetch(`${customerApiBaseUrl}/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Lỗi tải thông tin tài khoản (status ${res.status}).`);
    }
    return (await res.json()) as MeInfo;
  }, [customerApiBaseUrl]);

  const fetchCart = useCallback(async (accessToken: string): Promise<CartResult> => {
    const res = await fetch(`${customerApiBaseUrl}/cart`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Lỗi tải giỏ hàng (status ${res.status}).`);
    }
    return (await res.json()) as CartResult;
  }, [customerApiBaseUrl]);

  const fetchAll = useCallback(
    async (_page: number, accessToken: string): Promise<{ me: MeInfo; cart: CartResult }> => {
      const [me, cart] = await Promise.all([fetchMe(accessToken), fetchCart(accessToken)]);
      return { me, cart };
    },
    [fetchMe, fetchCart],
  );

  const { state, setState, logout } = useAuthenticatedList<{ me: MeInfo; cart: CartResult }>({
    adminApiBaseUrl: customerApiBaseUrl,
    loginUrl,
    fetchPage: fetchAll,
  });

  const [chinaWarehouses, setChinaWarehouses] = useState<OptionItem[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<OptionItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<OptionItem[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [busyShopId, setBusyShopId] = useState<string | null>(null);
  const [checkoutShop, setCheckoutShop] = useState<CartShopItem | null>(null);

  useEffect(() => {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    async function loadOptions() {
      try {
        const [chinaRes, vietnamRes, shippingRes] = await Promise.all([
          fetch(`${customerApiBaseUrl}/warehouses?type=China`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${customerApiBaseUrl}/warehouses?type=Vietnam`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${customerApiBaseUrl}/shipping-methods`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        if (chinaRes.ok) setChinaWarehouses(await chinaRes.json());
        if (vietnamRes.ok) setVietnamWarehouses(await vietnamRes.json());
        if (shippingRes.ok) setShippingMethods(await shippingRes.json());
      } catch {
        // Bỏ qua — dropdown sẽ rỗng, khách vẫn có thể thử tải lại trang.
      }
    }

    loadOptions();
  }, [state, customerApiBaseUrl]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  async function refreshCart(accessToken: string) {
    const cart = await fetchCart(accessToken);
    if (state.status === "ready") {
      setState({ status: "ready", data: { ...state.data, cart }, accessToken });
    }
  }

  async function handleUpdateQuantity(accessToken: string, item: CartProductItem, quantity: number) {
    if (quantity <= 0 || quantity === item.quantity) return;
    setBusyItemId(item.id);
    try {
      const res = await fetch(`${customerApiBaseUrl}/cart/items/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ quantity, attributes: item.attributes, note: item.note }),
      });
      if (!res.ok) {
        setToast({ message: "Cập nhật số lượng thất bại.", type: "error" });
        return;
      }
      await refreshCart(accessToken);
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleRemoveItem(accessToken: string, itemId: string) {
    setBusyItemId(itemId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/cart/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setToast({ message: "Xoá sản phẩm thất bại.", type: "error" });
        return;
      }
      await refreshCart(accessToken);
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleUpdateServices(accessToken: string, shopId: string, services: ServiceOptions) {
    setBusyShopId(shopId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/cart/shops/${shopId}/services`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ services }),
      });
      if (!res.ok) {
        setToast({ message: "Cập nhật dịch vụ thất bại.", type: "error" });
        return;
      }
      await refreshCart(accessToken);
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setBusyShopId(null);
    }
  }

  async function handleRemoveShop(accessToken: string, shopId: string) {
    setBusyShopId(shopId);
    try {
      const res = await fetch(`${customerApiBaseUrl}/cart/shops/${shopId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        setToast({ message: "Xoá giỏ hàng thất bại.", type: "error" });
        return;
      }
      await refreshCart(accessToken);
    } catch {
      setToast({ message: "Không kết nối được tới máy chủ.", type: "error" });
    } finally {
      setBusyShopId(null);
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

  const { me, cart } = state.data;
  const { accessToken } = state;

  return (
    <CustomerLayout
      title="Giỏ hàng"
      fullName={me.fullName}
      username={me.username}
      walletBalance={me.walletBalance}
      exchangeRate={me.exchangeRate}
      hotline={me.hotline}
      onLogout={logout}
    >
      {() => (
        <div>
          <h1 className="mb-2 text-xl font-semibold text-zinc-900">Giỏ hàng ({cart.shops.length} shop)</h1>

          {cart.cartAutoDeleteDays > 0 && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Sản phẩm trong giỏ quá <span className="font-semibold">{cart.cartAutoDeleteDays} ngày</span> chưa chốt đơn sẽ tự động bị xoá.
            </p>
          )}

          {cart.shops.length === 0 && (
            <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-400">
              Giỏ hàng trống. Dùng tiện ích mở rộng Chrome để thêm sản phẩm từ Taobao/1688 vào giỏ.
            </div>
          )}

          <div className="space-y-6">
            {cart.shops.map((shop) => (
              <div key={shop.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-orange-600">{shop.platform}</span>
                    <h2 className="font-semibold">{shop.shopName}</h2>
                  </div>
                  <button
                    onClick={() => handleRemoveShop(accessToken, shop.id)}
                    disabled={busyShopId === shop.id}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Xoá giỏ
                  </button>
                </div>

                <div className="divide-y divide-zinc-100">
                  {shop.products.map((p) => {
                    const lineTotal = p.unitPriceCny * p.quantity;
                    return (
                      <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                        <a
                          href={p.productLink || undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (!p.productLink) e.preventDefault();
                          }}
                          className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400"
                        >
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs">Không ảnh</span>
                          )}
                        </a>

                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm font-medium text-zinc-800">{p.productName}</p>
                          {p.attributes && <p className="mt-0.5 break-words text-xs text-zinc-500">{p.attributes}</p>}
                          {p.note && <p className="mt-0.5 break-words text-xs text-zinc-400">Ghi chú: {p.note}</p>}
                        </div>

                        <div className="grid shrink-0 grid-cols-3 gap-4 text-center sm:w-72">
                          <div>
                            <label className="mb-1 block text-xs text-zinc-400">Số lượng</label>
                            <input
                              type="number"
                              min={1}
                              step="1"
                              defaultValue={p.quantity}
                              disabled={busyItemId === p.id}
                              onBlur={(e) => handleUpdateQuantity(accessToken, p, Number(e.target.value))}
                              className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-center text-sm focus:border-blue-500 focus:outline-none disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Đơn giá</p>
                            <p className="pt-1.5 text-sm font-medium text-zinc-700">¥{p.unitPriceCny.toLocaleString("vi-VN")}</p>
                          </div>
                          <div>
                            <p className="text-xs text-zinc-400">Thành tiền</p>
                            <p className="pt-1.5 text-sm font-semibold text-zinc-800">¥{lineTotal.toLocaleString("vi-VN")}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleRemoveItem(accessToken, p.id)}
                          disabled={busyItemId === p.id}
                          className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          Xoá
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="border-t border-zinc-200 px-4 py-3">
                  <p className="mb-2 text-sm font-semibold text-blue-600">Dịch vụ tuỳ chọn</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-zinc-700 sm:grid-cols-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shop.services.requestCheckProduct}
                        disabled={busyShopId === shop.id}
                        onChange={(e) =>
                          handleUpdateServices(accessToken, shop.id, { ...shop.services, requestCheckProduct: e.target.checked })
                        }
                      />
                      Kiểm hàng
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shop.services.requestPackaging}
                        disabled={busyShopId === shop.id}
                        onChange={(e) =>
                          handleUpdateServices(accessToken, shop.id, { ...shop.services, requestPackaging: e.target.checked })
                        }
                      />
                      Đóng gói
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shop.services.requestInsurance}
                        disabled={busyShopId === shop.id}
                        onChange={(e) =>
                          handleUpdateServices(accessToken, shop.id, { ...shop.services, requestInsurance: e.target.checked })
                        }
                      />
                      Bảo hiểm
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={shop.services.requestHomeDelivery}
                        disabled={busyShopId === shop.id}
                        onChange={(e) =>
                          handleUpdateServices(accessToken, shop.id, { ...shop.services, requestHomeDelivery: e.target.checked })
                        }
                      />
                      Giao tận nhà
                    </label>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3">
                  <p className="text-sm text-zinc-600">
                    Tổng tiền hàng: <span className="font-semibold text-red-600">¥{shop.totalAmountCny.toLocaleString("vi-VN")}</span>
                  </p>
                  <button
                    onClick={() => setCheckoutShop(shop)}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Tạo đơn hàng
                  </button>
                </div>
              </div>
            ))}
          </div>

          {toast && (
            <div
              className={`fixed right-6 top-6 z-50 rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${
                toast.type === "success" ? "bg-green-600" : "bg-red-600"
              }`}
            >
              {toast.message}
            </div>
          )}

          {checkoutShop && (
            <CheckoutModal
              shop={checkoutShop}
              accessToken={accessToken}
              customerApiBaseUrl={customerApiBaseUrl}
              chinaWarehouses={chinaWarehouses}
              vietnamWarehouses={vietnamWarehouses}
              shippingMethods={shippingMethods}
              onClose={() => setCheckoutShop(null)}
              onSuccess={async (orderCode) => {
                setCheckoutShop(null);
                setToast({ message: `Đã tạo đơn ${orderCode}.`, type: "success" });
                await refreshCart(accessToken);
              }}
              onError={(message) => setToast({ message, type: "error" })}
            />
          )}
        </div>
      )}
    </CustomerLayout>
  );
}

interface CheckoutModalProps {
  shop: CartShopItem;
  accessToken: string;
  customerApiBaseUrl: string;
  chinaWarehouses: OptionItem[];
  vietnamWarehouses: OptionItem[];
  shippingMethods: OptionItem[];
  onClose: () => void;
  onSuccess: (orderCode: string) => void;
  onError: (message: string) => void;
}

function CheckoutModal({
  shop,
  accessToken,
  customerApiBaseUrl,
  chinaWarehouses,
  vietnamWarehouses,
  shippingMethods,
  onClose,
  onSuccess,
  onError,
}: CheckoutModalProps) {
  const [chinaWarehouseId, setChinaWarehouseId] = useState("");
  const [vietnamWarehouseId, setVietnamWarehouseId] = useState("");
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!chinaWarehouseId || !vietnamWarehouseId || !shippingMethodId) {
      setError("Vui lòng chọn đầy đủ Kho Trung Quốc, Kho nhận và Phương thức vận chuyển.");
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${customerApiBaseUrl}/cart/shops/${shop.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          chinaWarehouseId,
          vietnamWarehouseId,
          shippingMethodId,
          note: note.trim() === "" ? null : note.trim(),
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error ?? "Tạo đơn hàng thất bại.");
        return;
      }
      onSuccess(body.orderCode as string);
    } catch {
      onError("Không kết nối được tới máy chủ.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-zinc-900">Tạo đơn hàng — {shop.shopName}</h2>
        <p className="mb-4 text-xs text-zinc-500">{shop.products.length} sản phẩm</p>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-sm font-medium text-zinc-700">
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

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-sm font-medium text-zinc-700">
              Kho nhận (VN) <span className="text-red-500">*</span>
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

          <div className="flex items-center gap-3">
            <label className="w-28 shrink-0 text-sm font-medium text-zinc-700">
              PT vận chuyển <span className="text-red-500">*</span>
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
            <label className="mb-1 block text-sm font-medium text-zinc-700">Dịch vụ tuỳ chọn</label>
            <p className="text-sm text-zinc-600">
              {[
                shop.services.requestCheckProduct && "Kiểm hàng",
                shop.services.requestPackaging && "Đóng gói",
                shop.services.requestInsurance && "Bảo hiểm",
                shop.services.requestHomeDelivery && "Giao tận nhà",
              ]
                .filter(Boolean)
                .join(", ") || "Không chọn dịch vụ nào — sửa lại ở trang Giỏ hàng nếu cần."}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-16 w-full resize-y rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex justify-end gap-2 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Đang tạo đơn..." : "Xác nhận tạo đơn hàng"}
          </button>
        </div>
      </div>
    </div>
  );
}
