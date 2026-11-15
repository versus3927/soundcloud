/* VERSUSCLOUD — Electron shell (Windows, Linux, macOS)
 * The window loads your deployed Railway web app, so the .exe is tiny
 * and always shows the latest version of the service. */
const { app, BrowserWindow, shell, Menu, session } = require("electron");
const path = require("path");
const fs = require("fs");

// URL of the deployed web app. Can be overridden:
//   set VERSUSCLOUD_URL=http://localhost:3000   (dev)
// or edit desktop/url.txt next to this file.
function resolveAppUrl() {
  try {
    const file = path.join(__dirname, "url.txt");
    if (fs.existsSync(file)) {
      const url = fs.readFileSync(file, "utf8").trim();
      if (url && url.startsWith("http")) return url;
    }
  } catch {}
  return process.env.VERSUSCLOUD_URL || "https://versuscloud.up.railway.app";
}

const APP_URL = resolveAppUrl();
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: "VERSUSCLOUD",
    icon: path.join(__dirname, "icon.png"),
    backgroundColor: "#050a07",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  // audio autoplay without user gesture requirement quirks
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) =>
    cb(true),
  );

  mainWindow.loadURL(APP_URL).catch(() => {
    mainWindow.loadURL(
      "data:text/html;charset=utf-8," +
        encodeURIComponent(
          `<body style="background:#050a07;color:#00e065;font-family:sans-serif;display:grid;place-items:center;height:100vh">
            <div style="text-align:center">
              <h1>VERSUSCLOUD</h1>
              <p style="color:#8fa89a">Не удалось открыть ${APP_URL}.<br/>Проверь интернет или URL в desktop/url.txt</p>
            </div>
          </body>`,
        ),
    );
  });

  // external links → system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith(APP_URL)) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
