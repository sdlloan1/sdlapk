// Origin used for Base44 API calls.
//
// In the browser the app calls the API on its own origin, so this is empty and
// every request stays relative (the deployed site and the dev-server proxy both
// handle /api). The packaged Android app (Capacitor) is served from
// https://localhost, so the APK build sets VITE_BASE44_API_BASE_URL to the
// hosted backend origin instead.
export const API_BASE_URL = import.meta.env.VITE_BASE44_API_BASE_URL || '';

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
