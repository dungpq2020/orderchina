// Service worker (Manifest V3) — nơi DUY NHẤT gọi API OrderChina. Content script chạy trong ngữ cảnh
// trang Taobao/1688 nên fetch thẳng tới domain khác sẽ bị CORS chặn; background có host_permissions
// khai trong manifest.json nên fetch cross-origin không bị chặn, content script chỉ cần gửi message qua.
importScripts("config.js");

const STORAGE_KEY = "oc_session";

async function getSession() {
  const data = await chrome.storage.local.get(STORAGE_KEY);
  return data[STORAGE_KEY] ?? null;
}

async function setSession(session) {
  await chrome.storage.local.set({ [STORAGE_KEY]: session });
}

async function clearSession() {
  await chrome.storage.local.remove(STORAGE_KEY);
}

/** Token còn hạn dùng hay không — trừ sẵn 1 phút đề phòng lệch giờ máy/độ trễ mạng. */
function isSessionValid(session) {
  if (!session?.accessToken || !session?.expiresAtUtc) return false;
  return new Date(session.expiresAtUtc).getTime() - 60_000 > Date.now();
}

async function handleLogin(username, password) {
  try {
    const res = await fetch(`${ORDERCHINA_API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const body = await res.json().catch(() => null);

    if (!res.ok) {
      if (body?.requiresTwoFactor) {
        return { success: false, error: "Tài khoản đang bật xác thực 2 lớp — vui lòng đăng nhập trên web trước, extension chưa hỗ trợ nhập mã 2FA." };
      }
      return { success: false, error: body?.error ?? `Đăng nhập thất bại (mã ${res.status}).` };
    }

    await setSession({ username, accessToken: body.accessToken, expiresAtUtc: body.expiresAtUtc });
    return { success: true, username };
  } catch {
    return { success: false, error: "Không kết nối được tới máy chủ OrderChina." };
  }
}

async function handleGetAuthState() {
  const session = await getSession();
  if (!isSessionValid(session)) {
    return { loggedIn: false };
  }
  return { loggedIn: true, username: session.username };
}

async function handleLogout() {
  await clearSession();
  return { success: true };
}

async function handleAddToCart(payload) {
  const session = await getSession();
  if (!isSessionValid(session)) {
    return { success: false, needsLogin: true, error: "Chưa đăng nhập OrderChina — bấm vào icon extension để đăng nhập." };
  }

  try {
    const res = await fetch(`${ORDERCHINA_API_BASE_URL}/cart/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);

    if (res.status === 401) {
      // Access token hết hạn hoặc bị thu hồi — chưa xây refresh token cho extension (xem README),
      // yêu cầu đăng nhập lại là đủ vì access token sống 7 ngày, không cần thiết bị đăng nhập lại thường xuyên.
      await clearSession();
      return { success: false, needsLogin: true, error: "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại." };
    }

    if (!res.ok) {
      return { success: false, error: body?.error ?? `Thêm vào giỏ thất bại (mã ${res.status}).` };
    }

    return { success: true, shopTempId: body.shopTempId };
  } catch {
    return { success: false, error: "Không kết nối được tới máy chủ OrderChina." };
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    switch (message?.type) {
      case "LOGIN":
        sendResponse(await handleLogin(message.username, message.password));
        break;
      case "LOGOUT":
        sendResponse(await handleLogout());
        break;
      case "GET_AUTH_STATE":
        sendResponse(await handleGetAuthState());
        break;
      case "ADD_TO_CART":
        sendResponse(await handleAddToCart(message.payload));
        break;
      default:
        sendResponse({ success: false, error: "Yêu cầu không hợp lệ." });
    }
  })();

  return true; // giữ message channel mở cho response bất đồng bộ (bắt buộc với async listener).
});
