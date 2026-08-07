/**
 * Đọc dữ liệu sản phẩm trên trang 1688 — tách riêng khỏi content-taobao.js vì 1688 là nền tảng B2B khác
 * Taobao/Tmall (dù cùng Alibaba), cấu trúc trang không giống nhau. Các selector bên dưới hiện dùng
 * chung logic khởi điểm với Taobao (chưa có mẫu DOM thật của 1688 để tinh chỉnh riêng) — bắt sai
 * giá/thuộc tính/số lượng trên 1688 thì sửa ngay TRONG FILE NÀY, không ảnh hưởng tới content-taobao.js.
 */

const OC_1688_PLATFORM = "1688";

// Pattern class/attribute phổ biến cho trạng thái "đang được chọn" (màu/size/phân loại...).
const OC_1688_SELECTED_SELECTOR =
  '[class*="selected" i], [aria-checked="true"], [class*="isSelect" i], [class*="active" i][class*="sku" i], [class*="active" i][class*="item" i]';

function oc1688ExtractProductName() {
  const og = getMetaContent("og:title");
  if (og) return og;
  const title = document.title || "";
  return title.split(/[-–|]/)[0].trim();
}

/** 1688 hay set ảnh minh hoạ theo quy cách qua CSS `background: url(...)` trên 1 <div> (VD: class
 * "prop-img"), KHÔNG dùng thẻ <img> — kiểm thử trên DOM thật. */
function oc1688GetBackgroundImageUrl(el) {
  const value = (el.style && el.style.backgroundImage) || getComputedStyle(el).backgroundImage;
  const match = value && value.match(/url\(["']?([^"')]+)["']?\)/);
  return match ? match[1] : null;
}

/** Ảnh minh hoạ nằm ngay trong nút phân loại (màu/mẫu) đang được chọn — đúng ảnh khách vừa bấm chọn.
 * Thử cả <img> lẫn <div> nền CSS. Lọc ảnh quá nhỏ (< 24px) vì khả năng cao là icon trang trí, không
 * phải ảnh sản phẩm — ảnh quy cách 1688 thật (đã kiểm thử) cỡ 36×36px nên để ngưỡng thấp hơn Taobao. */
function oc1688ExtractSelectedAttributeImage() {
  const selectedEls = document.querySelectorAll(OC_1688_SELECTED_SELECTOR);
  for (const el of selectedEls) {
    // Loại badge trang trí "轻定制" (light customization) — hay bị bắt nhầm vì cũng dính class
    // "active"/"selected" nhưng không phải ảnh biến thể sản phẩm (đã kiểm thử, xác nhận là icon badge).
    if (/定制/.test(el.textContent || "")) continue;

    const img = el.tagName === "IMG" ? el : el.querySelector("img");
    if (img) {
      const src = getImageSrc(img);
      if (src && !src.startsWith("data:")) {
        const rect = img.getBoundingClientRect();
        const size = Math.max(img.naturalWidth || rect.width || 0, img.naturalHeight || rect.height || 0);
        if (size >= 24) return src;
      }
    }

    const bgCandidates = el.matches('[style*="background"]') ? [el] : Array.from(el.querySelectorAll('[style*="background"]'));
    for (const bgEl of bgCandidates) {
      const src = oc1688GetBackgroundImageUrl(bgEl);
      if (!src) continue;
      const rect = bgEl.getBoundingClientRect();
      if (Math.max(rect.width, rect.height) >= 24) return src;
    }
  }
  return null;
}

/** og:image thường không có/không kịp render trên trang SPA cần đăng nhập — rơi về chọn ảnh (thẻ <img>
 * hoặc <div> nền CSS) to nhất, nằm ở nửa trên trang (khả năng cao là ảnh gallery sản phẩm chứ không
 * phải icon/banner). */
function oc1688ExtractDefaultImage() {
  const og = getMetaContent("og:image");
  if (og) return og;

  const imgCandidates = Array.from(document.querySelectorAll("img")).map((img) => {
    const rect = img.getBoundingClientRect();
    return {
      src: getImageSrc(img),
      area: (img.naturalWidth || rect.width || 0) * (img.naturalHeight || rect.height || 0),
      top: rect.top + window.scrollY,
    };
  });

  const bgCandidates = Array.from(document.querySelectorAll('[style*="background"]')).map((el) => {
    const rect = el.getBoundingClientRect();
    return {
      src: oc1688GetBackgroundImageUrl(el),
      area: rect.width * rect.height,
      top: rect.top + window.scrollY,
    };
  });

  const candidates = [...imgCandidates, ...bgCandidates].filter(
    (c) => c.src && !c.src.startsWith("data:") && c.area >= 100 * 100 && c.top < 1600,
  );

  candidates.sort((a, b) => b.area - a.area);
  return candidates[0]?.src || null;
}

function oc1688ExtractImageUrl() {
  return oc1688ExtractSelectedAttributeImage() || oc1688ExtractDefaultImage();
}

/** Ưu tiên khối có class chứa "price" nhưng không phải giá gạch ngang (giá gốc trước KM); rơi về quét regex ¥/￥ toàn trang nếu không tìm được. */
function oc1688ExtractPriceCny() {
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

/** Gom text của các phần tử "đang được chọn" (màu/size...). Nút chọn màu/size hay có kèm badge tồn
 * kho (VD: class "label-badge" hiện "5" = còn 5 cái) nằm CHUNG trong nút — lấy nguyên textContent sẽ
 * dính cả badge vào tên thuộc tính (VD: "深蓝色5"). Ưu tiên đọc riêng ".label-name" nếu có; không thì
 * loại bỏ mọi phần tử "*badge*" trước khi đọc text. */
function oc1688ExtractSelectedAttributes() {
  const selectedEls = document.querySelectorAll(OC_1688_SELECTED_SELECTOR);
  const texts = new Set();
  for (const el of selectedEls) {
    const labelEl = el.querySelector('[class*="label-name" i], [class*="labelName" i]');
    let text;
    if (labelEl) {
      text = labelEl.textContent?.trim();
    } else {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[class*="badge" i]').forEach((b) => b.remove());
      text = clone.textContent?.trim();
    }

    if (!text || text.length === 0 || text.length > 20) continue;
    if (/^\d+$/.test(text)) continue; // số trơ trọi — khả năng cao là rò rỉ từ badge/số lượng, không phải thuộc tính thật.
    texts.add(text);
  }
  return texts.size > 0 ? Array.from(texts).join(", ") : null;
}

// Dùng chung 1 nguồn duy nhất (oc1688CollectQuantityCandidates, khai báo bên dưới) cho cả trường hợp
// 1 dòng lẫn nhiều dòng quy cách — tránh 2 hàm tách rời dễ sửa 1 bên quên bên kia (đã từng bị vậy).
function oc1688ExtractQuantity() {
  const candidates = oc1688CollectQuantityCandidates();
  return candidates[0]?.value ?? 1;
}

/**
 * 1688 KHÔNG nhất quán cấu trúc tên shop giữa các trang/template — đã kiểm thử 2 trang thật ra 2 kiểu
 * khác hẳn nhau (1 trang dùng data-spm-anchor-id chứa "shopNavigation", trang kia dùng span[title]
 * không có "shopNavigation" trong spm). Dò tổng quát: phần tử có `title` trùng khớp CHÍNH XÁC text
 * hiển thị của nó (dấu hiệu dùng title để tooltip khi tên bị cắt bớt — rất hay dùng cho tên
 * shop/company dài) và nằm gần đầu trang (khối thông tin shop luôn ở trên, không lẫn với nội dung khác).
 */
function oc1688FindShopNameByTitleMirror() {
  for (const el of document.querySelectorAll("[title]")) {
    const title = el.getAttribute("title")?.trim();
    const text = el.textContent?.trim();
    if (!title || title !== text) continue;
    if (title.length < 4 || title.length > 40) continue;
    if (/^(更多|详情|复制|分享|收藏|首页|客服|进店|关注)$/.test(title)) continue;

    const rect = el.getBoundingClientRect();
    if (rect.top + window.scrollY > 1000) continue;
    return el;
  }
  return null;
}

/**
 * Xác định shop thật của sản phẩm — a[href*="shop"] một mình rất dễ bắt nhầm link quảng cáo mời BÁN
 * HÀNG trên 1688 ("免费开店"/"入驻", không liên quan gì tới sản phẩm đang xem), khiến nhiều sản phẩm
 * của nhiều shop khác nhau bị gộp chung 1 nhãn → merge sai vào 1 giỏ trong hệ thống.
 */
function oc1688ExtractShopInfo() {
  const navEl =
    document.querySelector('[data-spm-anchor-id*="shopNavigation" i]') ||
    document.querySelector(
      '[class*="shopName" i], [class*="companyName" i], [class*="storeName" i], [class*="sellerName" i], [class*="shop-name" i]',
    ) ||
    oc1688FindShopNameByTitleMirror();

  if (navEl) {
    const shopName = navEl.getAttribute("title")?.trim() || navEl.textContent?.trim();
    if (shopName) {
      const linkEl = navEl.closest("a") || navEl.querySelector("a");
      return { shopName, shopLink: linkEl?.href || null };
    }
  }

  // Dự phòng nếu trang không có data-spm-anchor-id đó — dò link <a> có vẻ dẫn tới trang shop, loại
  // link quảng cáo mời BÁN HÀNG ("免费开店"/"入驻", không liên quan sản phẩm đang xem).
  const candidates = Array.from(
    document.querySelectorAll('a[href*="shop"], a[href*="winport"], a[href*="page.1688.com"], a[href*="member"]'),
  ).filter((a) => {
    const text = (a.textContent || "").trim();
    const href = a.href || "";
    return !/开店|入驻/.test(text) && !/开店|入驻/.test(href);
  });

  const preferred = candidates.find((a) => /^https?:\/\/[\w-]+\.1688\.com/i.test(a.href) && /winport|page\.1688/i.test(a.href));
  const shopLinkEl = preferred || candidates[0] || null;

  if (shopLinkEl) {
    const shopName = shopLinkEl.getAttribute("title")?.trim() || shopLinkEl.textContent?.trim();
    if (shopName) {
      return { shopName, shopLink: shopLinkEl.href };
    }
  }

  // Không xác định được shop thật — KHÔNG gộp chung 1 nhãn cố định (sẽ merge nhầm sản phẩm của các
  // shop khác nhau vào chung 1 giỏ), tách theo id sản phẩm trong URL để giữ đúng ranh giới từng shop.
  const idMatch = location.href.match(/\/offer\/(\d+)\.html/);
  const fallbackKey = idMatch ? idMatch[1].slice(-6) : Date.now().toString().slice(-6);
  return { shopName: `${OC_1688_PLATFORM} (chưa xác định shop) #${fallbackKey}`, shopLink: null };
}

/**
 * Gom mọi "ô số lượng" đang có giá trị > 0 trên trang — gồm cả input thật LẪN stepper dạng span/div
 * (không phải input, số nằm giữa 2 nút +/-, giống lỗi số lượng chính đã gặp ở Taobao). 1688 có thể có
 * NHIỀU stepper cùng lúc (mỗi dòng quy cách 1 cái) nên duyệt hết, không dừng ở cái đầu tiên tìm được.
 */
function oc1688CollectQuantityCandidates() {
  // 1688 dùng nhiều thư viện UI khác nhau tuỳ trang/template (đã kiểm thử ra ít nhất 2 kiểu: Alibaba
  // Fusion ".next-input-group" và Ant Design "ant-input-number-input") — input[role="spinbutton"] là
  // ARIA role chuẩn cho ô số dạng stepper, không phụ thuộc thư viện nào nên ưu tiên dùng cái này.
  const inputSelector =
    'input[role="spinbutton"], input[class*="quantity" i], input[class*="amount" i], input[class*="count" i], input[class*="input-number" i], input[type="number"], .next-input-group input, .next-number-picker input';
  const candidates = [];

  for (const input of document.querySelectorAll(inputSelector)) {
    const value = Number(input.value);
    if (value > 0) candidates.push({ value: Math.floor(value), el: input });
  }

  const plusButtons = Array.from(document.querySelectorAll("button, span, a, i")).filter((el) => {
    if (el.children.length > 0) return false; // chỉ lấy phần tử lá, tránh khớp nhầm container to.
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim();
    return label === "+" || /plus|increase|add\b/i.test(el.className || "");
  });
  for (const plusBtn of plusButtons) {
    const container = plusBtn.parentElement;
    if (!container || container.querySelector(inputSelector)) continue; // đã lấy ở nhánh input rồi.
    const text = container.textContent.replace(/[+\-]/g, "").trim();
    const value = Number(text);
    if (value > 0 && value < 10_000) candidates.push({ value: Math.floor(value), el: container });
  }

  return candidates;
}

const OC_1688_PRICE_PATTERN = /[¥￥]\s?(\d[\d,]*\.?\d{0,2})|(\d[\d,]*\.?\d{0,2})\s?元/;

/**
 * "Dòng quy cách" = tổ tiên gần nhất (đi lên tối đa 8 cấp) chứa cả ô số lượng lẫn 1 mức giá. Không cố
 * định theo 1 tên class cụ thể (VD ".expand-view-item"/".sku-item-wrapper") vì đã kiểm thử 3 trang
 * 1688 ra 3 cấu trúc/thư viện UI khác nhau — cách này tổng quát hơn, ít phụ thuộc đợt đổi giao diện.
 */
function oc1688FindRowWithPrice(el) {
  let node = el;
  for (let i = 0; i < 8 && node; i++) {
    if (node.nodeType === 1 && OC_1688_PRICE_PATTERN.test(node.textContent || "")) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

/** Đọc size/số lượng/giá của MÀU ĐANG ACTIVE tại thời điểm gọi — không tự đổi màu. Dùng lại được cho
 * cả trường hợp 1 màu duy nhất lẫn từng bước khi duyệt qua nhiều màu (oc1688ExtractLineItems bên dưới). */
function oc1688ExtractSizeLineItemsForCurrentColor() {
  const items = [];
  const seenRows = new Set();

  for (const { value: quantity, el } of oc1688CollectQuantityCandidates()) {
    const row = oc1688FindRowWithPrice(el);
    if (!row || seenRows.has(row)) continue;

    const rowText = row.textContent || "";
    const priceMatch = rowText.match(OC_1688_PRICE_PATTERN);
    const unitPriceCny = priceMatch ? Number((priceMatch[1] || priceMatch[2]).replace(/,/g, "")) : null;
    if (!unitPriceCny) continue;

    seenRows.add(row);

    // Cắt nhãn tại đúng vị trí khớp giá (không phụ thuộc ký hiệu ¥/￥/元) — 1688 hay hiển thị dạng
    // "3.90元" không có ký hiệu tiền tệ đứng trước.
    const rowLabel = rowText.slice(0, priceMatch.index).trim().slice(0, 30) || null;

    // 1 số trang 1688 gắn thẳng ảnh riêng cho từng dòng quy cách (VD class "item-image-icon") thay vì
    // gộp chung 1 khối màu — lấy ảnh ngay trong row nếu có, kiểm thử trên DOM thật.
    const rowImg = row.querySelector("img");
    const rowImageUrl = rowImg ? getImageSrc(rowImg) : null;

    items.push({ rowLabel, unitPriceCny, quantity, rowImageUrl });
  }

  return items;
}

/** Khối "颜色" (màu) — mỗi lựa chọn là 1 nút .sku-filter-button, tìm theo tiêu đề khối feature-item chứa "颜色"/"color" để không lẫn khối "尺码" (size). */
function oc1688FindColorButtons() {
  const section = Array.from(document.querySelectorAll(".feature-item")).find((s) =>
    /颜色|color/i.test(s.querySelector(".feature-item-label")?.textContent || ""),
  );
  if (!section) return [];
  return Array.from(section.querySelectorAll(".sku-filter-button, [class*='sku-filter' i]"));
}

/** Badge tồn trên nút màu (VD "1") — 1688 dùng để nhắc bạn đã gán số lượng cho màu đó (kể cả khi đang xem màu khác). */
function oc1688GetColorBadgeQuantity(btn) {
  const badge = btn.querySelector('[class*="badge" i]');
  const value = Number(badge?.textContent?.trim());
  return value > 0 ? value : 0;
}

function ocSleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 1688 chỉ RENDER bảng size/số lượng của ĐÚNG 1 màu đang active tại 1 thời điểm — không có cách nào
 * đọc được size của các màu khác nếu không thật sự click vào từng màu để trang tự vẽ lại bảng size
 * tương ứng. Vì vậy: duyệt qua từng nút màu có badge > 0 (dấu hiệu đã gán số lượng), click, đợi trang
 * cập nhật, đọc size/số lượng/ảnh của màu đó, rồi khôi phục lại đúng màu ban đầu sau khi xong — để
 * không làm rối trang của khách.
 * RỦI RO: mô phỏng click thật lên trang thật — CHƯA kiểm thử được trên phiên đăng nhập 1688 thật, báo
 * lại nếu bấm nhầm/bỏ sót màu nào.
 */
async function oc1688ExtractLineItems() {
  const colorButtons = oc1688FindColorButtons();

  if (colorButtons.length === 0) {
    // Không có khối màu — chỉ có size (hoặc chỉ 1 lựa chọn giá duy nhất).
    const sizeItems = oc1688ExtractSizeLineItemsForCurrentColor();
    if (sizeItems.length > 0) {
      return sizeItems.map(({ rowLabel, unitPriceCny, quantity, rowImageUrl }) => ({
        attributes: rowLabel,
        unitPriceCny,
        quantity,
        imageUrl: rowImageUrl,
      }));
    }
    const unitPriceCny = oc1688ExtractPriceCny();
    const quantity = oc1688ExtractQuantity();
    return unitPriceCny > 0 && quantity > 0 ? [{ attributes: oc1688ExtractSelectedAttributes(), unitPriceCny, quantity }] : [];
  }

  const originalActiveBtn = colorButtons.find((b) => /active/i.test(b.className)) || null;
  const badgedButtons = colorButtons.filter((b) => oc1688GetColorBadgeQuantity(b) > 0);
  // Không màu nào có badge — chỉ đọc đúng màu đang active hiện tại, không cần click gì thêm.
  const targets = badgedButtons.length > 0 ? badgedButtons : originalActiveBtn ? [originalActiveBtn] : [];

  const items = [];
  for (const btn of targets) {
    btn.click();
    await ocSleep(400);

    const colorLabel = btn.querySelector('[class*="label-name" i]')?.textContent?.trim() || null;
    const colorImg = btn.querySelector("img");
    const colorImageUrl = colorImg ? getImageSrc(colorImg) : null;

    const sizeItems = oc1688ExtractSizeLineItemsForCurrentColor();
    if (sizeItems.length > 0) {
      for (const { rowLabel, unitPriceCny, quantity, rowImageUrl } of sizeItems) {
        const attributes = [colorLabel, rowLabel].filter(Boolean).join(", ") || null;
        // Ưu tiên ảnh riêng của dòng size (nếu trang có) — không thì dùng ảnh của khối màu.
        items.push({ attributes, unitPriceCny, quantity, imageUrl: rowImageUrl || colorImageUrl });
      }
    } else {
      // Màu này không có bảng size riêng (giá/số lượng nằm ngay ở khối màu) — dùng giá/số lượng chung.
      const unitPriceCny = oc1688ExtractPriceCny();
      const quantity = oc1688GetColorBadgeQuantity(btn) || oc1688ExtractQuantity();
      if (unitPriceCny > 0 && quantity > 0) {
        items.push({ attributes: colorLabel, unitPriceCny, quantity, imageUrl: colorImageUrl });
      }
    }
  }

  // Khôi phục lại đúng màu ban đầu để không làm rối trang của khách sau khi đọc xong.
  if (originalActiveBtn) {
    originalActiveBtn.click();
    await ocSleep(200);
  }

  return items;
}

const OC_SITE = {
  platform: OC_1688_PLATFORM,
  extractProductName: oc1688ExtractProductName,
  extractImageUrl: oc1688ExtractImageUrl,
  extractPriceCny: oc1688ExtractPriceCny,
  extractSelectedAttributes: oc1688ExtractSelectedAttributes,
  extractQuantity: oc1688ExtractQuantity,
  extractShopInfo: oc1688ExtractShopInfo,
  extractLineItems: oc1688ExtractLineItems,
};

initContentScript();
