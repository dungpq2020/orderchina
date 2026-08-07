const loadingEl = document.getElementById("loading");
const loginFormEl = document.getElementById("login-form");
const loggedInEl = document.getElementById("logged-in");
const loginErrorEl = document.getElementById("login-error");
const loginSubmitEl = document.getElementById("login-submit");

function showState(el) {
  for (const e of [loadingEl, loginFormEl, loggedInEl]) {
    e.classList.toggle("hidden", e !== el);
  }
}

async function refresh() {
  showState(loadingEl);
  const state = await chrome.runtime.sendMessage({ type: "GET_AUTH_STATE" });
  if (state.loggedIn) {
    document.getElementById("welcome-username").textContent = state.username;
    document.getElementById("open-cart").href = ORDERCHINA_CART_PAGE_URL;
    showState(loggedInEl);
  } else {
    showState(loginFormEl);
  }
}

loginFormEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  loginErrorEl.classList.add("hidden");
  loginSubmitEl.disabled = true;
  loginSubmitEl.textContent = "Đang đăng nhập...";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  const result = await chrome.runtime.sendMessage({ type: "LOGIN", username, password });

  loginSubmitEl.disabled = false;
  loginSubmitEl.textContent = "Đăng nhập";

  if (!result.success) {
    loginErrorEl.textContent = result.error;
    loginErrorEl.classList.remove("hidden");
    return;
  }

  await refresh();
});

document.getElementById("logout").addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "LOGOUT" });
  await refresh();
});

refresh();
