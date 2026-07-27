/**
 * Định dạng ngày giờ thống nhất toàn hệ thống: 24h, múi giờ Việt Nam (Asia/Ho_Chi_Minh),
 * bất kể trình duyệt/máy chủ đang ở locale hay múi giờ nào.
 */
export function formatDateTime(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;

  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
