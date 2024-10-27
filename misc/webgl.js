var startTime, then, now, dt, fps=0, fpsMinForEffects=30, fpsTime=0, dtFix = 10, dtToProcess = 0, dtProcessed = 0


var canvas = document.getElementById('canvas')
const gl = canvas.getContext("webgl");

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)

    gl.clearColor(0,0,0,1.0)
   // gl.enable(gl.CULL_FACE);
   // gl.cullFace(gl.FRONT)
    //gl.enable(gl.DEPTH_TEST)

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


var vertices = [
    -0.75,0.75,0.0,
    -0.75,-0.75,0.0,
    0.75,0.75,0.0, 

    0.75,-0.75,0.0, 
 ];
 
 var indices = [3,2,1, 2,1,0];

 var vertexBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
 gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
 gl.bindBuffer(gl.ARRAY_BUFFER, null);

 var indexBuffer = gl.createBuffer();
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
 gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

 var vertCode =
 'attribute vec3 coordinates;' +
     
 'void main(void) {' +
    ' gl_Position = vec4(coordinates, 1.0);' +
 '}';
 var vertShader = gl.createShader(gl.VERTEX_SHADER);
 gl.shaderSource(vertShader, vertCode);
 gl.compileShader(vertShader);


 var fragCode =
 'void main(void) {' +
    ' gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);' +
 '}';
 var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
 gl.shaderSource(fragShader, fragCode);
 gl.compileShader(fragShader);

 var shaderProgram = gl.createProgram();
 gl.attachShader(shaderProgram, vertShader);
 gl.attachShader(shaderProgram, fragShader);
 gl.linkProgram(shaderProgram);
 gl.useProgram(shaderProgram);

 gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
 gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
 var coord = gl.getAttribLocation(shaderProgram, "coordinates");
 gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0); 
 gl.enableVertexAttribArray(coord);

function draw(dt, dtProcessed) {

    gl.viewport(0,0, canvas.width, canvas.height)
    gl.clear(gl.COLOR_BUFFER_BIT)// | gl.DEPTH_BUFFER_BIT)
    gl.drawElements(gl.LINE_STRIP, 3, gl.UNSIGNED_SHORT,0);
    
    /*
    gl.save()
        gl.clearRect(0, 0, canvas.width, canvas.height)
        gl.save()
            gl.font = "16px serif";
            gl.fillStyle = "white";
            gl.textBaseline='top'
            gl.textAlign = "left";
            gl.fillText(fps + " FPS ",0,0)
        gl.restore()

    gl.restore()
    */
}