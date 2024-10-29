var canvas = document.getElementById('canvas')
var textareaCanvas1 = document.getElementById('textAreaCanvas1')
var textareaCanvas2 = document.getElementById('textAreaCanvas2')
var textareaCanvas3 = document.getElementById('textAreaCanvas3')




const ctx = canvas.getContext("2d");
var now, then
var networkIdLocal = 0

var keyboards = [{left: 65, up: 87, right: 68, down: 83, action: 69, peerId: '', index: 1}, {left: 37, up: 38, right: 39, down: 40, action: 96, peerId: '', index: 2}]
var pressedKeys = {}; /* https://www.toptal.com/developers/keycode */
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] =true;  if (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'ArrowRight' || e.code === 'ArrowLeft') { /* prevent scrolling of website */
    e.preventDefault();
}}

var players = []
var figures = []

document.addEventListener('DOMContentLoaded', function (event) {
    now = Date.now();
    then = Date.now()

    window.requestAnimationFrame(gameLoop);
});

function gameLoop() {
    now = Date.now();
    var dt = now - then
    handleInput(dt)
    update(dt)
    render()
    then = now
    sendData()

    window.requestAnimationFrame(gameLoop);
}
  
function handleInput(dt) {
    players.filter(p => p.networkId === networkIdLocal).forEach((p,i) => {
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
        if (f.playerId !== undefined) {
            var p = players.find(p => f.playerId === p.playerId)
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

    ctx.textAlign = "center";
    ctx.textBaseline='middle'
    ctx.fillStyle = "white";
    ctx.font = "24px arial";


    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";

    figures.forEach(f => {
        ctx.fillText(f.networkId + ':' + f.playerId,f.x,f.y); // Punkte
    })

    var dataToSend = getDataToSend()
    textareaCanvas1.value = JSON.stringify(players, null, 2)
    textareaCanvas2.value = JSON.stringify(figures,null, 2)
    textAreaCanvas3.value = JSON.stringify(dataToSend)
    document.getElementById('txtNetworkId').innerText = networkIdLocal
    document.getElementById('txtPeerId').innerText = peer?.id

}

document.addEventListener('DOMContentLoaded', function (event) {
    networkIdLocal = Math.floor(Math.random() * 256)


    document
    .getElementById('btnSend')
    .addEventListener('click', function (event) {
      var message = document.getElementById('inputSend').value
      var jsonObject = null
      try {
        jsonObject = JSON.parse(message)
      } catch(e) {
        jsonObject = {error: message}
      }
      
      sendJsonToAllPeers(jsonObject)
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
}

function joinLocalPlayer() {
    var playerId = players.length
    var player = {networkId: networkIdLocal, playerId: playerId, type: 'keyboard', xAxis: 0, yAxis: 0 }
    var figure = {networkId: networkIdLocal, playerId: playerId, x: Math.random()*320, y:Math.random()*320}

    players.push(player)
    figures.push(figure)
}

btnJoin.addEventListener('click', joinLocalPlayer)

function dataReceived(d, peer, conn) {
    var jsonObject = d
 
    if (jsonObject.players) {
        jsonObject.players.filter(p => p.networkId !== networkIdLocal).forEach(p => {
            var indexInArray = players.findIndex(pp => pp.networkId === p.networkId && pp.index === p.index)
            if (indexInArray >= 0) {
                players[indexInArray] = k
            } else {
                players.push(p)
            }
        })
    }

    if (jsonObject.figures) {
        jsonObject.figures.filter(p => p.networkId !== networkIdLocal).forEach(p => {
            var indexInArray = figures.findIndex(pp => pp.networkId === p.networkId && pp.index === p.index)
            if (indexInArray >= 0) {
                figures[indexInArray] = k
            } else {
                figures.push(p)
            }
        })
    }
}

function getDataToSend() {
    var jsonObject = {

    }

    if (isMaster(peer)) {
        jsonObject.figures = figures
        jsonObject.players = players
    } else {
        jsonObject.players = players.filter(p => p.networkId === networkIdLocal)
    }

    return jsonObject
}
function sendData() {
   
}
