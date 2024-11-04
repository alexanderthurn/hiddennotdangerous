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


var figuresTexture

async function initApp() {
    app = new PIXI.Application();
    await app.init({ background: '#1099bb', width: 320, height: 480 });
    canvas = app.canvas
    document.getElementById('divCanvas').appendChild(app.canvas);
    await PIXI.Assets.load('../gfx/plain_grass.jpg');
    await PIXI.Assets.load('../gfx/character_base_topview_32x32.png');
    await PIXI.Assets.load('https://pixijs.com/assets/bitmap-font/desyrel.xml');
    figuresTexture = await PIXI.Assets.load('../gfx/character_base_topview_32x32_angles_sleepanimation.json')

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
    
    const bitmapFontText = createBitmapText({text: 'Knirps und Knall', style:{fontSize:32}})

    bitmapFontText.anchor.set(0.5,0.5)
    bitmapFontText.x = canvas.width/2
    bitmapFontText.y =  sprite.height/2
    container.addChild(bitmapFontText);
    
    app.stage.addChild(createBean({x:150, y: 150}))


    now = Date.now();
    then = Date.now()

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
    



    app.ticker.add((time) => {
        now = Date.now();
        var dt = now - then
        handleInput(dt)
        update(dt)
        render()
        //sendData()
        then = now
    })


    initNetwork('hiddennotdangerous', {logMethod: textareaLog, dataReceivedMethod: dataReceived})
    document.addEventListener('keyup', function(e) { pressedKeys[e.keyCode] = false; })
    document.addEventListener('keydown',function(e) { pressedKeys[e.keyCode] =true;  if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') { /* prevent scrolling of website */
        e.preventDefault();
    }})
    
    btnJoin.addEventListener('click', joinLocalPlayer)
    btnRemove.addEventListener('click', removeRandomLocalPlayer)

}

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

        var angleDegrees = rad2deg(angle(0,0,p.xAxis,p.yAxis))
        var offset = 45*0.5
        if (angleDegrees >= 180 - offset || angleDegrees < -135 -offset) {
            f.sprite.textures = figuresTexture.animations.left
        } else if (angleDegrees < -135+45 -offset){
            f.sprite.textures = figuresTexture.animations.upleft
        } else if (angleDegrees < -135+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.up
        } else if (angleDegrees < -135+45+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.upright
        } else if (angleDegrees < -135+45+45+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.right
        } else if (angleDegrees < -135+45+45+45+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.downright
        } else if (angleDegrees < -135+45+45+45+45+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.down
        } else if (angleDegrees < -135+45+45+45+45+45+45+45 -offset){
            f.sprite.textures = figuresTexture.animations.downleft
        } else {
            f.sprite.textures = figuresTexture.animations.dead
        }


        if (f.x > canvas.width) f.x = canvas.width
        if (f.y > canvas.height) f.y = canvas.height
        if (f.x < 0) f.x = 0
        if (f.y < 0) f.y = 0

        if (Math.abs(p.xAxis) + Math.abs(p.yAxis) > 0)
            f.sprite.animate(dt)
    })
}


function render() {
    textareaCanvas1.value = JSON.stringify(players, null, 2)
    textareaCanvas2.value = JSON.stringify(figures.map(f => ({x: f.x, y: f.y, networkIndex: f.networkIndex, playerIndex: f.playerIndex})),null, 2)
    textAreaCanvas3.value = JSON.stringify({peers: getConnectedPeers(), networkIndexes:networkIndexes},null, 2)
    document.getElementById('txtNetworkId').innerText = networkIdLocal
    document.getElementById('txtNetworkIndex').innerText = networkIndexLocal
    document.getElementById('txtPeerId').innerText = peer?.id
}

function removeRandomLocalPlayer() {
    var playersLocal = players.filter(p => p.networkIndex === networkIndexLocal)
    var pIndex = Math.floor(Math.random() * playersLocal.length)
    var fIndex = figures.findIndex(f => f.playerIndex === players[pIndex].playerIndex)

    app.stage.removeChild(figures[fIndex])
    players.splice(pIndex,1)
    figures.splice(fIndex,1)
}

function joinLocalPlayer() {
    if (networkIndexLocal < 0) {
        sendMessageBufferToAllPeers(getMessageBufferWantNetworkIndexes())
        return
    }
    var playerIndex = players.length
    var player = {networkIndex: networkIndexLocal, playerIndex: playerIndex, type: 'keyboard', xAxis: 0, yAxis: 0 }
    var figure =  createFigure({networkIndex: networkIndexLocal, playerIndex: playerIndex, x: Math.random()*320, y:Math.random()*320, angle: 0})


    players.push(player)
    figures.push(figure)
    app.stage.addChild(figure)
}


function createFigure(props) {

    var f = new PIXI.Container()
    Object_assign(f, props)

    let sprite = new HDND.AnimatedSprite(figuresTexture.animations.down);
    sprite.anchor.set(0.5)
    sprite.animationSpeed = 0.1
    sprite.frame = 0

    const bitmapFontText =createBitmapText({
        text: f.networkIndex + ':' + f.playerIndex,
        style: {
            fontSize: 24,
            align: 'center',
        },
        y: 10,
        anchor:0.5
    });
    
    f.addChild(sprite)
    f.sprite = sprite
    f.addChild(bitmapFontText);
    return f
}

function destroyFigure(f) {

}

function createBean(props) {
    var b = new PIXI.Container()
    Object_assign(b, props)

    let c = new PIXI.Graphics()
        .circle(0,0, 50)
        .fill('white')
        .circle(0,0, 40)
        .stroke('black')

    b.addChild(c)

    b.addChild(createBitmapText({text: 'B'}))
    return b
}

function createBitmapText(props) {
    var t = new PIXI.BitmapText({
        text: '',
        style: {
            fontFamily: 'Desyrel',
            fontSize: 16,
            align: 'left',
        }
    });

    Object_assign(t, props)

    return t
}