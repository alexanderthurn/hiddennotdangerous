var app
var canvas

var now, then
var keyboards = [{left: 65, up: 87, right: 68, down: 83, action: 69, peerId: '', index: 1}, {left: 37, up: 38, right: 39, down: 40, action: 96, peerId: '', index: 2}]
var pressedKeys = {}; /* https://www.toptal.com/developers/keycode */
var players = []
var figures = []

var textareaCanvas1 = document.getElementById('textAreaCanvas1')
var textareaCanvas2 = document.getElementById('textAreaCanvas2')
var textareaCanvas3 = document.getElementById('textAreaCanvas3')
var btnWantNetworkIndex = document.getElementById('btnWantNetworkIndex')
var btnTellNetworkIndex = document.getElementById('btnTellNetworkIndex')
var btnSend = document.getElementById('btnSend')
var PEERMESSAGEID_PLAYERSANDFIGURES = 17


async function initApp() {
    app = new PIXI.Application();
    await app.init({ background: '#1099bb', width: 320, height: 480 });
    canvas = app.canvas
    document.getElementById('divCanvas').appendChild(app.canvas);
    await PIXI.Assets.load('../gfx/plain_grass.jpg');
    await PIXI.Assets.load('../gfx/character_base_topview_32x32.png');
    await PIXI.Assets.load('https://pixijs.com/assets/bitmap-font/desyrel.xml');

    let container = new PIXI.Container()
    container.x = 0
    container.y = 0
    app.stage.addChild(container)

    let sprite = PIXI.Sprite.from('../gfx/plain_grass.jpg');
    sprite.anchor.set(0.0,0.0)
    sprite.x = 0
    sprite.y = 0
    sprite.width = canvas.width
    sprite.height = canvas.height/5
    container.addChild(sprite)
    
    const bitmapFontText = new PIXI.BitmapText({
        text: 'Knirps und Knall',
        style: {
            fontFamily: 'Desyrel',
            fontSize: 32,
            align: 'left',
        }
    });

    bitmapFontText.anchor.set(0.5,0.5)
    bitmapFontText.x = canvas.width/2
    bitmapFontText.y =  sprite.height/2
    container.addChild(bitmapFontText);



    now = Date.now();
    then = Date.now()

    app.ticker.add((time) => {
        now = Date.now();
        var dt = now - then
        //handleInput(dt)
        update(dt)
        render()
        //sendData()
        then = now
    })



}

window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] =true;  if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') { /* prevent scrolling of website */
    e.preventDefault();
}}

initApp()


function handleInput(dt) {
    players.filter(p => p.networkIndex === networkIndexLocal).forEach((p,i) => {
        var keyboard = keyboards[i % 2]
        p.xAxis = 0
        p.yAxis = 0
        p.isActionButtonPressed = pressedKeys[keyboard.action]

        if (pressedKeys[keyboard.left]) {
            p.xAxis = -1
        } 
        if (pressedKeys[keyboard.right]) {
            p.xAxis = 1
        } 
        if (pressedKeys[keyboard.up]) {
            p.yAxis = -1
        } 
        if (pressedKeys[keyboard.down]) {
            p.yAxis = 1
        } 
    })
}

function update(dt) {
    figures.forEach(f => {
        if (f.playerIndex !== undefined) {
            var p = players.find(p => f.playerIndex === p.playerIndex)
            f.x += p.xAxis*0.1*dt
            f.y += p.yAxis*0.1*dt
        }

        if (f.x > canvas.width) f.x = canvas.width
        if (f.y > canvas.height) f.y = canvas.height
        if (f.x < 0) f.x = 0
        if (f.y < 0) f.y = 0
    })
}

function render() {
    var dataToSend = getPlayersAndFiguresDataToSend()
    textareaCanvas1.value = JSON.stringify(players, null, 2)
    textareaCanvas2.value = JSON.stringify(figures,null, 2)
    textAreaCanvas3.value = JSON.stringify(dataToSend,null, 2)
    textAreaCanvas4.value = JSON.stringify({peers: getConnectedPeers(), networkIndexes:networkIndexes},null, 2)
    document.getElementById('txtNetworkId').innerText = networkIdLocal
    document.getElementById('txtNetworkIndex').innerText = networkIndexLocal
    document.getElementById('txtPeerId').innerText = peer?.id
}

document.addEventListener('DOMContentLoaded', function (event) {

    btnSend
    .addEventListener('click', function (event) {
      var message = document.getElementById('inputSend').value
      sendMessageBufferToAllPeers(getMessageBufferText(message))
    });
  
    btnWantNetworkIndex.addEventListener('click', function (event) {
      var messageBuffer = getMessageBufferWantNetworkIndexes()
      sendMessageBufferToAllPeers(messageBuffer)
    });

    btnTellNetworkIndex.addEventListener('click', function (event) {
        var messageBuffer = getMessageBufferTellNetworkIndexes()
        sendMessageBufferToAllPeers(messageBuffer)
      });
  

    initNetwork('hiddennotdangerous', {logMethod: textareaLog, dataReceivedMethod: dataReceived})
  
  })

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

function joinLocalPlayer() {
    if (networkIndexLocal < 0) {
        sendMessageBufferToAllPeers(getMessageBufferWantNetworkIndexes())
        return
    }
    var playerIndex = players.length
    var player = {networkIndex: networkIndexLocal, playerIndex: playerIndex, type: 'keyboard', xAxis: 0, yAxis: 0 }
    var figure = {networkIndex: networkIndexLocal, playerIndex: playerIndex, x: Math.random()*320, y:Math.random()*320, angle: 0}

    players.push(player)
    figures.push(figure)


    let container = new PIXI.Container()
    container.x = figure.x
    container.y = figure.y
    app.stage.addChild(container)

    let sprite = PIXI.Sprite.from('../gfx/character_base_topview_32x32.png');
    sprite.anchor.set(0.5)
    sprite.x = 0
    sprite.y = 0
    sprite.scale = 0.25
    container.addChild(sprite)

    const bitmapFontText = new PIXI.BitmapText({
        text: figure.networkIndex + ':' + figure.playerIndex,
        style: {
            fontFamily: 'Desyrel',
            fontSize: 24,
            align: 'center',
        }
    });

    bitmapFontText.anchor.set(0.5)
    bitmapFontText.x = 0//app.screen.width/2
    bitmapFontText.y = 0//app.screen.height/2
    container.addChild(bitmapFontText);
}

btnJoin.addEventListener('click', joinLocalPlayer)

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