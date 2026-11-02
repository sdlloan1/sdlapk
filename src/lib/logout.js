// Signing out must clear the stored session and land on the login screen.
// The SDK's own logout() calls the hosted logout endpoint with the app's base
// URL, which inside the packaged Android app navigates the WebView away from
// the bundle — so the app clears the tokens itself and routes in-app instead.
export function clearSession() {
  const stores = [];
  try {
    stores.push(window.localStorage, window.sessionStorage);
  } catch (e) {
    // storage can be blocked; nothing to clear then
  }
  stores.forEach((store) => {
    try {
      store.removeItem("base44_access_token");
      store.removeItem("token");
    } catch (e) {
      // best-effort
    }
  });
}

export function logoutToLogin(navigate) {
  clearSession();
  navigate("/login", { replace: true });
}
