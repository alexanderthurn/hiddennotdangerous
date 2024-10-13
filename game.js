console.log('no need to hide')
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mousePlayers = [{x: 0, y: 0}];
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
var figures = [], maxFigures = 6

var image = new Image()
var showDebug = false
image.src = 'character_base_16x16.png'
var imageAnim = {
    down: {a: [[0,0,16,16], [16,0,16,16], [32,0,16,16], [48,0,16,16]]},
    up: {a: [[0,16,16,16], [16,16,16,16], [32,16,16,16], [48,16,16,16]]},
    left: {a: [[0,48,16,16], [16,48,16,16], [32,48,16,16], [48,48,16,16]]},
    right: {a: [[0,32,16,16], [16,32,16,16], [32,32,16,16], [48,32,16,16]]}
}
var texture = new Image()
texture.src = 'texture_grass.jpg'
const dimTileArea = [40, 25]
let tileArea = []
const textureTiles = {
    flowers: [1288, 23, 609, 609],
    grass: [655, 23, 609, 609],
    mushrooms: [23, 23, 609, 609]
}
const tileWidth = 100;
const textureTilesList = Object.values(textureTiles);
const audio = {
    attack: {title: 'sound2.mp3', startTime: 0.15},
    death: {title: 'sound1.mp3', startTime: 0.4},
    join: {title: 'sounddrum.mp3', startTime: 0},
    music: {title: 'music.mp3', startTime: 0}
}
var soundJoin = getAudio('join');
var soundMusic = getAudio('music')
soundMusic.file.volume = 0.5
soundMusic.file.loop = true


document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)
    gameInit()
    window.requestAnimationFrame(gameLoop);
})

window.addEventListener('keydown', event => {
    keyboards.forEach(k => {
        k.pressed[event.code] = true;
    });
});

window.addEventListener('keyup', event => {
    if (event.code === 'Escape') {
        showDebug =!showDebug
    }
    keyboards.forEach(k => {
        delete k.pressed[event.code];
    });
});

canvas.addEventListener('pointermove', event => {
    mousePlayers[0].x = event.clientX - canvas.offsetLeft;
    mousePlayers[0].y = event.clientY -  canvas.offsetTop;
    //mousePlayers[0].isAttackButtonPressed = event.buttons.some(b => b.pressed)
}, false);

window.addEventListener("resize", function(event){
    resizeCanvasToDisplaySize(canvas)
});

function gameInit() {
    console.log('hahahahahahaha')
    for (let i = 0; i < dimTileArea[0]; i++) {
        tileArea[i] = [];
        for (let j = 0; j < dimTileArea[1]; j++) {
            tileArea[i][j] = getRandomInt(3);
        }
    }
   
    then = Date.now();
    startTime = then;
    fpsTime = then
    var activePlayerIds = figures.filter(f => f.playerId).map(f => f.playerId)
    var oldFigures = figures
    figures = []
    for (var i = 0; i < maxFigures; i++) {
        const x = Math.random()*canvas.width;
        const y = Math.random()*canvas.height;
        const xTarget = Math.random()*canvas.width;
        const yTarget = Math.random()*canvas.height;
        var figure = {
            x,
            y,
            xTarget,
            yTarget,
            maxBreakDuration: 5000,
            maxSpeed: 0.08,
            startWalkTime: then,
            speed: 0,
            isDead: false, 
            isAI: true,
            playerId: null,
            index: i,
            angle: angle(x,y,xTarget,yTarget),
            anim: 0,
            isAttacking: false,
            attackDuration: 500,
            attackBreakDuration: 2000,
            lastAttackTime: 0,
            points: 0,
            attackDistance: 40,
            soundAttack: getAudio('attack'),
            soundDeath: getAudio('death')
        }

        if (activePlayerIds.length > i) {
            figure.playerId = activePlayerIds[i]
            figure.isAI = false
            figure.points = oldFigures.find(f => f.playerId == figure.playerId).points
        }

        figures.push(figure)
    }
}

function gameLoop() {
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }
    gamepadPlayers = navigator.getGamepads().filter(x => x && x.connected).map(g => {
        if (g.buttons.some(b => b.pressed)) {
            g.isAttackButtonPressed = true
        } else {
            g.isAttackButtonPressed = false
        }
        let x = g.axes[0];
        let y = g.axes[1];
        [x, y] = setDeadzone(x, y,0.0001);
        [x, y] = clampStick(x, y);
        g.xAxis = x
        g.yAxis = y
        g.isMoving = x !== 0 || y !== 0;
        g.type = 'gamepad'
        g.playerId = 'g' + g.index // id does not work as it returns just XBOX Controller
        return g
    });

    keyboardPlayers.forEach((kp,i) => {
        kp.xAxis = 0;
        kp.yAxis = 0;
        kp.isMoving = false;
        kp.type = 'keyboard'
        kp.playerId = 'k' + i
        kp.isAttackButtonPressed = false
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
                        p.isAttackButtonPressed = true
                        break;
                    default:
                        break;
                }
                p.isMoving = p.xAxis !== 0 || p.yAxis !== 0;
            }
        })
    });

    let players = [...gamepadPlayers, ...keyboardPlayers];

   /* mousePlayers.forEach(m => {
        g = {}
        let x = m.x - canvas.x / 2;
        let y = m.y - canvas.y / 2;
        [x, y] = setDeadzone(x, y,0.0001);
        [x, y] = clampStick(x, y);
        g.xAxis = x
        g.yAxis = y
        g.playerId = 'm0'
        g.isMoving = Math.abs(x) > 0 && Math.abs(y) > 0.0001
        virtualGamepads.unshift(g)
    })*/
   

    dtToProcess += dt
    while(dtToProcess > dtFix) {
        handleInput(players, figures, now)
        handleAi(figures, then)
        updateGame(figures, dtFix)
        dtToProcess-=dtFix
    }
    
    draw(players, figures, dt);
    then = now

    var survivors = figures.filter(f => !f.isAI && !f.isDead)
    var figuresWithPlayer = figures.filter(f => f.playerId)
    if (survivors.length == 1 && figuresWithPlayer.length > 1) {
        survivors[0].points++
        gameInit()
    }


    

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
                playAudio(fig.soundDeath);
            }
        });
    })
}

function handleInput(players, figures, time) {
    
    // join by doing anything
    players.filter(p => p.isAttackButtonPressed || p.isMoving).forEach(p => {
        var figure = figures.find(f => f.playerId === p.playerId)
        if (!figure) {
            var figure = figures.find(f => f.isAI)
            figure.isAI = false
            figure.playerId = p.playerId
            playAudio(soundJoin);

            if (figures.filter(f => !f.isAI).length == 2) {
                playAudio(soundMusic)
                soundMusic.volume = 0.2
            }
               
        }
    })

    figures.filter(f => !f.isAI).forEach(f => {
        var p = players.find(p => p.playerId === f.playerId)

 

        f.speed = 0.0
        if (!f.isDead) {
            if (p.isMoving) {
                f.angle = angle(0,0,p.xAxis,p.yAxis)
                f.speed = f.maxSpeed
            }

            if (p.isAttackButtonPressed && !f.isAttacking) {

                if (time-f.lastAttackTime > f.attackBreakDuration) {
                    f.lastAttackTime = time
                    playAudio(f.soundAttack);
                }
            }

            f.isAttacking = time-f.lastAttackTime < f.attackDuration ? true : false;
           
        }
    })


}

function handleAi(figures, time) {
    figures.filter(f => f.isAI && !f.isDead).forEach(f => {

        if (f.xTarget > canvas.width) f.xTarget = canvas.width
        if (f.yTarget > canvas.height) f.yTarget = canvas.height
        if (f.xTarget < 0) f.xTarget = 0
        if (f.yTarget < 0) f.yTarget = 0

        if (distance(f.x,f.y,f.xTarget,f.yTarget) < 5 && f.speed > 0) {
            f.xTarget = Math.random()*canvas.width
            f.yTarget = Math.random()*canvas.height
            f.startWalkTime = Math.random() * f.maxBreakDuration + time
            f.speed = 0
        }
        if (time >= f.startWalkTime) {
            f.angle = angle(f.x,f.y,f.xTarget,f.yTarget)
            f.speed = f.maxSpeed
        }
    })
}

function draw(players, figures) {

    /*HALLO*/
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save();
    tileArea.forEach(row => {
        row.forEach((entry, index, array) => {
            const tile = textureTilesList[entry];
            ctx.drawImage(texture, tile[0], tile[1], tile[2], tile[3], 0, 0, tileWidth, tileWidth)
            if(index < array.length - 1) {
                ctx.translate(0, tileWidth);
            } else {
                ctx.translate(0, -tileWidth * index);
            } 
        })
        ctx.translate(tileWidth, 0);
    });
    ctx.restore();

    //ctx.drawImage(texture, tile[0], tile[1], tile[2], tile[3], 0, 0, 100, 100)
    
    /*ctx.beginPath();
    ctx.arc(mousePlayers[0].x, mousePlayers[0].y, 40, 0, 2 * Math.PI);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "red";
    ctx.stroke();*/

    figures.forEach(f => {
        let deg = rad2limiteddeg(f.angle)
        if (deg < 45 || deg > 315) {
            frame = imageAnim.right.a
        } else if (deg >= 45 && deg <= 135){
            frame = imageAnim.down.a
        } else if (deg > 135 && deg < 225){
            frame = imageAnim.left.a
        } else {
            frame = imageAnim.up.a
        }

        let sprite = frame[Math.floor(f.anim) % frame.length]
        ctx.save()
        ctx.translate(f.x, f.y)
        if (f.isAttacking) {
            ctx.rotate(deg2rad(-30+mod(rad2deg(f.anim),60)) )
        }
        if (f.isDead) {
            ctx.rotate(deg2rad(90))
            ctx.scale(0.5,0.5)
        }
        ctx.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - 32, 0 - 32, 64, 64)
        ctx.restore()

       
        if (showDebug) {
            ctx.beginPath()
            ctx.lineWidth = 1;
            ctx.fillStyle = "green";
            if (!f.isAI) {
                ctx.fillStyle = "red";
            }

            ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
            ctx.fill();

            if (!f.isAI) {
                ctx.fillStyle = "red";
                ctx.font = "16px serif";
                ctx.fillStyle = "white";
                ctx.fillText(f.playerId + '',f.x,f.y)
            }
        }
    })

  

    figures.filter(f => !f.isAI).forEach((f,i) => {
        ctx.save()
        ctx.fillStyle = "red";
        ctx.beginPath();
        ctx.translate(32+i*48, canvas.height-32)
        ctx.arc(0,0,16,0, 2 * Math.PI);
        ctx.fill();
        ctx.textAlign = "center";
        ctx.textBaseline='center'
        ctx.fillStyle = "white";
        ctx.font = "24px arial";
        ctx.fillText(f.points,0,-12); // Punkte
        ctx.stroke();
        ctx.restore()
    })

    ctx.font = "16px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'

    ctx.save()
    ctx.textAlign = "right";
    ctx.fillText(fps + " FPS", canvas.width, 0);
    ctx.restore()

    if (showDebug) {
        ctx.save()
        ctx.fillText('Players',0,0)
        players.forEach((g,i) => {
            ctx.translate(0,16)
            ctx.fillText("xAxis: " + g.xAxis.toFixed(2) + " yAxis: " + g.yAxis.toFixed(2) + " Attack?: " + g.isAttackButtonPressed,0,0) 
        })
        ctx.restore()
    
        ctx.save()
        ctx.textBaseline='bottom'
        ctx.translate(0,canvas.height)
        figures.forEach((g,i) => {
            ctx.fillText("playerId: " + g.playerId + " x: " + Math.floor(g.x) + " y: " + Math.floor(g.y) + " Dead: " + g.isDead,0,0) 
            ctx.translate(0,-16)
        })
        ctx.fillText('Figures',0,0)
        ctx.restore()
    }

}