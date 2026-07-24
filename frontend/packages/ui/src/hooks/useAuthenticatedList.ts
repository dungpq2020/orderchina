"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AuthListState<T> =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T; accessToken: string };

interface UseAuthenticatedListOptions<T> {
  adminApiBaseUrl: string;
  loginUrl: string;
  /** Gọi endpoint dữ liệu cụ thể (khác nhau theo từng trang) với accessToken đã có sẵn. */
  fetchPage: (page: number, accessToken: string) => Promise<T>;
}

/**
 * Dùng chung cho mọi trang danh sách trong admin-web cần: refresh session qua cookie lúc vào trang,
 * tự tải lại khi quay lại tab, và điều hướng phân trang — để về sau thêm trang mới không phải copy
 * lại logic (và không phải sửa lại từng nơi nếu có bug, như vụ Strict Mode double-fetch /auth/refresh
 * gây "token bị dùng lại" và bị đăng xuất hàng loạt).
 */
export function useAuthenticatedList<T>({ adminApiBaseUrl, loginUrl, fetchPage }: UseAuthenticatedListOptions<T>) {
  const [state, setState] = useState<AuthListState<T>>({ status: "loading" });
  const [page, setPage] = useState(1);
  const stateRef = useRef(state);
  const pageRef = useRef(page);
  stateRef.current = state;
  pageRef.current = page;

  const loadPage = useCallback(
    async (targetPage: number, accessToken: string) => {
      try {
        const data = await fetchPage(targetPage, accessToken);
        setState({ status: "ready", data, accessToken });
      } catch (err) {
        setState({
          status: "error",
          message: err instanceof Error ? err.message : "Lỗi tải dữ liệu.",
        });
      }
    },
    [fetchPage],
  );

  const didBootstrapRef = useRef(false);

  useEffect(() => {
    // Refresh token xoay vòng (mỗi lần gọi /auth/refresh sẽ vô hiệu hoá token cũ) — nếu effect này
    // chạy 2 lần gần như đồng thời (React Strict Mode ở dev tự double-invoke effect: mount → cleanup
    // → mount lại ngay trong cùng 1 tick), request thứ 2 sẽ dùng token đã bị token thứ 1 xoay vòng,
    // bị hệ thống coi là "token bị dùng lại" và thu hồi toàn bộ phiên đăng nhập.
    //
    // Ref này đảm bảo chỉ có 1 lần gọi fetch thật sự (ref giữ nguyên giá trị qua cả 2 lần
    // mount/cleanup của Strict Mode vì cùng 1 fiber). Cố tình KHÔNG dùng thêm cờ "cancelled" ở đây
    // như pattern thông thường — vì cleanup giả của Strict Mode sẽ set cancelled=true trước khi
    // fetch thật (từ lần mount đầu) kịp trả về, khiến kết quả hợp lệ bị bỏ qua và trang bị kẹt ở
    // "loading" mãi mãi. Do ref đã đảm bảo effect này chỉ thực thi đúng 1 lần, không cần chặn thêm.
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    async function bootstrap() {
      try {
        const refreshRes = await fetch(`${adminApiBaseUrl}/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });

        if (!refreshRes.ok) {
          setState({ status: "unauthenticated" });
          return;
        }

        const { accessToken } = (await refreshRes.json()) as { accessToken: string };
        await loadPage(1, accessToken);
      } catch {
        setState({ status: "error", message: "Không kết nối được tới máy chủ." });
      }
    }

    bootstrap();
  }, [adminApiBaseUrl, loadPage]);

  // Tự tải lại dữ liệu khi quay lại tab để dữ liệu luôn gần với thời gian thực nhất có thể.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      const current = stateRef.current;
      if (current.status !== "ready") return;
      loadPage(pageRef.current, current.accessToken);
    }

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [loadPage]);

  useEffect(() => {
    if (state.status === "unauthenticated") {
      window.location.href = loginUrl;
    }
  }, [state.status, loginUrl]);

  function goToPage(targetPage: number) {
    if (state.status !== "ready") return;
    setPage(targetPage);
    loadPage(targetPage, state.accessToken);
  }

  async function logout() {
    await fetch(`${adminApiBaseUrl}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    window.location.href = loginUrl;
  }

  return { state, page, goToPage, logout, setState };
}
