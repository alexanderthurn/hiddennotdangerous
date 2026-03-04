// Electron gamepad bridge
//
// In browser:  no-op — navigator.getGamepads() is untouched.
// In Electron: patches navigator.getGamepads() to return Steam Input data
//              when available (requires real app_id + VDF), otherwise falls
//              back to the original browser Gamepad API (≤4 controllers, dev).
//
// Loaded via index.html before main.js — zero changes to any game file.

if (window.__ELECTRON_BRIDGE__?.isElectron) {
    const _originalGetGamepads = navigator.getGamepads.bind(navigator)
    let _steamGamepads = null

    window.__ELECTRON_BRIDGE__.onGamepadState((gamepads) => {
        _steamGamepads = gamepads
    })

    navigator.getGamepads = () => {
        // Use Steam Input data when controllers are connected and Steam Input
        // is active (real app_id with uploaded VDF).
        if (_steamGamepads !== null && _steamGamepads.length > 0) {
            return _steamGamepads
        }
        // Fallback: browser Gamepad API (used during dev with app_id 480
        // or when Steam is not running).
        return _originalGetGamepads()
    }
}
