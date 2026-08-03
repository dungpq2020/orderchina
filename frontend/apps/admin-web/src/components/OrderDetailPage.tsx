"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthenticatedList } from "@orderchina/ui/hooks/useAuthenticatedList";
import AdminLayout from "./AdminLayout";
import { roleLabel } from "./StaffListPage";
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

interface PaymentHistoryItem {
  id: string;
  type: number;
  method: number;
  amount: number;
  performedByUserId: string;
  performedByUsername: string | null;
  paidAtUtc: string;
}

interface ActivityLogItem {
  id: string;
  description: string;
  performedByUserId: string;
  performedByUsername: string | null;
  performedByRole: number;
  performedAtUtc: string;
}

interface ShopCodeItem {
  id: string;
  code: string;
  createdAtUtc: string;
  createdByUsername: string | null;
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
  createdAtUtc: string;
  createdByUsername: string | null;
  arrivedChinaWarehouseAtUtc: string | null;
  inTransitToVietnamAtUtc: string | null;
  arrivedVietnamWarehouseAtUtc: string | null;
  deliveredToCustomerAtUtc: string | null;
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
  totalWeightKg: number;
  unitWeightPriceVnd: number;
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
  paymentHistories: PaymentHistoryItem[];
  shopCodes: ShopCodeItem[];
  trackingCodes: TrackingCodeItem[];
  activityLogs: ActivityLogItem[];
  /** Concurrency token (xmin) — gửi lại nguyên giá trị này ở mỗi request cập nhật để backend phát hiện
   * đơn đã bị người khác (staff khác, hoặc khách hàng tự đặt cọc/thanh toán) sửa từ lúc trang này tải dữ liệu. */
  rowVersion: string;
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

interface ShopCodeRow {
  key: string;
  id: string | null;
  code: string;
}

interface TrackingCodeRow {
  key: string;
  id: string | null;
  code: string;
  weightKg: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  status: string;
  note: string;
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

const PAYMENT_TYPE_LABELS: Record<number, string> = {
  1: "Đặt cọc",
  2: "Thanh toán",
  3: "Hoàn tiền",
};

/** Đặt cọc/Thanh toán trừ tiền ví khách (-), Hoàn tiền cộng lại (+). */
const PAYMENT_TYPE_IS_CREDIT: Record<number, boolean> = {
  1: false,
  2: false,
  3: true,
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

/** Ngày ứng với trạng thái HIỆN TẠI của mã vận đơn (đã lưu ở server) — chỉ có sau khi bấm Lưu, đổi trạng thái trên form chưa lưu thì chưa có ngày mới. */
function trackingCodeStatusDate(item: TrackingCodeItem | undefined): string | null {
  if (!item) return null;
  switch (item.status) {
    case 1:
      return item.createdAtUtc;
    case 2:
      return item.arrivedChinaWarehouseAtUtc;
    case 3:
      return item.inTransitToVietnamAtUtc;
    case 4:
      return item.arrivedVietnamWarehouseAtUtc;
    case 5:
      return item.deliveredToCustomerAtUtc;
    default:
      return null;
  }
}

function formatMoney(value: number): string {
  return Math.round(value).toLocaleString("vi-VN");
}

const ROLE_ADMIN = 0;

/** Đọc claim "role" từ access token (JWT) để biết người đang đăng nhập có phải Admin không — chỉ Admin
 * mới được sửa "Tiền đã trả" (khớp check ở backend UpdateInfoAsync, đây chỉ là chặn ở UI cho gọn form). */
function decodeJwtRole(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const role = Number(json.role);
    return Number.isNaN(role) ? null : role;
  } catch {
    return null;
  }
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

function toShopCodeRows(shopCodes: ShopCodeItem[]): ShopCodeRow[] {
  return shopCodes.map((s) => ({ key: s.id, id: s.id, code: s.code }));
}

function newShopCodeRow(): ShopCodeRow {
  return { key: crypto.randomUUID(), id: null, code: "" };
}

function toTrackingCodeRows(trackingCodes: TrackingCodeItem[]): TrackingCodeRow[] {
  return trackingCodes.map((t) => ({
    key: t.id,
    id: t.id,
    code: t.code,
    weightKg: String(t.weightKg),
    lengthCm: String(t.lengthCm),
    widthCm: String(t.widthCm),
    heightCm: String(t.heightCm),
    status: String(t.status),
    note: t.note ?? "",
  }));
}

function newTrackingCodeRow(): TrackingCodeRow {
  return {
    key: crypto.randomUUID(),
    id: null,
    code: "",
    weightKg: "0",
    lengthCm: "0",
    widthCm: "0",
    heightCm: "0",
    status: "1",
    note: "",
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
  const [confirmOutOfStockKey, setConfirmOutOfStockKey] = useState<string | null>(null);
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
  const [savingDeposit, setSavingDeposit] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [confirmDepositOrPay, setConfirmDepositOrPay] = useState<"deposit" | "pay" | null>(null);

  const [shopCodeRows, setShopCodeRows] = useState<ShopCodeRow[]>([]);
  const [savingShopCodes, setSavingShopCodes] = useState(false);

  const [trackingCodesOpen, setTrackingCodesOpen] = useState(true);
  const [trackingCodeRows, setTrackingCodeRows] = useState<TrackingCodeRow[]>([]);
  const [savingTrackingCodes, setSavingTrackingCodes] = useState(false);

  const [chinaWarehouses, setChinaWarehouses] = useState<OptionItem[]>([]);
  const [vietnamWarehouses, setVietnamWarehouses] = useState<OptionItem[]>([]);
  const [shippingMethods, setShippingMethods] = useState<OptionItem[]>([]);
  const [volumetricWeightDivisor, setVolumetricWeightDivisor] = useState(5000);

  const seededRef = useRef(false);
  const seededRowVersionRef = useRef<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState(false);

  useEffect(() => {
    if (state.status !== "ready" || seededRef.current) return;
    seededRef.current = true;
    seededRowVersionRef.current = state.data.rowVersion;
    setProductRows(toProductRows(state.data.products));
    setFeesForm(toFeesForm(state.data));
    setInfoForm(toInfoForm(state.data));
    setExchangeRateInput(String(state.data.exchangeRateApplied));
    setShopCodeRows(toShopCodeRows(state.data.shopCodes));
    setTrackingCodeRows(toTrackingCodeRows(state.data.trackingCodes));
  }, [state]);

  // Trang tự tải lại đơn ngầm khi quay lại tab (useAuthenticatedList) — nếu rowVersion đổi so với lúc
  // seed form nghĩa là có người khác (khách hàng đặt cọc, staff khác...) vừa sửa đơn, cảnh báo trước khi
  // staff bấm Cập nhật để tránh phải chờ tới lúc backend từ chối do concurrency mới biết.
  useEffect(() => {
    if (state.status !== "ready" || !seededRef.current) return;
    if (seededRowVersionRef.current && state.data.rowVersion !== seededRowVersionRef.current) {
      setConflictWarning(true);
    }
  }, [state]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const { accessToken } = state;

    async function loadOptions() {
      try {
        const [chinaRes, vietnamRes, shippingRes, systemConfigRes] = await Promise.all([
          fetch(`${adminApiBaseUrl}/warehouses?type=China`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${adminApiBaseUrl}/warehouses?type=Vietnam`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${adminApiBaseUrl}/shipping-methods`, { headers: { Authorization: `Bearer ${accessToken}` } }),
          fetch(`${adminApiBaseUrl}/system-config`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        ]);
        if (chinaRes.ok) setChinaWarehouses(await chinaRes.json());
        if (vietnamRes.ok) setVietnamWarehouses(await vietnamRes.json());
        if (shippingRes.ok) setShippingMethods(await shippingRes.json());
        if (systemConfigRes.ok) {
          const config = (await systemConfigRes.json()) as { volumetricWeightDivisor: number };
          if (config.volumetricWeightDivisor > 0) setVolumetricWeightDivisor(config.volumetricWeightDivisor);
        }
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
    setShopCodeRows(toShopCodeRows(order.shopCodes));
    setTrackingCodeRows(toTrackingCodeRows(order.trackingCodes));
    seededRowVersionRef.current = order.rowVersion;
    setConflictWarning(false);
  }

  function updateTrackingCodeRow(key: string, patch: Partial<TrackingCodeRow>) {
    setTrackingCodeRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addTrackingCodeRow() {
    setTrackingCodeRows((prev) => [...prev, newTrackingCodeRow()]);
  }

  function removeTrackingCodeRow(key: string) {
    setTrackingCodeRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSaveTrackingCodes(accessToken: string) {
    if (!orderId) return;

    for (const r of trackingCodeRows) {
      if (r.code.trim() === "") {
        setError("Vui lòng nhập mã vận đơn cho tất cả các dòng.");
        return;
      }
    }

    setError(null);
    setSavingTrackingCodes(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/tracking-codes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          trackingCodes: trackingCodeRows.map((r) => ({
            id: r.id,
            code: r.code.trim(),
            weightKg: Number(r.weightKg || 0),
            lengthCm: Number(r.lengthCm || 0),
            widthCm: Number(r.widthCm || 0),
            heightCm: Number(r.heightCm || 0),
            status: Number(r.status),
            note: r.note.trim() === "" ? null : r.note.trim(),
          })),
          rowVersion: seededRowVersionRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) setConflictWarning(true);
        setError(body?.error ?? "Lưu mã vận đơn thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã lưu mã vận đơn", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingTrackingCodes(false);
    }
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
          rowVersion: seededRowVersionRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) setConflictWarning(true);
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

  function updateShopCodeRow(key: string, patch: Partial<ShopCodeRow>) {
    setShopCodeRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function addShopCodeRow() {
    setShopCodeRows((prev) => [...prev, newShopCodeRow()]);
  }

  function removeShopCodeRow(key: string) {
    setShopCodeRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSaveShopCodes(accessToken: string) {
    if (!orderId) return;

    for (const r of shopCodeRows) {
      if (r.code.trim() === "") {
        setError("Vui lòng nhập mã shop cho tất cả các dòng.");
        return;
      }
    }

    setError(null);
    setSavingShopCodes(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/shop-codes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          shopCodes: shopCodeRows.map((r) => ({ id: r.id, code: r.code.trim() })),
          rowVersion: seededRowVersionRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) setConflictWarning(true);
        setError(body?.error ?? "Lưu mã shop thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã lưu mã shop", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingShopCodes(false);
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
        body: JSON.stringify({ exchangeRateApplied: newRate, rowVersion: seededRowVersionRef.current }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) setConflictWarning(true);
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
          rowVersion: seededRowVersionRef.current,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409) setConflictWarning(true);
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

  async function handleDeposit(accessToken: string) {
    if (!orderId) return;
    setError(null);
    setSavingDeposit(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/deposit`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Đặt cọc thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã đặt cọc hộ khách", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingDeposit(false);
      setConfirmDepositOrPay(null);
    }
  }

  async function handlePay(accessToken: string) {
    if (!orderId) return;
    setError(null);
    setSavingPay(true);
    try {
      const res = await fetch(`${adminApiBaseUrl}/main-orders/${orderId}/pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Thanh toán thất bại.");
        return;
      }
      const updated = (await res.json()) as OrderDetail;
      applyUpdatedOrder(updated, accessToken);
      setToast({ message: "Đã thanh toán hộ khách", type: "success" });
    } catch {
      setError("Không kết nối được tới máy chủ.");
    } finally {
      setSavingPay(false);
      setConfirmDepositOrPay(null);
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
  const isAdmin = decodeJwtRole(accessToken) === ROLE_ADMIN;
  const totalQuantity = productRows.reduce((sum, r) => sum + Number(r.quantity || 0), 0);
  const totalCny = productRows.reduce((sum, r) => sum + Number(r.unitPriceCny || 0) * Number(r.quantity || 0), 0);
  const totalVnd = totalCny * order.exchangeRateApplied;

  return (
    <AdminLayout title="Chi tiết đơn hàng" adminApiBaseUrl={adminApiBaseUrl} accessToken={accessToken} onLogout={logout}>
      {conflictWarning && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            ⚠️ Đơn hàng vừa được cập nhật (có thể do khách hàng hoặc người khác thao tác) — dữ liệu bạn đang xem/sửa có thể đã cũ. Tải lại trang trước khi lưu để tránh ghi đè mất dữ liệu mới.
          </span>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Tải lại trang
          </button>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <Link href="/orders" className="text-sm text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
          <h1 className="mt-1 text-xl font-semibold text-zinc-900">
            Đơn {order.orderCode} — <span className="text-red-600">{order.username}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          title="Trang không tự động realtime — bấm để tải lại dữ liệu mới nhất (VD: sau khi kiểm/xuất kho ở trang khác)"
          className="mt-1 shrink-0 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          🔄 Làm mới
        </button>
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
                <div>
                  <div className="text-sm font-medium text-zinc-700">Ghi chú đơn</div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-600">{order.note || "—"}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateInfo(accessToken)}
                    disabled={savingInfo}
                    className="flex-1 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {savingInfo ? "Đang cập nhật..." : "✎ Cập nhật"}
                  </button>
                  {infoForm.status === "2" && (
                    <button
                      onClick={() => setConfirmDepositOrPay("deposit")}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      💳 Đặt cọc
                    </button>
                  )}
                  {infoForm.status === "9" && (
                    <button
                      onClick={() => setConfirmDepositOrPay("pay")}
                      className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      💳 Thanh toán
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Danh sách sản phẩm ({productRows.length})</h2>
          <div className="flex gap-2">
            <button
              onClick={addRow}
              className="rounded-lg bg-white px-3 py-1.5 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              + Thêm
            </button>
            <button
              onClick={() => handleSaveProducts(accessToken)}
              disabled={savingProducts}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
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
                    readOnly={row.locked}
                    onChange={(e) => updateRow(row.key, { note: e.target.value })}
                    title={row.locked ? "Khoá để mua đúng thông tin khách đã đặt" : undefined}
                    className={`rounded-lg border px-2.5 py-1.5 text-sm ${
                      row.locked
                        ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                        : "border-zinc-300 focus:border-blue-500 focus:outline-none"
                    }`}
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
                      if (row.outOfStock) {
                        toggleOutOfStock(row.key);
                      } else {
                        setConfirmOutOfStockKey(row.key);
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

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Mã shop ({shopCodeRows.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-3 py-2.5">Mã shop</th>
                <th className="px-3 py-2.5">Ngày tạo</th>
                <th className="px-3 py-2.5">Người tạo</th>
                <th className="px-3 py-2.5">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {shopCodeRows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-zinc-400">
                    Chưa có mã shop nào.
                  </td>
                </tr>
              )}
              {shopCodeRows.map((row) => {
                const original = order.shopCodes.find((s) => s.id === row.id);
                return (
                  <tr key={row.key}>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Mã đơn hàng"
                        value={row.code}
                        onChange={(e) => updateShopCodeRow(row.key, { code: e.target.value })}
                        className="w-48 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">
                      {original ? formatDateTime(original.createdAtUtc) : "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-zinc-500">{original?.createdByUsername ?? "—"}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeShopCodeRow(row.key)}
                        className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 p-4">
            <button
              onClick={addShopCodeRow}
              className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
            >
              + Thêm
            </button>
            <button
              onClick={() => handleSaveShopCodes(accessToken)}
              disabled={savingShopCodes}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {savingShopCodes ? "Đang lưu..." : "Lưu mã shop"}
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Mã vận đơn ({trackingCodeRows.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
              <tr>
                <th className="px-3 py-2.5">Mã vận đơn</th>
                  <th className="px-3 py-2.5">Cân nặng</th>
                  <th className="px-3 py-2.5">Cân quy đổi</th>
                  <th className="px-3 py-2.5">Kích thước</th>
                  <th className="px-3 py-2.5">Ghi chú</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3 py-2.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {trackingCodeRows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-6 text-center text-zinc-400">
                      Chưa có mã vận đơn nào.
                    </td>
                  </tr>
                )}
                {trackingCodeRows.map((row) => {
                  const volumetricWeightKg =
                    (Number(row.lengthCm || 0) * Number(row.widthCm || 0) * Number(row.heightCm || 0)) /
                    volumetricWeightDivisor;
                  return (
                    <tr key={row.key}>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.code}
                          onChange={(e) => updateTrackingCodeRow(row.key, { code: e.target.value })}
                          className="w-32 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled
                            title="Chỉ nhập được ở trang Kiểm hàng kho Trung Quốc"
                            value={row.weightKg}
                            className="w-20 rounded-lg border border-zinc-300 bg-zinc-100 px-2 py-1.5 text-sm text-zinc-500"
                          />
                          <span className="text-xs text-zinc-500">Kg</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="rounded-lg bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-500">
                          {volumetricWeightKg.toFixed(2)} Kg
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1" title="Chỉ nhập được ở trang Kiểm hàng kho Trung Quốc">
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled
                            placeholder="Dài"
                            value={row.lengthCm}
                            className="w-14 rounded-lg border border-zinc-300 bg-zinc-100 px-1.5 py-1.5 text-xs text-zinc-500"
                          />
                          <span className="text-xs text-zinc-400">x</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled
                            placeholder="Rộng"
                            value={row.widthCm}
                            className="w-14 rounded-lg border border-zinc-300 bg-zinc-100 px-1.5 py-1.5 text-xs text-zinc-500"
                          />
                          <span className="text-xs text-zinc-400">x</span>
                          <input
                            type="number"
                            min={0}
                            step="any"
                            disabled
                            placeholder="Cao"
                            value={row.heightCm}
                            className="w-14 rounded-lg border border-zinc-300 bg-zinc-100 px-1.5 py-1.5 text-xs text-zinc-500"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="text"
                          value={row.note}
                          onChange={(e) => updateTrackingCodeRow(row.key, { note: e.target.value })}
                          className="w-32 rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.status}
                          onChange={(e) => updateTrackingCodeRow(row.key, { status: e.target.value })}
                          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        >
                          {Object.entries(TRACKING_CODE_STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                        {(() => {
                          const original = order.trackingCodes.find((t) => t.id === row.id);
                          const date = trackingCodeStatusDate(original);
                          return date ? <div className="mt-1 text-xs text-zinc-400">{formatDateTime(date)}</div> : null;
                        })()}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeTrackingCodeRow(row.key)}
                          className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 p-4">
              <button
                onClick={addTrackingCodeRow}
                className="rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600"
              >
                + Thêm
              </button>
              <button
                onClick={() => handleSaveTrackingCodes(accessToken)}
                disabled={savingTrackingCodes}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {savingTrackingCodes ? "Đang lưu..." : "Lưu mã vận đơn"}
              </button>
            </div>
          </div>
      </div>

      {feesForm && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
              <h2 className="font-semibold">Phí cố định</h2>
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
              <hr className="border-zinc-200" />
              <FeeRow label="Cân nặng">
                <div className="w-full rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-500">
                  {order.totalWeightKg.toFixed(2)} Kg
                  {order.unitWeightPriceVnd > 0 && (
                    <span className="ml-1 text-xs text-zinc-400">× {formatMoney(order.unitWeightPriceVnd)}đ/Kg</span>
                  )}
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
            <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
              <h2 className="font-semibold">Phí tùy chọn</h2>
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
                      <div className="w-full">
                        <MoneyInput
                          disabled={!isAdmin}
                          value={infoForm.amountPaid}
                          onChange={(v) => setInfoForm({ ...infoForm, amountPaid: v })}
                          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:bg-zinc-100 disabled:text-zinc-400"
                        />
                        {!isAdmin && <p className="mt-1 text-xs text-zinc-400">Chỉ Admin được sửa</p>}
                      </div>
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

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Lịch sử thanh toán</h2>
        </div>
        {order.paymentHistories.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">Chưa có giao dịch thanh toán nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Thời gian</th>
                  <th className="px-4 py-2">Loại</th>
                  <th className="px-4 py-2">Phương thức</th>
                  <th className="px-4 py-2">Số tiền</th>
                  <th className="px-4 py-2">Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {order.paymentHistories.map((h) => (
                  <tr key={h.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-500">{formatDateTime(h.paidAtUtc)}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{PAYMENT_TYPE_LABELS[h.type] ?? "—"}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{PAYMENT_METHOD_LABELS[h.method] ?? "—"}</td>
                    <td
                      className={`px-4 py-2.5 font-medium ${PAYMENT_TYPE_IS_CREDIT[h.type] ? "text-green-600" : "text-red-600"}`}
                    >
                      {PAYMENT_TYPE_IS_CREDIT[h.type] ? "+" : "-"}
                      {formatMoney(h.amount)} đ
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700">{h.performedByUsername ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-orange-400 px-4 py-3 text-white">
          <h2 className="font-semibold">Lịch sử thao tác</h2>
        </div>
        {order.activityLogs.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-zinc-400">Chưa có thao tác nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-4 py-2">Thời gian</th>
                  <th className="px-4 py-2">Nội dung</th>
                  <th className="px-4 py-2">Người thực hiện</th>
                  <th className="px-4 py-2">Quyền hạn</th>
                </tr>
              </thead>
              <tbody>
                {order.activityLogs.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-2.5 text-zinc-500">{formatDateTime(a.performedAtUtc)}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{a.description}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{a.performedByUsername ?? "—"}</td>
                    <td className="px-4 py-2.5 text-zinc-700">{a.performedByRole >= 0 ? roleLabel(a.performedByRole) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmOutOfStockKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <p className="text-sm text-zinc-700">
              Đánh dấu{" "}
              <span className="font-semibold">
                &quot;{productRows.find((r) => r.key === confirmOutOfStockKey)?.productName || "sản phẩm này"}&quot;
              </span>{" "}
              hết hàng — số lượng sẽ về 0 và trừ khỏi tổng tiền đơn?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmOutOfStockKey(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => {
                  toggleOutOfStock(confirmOutOfStockKey);
                  setConfirmOutOfStockKey(null);
                }}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Đánh dấu hết hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDepositOrPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
            <p className="text-sm text-zinc-700">
              {confirmDepositOrPay === "deposit" ? (
                <>
                  Đặt cọc hộ khách <span className="font-semibold">{order.username}</span> số tiền{" "}
                  <span className="font-semibold text-blue-600">{formatMoney(order.depositAmount)} đ</span> — trừ thẳng vào ví
                  của khách?
                </>
              ) : (
                <>
                  Thanh toán hộ khách <span className="font-semibold">{order.username}</span> số tiền còn lại{" "}
                  <span className="font-semibold text-blue-600">{formatMoney(order.remainingAmount)} đ</span> — trừ thẳng vào
                  ví của khách?
                </>
              )}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDepositOrPay(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Huỷ
              </button>
              <button
                onClick={() => (confirmDepositOrPay === "deposit" ? handleDeposit(accessToken) : handlePay(accessToken))}
                disabled={savingDeposit || savingPay}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingDeposit || savingPay ? "Đang xử lý..." : confirmDepositOrPay === "deposit" ? "Xác nhận đặt cọc" : "Xác nhận thanh toán"}
              </button>
            </div>
          </div>
        </div>
      )}
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
