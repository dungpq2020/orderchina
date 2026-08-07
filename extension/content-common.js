/**
 * Logic DÙNG CHUNG cho mọi site (dock nổi, đăng nhập, toast, gọi API) — KHÔNG chứa selector đọc DOM
 * theo từng site. Phần đọc dữ liệu trang (ảnh/giá/thuộc tính/số lượng/shop) nằm riêng ở
 * content-taobao.js (dùng chung cho Taobao + Tmall, cùng nền tảng/cấu trúc trang) và content-1688.js
 * (1688 khác cấu trúc, tách riêng để sửa không ảnh hưởng 2 site kia) — mỗi file site tự định nghĩa
 * biến `OC_SITE` rồi gọi `initContentScript()` ở cuối.
 *
 * Nạp theo đúng thứ tự trong manifest.json: config.js → content-common.js → content-{site}.js.
 */

function getMetaContent(...names) {
  for (const name of names) {
    const el =
      document.querySelector(`meta[property="${name}"]`) || document.querySelector(`meta[name="${name}"]`);
    if (el?.content) return el.content.trim();
  }
  return "";
}

function getImageSrc(img) {
  return img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || "";
}

let toastTimer = null;

function showToast(message, type) {
  let toast = document.getElementById("oc-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "oc-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `oc-toast oc-toast-${type}`;
  toast.classList.add("oc-toast-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("oc-toast-visible"), 3500);
}

// ---- Dock ----

function buildDock() {
  const bar = document.createElement("div");
  bar.id = "oc-dock";
  bar.innerHTML = `
    <div class="oc-dock-brand">
      <span class="oc-dock-logo-dot"></span>
      <span class="oc-dock-logo-text">OrderChina</span>
    </div>
    <div class="oc-dock-divider"></div>
    <div id="oc-dock-actions" class="oc-dock-actions"></div>
  `;
  document.body.appendChild(bar);
  return bar;
}

function renderLoggedOutActions() {
  const actions = document.getElementById("oc-dock-actions");
  actions.innerHTML = `<button type="button" id="oc-login-btn" class="oc-dock-btn oc-dock-btn-primary">Đăng nhập</button>`;
  document.getElementById("oc-login-btn").addEventListener("click", openLoginPopover);
}

function renderLoggedInActions() {
  const actions = document.getElementById("oc-dock-actions");
  actions.innerHTML = `
    <a id="oc-view-cart-btn" class="oc-dock-btn oc-dock-btn-ghost" target="_blank" rel="noopener noreferrer" href="${ORDERCHINA_CART_PAGE_URL}">Giỏ hàng</a>
    <button type="button" id="oc-add-btn" class="oc-dock-btn oc-dock-btn-primary">+ Thêm vào giỏ</button>
  `;
  document.getElementById("oc-add-btn").addEventListener("click", (e) => handleAddToCart(e.currentTarget));
}

async function refreshDockState() {
  const state = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });
  if (state.loggedIn) {
    renderLoggedInActions();
  } else {
    renderLoggedOutActions();
  }
}

// ---- Login popover (đăng nhập ngay tại dock, không cần mở popup extension) ----

let loginPopover = null;

function closeLoginPopover() {
  loginPopover?.remove();
  loginPopover = null;
}

function openLoginPopover() {
  if (loginPopover) return;

  loginPopover = document.createElement("div");
  loginPopover.id = "oc-login-popover";
  loginPopover.innerHTML = `
    <div class="oc-login-header">
      <span>Đăng nhập OrderChina</span>
      <button type="button" id="oc-login-close" aria-label="Đóng">✕</button>
    </div>
    <div class="oc-login-body">
      <label>Tài khoản</label>
      <input type="text" id="oc-login-username" autocomplete="username" />
      <label>Mật khẩu</label>
      <input type="password" id="oc-login-password" autocomplete="current-password" />
      <p id="oc-login-error" class="oc-login-error hidden"></p>
      <button type="button" id="oc-login-submit" class="oc-login-submit">Đăng nhập</button>
    </div>
  `;
  document.body.appendChild(loginPopover);

  document.getElementById("oc-login-close").addEventListener("click", closeLoginPopover);
  document.getElementById("oc-login-submit").addEventListener("click", submitLogin);
  document.getElementById("oc-login-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitLogin();
  });
  document.getElementById("oc-login-username").focus();
}

async function submitLogin() {
  const errorEl = document.getElementById("oc-login-error");
  errorEl.classList.add("hidden");

  const username = document.getElementById("oc-login-username").value.trim();
  const password = document.getElementById("oc-login-password").value;
  if (!username || !password) {
    errorEl.textContent = "Vui lòng nhập tài khoản và mật khẩu.";
    errorEl.classList.remove("hidden");
    return;
  }

  const submitBtn = document.getElementById("oc-login-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Đang đăng nhập...";

  const result = await chrome.runtime.sendMessage({ type: "LOGIN", username, password });

  submitBtn.disabled = false;
  submitBtn.textContent = "Đăng nhập";

  if (!result.success) {
    errorEl.textContent = result.error;
    errorEl.classList.remove("hidden");
    return;
  }

  closeLoginPopover();
  await refreshDockState();
  showToast(`Đã đăng nhập ${result.username}`, "success");
}

// ---- Thêm vào giỏ — dùng các hàm extract* do file site (OC_SITE) cung cấp ----

async function handleAddToCart(btn) {
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Đang thêm...";

  try {
    const productName = OC_SITE.extractProductName();
    const { shopName, shopLink } = OC_SITE.extractShopInfo();
    const defaultImageUrl = OC_SITE.extractImageUrl();

    if (!productName) {
      showToast("Không đọc được tên sản phẩm — thử tải lại trang.", "error");
      return;
    }

    // 1688 cho chọn số lượng riêng cho NHIỀU dòng quy cách (có thể cả nhiều màu khác nhau, mỗi màu tự
    // đổi ảnh) cùng lúc — 1 lần bấm gửi hết. Site nào hỗ trợ thì cung cấp extractLineItems() (có thể là
    // async nếu cần mô phỏng click qua từng màu), không thì mặc định 1 dòng như Taobao/Tmall.
    const lineItems = OC_SITE.extractLineItems
      ? await OC_SITE.extractLineItems()
      : [
          {
            attributes: OC_SITE.extractSelectedAttributes(),
            unitPriceCny: OC_SITE.extractPriceCny(),
            quantity: OC_SITE.extractQuantity(),
          },
        ];

    const validItems = lineItems.filter((item) => item.unitPriceCny > 0 && item.quantity > 0);
    if (validItems.length === 0) {
      showToast("Không đọc được giá/số lượng — chọn phân loại rồi thử lại.", "error");
      return;
    }

    let successCount = 0;
    let lastError = null;
    let needsLogin = false;

    for (const item of validItems) {
      const payload = {
        shopName,
        shopLink,
        platform: OC_SITE.platform,
        imageUrl: item.imageUrl || defaultImageUrl,
        productLink: location.href,
        productName,
        attributes: item.attributes,
        unitPriceCny: item.unitPriceCny,
        quantity: item.quantity,
        note: null,
      };

      const result = await chrome.runtime.sendMessage({ type: "ADD_TO_CART", payload });
      if (result.success) {
        successCount++;
      } else {
        lastError = result.error;
        if (result.needsLogin) needsLogin = true;
      }
    }

    if (needsLogin) {
      renderLoggedOutActions();
      openLoginPopover();
    }

    if (successCount === 0) {
      showToast(lastError ?? "Thêm vào giỏ thất bại.", "error");
      return;
    }

    if (successCount < validItems.length) {
      showToast(`Đã thêm ${successCount}/${validItems.length} phân loại — có dòng lỗi: ${lastError ?? ""}`, "error");
      return;
    }

    const summary = validItems.length > 1 ? `${validItems.length} phân loại` : `¥${validItems[0].unitPriceCny} × ${validItems[0].quantity}`;
    showToast(`Đã thêm "${productName.slice(0, 40)}" — ${summary}`, "success");
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/** Gọi ở cuối mỗi file content-{site}.js sau khi đã gán `OC_SITE`. */
function initContentScript() {
  buildDock();
  refreshDockState();
}
