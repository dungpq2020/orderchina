/**
 * Cache + đồng bộ accessToken giữa các tab, theo adminApiBaseUrl.
 *
 * Trước đây mỗi trang danh sách tự gọi POST /auth/refresh khi mount (xem useAuthenticatedList).
 * Refresh token dùng cơ chế rotation (mỗi lần refresh vô hiệu hoá token cũ) — nếu 2 tab cùng gọi
 * /auth/refresh mà không đồng bộ với nhau, tab "thua" sẽ gửi lên token đã bị tab kia rotate mất,
 * bị AuthService.RefreshAsync coi là "reuse_detected" và THU HỒI TOÀN BỘ phiên đăng nhập — tức bị
 * đăng xuất khi đang thao tác ở tab khác, dù không làm gì sai.
 *
 * Cách xử lý dứt điểm (giống Auth0 SPA SDK / Clerk / Supabase đang dùng cho single-flight refresh
 * đa tab), gồm 2 lớp:
 *
 * 1. Lưu session vào localStorage thay vì chỉ giữ trong bộ nhớ riêng của từng tab — tab nào vừa
 *    refresh xong, các tab khác đọc thấy token mới ngay qua sự kiện "storage", không tự gọi
 *    /auth/refresh thêm nữa (localStorage dùng chung mọi tab cùng origin).
 * 2. Bọc lệnh refresh thật sự trong navigator.locks — nếu nhiều tab cùng lúc thấy chưa có token
 *    hợp lệ (vd cùng mở app sau khi trình duyệt khởi động lại), chỉ 1 tab giữ được lock và gọi
 *    mạng; các tab còn lại xếp hàng chờ, sau khi có lock sẽ đọc lại localStorage (double-check)
 *    và dùng luôn kết quả tab kia vừa lấy được thay vì gọi refresh lần nữa.
 *
 * Rotation + reuse-detection + grace-window phía server (AuthService.RefreshAsync) vẫn giữ nguyên
 * làm lớp phòng thủ cuối — cơ chế ở đây chỉ nhằm tránh kích hoạt race đó một cách không cần thiết.
 */

interface CachedSession {
  accessToken: string;
  expiresAtUtc: number;
}

interface SessionEntry {
  session: CachedSession | null;
  inFlight: Promise<CachedSession | null> | null;
}

const entries = new Map<string, SessionEntry>();

const STORAGE_PREFIX = "oc-auth-session:";
const LOCK_PREFIX = "oc-auth-refresh:";

// Coi token là "sắp hết hạn" sớm hơn 1 phút so với thời điểm thật, để không dùng token gần chết
// rồi bị 401 giữa chừng ngay sau đó.
const EXPIRY_BUFFER_MS = 60_000;

function getEntry(adminApiBaseUrl: string): SessionEntry {
  let entry = entries.get(adminApiBaseUrl);
  if (!entry) {
    entry = { session: null, inFlight: null };
    entries.set(adminApiBaseUrl, entry);
  }
  return entry;
}

function isValid(session: CachedSession | null | undefined): session is CachedSession {
  return !!session && session.expiresAtUtc - EXPIRY_BUFFER_MS > Date.now();
}

function readStoredSession(adminApiBaseUrl: string): CachedSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + adminApiBaseUrl);
    return raw ? (JSON.parse(raw) as CachedSession) : null;
  } catch {
    // Safari private mode / storage bị chặn — chấp nhận không đồng bộ đa tab, vẫn hoạt động
    // đúng trong phạm vi 1 tab nhờ cache trong bộ nhớ (entry.session).
    return null;
  }
}

function writeStoredSession(adminApiBaseUrl: string, session: CachedSession | null): void {
  try {
    const key = STORAGE_PREFIX + adminApiBaseUrl;
    if (session) {
      localStorage.setItem(key, JSON.stringify(session));
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // Bỏ qua — xem readStoredSession.
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.storageArea !== localStorage || !event.key?.startsWith(STORAGE_PREFIX)) return;
    const adminApiBaseUrl = event.key.slice(STORAGE_PREFIX.length);
    const entry = entries.get(adminApiBaseUrl);
    if (!entry) return;
    entry.session = event.newValue ? (JSON.parse(event.newValue) as CachedSession) : null;
  });
}

async function callRefresh(adminApiBaseUrl: string): Promise<CachedSession | null> {
  const res = await fetch(`${adminApiBaseUrl}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    return null;
  }

  const body = (await res.json()) as { accessToken: string; expiresAtUtc: string };
  return { accessToken: body.accessToken, expiresAtUtc: new Date(body.expiresAtUtc).getTime() };
}

/** navigator.locks (Chrome/Edge/Firefox từ 2021, Safari từ 15.4) — trình duyệt cũ hơn thì chạy thẳng, chấp nhận mất phần chống race liên-tab. */
function withRefreshLock<T>(adminApiBaseUrl: string, fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    // navigator.locks.request flatten Promise trả về từ callback lúc chạy thật (theo spec Web Locks),
    // nhưng kiểu generic của lib.dom suy luận thành Promise<Promise<T>> — ép kiểu lại cho đúng runtime.
    return navigator.locks.request(LOCK_PREFIX + adminApiBaseUrl, fn) as Promise<T>;
  }
  return fn();
}

/**
 * Trả về accessToken hợp lệ hiện có (ưu tiên đọc từ localStorage vì tab khác có thể vừa refresh
 * xong), hoặc refresh nếu chưa có / sắp hết hạn. `null` nghĩa là refresh thất bại — không còn
 * phiên đăng nhập hợp lệ.
 */
export async function getAccessToken(adminApiBaseUrl: string): Promise<string | null> {
  const entry = getEntry(adminApiBaseUrl);

  const stored = readStoredSession(adminApiBaseUrl);
  if (isValid(stored)) {
    entry.session = stored;
    return stored.accessToken;
  }

  if (isValid(entry.session)) {
    return entry.session.accessToken;
  }

  if (!entry.inFlight) {
    entry.inFlight = withRefreshLock(adminApiBaseUrl, async () => {
      // Double-check sau khi giành được lock: tab khác có thể đã refresh xong trong lúc mình chờ.
      const latest = readStoredSession(adminApiBaseUrl);
      if (isValid(latest)) return latest;

      const session = await callRefresh(adminApiBaseUrl);
      writeStoredSession(adminApiBaseUrl, session);
      return session;
    }).finally(() => {
      entry.inFlight = null;
    });
  }

  const session = await entry.inFlight;
  entry.session = session;
  return session?.accessToken ?? null;
}

/** Ép refresh lại ngay cả khi cache còn hợp lệ (vd sau khi gặp 401 bất ngờ từ 1 API call). */
export async function forceRefresh(adminApiBaseUrl: string): Promise<string | null> {
  getEntry(adminApiBaseUrl).session = null;
  return getAccessToken(adminApiBaseUrl);
}

/** Xoá cache khi logout — đồng bộ sang các tab khác qua sự kiện "storage". */
export function clearSession(adminApiBaseUrl: string): void {
  const entry = getEntry(adminApiBaseUrl);
  entry.session = null;
  entry.inFlight = null;
  writeStoredSession(adminApiBaseUrl, null);
}
