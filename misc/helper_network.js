
const playerPayloadBytes = 1+1+8+1 // 1*1 int8 (networkIndex) + 1*1 int8 (playerIndex) + 2*2 floatUnitCircle (xAxis/yAxis) + 1*1 boolean (isActionButtonPressed, 1 Byte)
const figurePayloadBytes = 1+1+8+4 // 1*1 int8 (networkIndex) + 1*1 int8 (playerIndex) + 2*2 float3000 for (x/y) + 1*2 floatAngle

function handleMessagePlayersAndFigures(buffer, peer, conn) {
    const view = new DataView(buffer);
    var offset = 1

    // players
    var playersToSendLength = view.getUint8(offset);
    var playersToSend = []
    offset+=1
    for (var pi = 0; pi < playersToSendLength; pi++) {
        var p = {}
        p.networkIndex = view.getUint8(offset + 0);
        p.playerIndex = view.getUint8(offset + 1);
        p.xAxis = view.getFloat32(offset + 2, false)
        p.yAxis = view.getFloat32(offset + 6, false)
        p.isActionButtonPressed = view.getUint8(offset + 10) > 0 ? true : false
        offset += playerPayloadBytes
        playersToSend.push(p)
    }

    // figures
    var figuresToSendLength = view.getUint8(offset)
    var figuresToSend = []
    offset+=1

    for (var fi = 0; fi < figuresToSendLength; fi++) {
        var f = {}
        f.networkIndex = view.getUint8(offset + 0);
        f.playerIndex = view.getUint8(offset + 1);
        f.x = view.getFloat32(offset + 2, false)
        f.y = view.getFloat32(offset + 6, false)
        f.angle = view.getFloat32(buffer, offset + 10, false)
        offset += figurePayloadBytes
        figuresToSend.push(f)
    }

    playersToSend.forEach(p => {
        var player = players.find(pp => pp.networkIndex === p.networkIndex && pp.playerIndex === p.playerIndex)
        if (!player) {
            player = createPlayer(p)
            players.push(player)
        } else {
            Object_assign(player, p)
        }
    })

    figuresToSend.forEach(f => {
        var figure= figures.find(ff => ff.networkIndex === f.networkIndex && ff.playerIndex === f.playerIndex)
        if (!figure) {
            figure =  createFigure(f)  
            figures.push(figure)
            app.stage.addChild(figure)
        } else {
            Object_assign(figure, f)
        }
    })

    return 'received ' + playersToSendLength + ' players and ' + figuresToSendLength +' figures'
  }

function getMessagePlayersAndFigures(dataToSend) {
    const figuresToSend = dataToSend.figures
    const playersToSend = dataToSend.players
    const payloadLength = 1 + (1+playersToSend.length*playerPayloadBytes) + (1+figuresToSend.length*figurePayloadBytes) 

    let buffer = new ArrayBuffer(payloadLength)
    let view = new DataView(buffer)
    var offset = 0

    // message id
    view.setUint8(0, PEERMESSAGEID_PLAYERSANDFIGURES)
    offset+=1

    // players
    view.setUint8(offset, playersToSend.length)
    offset+=1

    playersToSend.forEach((p) => {
        view.setUint8(offset + 0, p.networkIndex)
        view.setUint8(offset + 1, p.playerIndex)
        view.setFloat32(offset + 2, p.xAxis, false)
        view.setFloat32(offset + 6, p.yAxis, false)
        view.setUint8(offset + 10, p.isActionButtonPressed ? 1 : 0)
        offset += playerPayloadBytes
    })

    // figures
    view.setUint8(offset, figuresToSend.length)
    offset+=1

    figuresToSend.forEach((f) => {
        view.setUint8(offset + 0, f.networkIndex)
        view.setUint8(offset + 1, f.playerIndex)
        view.setFloat32(offset + 2, f.x, false)
        view.setFloat32(offset + 6, f.y, false)
        view.setFloat32(offset + 10, f.angle, false)
        offset+=figurePayloadBytes
    })
    
    return buffer
}


function dataReceived(messageBuffer, peer, conn) {
    const messageType = getMessageType(messageBuffer)
    var result = 'unknown'
    try {
      switch (messageType) {
        case PEERMESSAGEID_PLAYERSANDFIGURES:
          result = handleMessagePlayersAndFigures(messageBuffer, peer, conn)
          break
        default:
            result = 'unknown'
          break
      }
    } catch(e) {
        result = 'error dataReceived: ' + e.message + ' ' + getMessageTypeTitle(messageBuffer)
    }

    return result
}

function getPlayersAndFiguresDataToSend() {
    var jsonObject = {

    }

    if (false && isMaster(peer)) {
        jsonObject.figures = figures
        jsonObject.players = players
    } else {
        jsonObject.players = players.filter(p => p.networkIndex === networkIndexLocal)
        jsonObject.figures = figures.filter(p => p.networkIndex === networkIndexLocal)
    }

    return jsonObject
}




function textareaLog(d) {
    var textArea = document.getElementById('textAreaLog')
    textArea.value += d + '\n';
    textArea.scrollTop = textArea.scrollHeight;
    var color = 'white'
    if (peer && peer.open) {
        if (isMaster(peer)) {
            color = 'gold'
        } else {
            color = 'silver'
        }
    } 

    document.getElementsByTagName('body')[0].style.backgroundColor = color
    console.log(d)
}

function Object_assign (target, ...sources) {
    sources.forEach(source => {
      Object.keys(source).forEach(key => {
        const s_val = source[key]
        const t_val = target[key]
        target[key] = t_val && s_val && typeof t_val === 'object' && typeof s_val === 'object'
                    ? Object_assign(t_val, s_val)
                    : s_val
      })
    })
    return target
  }
  

  
let HDND = {}
HDND.AnimatedSprite = class AnimatedSprite extends PIXI.AnimatedSprite{
    constructor(textures) {
        super(textures, false)
        this.frame = 0
    }
    animate(dt) {
        this.frame = (this.frame + 0.001*dt/this.animationSpeed) % this.totalFrames
        if (this.frame > this.totalFrames -1)
            this.frame = 0
        this.currentFrame= Math.floor(this.frame)
    }
}
