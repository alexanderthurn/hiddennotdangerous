
function sendMessagePlayersAndFigures(peerId, peer, conn) {
    const dataToSend = getPlayersAndFiguresDataToSend()
    const figuresToSend = dataToSend.figures
    const playersToSend = dataToSend.players
    const playerPayloadBytes = 4+1+1+1 // 2* floatUnitCircle aka 2 Byte (2*2 Bytes) + 1 * boolean (isActionButtonPressed, 1 Byte) + 1* int8 (playerIndex) + 1*int8 (networkIndex)
    const figurePayloadBytes = 1+1+4+2 // 1*int8 (networkIndex) + 1* int8 (playerIndex) + 4  float3000 aka int16 (x/y) + 2 floatAngle aka int16 (angle)
    const payloadLength = 1+(1+figuresToSend.length*figurePayloadBytes) + (1+playersToSend.length*playerPayloadBytes)

    let buffer = new ArrayBuffer(payloadLength)
    let view = new DataView(buffer)
    var offset = 0

    // message id
    view.setUint8(0, PEERMESSAGEID_PLAYERSANDFIGURES)
    offset+=1

    // number of players
    view.setUint8(1, playersToSend.length)
    offset+=1

    playersToSend.forEach((p) => {
        writeUnitCircleFloatAsInt16(buffer, offset + 0, p.xAxis)
        writeUnitCircleFloatAsInt16(buffer, offset + 2, p.yAxis)
        view.setUint8(offset + 4, p.isActionButtonPressed ? 1 : 0)
        view.setUint8(offset + 5, p.networkIndex)
        view.setUint8(offset + 6, p.playerIndex)
        offset += playerPayloadBytes
    })

    // number of figures
    view.setUint8(2, figuresToSend.length)
    offset+=1

    figuresToSend.forEach((f) => {
        view.setUint8(offset + 0, f.networkIndex)
        view.setUint8(offset + 1, f.playerIndex)
        write3000erFloatAsInt16(buffer, offset + 2, f.x)
        write3000erFloatAsInt16(buffer, offset + 4, f.y)
        writeAngleAsInt16(buffer, offset + 6, f.angle)
        offset+=figurePayloadBytes
    })
    conn.send(buffer)
}


function dataReceived(d, peer, conn) {
    var jsonObject = d
 
    if (jsonObject.players) {
        jsonObject.players.filter(p => p.networkIndex !== networkIndexLocal).forEach(p => {
            var indexInArray = players.findIndex(pp => pp.networkIndex === p.networkIndex && pp.playerIndex === p.playerIndex)
            if (indexInArray >= 0) {
                players[indexInArray] = k
            } else {
                players.push(p)
            }
        })
    }

    if (jsonObject.figures) {
        jsonObject.figures.filter(p => p.networkIndex !== networkIndexLocal).forEach(p => {
            var indexInArray = figures.findIndex(pp => pp.networkIndex === p.networkIndex && pp.playerIndex === p.playerIndex)
            if (indexInArray >= 0) {
                figures[indexInArray] = k
            } else {
                figures.push(p)
            }
        })
    }
}

function getPlayersAndFiguresDataToSend() {
    var jsonObject = {

    }

    if (isMaster(peer)) {
        jsonObject.figures = figures
        jsonObject.players = players
    } else {
        jsonObject.players = players.filter(p => p.networkIndex === networkIndexLocal)
        jsonObject.figures = figures.filter(p => p.networkIndex === networkIndexLocal)
    }

    return jsonObject
}

function sendData() {
   
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
