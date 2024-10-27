var startTime, then, now, dt, fps=0, fpsMinForEffects=30, fpsTime=0, dtFix = 10, dtToProcess = 0, dtProcessed = 0


var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("webgl");

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)

    ctx.clearColor(1,0,0,1.0)
    //ctx.enable(ctx.DEPTH_TEST)

    window.requestAnimationFrame(gameLoop);
})



function gameLoop() {
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }
   
    dtToProcess += dt
    while(dtToProcess > dtFix) {
        dtToProcess-=dtFix
        dtProcessed+=dtFix
    }
    
    draw(dt, dtProcessed);
    then = now

    window.requestAnimationFrame(gameLoop);
}

function drawShape() {
    var vertexPositionArray = [
        -0.5, -0.5, 0, //bottom left
         0.5, -0.5, 0, //bottom right 
         0.5,  0.5, 0  //top right
    ];

    numberOfVertices = 3;
    window.vertexBufferPositionID = GL.createBuffer ();
    ctx.bindBuffer(ctx.ARRAY_BUFFER, vertexBufferPositionID);
    ctx.bufferData(ctx.ARRAY_BUFFER,
        new Float32Array(vertexPositionArray),
        ctx.STATIC_DRAW);
}


function draw(dt, dtProcessed) {

    ctx.viewport(0,0, canvas.width, canvas.height)
    ctx.clear(ctx.COLOR_BUFFER_BIT)// | ctx.DEPTH_BUFFER_BIT)

    /*
    ctx.save()
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.save()
            ctx.font = "16px serif";
            ctx.fillStyle = "white";
            ctx.textBaseline='top'
            ctx.textAlign = "left";
            ctx.fillText(fps + " FPS ",0,0)
        ctx.restore()

    ctx.restore()
    */
}