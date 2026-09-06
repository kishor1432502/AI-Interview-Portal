const { contextBridge, ipcRenderer } = require('electron');

// Expose safe lockdown APIs to renderer window (Section 9)
contextBridge.exposeInMainWorld('LockdownBridge', {
  isLockdownActive: true,
  getDeviceFingerprint: () => ipcRenderer.invoke('get-device-fingerprint'),
  reportViolation: (violationType) => ipcRenderer.send('report-violation', violationType),
  sendHeartbeat: (sessionId) => ipcRenderer.send('session-heartbeat', sessionId)
});

window.__LOCKDOWN_ACTIVE__ = true;
