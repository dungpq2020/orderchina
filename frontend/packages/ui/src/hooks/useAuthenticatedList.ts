"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clearSession, getAccessToken } from "../utils/authSession";

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
    // getAccessToken cache token trong bộ nhớ theo adminApiBaseUrl (xem utils/authSession) — chỉ
    // gọi /auth/refresh thật sự khi tab này chưa có token hợp lệ, nên chuyển qua lại giữa các trang
    // trong cùng 1 tab không rotate refresh token cookie mỗi lần nữa (tránh race "reuse_detected"
    // với tab khác khiến cả phiên bị thu hồi oan). Việc dedupe request đồng thời (kể cả React
    // Strict Mode tự double-invoke effect ở dev) cũng nằm trong getAccessToken, nên ref này chỉ
    // cần để tránh gọi loadPage 2 lần, không phải để chặn race refresh như trước.
    if (didBootstrapRef.current) return;
    didBootstrapRef.current = true;

    async function bootstrap() {
      try {
        const accessToken = await getAccessToken(adminApiBaseUrl);

        if (!accessToken) {
          setState({ status: "unauthenticated" });
          return;
        }

        await loadPage(1, accessToken);
      } catch {
        setState({ status: "error", message: "Không kết nối được tới máy chủ." });
      }
    }

    bootstrap();
  }, [adminApiBaseUrl, loadPage]);

  // Tự tải lại dữ liệu khi quay lại tab để dữ liệu luôn gần với thời gian thực nhất có thể.
  // Đi qua getAccessToken (rẻ, thường chỉ đọc cache) thay vì dùng thẳng accessToken cũ trong state,
  // để phát hiện được trường hợp tab khác vừa đăng xuất/thu hồi phiên trong lúc tab này không active.
  useEffect(() => {
    function handleVisible() {
      if (document.visibilityState !== "visible") return;
      const current = stateRef.current;
      if (current.status !== "ready") return;

      getAccessToken(adminApiBaseUrl).then((accessToken) => {
        if (!accessToken) {
          setState({ status: "unauthenticated" });
          return;
        }
        loadPage(pageRef.current, accessToken);
      });
    }

    document.addEventListener("visibilitychange", handleVisible);
    window.addEventListener("focus", handleVisible);
    return () => {
      document.removeEventListener("visibilitychange", handleVisible);
      window.removeEventListener("focus", handleVisible);
    };
  }, [adminApiBaseUrl, loadPage]);

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
    clearSession(adminApiBaseUrl);
    window.location.href = loginUrl;
  }

  return { state, page, goToPage, logout, setState };
}
