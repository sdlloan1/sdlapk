// Files in public/download/ are committed to the repository, so GitHub hosts
// every build artifact itself. GitHub Pages publishes the web build from main,
// so it serves the same files with the right content types (that is what makes
// Android treat the APK as an app download instead of a text file).
export const GITHUB_REPO = "sdlloan1/sdlapk";
export const GITHUB_PAGES_SITE = "https://sdlloan1.github.io/sdlapk";

/** GitHub Pages download URL for a file from public/download/. */
export const githubDownloadUrl = (name) => `${GITHUB_PAGES_SITE}/download/${encodeURIComponent(name)}`;

/** Raw file URL on GitHub (serves the file bytes without the Pages build). */
export const githubRawUrl = (name) =>
  `https://raw.githubusercontent.com/${GITHUB_REPO}/main/public/download/${encodeURIComponent(name)}`;
