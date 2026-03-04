'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Exposes a minimal, safe API to the renderer.
// Nothing from Node.js leaks through — only these two properties.
contextBridge.exposeInMainWorld('__ELECTRON_BRIDGE__', {
    isElectron: true,

    // Register a callback that receives Steam Input gamepad state arrays.
    // Called at ~60Hz when controllers are connected and Steam Input is active.
    // Falls back to navigator.getGamepads() in the bridge when no data arrives.
    onGamepadState: (callback) => {
        ipcRenderer.on('gamepad-state', (_event, data) => callback(data))
    },
})
