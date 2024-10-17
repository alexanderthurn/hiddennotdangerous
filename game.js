console.log('no need to hide')
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mousePlayers = [{x: 0, y: 0, offsetCursorX: 0, offsetCursorY: 0,pressed: {}, pressedLastFrame: false}];
var keyboardPlayers = [{}, {}];
var keyboards = [{bindings: {
    'KeyA': {playerId: 'k0', action: 'left'},
    'KeyD': {playerId: 'k0', action: 'right'},
    'KeyW': {playerId: 'k0', action: 'up'},
    'KeyS': {playerId: 'k0', action: 'down'},
    'KeyT': {playerId: 'k0', action: 'attack'},
    'ArrowLeft': {playerId: 'k1', action: 'left'},
    'ArrowRight': {playerId: 'k1', action: 'right'},
    'ArrowUp': {playerId: 'k1', action: 'up'},
    'ArrowDown': {playerId: 'k1', action: 'down'},
    'Numpad0': {playerId: 'k1', action: 'attack'}}, pressed: {}}];
var virtualGamepads = []
var startTime, then, now, dt, fps=0, fpsTime
var isGameStarted = false, lastWinnerPlayerId = null, lastWinnerPlayerIdThen
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figures = [], maxFigures = 21
var image = new Image()
var showDebug = false
var lastKillTime;
var multikillCounter;
var multikillTimeWindow = 4000;
var lastTotalkillAudio;
var totalkillCounter;
image.src = 'character_base_16x16.png'
var imageAnim = {
    down: {a: [[0,0,16,16], [16,0,16,16], [32,0,16,16], [48,0,16,16]]},
    up: {a: [[0,16,16,16], [16,16,16,16], [32,16,16,16], [48,16,16,16]]},
    left: {a: [[0,48,16,16], [16,48,16,16], [32,48,16,16], [48,48,16,16]]},
    right: {a: [[0,32,16,16], [16,32,16,16], [32,32,16,16], [48,32,16,16]]}
}
var texture = new Image()
texture.src = 'texture_grass.jpg'
let tileArea = []
const textureTiles = {
    flowers: [1288, 23, 609, 609],
    grass: [655, 23, 609, 609],
    mushrooms: [23, 23, 609, 609]
}
const tileWidth = 100;
const textureTilesList = Object.values(textureTiles);
const audio = {
    attack: {title: 'sound2.mp3', currentTime: 0.15},
    death: {title: 'sound1.mp3', currentTime: 0.4},
    music1: {title: 'music1.mp3', currentTime: 20, volume: 0.5},
    music2: {title: 'music2.mp3', volume: 0.5},
    music3: {title: 'music3.mp3', volume: 0.5},
    join: {title: 'sounddrum.mp3'},
    firstBlood: {title: 'first-blood.mp3', volume: 0.5},
    doubleKill: {title: 'double-kill.mp3', volume: 0.5},
    tripleKill: {title: 'triple-kill.mp3', volume: 0.5},
    multiKill: {title: 'multi-kill.mp3', volume: 0.5},
    megaKill: {title: 'mega-kill.ogg'},
    ultraKill: {title: 'ultra-kill.mp3', volume: 0.5},
    monsterKill: {title: 'monster-kill.mp3', volume: 0.5},
    ludicrousKill: {title: 'ludicrous-kill.mp3', volume: 0.5},
    holyShit: {title: 'holy-shit.ogg'},

    killingSpree: {title: 'killing-spree.mp3', volume: 0.5},
    rampage: {title: 'rampage.mp3', volume: 0.5},
    dominating: {title: 'dominating.mp3', volume: 0.5},
    unstoppable: {title: 'unstoppable.ogg'},
    godlike: {title: 'god-like.mp3', volume: 0.5},
    wickedSick: {title: 'wicked-sick.ogg'}
}
var music1 = getAudio(audio.music1);
var music2 = getAudio(audio.music2);
var music3 = getAudio(audio.music3);
var soundJoin = getAudio(audio.join);
var soundFirstBlood = getAudio(audio.firstBlood);
var soundDoubleKill = getAudio(audio.doubleKill);
var soundTripleKill = getAudio(audio.tripleKill);
var soundMultiKill = getAudio(audio.multiKill);
var soundMegaKill = getAudio(audio.megaKill);
var soundUltraKill = getAudio(audio.ultraKill);
var soundMonsterKill = getAudio(audio.monsterKill);
var soundLudicrousKill = getAudio(audio.ludicrousKill);
var soundHolyShit = getAudio(audio.holyShit);
var soundKillingSpree = getAudio(audio.killingSpree);
var soundRampage = getAudio(audio.rampage);
var soundDominating = getAudio(audio.dominating);
var soundUnstoppable = getAudio(audio.unstoppable);
var soundGodlike = getAudio(audio.godlike);
var soundWickedSick = getAudio(audio.wickedSick);

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)
    widthInTiles2 = Math.ceil(canvas.width/tileWidth);

    gameInit()
    window.requestAnimationFrame(gameLoop);
})

window.addEventListener('keydown', event => {
    keyboards.forEach(k => {
        k.pressed[event.code] = true;
    });

    if (event.code === 'ArrowDown' || event.code === 'ArrowUp') { /* prevent scrolling of website */
        event.preventDefault();
    }
  
});


window.addEventListener('touchstart', event => {
    event.preventDefault();
}, { passive: false });
window.addEventListener('touchend', event => {
    event.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', event => {
    event.preventDefault();
}, { passive: false });


window.addEventListener('keyup', event => {
    if (event.code === 'Escape') {
        showDebug =!showDebug
    }
    keyboards.forEach(k => {
        delete k.pressed[event.code];
    });
});

window.addEventListener('pointerdown', event => {
    mousePlayers[0].pressed[event.button] = true;
    event.preventDefault();
    event.stopPropagation();
});

window.addEventListener('pointerup', event => {
    delete mousePlayers[0].pressed[event.button];
    event.preventDefault();
    event.stopPropagation();
});

canvas.addEventListener('pointermove', event => {
    mousePlayers[0].x = event.clientX - canvas.offsetLeft;
    mousePlayers[0].y = event.clientY -  canvas.offsetTop;
    event.preventDefault();
    event.stopPropagation();
}, false);

window.addEventListener("resize", function(event){
    resizeCanvasToDisplaySize(canvas)
});

function gameInit() {
    then = Date.now();
    startTime = then;
    fpsTime = then
    lastKillTime = undefined;
    multikillCounter = 0;
    lastTotalkillAudio = 0;
    totalkillCounter = 0;
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
            startWalkTime: 0,
            speed: 0,
            isDead: false, 
            playerId: null,
            index: i,
            angle: angle(x,y,xTarget,yTarget),
            anim: 0,
            isAttacking: false,
            attackDuration: 500,
            attackBreakDuration: 2000,
            lastAttackTime: 0,
            points: 0,
            attackDistance: 80,
            soundAttack: getAudio(audio.attack),
            soundDeath: getAudio(audio.death)
        }

        if (activePlayerIds.length > i) {
            figure.playerId = activePlayerIds[i]
            figure.points = oldFigures.find(f => f.playerId == figure.playerId).points
        }

        figures.push(figure)

        mousePlayers.forEach(mp => {
            mp.offsetCursorX = -canvas.width*0.1+Math.random()*canvas.width*0.2
            mp.offsetCursorY = -canvas.height*0.1+Math.random()*canvas.height*0.2
        })
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
        g.isAttackButtonPressed = false
        if (g.buttons[0].pressed) {
            g.isAttackButtonPressed = true
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
                let p = keyboardPlayers.find(kp => binding.playerId ===  kp.playerId);
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

    
    mousePlayers.forEach((mp,i) => {
        mp.type = 'mouse'
        mp.playerId = 'm' + i
        mp.isAttackButtonPressed = !mp.pressed[0] && mp.pressedLastFrame || false
        mp.pressedLastFrame = mp.pressed[0]
        mp.xAxis = 0
        mp.yAxis = 0
        mp.isMoving = 0

        var f = figures.find(f => f.playerId ===  mp.playerId)
        if (f) {
            let x = mp.x - f.x;
            let y = mp.y - f.y;
            //[x, y] = setDeadzone(x, y,0.1);
            //[x, y] = clampStick(x, y);
            mp.xAxis = x
            mp.yAxis = y
            mp.isMoving = Math.abs(x) > 1 && Math.abs(y) > 1
        }
       
    })
   
    let players = [...gamepadPlayers, ...keyboardPlayers, ...mousePlayers];
    const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.playerId).includes(k.playerId)).length;

    dtToProcess += dt
    while(dtToProcess > dtFix) {
        handleInput(players, figures, dtProcessed)
        handleAi(figures, dtProcessed, oldNumberJoinedKeyboardPlayers)
        updateGame(figures, dtFix,dtProcessed)
        dtToProcess-=dtFix
        dtProcessed+=dtFix
    }
    
    draw(players, figures, dt, dtProcessed, 0);
    draw(players, figures, dt, dtProcessed, 1);
    then = now

    var figuresWithPlayer = figures.filter(f => f.playerId)
    var survivors = figuresWithPlayer.filter(f => !f.isDead)
    if (survivors.length == 1 && figuresWithPlayer.length > 1) {
        if (isGameStarted) {
            survivors[0].points++
            lastWinnerPlayerId = survivors[0].playerId
            lastWinnerPlayerIdThen = dtProcessed
        } else {
            isGameStarted = true
        }
        gameInit()
    }
    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt, dtProcessed) {
    let figuresAlive = figures.filter(f => !f.isDead);
    figuresAlive.forEach(f => {
        let xyNew = move(f.x, f.y, f.angle,f.speed, dt)
        f.x = xyNew.x
        f.y = xyNew.y
        f.anim += f.speed
       // f.anim += f.isAttacking ? 0.5 : 0

        if (f.x > canvas.width) f.x = canvas.width
        if (f.y > canvas.height) f.y = canvas.height
        if (f.x < 0) f.x = 0
        if (f.y < 0) f.y = 0
        
    })
    let numberKilledFigures = 0;
    let killTime;
    figuresAlive.filter(f => f.isAttacking).forEach(f => {
        figures.filter(fig => fig !== f && !fig.isDead).forEach(fig => {
            let diffAngle = Math.abs(rad2limiteddeg(f.angle-angle(f.x,f.y,fig.x,fig.y))-180);
            if (distance(f.x,f.y,fig.x,fig.y) < f.attackDistance && diffAngle <= 90) {
                fig.isDead = true;
                fig.y+=16
                playAudio(fig.soundDeath);
                numberKilledFigures++;
                killTime = dtProcessed;
            }
        });
    })
    playKillingSounds(numberKilledFigures, killTime);
}

function handleInput(players, figures, dtProcessed) {
    // join by doing anything
    players.filter(p => p.isAttackButtonPressed || p.isMoving).forEach(p => {
        var figure = figures.find(f => f.playerId === p.playerId)
        if (!figure) {
            var figure = figures.find(f => !f.playerId)
            figure.isDead = false
            figure.playerId = p.playerId
            playAudio(soundJoin);
            lastWinnerPlayerId = figure.playerId  
            lastWinnerPlayerIdThen = dtProcessed

            if (figures.filter(f => f.playerId).length == 2) {
                playPlaylist(shuffle([music1, music2, music3]))   
                isGameStarted = true                                                                                                                                                                                 
            }  
        }
    })

    figures.filter(f => f.playerId).forEach(f => {
        var p = players.find(p => p.playerId === f.playerId)

        f.speed = 0.0
        if (!f.isDead) {
            if (p.isMoving) {
                f.angle = angle(0,0,p.xAxis,p.yAxis)
                f.speed = f.maxSpeed
            }
            if (p.isAttackButtonPressed && !f.isAttacking) {

                if (dtProcessed-f.lastAttackTime > f.attackBreakDuration) {
                    f.lastAttackTime = dtProcessed
                    playAudio(f.soundAttack);
                }
            }
            f.isAttacking = dtProcessed-f.lastAttackTime < f.attackDuration ? true : false;
        }
    })
}

function handleAi(figures, time, oldNumberJoinedKeyboardPlayers) {
    const numberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.playerId).includes(k.playerId)).length;
    const startKeyboardMovement = oldNumberJoinedKeyboardPlayers === 0 && numberJoinedKeyboardPlayers > 0;
    const livingAIFigures = figures.filter(f => !f.playerId && !f.isDead);
    let shuffledIndexes;
    if (startKeyboardMovement) {
        shuffledIndexes = shuffle([...Array(livingAIFigures.length).keys()]);
    }
    livingAIFigures.forEach((f,i,array) => {
        if (((startKeyboardMovement && shuffledIndexes[i] < array.length/2) || distance(f.x,f.y,f.xTarget,f.yTarget) < 5) && f.speed > 0) {
            const breakDuration = startKeyboardMovement ? 0 : Math.random() * f.maxBreakDuration;
            f.startWalkTime = Math.random() * breakDuration + time
            f.speed = 0
        }
        if (time >= f.startWalkTime) {
            if (f.speed === 0) {
                if (!startKeyboardMovement) {
                    f.xTarget = Math.random()*canvas.width
                    f.yTarget = Math.random()*canvas.height
                }

                if (numberJoinedKeyboardPlayers > 0) {
                    discreteAngle = getNextDiscreteAngle(angle(f.x, f.y, f.xTarget, f.yTarget), 8);
                    const direction = {x: Math.cos(discreteAngle), y: Math.sin(discreteAngle)};
                    let distanceToBorder;
                    if (direction.x !== 0) {
                        const xBorder = direction.x > 0 ? canvas.width : 0;
                        let t = (xBorder - f.x)/direction.x;
                        let y = t*direction.y + f.y;
                        if (y >= 0 && y < canvas.height) {
                            distanceToBorder = t;
                        }
                    }
                    if (direction.y !== 0) {
                        const yBorder = direction.y > 0 ? canvas.height : 0;
                        let t = (yBorder - f.y)/direction.y;
                        let x = t*direction.x + f.x;
                        if (x >= 0 && x < canvas.width) {
                            distanceToBorder = t;
                        }
                    }
                    const tRandom = Math.random() * distanceToBorder;
                    f.xTarget = tRandom * direction.x + f.x;
                    f.yTarget = tRandom * direction.y + f.y;
                }
            }
            
            if (f.xTarget > canvas.width) f.xTarget = canvas.width
            if (f.yTarget > canvas.height) f.yTarget = canvas.height
            if (f.xTarget < 0) f.xTarget = 0
            if (f.yTarget < 0) f.yTarget = 0

            f.angle = angle(f.x,f.y,f.xTarget,f.yTarget)
            f.speed = f.maxSpeed
        }
    })
}

function draw(players, figures, dt, dtProcessed, layer) {
    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const heightInTiles = getHeightInTiles();
        const widthInTiles = getWidthInTiles();
        for (let i = 0; i < tileArea.length; i++) {
            for (let j = tileArea[i].length; j < heightInTiles; j++) {
                tileArea[i][j] = getRandomInt(3);
            }
        }
        for (let i = tileArea.length; i < widthInTiles; i++) {
            tileArea[i] = [];
            for (let j = 0; j < heightInTiles; j++) {
                tileArea[i][j] = getRandomInt(3);
            }
        }

        ctx.save();
        for (let i = 0; i < Math.min(tileArea.length, widthInTiles); i++) {
            for (let j = 0; j < Math.min(tileArea[i].length, heightInTiles); j++) {
                const tile = textureTilesList[tileArea[i][j]];
                ctx.drawImage(texture, tile[0], tile[1], tile[2], tile[3], 0, 0, tileWidth, tileWidth)
                if(j < Math.min(tileArea[i].length, heightInTiles)-1) {
                    ctx.translate(0, tileWidth);
                } else {
                    ctx.translate(tileWidth, -tileWidth * j);
                } 
                
            }
        }
        ctx.restore();

    }
    ctx.save()
    ctx.strokeStyle = "rgba(165,24,24,0.5)";
    ctx.lineWidth = 15;
    ctx.lineJoin = "bevel";
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.restore()

    if (!isGameStarted) {
        ctx.save()
        ctx.shadowColor = "rgba(0,0,0,1)"
        ctx.shadowOffsetX = -canvas.width;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 2+Math.sin(dtProcessed*0.001)*2;
        ctx.font = canvas.width*0.06+"px serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline='center'
        ctx.translate(canvas.width*1.5,canvas.height*0.3)
        ctx.fillText('Hidden Not Dangerous',0,0)
        ctx.font = canvas.width*0.03+"px serif";
        ctx.shadowBlur = 1;
        ctx.fillText('WASDT',0,96)
        ctx.fillText(String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0',0,96*2)
        ctx.fillText('Gamepad',0,96*3)
        ctx.fillText('Mouse',0,96*4)
        ctx.restore()
    }

    //ctx.drawImage(texture, tile[0], tile[1], tile[2], tile[3], 0, 0, 100, 100)
    ctx.save()
    
    for (x = -2; x < 2;x ++) {
        for (y = -2;y < 2;y++) {
            ctx.beginPath();
            ctx.arc(mousePlayers[0].x + mousePlayers[0].offsetCursorX + x*canvas.width*0.5, mousePlayers[0].y + mousePlayers[0].offsetCursorY + y*canvas.height*0.5, 5, 0, 2 * Math.PI);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.stroke();
        }
    }
    

    ctx.restore()

    figures.toSorted((f1,f2) => (f2.isDead || f1.isDead) ? f2.isDead - f1.isDead:  f1.y - f2.y ).forEach(f => {
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
        
        let indexFrame = 0;
        if (f.speed > 0) {
            indexFrame = Math.floor(f.anim) % frame.length;
        }
        let sprite = frame[indexFrame]
        ctx.save()
        ctx.translate(f.x, f.y)

        if (layer === 0) {
            if (f.isDead) {
                ctx.rotate(deg2rad(90))
                ctx.scale(0.5,0.5)
                ctx.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - 32, 0 - 32, 64, 64)
            } else {
                // shadow
                ctx.shadowColor = "rgba(0,0,0,0.5)"
                ctx.shadowOffsetX = -canvas.width;
                ctx.shadowOffsetY = 0;
                ctx.shadowBlur = 16;
                ctx.translate(canvas.width+24,-8)
                ctx.transform(1, 0.1, -0.8, 1, 0, 0);
                ctx.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - 32, 0 - 32, 64, 64)
            }
        } else {
            if (!f.isDead) {
                if (f.isAttacking) {
                    //ctx.rotate(deg2rad(-10+mod(dtProcessed*0.5,20)) )
                   
                    if (deg < 45 || deg > 315) {
                        ctx.rotate(deg2rad(20))
                    } else if (deg >= 45 && deg <= 135){
                        ctx.rotate(deg2rad(-20))
                    } else if (deg > 135 && deg < 225){
                        ctx.rotate(deg2rad(-20))
                    } else {
                        ctx.rotate(deg2rad(20))
                    }
                }
                ctx.drawImage(image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - 32, 0 - 32, 64, 64)
            }
        }
        ctx.restore()  
       
        if (showDebug && layer === 1) {
            if (f.isAttacking) {
                ctx.save()
                let startAngle = f.angle + deg2rad(135)
                let endAngle = startAngle + deg2rad(90)
                ctx.translate(f.x, f.y)
                ctx.lineWidth = 1;
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.arc(0,0,f.attackDistance, startAngle, endAngle)
                ctx.closePath()
                ctx.fill();
                ctx.restore()
            }

            ctx.beginPath()
            ctx.lineWidth = 1;
            ctx.fillStyle = "green";
            if (f.playerId) {
                ctx.fillStyle = "red";
            }

            ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath()

            if (f.playerId) {
                ctx.fillStyle = "red";
                ctx.font = "16px serif";
                ctx.fillStyle = "white";
                ctx.fillText(f.playerId + '',f.x,f.y)
            }
        }
    })

    if (layer === 1) {
        figures.filter(f => f.playerId).forEach((f,i) => {
            ctx.save()
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.beginPath();
            if (lastWinnerPlayerId !== f.playerId) {
                ctx.translate(32+i*48, canvas.height-32)
            } else {
                var dtt = dtProcessed - lastWinnerPlayerIdThen
                var lastWinnerPlayerIdDuration = 1000
                if (dtt > lastWinnerPlayerIdDuration) {
                    dtt = lastWinnerPlayerIdDuration
                }

                var lp = dtt / (lastWinnerPlayerIdDuration)
                var lpi = 1-lp
                ctx.translate(lpi * (canvas.width*0.5) + lp*(32+i*48), lpi*(canvas.height*0.5) + lp*(canvas.height-32))
                ctx.scale(12.0*lpi + 1*lp,12.0*lpi +1*lp)

            }

            ctx.arc(0,0,16,0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath()
            ctx.textAlign = "center";
            ctx.textBaseline='center'
            ctx.fillStyle = "white";
            ctx.font = "24px arial";
            ctx.fillText(f.points,0,-10); // Punkte
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
    

}