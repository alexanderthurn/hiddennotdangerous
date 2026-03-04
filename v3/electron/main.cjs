'use strict'

const { app, BrowserWindow } = require('electron')
const path = require('path')

const POLL_MS = Math.round(1000 / 60)
const DEV_SERVER_URL = 'http://localhost:5173'

let mainWindow = null

// ---------------------------------------------------------------------------
// Steam overlay (optional — only active when launched via Steam with a valid
// app_id. Currently uses 480 (Spacewar) for testing. Replace before release.)
// ---------------------------------------------------------------------------

function initSteam() {
    try {
        const steamworks = require('steamworks.js')
        steamworks.init(480)
        console.log('[Steam] Initialized. Overlay active when launched via Steam.')
    } catch (e) {
        console.warn('[Steam] Not available (launch through Steam to enable overlay):', e.message)
    }
}

// ---------------------------------------------------------------------------
// SDL2 controllers — cross-platform, no 4-controller limit, self-contained
//
// @kmamal/sdl bundles SDL2 automatically. No system install needed.
// Supports Xbox, PlayStation, Nintendo, and generic controllers.
// On Windows: uses HIDAPI for Xbox controllers to bypass XInput's 4-device cap.
// ---------------------------------------------------------------------------

const sdl = require('@kmamal/sdl')
const _controllers = new Map()  // device.id → { instance, index }
let _nextIndex = 0

function btn(pressed, value) {
    const p = Boolean(pressed)
    return { pressed: p, value: typeof value === 'number' ? value : (p ? 1.0 : 0.0) }
}

// Build a Gamepad-API-shaped object from a live ControllerInstance.
// Reading .axes/.buttons triggers SDL's internal event poll automatically.
function buildGamepadState(instance, index) {
    const ax = instance.axes
    const bu = instance.buttons
    const lt = ax.leftTrigger   // 0..1
    const rt = ax.rightTrigger  // 0..1

    return {
        index,
        connected: true,
        id: instance.device.name || `SDL2 Controller (${index})`,
        mapping: 'standard',
        timestamp: Date.now(),
        // SDL Y: -1=up, +1=down — matches Gamepad API convention, no inversion needed
        axes: [ax.leftStickX, ax.leftStickY, ax.rightStickX, ax.rightStickY],
        buttons: [
            btn(bu.a),              // 0  South         → Attack
            btn(bu.b),              // 1  East          → Speed
            btn(bu.x),              // 2  West          → Walk
            btn(bu.y),              // 3  North         → Marker
            btn(bu.leftShoulder),   // 4  LB            → restart combo
            btn(bu.rightShoulder),  // 5  RB            → restart combo
            btn(lt > 0.5, lt),      // 6  LT (analog)   → restart combo
            btn(rt > 0.5, rt),      // 7  RT (analog)   → restart combo
            btn(bu.back),           // 8  Select
            btn(bu.start),          // 9  Start
            btn(bu.leftStick),      // 10 L3            → restart combo
            btn(bu.rightStick),     // 11 R3            → restart combo
            btn(bu.dpadUp),         // 12 D-Pad Up
            btn(bu.dpadDown),       // 13 D-Pad Down
            btn(bu.dpadLeft),       // 14 D-Pad Left
            btn(bu.dpadRight),      // 15 D-Pad Right
            btn(bu.guide),          // 16 Guide
        ],
    }
}

function openController(device) {
    if (_controllers.has(device.id)) return
    try {
        const instance = sdl.controller.openDevice(device)
        const index = _nextIndex++
        _controllers.set(device.id, { instance, index })
        instance.on('close', () => _controllers.delete(device.id))
        console.log(`[SDL2] Connected: "${device.name}" (type: ${device.type ?? 'unknown'}) → slot ${index}`)
    } catch (e) {
        console.warn(`[SDL2] Failed to open "${device.name}":`, e.message)
    }
}

function initSDL() {
    // Open controllers already connected at startup
    for (const device of sdl.controller.devices) {
        openController(device)
    }

    // Hot-plug: open new controllers as they connect
    sdl.controller.on('deviceAdd', ({ device }) => openController(device))

    // Hot-plug: clean up when controllers disconnect
    sdl.controller.on('deviceRemove', ({ device }) => {
        _controllers.delete(device.id)
        console.log(`[SDL2] Disconnected: "${device.name}"`)
    })

    console.log(`[SDL2] Ready. ${_controllers.size} controller(s) connected.`)
}

function startControllerPolling() {
    setInterval(() => {
        if (!mainWindow || mainWindow.isDestroyed() || _controllers.size === 0) return

        const gamepads = []
        for (const { instance, index } of _controllers.values()) {
            if (!instance.closed) {
                gamepads.push(buildGamepadState(instance, index))
            }
        }

        if (gamepads.length > 0) {
            mainWindow.webContents.send('gamepad-state', gamepads)
        }
    }, POLL_MS)
}

// ---------------------------------------------------------------------------
// Window
// ---------------------------------------------------------------------------

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        title: 'Stealthy Stinkers',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    })

    if (!app.isPackaged) {
        mainWindow.loadURL(DEV_SERVER_URL)
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('closed', () => { mainWindow = null })
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
    initSteam()
    initSDL()
    createWindow()
    startControllerPolling()
})

app.on('window-all-closed', () => app.quit())
