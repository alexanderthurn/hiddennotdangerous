var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var now, then
var keyboards = [{left: 65, up: 87, right: 68, down: 83, action: 69}, {left: 37, up: 38, right: 39, down: 40, action: 96}]
var pressedKeys = {}; /* https://www.toptal.com/developers/keycode */
window.onkeyup = function(e) { pressedKeys[e.keyCode] = false; }
window.onkeydown = function(e) { pressedKeys[e.keyCode] =true; }

var players = [{playerId: 'a', peerId: 'local', type: 'keyboard', keyboardIndex:0 }, {playerId: 'b',  peerId: 'local', type: 'keyboard', keyboardIndex:1}]
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
    render()
    then = now
    sendData()

    window.requestAnimationFrame(gameLoop);
}
  
function handleInput(dt) {
    players.filter(p => p.peerId === 'local').forEach(p => {
        var keyboard = keyboards[p.keyboardIndex]
        var figure = figures.find(f => f.playerId === p.playerId)
        if (pressedKeys[keyboard.left]) {
            figure.x-=0.1*dt
        } 
        if (pressedKeys[keyboard.right]) {
            figure.x+=0.1*dt
        } 
        if (pressedKeys[keyboard.up]) {
            figure.y-=0.1*dt
        } 
        if (pressedKeys[keyboard.down]) {
            figure.y+=0.1*dt
        } 
    })
}

function render() {

    ctx.textAlign = "center";
    ctx.textBaseline='center'
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
