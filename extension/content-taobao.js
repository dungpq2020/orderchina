/**
 * Đọc dữ liệu sản phẩm trên trang Taobao/Tmall (cùng nền tảng Alibaba, cấu trúc trang gần như nhau).
 * SPA nặng JS, class thường bị obfuscate và đổi theo từng đợt deploy — các selector bên dưới chỉ là
 * suy đoán hợp lý (dò theo pattern tên class phổ biến + fallback quét regex trên text hiển thị), không
 * phải đã kiểm thử trên DOM thật vì cần đăng nhập mới xem được trang sản phẩm. Bắt sai giá/thuộc tính
 * thì sửa ngay TRONG FILE NÀY, không ảnh hưởng tới content-1688.js.
 */

const OC_TAOBAO_PLATFORM = location.hostname.includes("tmall.com") ? "Tmall" : "Taobao";

// Pattern class/attribute phổ biến cho trạng thái "đang được chọn" (màu/size/phân loại...) — dùng chung
// cho cả đọc thuộc tính lẫn đọc ảnh theo đúng phân loại khách đang chọn.
const OC_TAOBAO_SELECTED_SELECTOR =
  '[class*="selected" i], [aria-checked="true"], [class*="isSelect" i], [class*="active" i][class*="sku" i], [class*="active" i][class*="item" i]';

function ocTaobaoExtractProductName() {
  const og = getMetaContent("og:title");
  if (og) return og;
  const title = document.title || "";
  return title.split(/[-–|]/)[0].trim();
}

/** Ảnh minh hoạ nằm ngay trong nút phân loại (màu/mẫu) đang được chọn — đúng ảnh khách vừa bấm chọn,
 * không phải ảnh mặc định của cả sản phẩm (có thể là màu khác). */
function ocTaobaoExtractSelectedAttributeImage() {
  const selectedEls = document.querySelectorAll(OC_TAOBAO_SELECTED_SELECTOR);
  for (const el of selectedEls) {
    const img = el.querySelector("img");
    if (!img) continue;
    const src = getImageSrc(img);
    if (!src || src.startsWith("data:")) continue;
    const rect = img.getBoundingClientRect();
    const size = Math.max(img.naturalWidth || rect.width || 0, img.naturalHeight || rect.height || 0);
    if (size < 40) continue; // quá nhỏ khả năng cao là icon/badge trang trí, không phải ảnh sản phẩm.
    return src;
  }
  return null;
}

/** og:image thường không có/không kịp render trên trang SPA cần đăng nhập như Taobao — rơi về chọn
 * ảnh <img> to nhất, nằm ở nửa trên trang (khả năng cao là ảnh gallery sản phẩm chứ không phải icon/banner). */
function ocTaobaoExtractDefaultImage() {
  const og = getMetaContent("og:image");
  if (og) return og;

  const candidates = Array.from(document.querySelectorAll("img"))
    .map((img) => {
      const rect = img.getBoundingClientRect();
      return {
        src: getImageSrc(img),
        area: (img.naturalWidth || rect.width || 0) * (img.naturalHeight || rect.height || 0),
        top: rect.top + window.scrollY,
      };
    })
    .filter((c) => c.src && !c.src.startsWith("data:") && c.area >= 100 * 100 && c.top < 1600);

  candidates.sort((a, b) => b.area - a.area);
  return candidates[0]?.src || null;
}

function ocTaobaoExtractImageUrl() {
  return ocTaobaoExtractSelectedAttributeImage() || ocTaobaoExtractDefaultImage();
}

/** Ưu tiên khối có class chứa "price" nhưng không phải giá gạch ngang (giá gốc trước KM); rơi về quét regex ¥/￥ toàn trang nếu không tìm được. */
function ocTaobaoExtractPriceCny() {
  const candidates = document.querySelectorAll(
    '[class*="price" i]:not([class*="origin" i]):not([class*="delete" i]):not(del), [class*="Price" i]',
  );
  for (const el of candidates) {
    if (el.querySelector("del, s, [class*='origin' i], [class*='delete' i]")) continue;
    const match = el.textContent.match(/(\d[\d,]*\.?\d{0,2})/);
    if (match) {
      const value = Number(match[1].replace(/,/g, ""));
      if (value > 0 && value < 1_000_000) return value;
    }
  }

  const bodyText = document.body.innerText || "";
  const match = bodyText.match(/[¥￥]\s?(\d[\d,]*\.?\d{0,2})/);
  if (match) {
    const value = Number(match[1].replace(/,/g, ""));
    if (value > 0) return value;
  }

  return null;
}

/** Gom text của các phần tử "đang được chọn" (màu/size...). */
function ocTaobaoExtractSelectedAttributes() {
  const selectedEls = document.querySelectorAll(OC_TAOBAO_SELECTED_SELECTOR);
  const texts = new Set();
  for (const el of selectedEls) {
    // Nút chọn màu/size đôi khi kèm badge tồn kho/số lượng dính chung trong DOM — loại phần tử
    // "*badge*" trước khi đọc text để tránh dính số lạ vào tên thuộc tính (VD: "Đen5" thay vì "Đen").
    const clone = el.cloneNode(true);
    clone.querySelectorAll('[class*="badge" i]').forEach((b) => b.remove());
    const text = clone.textContent?.trim();
    // Bỏ qua phần tử rỗng, quá dài chữ (khả năng là container cha), hoặc số trơ trọi (rò rỉ badge).
    if (text && text.length > 0 && text.length <= 20 && !/^\d+$/.test(text)) {
      texts.add(text);
    }
  }
  return texts.size > 0 ? Array.from(texts).join(", ") : null;
}

function ocTaobaoExtractQuantity() {
  const input = document.querySelector(
    'input[class*="quantity" i], input[class*="amount" i], input[class*="count" i], input[type="number"]',
  );
  if (input) {
    const value = Number(input.value);
    if (value > 0) return Math.floor(value);
  }

  // Nhiều site dựng stepper số lượng bằng div/span (không phải input thật) nằm giữa 2 nút +/-.
  // Tìm nút +/- rồi đọc số ở phần tử cha (thường chứa cả 2 nút và số ở giữa).
  const stepButtons = Array.from(document.querySelectorAll("button, span, a, i")).filter((el) => {
    if (el.children.length > 0) return false; // chỉ lấy phần tử lá, tránh khớp nhầm container to.
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
    return label === "+" || label === "-" || /plus|minus|increase|decrease|jian|add\b/i.test(el.className || "");
  });
  for (const btn of stepButtons) {
    const container = btn.parentElement;
    if (!container) continue;
    const text = container.textContent.replace(/[+\-]/g, "").trim();
    const value = Number(text);
    if (value > 0 && value < 10_000) return Math.floor(value);
  }

  return 1;
}

/**
 * Xác định shop thật của sản phẩm — a[href*="shop"] một mình rất dễ bắt nhầm link quảng cáo mời BÁN
 * HÀNG trên Taobao ("免费开店"/"入驻", không liên quan gì tới sản phẩm đang xem), khiến nhiều sản phẩm
 * của nhiều shop khác nhau bị gộp chung 1 nhãn "Taobao Shop" → merge sai vào 1 giỏ trong hệ thống.
 */
function ocTaobaoExtractShopInfo() {
  const candidates = Array.from(
    document.querySelectorAll('a[href*="shop"], a[href*="myseller"], a[href*="mall."], a[href*="winport"]'),
  ).filter((a) => {
    const text = (a.textContent || "").trim();
    const href = a.href || "";
    return !/开店|入驻/.test(text) && !/开店|入驻/.test(href);
  });

  // Ưu tiên href dạng "shopXXXX.taobao.com" hoặc kèm tham số định danh người bán — đúng shop hơn là
  // link chung chung đầu tiên khớp được.
  const preferred = candidates.find((a) => /^https?:\/\/shop\d/i.test(a.href) || /user_number_id=/i.test(a.href));
  const shopLinkEl = preferred || candidates[0] || null;

  if (shopLinkEl) {
    const shopName = shopLinkEl.getAttribute("title")?.trim() || shopLinkEl.textContent?.trim();
    if (shopName) {
      return { shopName, shopLink: shopLinkEl.href };
    }
  }

  // Không xác định được shop thật — KHÔNG gộp chung 1 nhãn cố định (sẽ merge nhầm sản phẩm của các
  // shop khác nhau vào chung 1 giỏ), tách theo id sản phẩm trong URL để giữ đúng ranh giới từng shop.
  const idMatch = location.href.match(/[?&]id=(\d+)/);
  const fallbackKey = idMatch ? idMatch[1].slice(-6) : Date.now().toString().slice(-6);
  return { shopName: `${OC_TAOBAO_PLATFORM} (chưa xác định shop) #${fallbackKey}`, shopLink: null };
}

const OC_SITE = {
  platform: OC_TAOBAO_PLATFORM,
  extractProductName: ocTaobaoExtractProductName,
  extractImageUrl: ocTaobaoExtractImageUrl,
  extractPriceCny: ocTaobaoExtractPriceCny,
  extractSelectedAttributes: ocTaobaoExtractSelectedAttributes,
  extractQuantity: ocTaobaoExtractQuantity,
  extractShopInfo: ocTaobaoExtractShopInfo,
};

initContentScript();
