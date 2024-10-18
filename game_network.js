var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var now, then
var keyboards = [{left: 65, up: 87, right: 68, down: 83, action: 69}, {left: 37, up: 38, right: 39, down: 40, action: 96}]
var pressedKeys = {}; /* https://www.toptal.com/developers/keycode */
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] =true; }

var players = [{playerId: 'a', peerId: 'local', type: 'keyboard', keyboardIndex:0, xAxis: 0, yAxis: 0 }, {playerId: 'b',  peerId: 'local', type: 'keyboard', keyboardIndex:1, xAxis: 0, yAxis: 0}]
var figures = [{playerId: 'a', x: Math.random()*320, y:Math.random()*320}, {playerId: 'b', x: Math.random()*320, y:Math.random()*320}]


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
    players.filter(p => p.peerId === 'local').forEach(p => {
        var keyboard = keyboards[p.keyboardIndex]
        p.xAxis = 0
        p.yAxis = 0
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
        if (f.playerId) {
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
        ctx.fillText(f.playerId,f.x,f.y); // Punkte
    })
}

document.addEventListener('DOMContentLoaded', function (event) {
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

function dataReceived(d) {
    var jsonObject = d
    if (jsonObject.players) {
        players = jsonObject.players
    }
    if (jsonObject.figures) {
        figures = jsonObject.figures
    }
}

function sendData() {
    var jsonObject = {
        figures: figures,
        players: players
    }
    document.getElementById('inputSend').value = JSON.stringify(jsonObject)
}
