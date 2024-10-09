console.log('no need to hide')
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mice = [{x: 0, y: 0}];
var gamepads = navigator.getGamepads();
var stop = false;
var frameCount = 0;
var startTime, then, now, dt, fps=0, fpsTime
var dtFix = 10, dtToProcess = 0

document.addEventListener("DOMContentLoaded", function(event){
    console.log('hahahahahahaha')
   
    then = Date.now();
    startTime = then;
    fpsTime = then

    window.requestAnimationFrame(gameLoop);
    resizeCanvasToDisplaySize(canvas)
    canvas.addEventListener('pointermove', event => {
        mice[0].x = event.clientX - canvas.offsetLeft;
        mice[0].y = event.clientY -  canvas.offsetTop;
    }, false);

})

window.addEventListener("resize", function(event){
    resizeCanvasToDisplaySize(canvas)
});

function resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
 
    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
 
    return false;
 }


function gameLoop() {
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }
    gamepads = navigator.getGamepads().filter(x => x && x.connected);

    dtToProcess += dt
    while(dtToProcess > dtFix) {
        handleInput(gamepads, mice, dtFix)
        dtToProcess-=dtFix
    }
    
    draw(gamepads, mice, dt);


    then = now
    window.requestAnimationFrame(gameLoop);
}

function handleInput(gamepads, mice) {

}

function draw() {

    /*HALLO*/
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath();
    ctx.arc(mice[0].x, mice[0].y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "blue";
    ctx.stroke();

    ctx.font = "16px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText("FPS: " + fps + " Gamepads: " + gamepads.length + " Mouses: " + mice.length + " Time: " + (new Date().getTime() / 1000), 0, 0);

}