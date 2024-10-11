console.log('no need to hide')
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mice = [{x: 0, y: 0, isAttackButtonPressed: false}];
var keyboardPlayers = [{}, {}];
var keyboards = [{bindings: {
    'KeyA': {player: keyboardPlayers[0], action: 'left'},
    'KeyD': {player: keyboardPlayers[0], action: 'right'},
    'KeyW': {player: keyboardPlayers[0], action: 'up'},
    'KeyS': {player: keyboardPlayers[0], action: 'down'},
    'KeyT': {player: keyboardPlayers[0], action: 'attack'},
    'ArrowLeft': {player: keyboardPlayers[1], action: 'left'},
    'ArrowRight': {player: keyboardPlayers[1], action: 'right'},
    'ArrowUp': {player: keyboardPlayers[1], action: 'up'},
    'ArrowDown': {player: keyboardPlayers[1], action: 'down'},
    'Numpad0': {player: keyboardPlayers[1], action: 'attack'}}, pressed: {}}];
var virtualGamepads = []
var stop = false;
var frameCount = 0;
var startTime, then, now, dt, fps=0, fpsTime
var dtFix = 10, dtToProcess = 0
var figures = []
var image = new Image()
image.src = 'character_base_16x16.png'
var imageAnim = {
    down: {a: [[0,0,16,16], [16,0,16,16], [32,0,16,16], [48,0,16,16]]},
    up: {a: [[0,16,16,16], [16,16,16,16], [32,16,16,16], [48,16,16,16]]},
    left: {a: [[0,48,16,16], [16,48,16,16], [32,48,16,16], [48,48,16,16]]},
    right: {a: [[0,32,16,16], [16,32,16,16], [32,32,16,16], [48,32,16,16]]}
}

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)

    console.log('hahahahahahaha')
   
    then = Date.now();
    startTime = then;
    fpsTime = then
    figures = []
    for (var i = 0; i < 20; i++) {
        const x = Math.random()*canvas.width;
        const y = Math.random()*canvas.height;
        const xTarget = Math.random()*canvas.width;
        const yTarget = Math.random()*canvas.height;
        figures.push({
            x,
            y,
            xTarget,
            yTarget,
            maxSpeed: 0.08,
            speed: 0,
            isAlive: true, 
            isAI: i > 5,
            index: i,
            angle: angle(x,y,xTarget,yTarget),
            anim: 0,
            isAttacking: false,
            attackDistance: 40
        })
    }

    window.requestAnimationFrame(gameLoop);
})

window.addEventListener('keydown', event => {
    keyboards.forEach(k => {
        k.pressed[event.code] = true;
    });
});

window.addEventListener('keyup', event => {
    keyboards.forEach(k => {
        delete k.pressed[event.code];
    });
});

canvas.addEventListener('pointermove', event => {
    mice[0].x = event.clientX - canvas.offsetLeft;
    mice[0].y = event.clientY -  canvas.offsetTop;
   // mice[0].isAttackButtonPressed = event.buttons.some(b => b.pressed)
}, false);

window.addEventListener("resize", function(event){
    resizeCanvasToDisplaySize(canvas)
});


function gameLoop() {
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }
    virtualGamepads = navigator.getGamepads().filter(x => x && x.connected).map(g => {
        g.isAttackButtonPressed = g.buttons.some(b => b.pressed)
        let x = g.axes[0];
        let y = g.axes[1];
        [x, y] = setDeadzone(x, y,0.0001);
        [x, y] = clampStick(x, y);
        g.xAxis = x
        g.yAxis = y
        g.isMoving = x !== 0 || y !== 0;
        return g
    });

    keyboardPlayers.forEach(kp => {
        kp.xAxis = 0;
        kp.yAxis = 0;
        kp.isMoving = false;
        kp.isAttackButtonPressed = false;
    });

    keyboards.forEach(k => {
        Object.keys(k.pressed).forEach(pressedButton => {
            const binding = k.bindings[pressedButton];
            if (binding) {
                const action = binding.action;
                let p = binding.player;
                switch (action) {
                    case 'left':
                        p.xAxis--;
                        break;
                    case 'right':
                        p.xAxis++;
                        break;
                    case 'up':
                        p.yAxis--;
                        break;
                    case 'down':
                        p.yAxis++;
                        break;
                    case 'attack':
                        p.isAttackButtonPressed = true;
                        break;
                    default:
                        break;
                }
                p.isMoving = p.xAxis !== 0 || p.yAxis !== 0;
            }
        })
    });

    let players = [...virtualGamepads, ...keyboardPlayers];

   /* mice.forEach(m => {
        g = {}
        let x = m.x - canvas.x / 2;
        let y = m.y - canvas.y / 2;
        [x, y] = setDeadzone(x, y,0.0001);
        [x, y] = clampStick(x, y);
        g.xAxis = x
        g.yAxis = y
        g.isMoving = Math.abs(x) > 0 && Math.abs(y) > 0.0001
        virtualGamepads.unshift(g)
    })*/
   

    dtToProcess += dt
    while(dtToProcess > dtFix) {
        handleInput(players, figures)
        handleAi(figures)
        updateGame(figures, dtFix)
        dtToProcess-=dtFix
    }
    
    draw(virtualGamepads, mice, figures, dt);


    then = now
    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt) {
    let figuresAlive = figures.filter(f => !f.isDead);
    figuresAlive.forEach(f => {
        let xyNew = move(f.x, f.y, f.angle,f.speed, dt)
        f.x = xyNew.x
        f.y = xyNew.y
        f.anim += f.speed
        f.anim += f.isAttacking ? 0.5 : 0

        if (f.x > canvas.width) f.x = canvas.width
        if (f.y > canvas.height) f.y = canvas.height
        if (f.x < 0) f.x = 0
        if (f.y < 0) f.y = 0
        
    })
    figuresAlive.filter(f => f.isAttacking).forEach(f => {
        figures.filter(fig => fig !== f).forEach(fig => {
            let diffAngle = Math.abs(rad2deg(f.angle-angle(f.x,f.y,fig.x,fig.y)));
            if (distance(f.x,f.y,fig.x,fig.y) < f.attackDistance && diffAngle <= 45) {
                fig.isDead = true;
            }
        });
    })
}

function handleInput(players, figures) {
    players.filter((_,i) => !figures[i].isDead).forEach((p,i) => {
        console.log('ALIVE', i);
        var f = figures[i]
        f.speed = 0.0
        if (p.isMoving) {
            f.angle = angle(0,0,p.xAxis,p.yAxis)
            f.speed = f.maxSpeed
        }
        f.isAttacking = p.isAttackButtonPressed;
    });
}

function handleAi(figures) {
    figures.filter(f => f.isAI && !f.isDead).forEach(f => {

        if (f.xTarget > canvas.width) f.xTarget = canvas.width
        if (f.yTarget > canvas.height) f.yTarget = canvas.height
        if (f.xTarget < 0) f.xTarget = 0
        if (f.yTarget < 0) f.yTarget = 0

        if (distance(f.x,f.y,f.xTarget,f.yTarget) < 5) {
            f.xTarget = Math.random()*canvas.width
            f.yTarget = Math.random()*canvas.height
        }
        f.angle = angle(f.x,f.y,f.xTarget,f.yTarget)
        f.speed = f.maxSpeed
    })
}

function draw(gamepads, mice, figures, dt) {

    /*HALLO*/
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath();
    ctx.arc(mice[0].x, mice[0].y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "red";
    ctx.stroke();

    figures.forEach(f => {
        let deg = rad2positivedeg(f.angle)

        if (deg <= 45 || deg > 315) {
            frame = imageAnim.right.a
        } else if (deg > 45 && deg <= 135){
            frame = imageAnim.up.a
        } else if (deg > 135 && deg <= 225){
            frame = imageAnim.left.a
        } else {
            frame = imageAnim.down.a
        }

        let sprite = frame[Math.floor(f.anim) % frame.length]
        ctx.save()
        ctx.translate(f.x, f.y)
        if (f.isAttacking) {
            ctx.rotate(deg2rad(-30+rad2positivedeg(f.anim) % 60) )
        }
        ctx.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - 32, 0 - 32, 64, 64)
        ctx.restore()

       

        ctx.beginPath()
        ctx.lineWidth = 1;
        ctx.fillStyle = "green";
        if (!f.isAI) {
            ctx.fillStyle = "red";
        }
        if (f.isDead) {
            ctx.fillStyle = "blue";
        }
        ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
        ctx.fill();

        if (!f.isAI) {
            ctx.fillStyle = "red";
            ctx.font = "16px serif";
            ctx.fillStyle = "white";
            ctx.fillText(f.index + '',f.x,f.y)
        }
    })

  


    ctx.font = "16px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText("FPS: " + fps + " Gamepads: " + gamepads.length + " Mouses: " + mice.length + " Time: " + (new Date().getTime() / 1000), 0, 0);
    gamepads.forEach((g,i) => {
        ctx.fillText("xAxis: " + g.xAxis + " yAxis: " + g.yAxis + " Attack?: " + g.isAttackButtonPressed,0,(1+i)*16) 
    })
}