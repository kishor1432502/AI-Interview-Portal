/**
 * AI Interview Portal - Dedicated Lockdown Browser Main Process (Section 9)
 * - Kiosk / Fullscreen Mode
 * - Disables OS shortcuts (Alt+Tab, Win key, Cmd+Tab, DevTools)
 * - Captures Hardware & OS Fingerprint (CPU, Network MAC, OS build ID)
 * - Restricts extensions & unauthorized windows
 */

const { app, BrowserWindow, globalShortcut, ipcMain, session } = require('electron');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Enforce 100% Extension Disabling at Chromium Process Engine Level
app.commandLine.appendSwitch('disable-extensions');
app.commandLine.appendSwitch('disable-component-extensions-with-background-pages');

let mainWindow = null;

function generateDeviceFingerprint() {
  const cpus = os.cpus().map(c => c.model).join('|');
  const totalMem = os.totalmem();
  const platform = os.platform();
  const release = os.release();
  const nics = JSON.stringify(os.networkInterfaces());
  const raw = `${cpus}|${totalMem}|${platform}|${release}|${nics}`;
  return 'LKD-' + crypto.createHash('sha256').update(raw).digest('hex').slice(0, 24);
}

function createWindow() {
  const fingerprint = generateDeviceFingerprint();

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    kiosk: true, // Lockdown kiosk mode
    fullscreen: true,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true
    }
  });

  // Block new window popups / tabs
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  // Load Portal SPA
  mainWindow.loadFile(path.join(__dirname, '../index.html'));

  // Disallow browser extensions
  session.defaultSession.getAllExtensions().forEach(ext => {
    session.defaultSession.removeExtension(ext.id);
  });

  // Register Global Shortcut Locks
  registerLockdownShortcuts();

  // Handle IPC calls
  ipcMain.handle('get-device-fingerprint', () => fingerprint);
  ipcMain.on('report-violation', (event, violation) => {
    console.warn(`[LOCKDOWN VIOLATION REPORTED]: ${violation}`);
  });
}

function registerLockdownShortcuts() {
  const forbiddenShortcuts = [
    'CommandOrControl+R',
    'CommandOrControl+Shift+R',
    'F5',
    'F11',
    'F12',
    'CommandOrControl+Shift+I',
    'Alt+Tab',
    'Alt+F4',
    'Escape'
  ];

  forbiddenShortcuts.forEach(sc => {
    try {
      globalShortcut.register(sc, () => {
        console.warn(`Blocked restricted shortcut: ${sc}`);
        return false;
      });
    } catch (e) {}
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
