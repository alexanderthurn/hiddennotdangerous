console.log('no need to hide')
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mice = [{x: 0, y: 0}];
var gamepads = navigator.getGamepads();
var stop = false;
var frameCount = 0;
var startTime, then, now, dt, fps=0, fpsTime
var dtFix = 10, dtToProcess = 0
var figures = []

const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1); 
const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 
const move = (x1, y1, angle, speed) => ({x: x1 + Math.cos(angle)*speed, y: y1 + Math.sin(angle)*speed}); 

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)

    console.log('hahahahahahaha')
   
    then = Date.now();
    startTime = then;
    fpsTime = then
    figures = []
    for (var i = 0; i < 20; i++) {
        figures.push({
            x: Math.random()*canvas.width,
            y: Math.random()*canvas.height,
            xTarget: Math.random()*canvas.width,
            yTarget: Math.random()*canvas.height,
            speed: 0.8,
            isAlive: true, 
            isAI: i > 2
        })
    }

    window.requestAnimationFrame(gameLoop);
})

canvas.addEventListener('pointermove', event => {
    mice[0].x = event.clientX - canvas.offsetLeft;
    mice[0].y = event.clientY -  canvas.offsetTop;
}, false);

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
        handleInput(gamepads, mice, dtFix, figures)
        handleAi(figures)
        dtToProcess-=dtFix
    }
    
    draw(gamepads, mice, figures, dt);


    then = now
    window.requestAnimationFrame(gameLoop);
}

function handleInput(gamepads, mice, dtFix, figures) {

}

function handleAi(figures) {
    figures.filter(f => f.isAI).forEach(f => {
        if (distance(f.x,f.y,f.xTarget,f.yTarget) < 5) {
            f.xTarget = Math.random()*canvas.width
            f.yTarget = Math.random()*canvas.height
        }

        let xyNew = move(f.x, f.y, angle(f.x,f.y,f.xTarget,f.yTarget),f.speed)
        f.x = xyNew.x
        f.y = xyNew.y
    })
}

function draw(gamepads, mice, figures, dt) {

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath();
    ctx.arc(mice[0].x, mice[0].y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "blue";
    ctx.stroke();

    figures.forEach(f => {
        
        ctx.beginPath()
        ctx.lineWidth = 1;
        ctx.fillStyle = "green";
        ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
        ctx.fill();
    })


    ctx.font = "16px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText("FPS: " + fps + " Gamepads: " + gamepads.length + " Mouses: " + mice.length + " Time: " + (new Date().getTime() / 1000), 0, 0);

}