import * as PIXI from 'pixi.js'
import '@pixi/sound'
import Peer from 'peerjs'
import QRious from 'qrious'

window.PIXI = PIXI
window.Peer = Peer
window.QRious = QRious

await import('./fwnetwork/fwapplication.js')
await import('./fwnetwork/fwnetwork.js')
await import('./fwnetwork/fwnetworkgamepad.js')
await import('./fwnetwork/fwtouchcontrol.js')

await import('./helper.js')
await import('./draw.js')
await import('./input.js')
await import('./game.js')
