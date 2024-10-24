console.log('no need to hide')
var loadPromises = []
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mousePlayers = [{x: 0, y: 0, offsetCursorX: 0, offsetCursorY: 0,pressed: new Set(), pressedLastFrame: false}];
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
    'Numpad0': {playerId: 'k1', action: 'attack'}}, pressed: new Set()}];
var virtualGamepads = []
var startTime, then, now, dt, fps=0, fpsMinForEffects=30, fpsTime
var isGameStarted = false, restartGame = false, lastWinnerPlayerIds = new Set(), lastWinnerPlayerIdThen, lastFinalWinnerPlayerId;
const moveNewScoreDuration = 1000, moveScoreToPlayerDuration = 1000, showFinalWinnerDuration = 3000;
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figures = [], maxPlayerFigures = 32
var showDebug = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = {}
var tileMap;
var playerImage = new Image()
playerImage.src = 'character_base_16x16.png'
var playerImageAnim = {
    width: 64,
    height: 64,
    tileWidth: 16,
    tileHeight: 16,
    hasDirections: true,
    animDefaultSpeed: 0,
    down: {a: [[0,0,16,16], [16,0,16,16], [32,0,16,16], [48,0,16,16]]},
    up: {a: [[0,16,16,16], [16,16,16,16], [32,16,16,16], [48,16,16,16]]},
    left: {a: [[0,48,16,16], [16,48,16,16], [32,48,16,16], [48,48,16,16]]},
    right: {a: [[0,32,16,16], [16,32,16,16], [32,32,16,16], [48,32,16,16]]},
    default: {a: [[0,0,16,16]]}
}
var playerShadowImage
var playerImageShadowAnim
loadPromises.push(new Promise((resolve, reject) => {
    playerImage.onload = () => {
        [playerShadowImage, playerImageShadowAnim] = shadowrize(playerImage,playerImageAnim)
        resolve()
    }
}))



var cloudImage = new Image()
cloudImage.src = 'fart.png'
/*loadPromises.push(new Promise((resolve, reject) => {
    cloudImage.onload = () => {
        cloudImage = colorize(cloudImage, 139.0/256,69.0/256,19.0/256)
        resolve()
    }
}))*/
var texture = new Image()
texture.src = 'texture_grass.jpg'
loadPromises.push(new Promise((resolve, reject) => {
    texture.onload = () => {
        tileMap = tileMapFunc(texture);
        resolve();
    }
}))


cloudImageAnim = {
    hasDirections: false,
    width: 128,
    height: 128,
    animDefaultSpeed: 0.1,
    default: {a: [[0,0,64,64],[64,0,64,64],[128,0,64,64],[0,64,64,64],[64,64,64,64],[128,64,64,64],[0,128,64,64],[64,128,64,64],[128,128,64,64]]}
}
var foodImage = new Image()
foodImage.src = 'food-OCAL.png'
foodImageAnim = {
    hasDirections: false,
    width: 64,
    height: 64,
    animDefaultSpeed: 0,
    down: {a: [[192,64,32,32]]},
    up: {a: [[64,64,32,32]]},
    left: {a: [[256,32,32,32]]},
    right: {a: [[32,192,32,32]]},
    default: {a: [[224,256,32,32]]}
}


let tileArea = []
const textureTiles = {
    flowers: [1288, 23, 609, 609],
    grass: [655, 23, 609, 609],
    mushrooms: [23, 23, 609, 609]
}
const tileWidth = 120;
const textureTilesList = Object.values(textureTiles);
const audio = {
    attack: {title: 'sound2.mp3', currentTime: 0.15},
    attack2: {title: 'sound1.mp3', currentTime: 0.15},
    death: {title: 'gag-reflex-41207.mp3', currentTime: 0.0},
    join: {title: 'sounddrum.mp3'},
    firstBlood: {title: 'first-blood.mp3', volume: 0.2},

    music: [
        {title: 'music1.mp3', currentTime: 20, volume: 0.5},
        {title: 'music2.mp3', volume: 0.5},
        {title: 'music3.mp3', volume: 0.5}
    ],
    multiKill: [
        {title: 'double-kill.mp3', volume: 0.3},
        {title: 'triple-kill.mp3', volume: 0.4},
        {title: 'multi-kill.mp3', volume: 0.5},
        {title: 'mega-kill.ogg'},
        {title: 'ultra-kill.mp3', volume: 0.5},
        {title: 'monster-kill.mp3', volume: 0.5},
        {title: 'ludicrous-kill.mp3', volume: 0.5},
        {title: 'holy-shit.ogg'}
    ],
    totalKill: [
        {title: 'killing-spree.mp3', volume: 0.5},
        {title: 'rampage.mp3', volume: 0.5},
        {title: 'dominating.mp3', volume: 0.5},
        {title: 'unstoppable.ogg'},
        {title: 'god-like.mp3', volume: 0.5},
        {title: 'wicked-sick.ogg'}
    ],

    eat: [
        {title: 'eatingsfxwav-14588.mp3'},
        {title: 'carrotnom-92106.mp3'},
        {title: 'eat-a-cracker-95783.mp3', volume: 0.5},
        {title: 'game-eat-sound-83240.mp3', volume: 1.0},
        {title: 'game-eat-sound-83240.mp3'}
    ]
}

var music = shuffle(audio.music.map(audio => getAudio(audio)));
var soundJoin = getAudio(audio.join);
var soundFirstBlood = getAudio(audio.firstBlood);

var soundMultiKill = audio.multiKill.map(audio => getAudio(audio));
var soundTotalKill = audio.totalKill.map(audio => getAudio(audio));
var soundEat = audio.eat.map(audio => getAudio(audio));

document.addEventListener("DOMContentLoaded", function(event){
    resizeCanvasToDisplaySize(canvas)
    adjustLevelToCanvas(level, canvas)
    tileMap = tileMapFunc(texture);

    // loading images
    ctx.save()
    ctx.font = canvas.height*0.1+"px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText('Loading...',0,0)
    ctx.restore()

    Promise.all(loadPromises).then(() => { 
        ctx.clearRect(0,0, canvas.width, canvas.height)
      
        gameInit()
        window.requestAnimationFrame(gameLoop);
    })
   
})

window.addEventListener("resize", function(event){
    resizeCanvasToDisplaySize(canvas)
    adjustLevelToCanvas(level, canvas)
});

window.addEventListener('keydown', event => {
    keyboards.forEach(k => {
        k.pressed.add(event.code);
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
        k.pressed.delete(event.code);
    });
});

window.addEventListener('pointerdown', event => {
    mousePlayers[0].pressed.add(event.button);
    event.preventDefault();
    event.stopPropagation();
});

window.addEventListener('pointerup', event => {
    mousePlayers[0].pressed.delete(event.button);
    event.preventDefault();
    event.stopPropagation();
});

canvas.addEventListener('pointermove', event => {
    mousePlayers[0].x = (event.clientX - canvas.offsetLeft - level.offsetX)/level.scale;
    mousePlayers[0].y = (event.clientY -  canvas.offsetTop - level.offsetY)/level.scale;
    event.preventDefault();
    event.stopPropagation();
}, false);



function gameInit(completeRestart) {
    console.log('start game init')
    then = Date.now();
    startTime = then;
    //dtProcessed = 0
    lastFinalWinnerPlayerId = undefined
    fpsTime = then
    lastKillTime = undefined;
    multikillCounter = 0;
    lastTotalkillAudio = 0;
    totalkillCounter = 0;
    var activePlayerIds = figures.filter(f => f.playerId && f.type === 'fighter').map(f => f.playerId)
    var oldFigures = figures
    figures = []
    for (var i = 0; i < maxPlayerFigures; i++) {
        const x = Math.random()*level.width;
        const y = Math.random()*level.height;
        const xTarget = Math.random()*level.width;
        const yTarget = Math.random()*level.height;
        var figure = {
            x,
            y,
            xTarget,
            yTarget,
            maxBreakDuration: 5000,
            startWalkTime: Math.random() * 5000 + dtProcessed,
            maxSpeed: 0.08,
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
            attackAngle: 90,
            soundAttack: getAudio(audio.attack),
            soundAttack2: getAudio(audio.attack2),
            soundDeath: getAudio(audio.death),
            beans: new Set(),
            beansFarted: new Set(),
            image: playerImage,
            imageAnim: playerImageAnim,
            imageShadow: playerShadowImage,
            imageShadowAnim: playerImageShadowAnim,
            type: 'fighter',
            scale: 1,
            zIndex: 0,
            frame: null
        }

        if (activePlayerIds.length > i) {
            figure.playerId = activePlayerIds[i]
            if (!completeRestart) {
                figure.points = oldFigures.find(f => f.playerId == figure.playerId).points
            } 
        }

        figures.push(figure)

        /*mousePlayers.forEach(mp => {
            mp.offsetCursorX = -level.width*0.1+Math.random()*level.width*0.2
            mp.offsetCursorY = -level.height*0.1+Math.random()*level.height*0.2
        })*/
    }
    console.log('HALF game init')
    figures.push({
        id: 1,
        type: 'bean',
        x: level.width/5,
        y: level.height/5,
        image: foodImage,
        imageAnim: foodImageAnim,
        frame: foodImageAnim.left.a,
        attackDistance: 32,
        angle: 0,    
        speed: 0,
        angle: 0,
        scale: 1,
        zIndex: -level.height
    });
    figures.push({
        id: 2,
        type: 'bean',
        x: level.width*4/5,
        y: level.height/5,
        image: foodImage,
        attackDistance: 32,
        imageAnim: foodImageAnim,
        frame: foodImageAnim.up.a,
        speed: 0,
        angle: 0,
        scale: 1,
        zIndex: -level.height
    });
    figures.push({
        id: 3,
        type: 'bean',
        x: level.width/5,
        y: level.height*4/5,
        image: foodImage,
        attackDistance: 32,
        imageAnim: foodImageAnim,
        frame: foodImageAnim.down.a,
        speed: 0,
        angle: 0,
        scale: 1,
        zIndex: -level.height
    });
    figures.push({
        id: 4,
        type: 'bean',
        x: level.width*4/5,
        y: level.height*4/5,
        image: foodImage,
        attackDistance: 32,
        imageAnim: foodImageAnim,
        frame: foodImageAnim.right.a,
        speed: 0,
        angle: 0,
        scale: 1,
        zIndex: -level.height
    });
    figures.push({
        id: 5,
        type: 'bean',
        x: level.width/2,
        y: level.height/2,
        image: foodImage,
        attackDistance: 32,
        imageAnim: foodImageAnim,
        frame: foodImageAnim.default.a,
        speed: 0,
        angle: 0,
        scale: 1,
        zIndex: -level.height
    });

    console.log('FINISH game init')
}


function addFartCloud(x,y,playerId, size=1) {
    figures.push({
        type: 'cloud',
        x,
        y,
        playerId, playerId,
        image: cloudImage,
        imageAnim: cloudImageAnim,    
        speed: 0,
        angle: 0,
        anim: 0,
        size: size,
        scale: 0,
        zIndex: 1000,
        attackAngle: 360,
        isAttacking: false,
        attackDuration: 10000000,
        attackDistance: 64,
        lifetime: 0
    })
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
        [x, y] = setDeadzone(x, y,0.2);
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
        Array.from(k.pressed.values()).forEach(pressedButton => {
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
        mp.isAttackButtonPressed = !mp.pressed.has(0) && mp.pressedLastFrame || false
        mp.pressedLastFrame = mp.pressed.has(0)
        mp.xAxis = 0
        mp.yAxis = 0
        mp.isMoving = 0

        var f = figures.find(f => f.playerId ===  mp.playerId && f.type === 'fighter')
        if (f) {
            //let x = mp.x - f.x;
            //let y = mp.y - f.y;
            let x = mp.x - level.width / 2;
            let y = mp.y - level.height / 2;
            //[x, y] = setDeadzone(x, y,0.1);
            //[x, y] = clampStick(x, y);
            mp.xAxis = x
            mp.yAxis = y

            if (!mp.pressed.has(0)) {
                mp.xAxis = 0
                mp.yAxis = 0
            }
            mp.isMoving = Math.abs(mp.xAxis) > 0 || Math.abs(mp.yAxis) > 0
        }
       
    })
   
    let players = [...gamepadPlayers, ...keyboardPlayers, ...mousePlayers];
    const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.type === 'fighter' && f.playerId).includes(k.playerId)).length;

    dtToProcess += dt
    while(dtToProcess > dtFix) {
        if (!restartGame) {
            handleInput(players, figures, dtProcessed)
            handleAi(figures, dtProcessed, oldNumberJoinedKeyboardPlayers, dtFix)
            updateGame(figures, dtFix,dtProcessed)
        }
        dtToProcess-=dtFix
        dtProcessed+=dtFix
    }
    
    draw(players, figures, dt, dtProcessed, 0);
    draw(players, figures, dt, dtProcessed, 1);
    then = now

    const figuresWithPlayer = figures.filter(f => f.playerId && f.type === 'fighter')
    if (!restartGame) {
        var survivors = figuresWithPlayer.filter(f => !f.isDead)
        if (survivors.length < 2 && figuresWithPlayer.length > survivors.length) {
            if (isGameStarted && survivors.length == 1) {
                survivors[0].points++
                lastWinnerPlayerIds.clear();
                lastWinnerPlayerIds.add(survivors[0].playerId);
                lastWinnerPlayerIdThen = dtProcessed
            }
            restartGame = true;
        }

        const maxPoints = Math.max(...figuresWithPlayer.map(f => f.points));
        if (maxPoints > 2) {
            const figuresWithMaxPoints = figuresWithPlayer.filter(f => f.points === maxPoints);
            if (figuresWithMaxPoints.length === 1) {
                lastFinalWinnerPlayerId = figuresWithMaxPoints[0].playerId;
            }
        }
    }

    const gameBreakDuration = moveNewScoreDuration + (figuresWithPlayer.length+1)*moveScoreToPlayerDuration + showFinalWinnerDuration;
    if (restartGame && (!lastFinalWinnerPlayerId || dtProcessed - lastWinnerPlayerIdThen > gameBreakDuration)) {
        restartGame = false;
        isGameStarted = true;
        gameInit(!!lastFinalWinnerPlayerId);
    }

    /*
    let fullbeaners = figuresWithPlayer.filter(f => f.beans.size === 5);
    if (fullbeaners.length > 0 && figuresWithPlayer.length > 1) {
        if (isGameStarted) {
            lastWinnerPlayerIds.clear();
            fullbeaners.forEach(f => {
                f.points++
                lastWinnerPlayerIds.add(f.playerId);
            });
            lastWinnerPlayerIdThen = dtProcessed
        } else {
            isGameStarted = true
        }
        gameInit()
    }*/
    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt, dtProcessed) {
    let figuresAlive = figures.filter(f => !f.isDead);
    figuresAlive.forEach(f => {
        let xyNew = move(f.x, f.y, f.angle,f.speed, dt)
        f.x = xyNew.x
        f.y = xyNew.y
        f.anim += f.speed + f.imageAnim?.animDefaultSpeed
       // f.anim += f.isAttacking ? 0.5 : 0

        if (f.x > level.width) f.x = level.width
        if (f.y > level.height) f.y = level.height
        if (f.x < 0) f.x = 0
        if (f.y < 0) f.y = 0
        
    })
    
    let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter');
    figures.filter(f => f.type === 'bean').forEach(f => {
        playerFigures.forEach(fig => {
            if (distance(f.x,f.y,fig.x,fig.y + f.imageAnim.height*0.5) < f.attackDistance) {
                if (!fig.beans.has(f.id)) {
                    playAudio(soundEat[fig.beans.size]);
                    fig.beans.add(f.id);
                }
            }
        })
    })

    let numberKilledFigures = 0;
    let killTime;
    figuresAlive.filter(f => f.isAttacking).forEach(f => {
        figures.filter(fig => fig !== f && fig.playerId !== f.playerId && !fig.isDead && fig.type === 'fighter').forEach(fig => {
            let distAngles = distanceAngles(rad2deg(f.angle), rad2deg(angle(f.x,f.y,fig.x,fig.y)+180));
            if (distance(f.x,f.y,fig.x,fig.y) < f.attackDistance*f.scale && distAngles <= f.attackAngle) {
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
        var figure = figures.find(f => f.playerId === p.playerId && f.type === 'fighter')
        if (!figure) {
            var figure = figures.find(f => !f.playerId && f.type === 'fighter')
            figure.isDead = false
            figure.playerId = p.playerId
            playAudio(soundJoin);
            lastWinnerPlayerIds.clear();
            lastWinnerPlayerIds.add(figure.playerId);
            lastWinnerPlayerIdThen = dtProcessed

            figures.forEach(f => f.isDead = false)
            if (figures.filter(f => f.playerId).length == 2) {
                playPlaylist(music);
                restartGame = true;
            }  
        }
    })

    figures.filter(f => f.playerId && f.type === 'fighter').forEach(f => {
        var p = players.find(p => p.playerId === f.playerId && f.type === 'fighter')

        f.speed = 0.0
        if (!f.isDead) {
            if (p.isMoving) {
                f.angle = angle(0,0,p.xAxis,p.yAxis)
                f.speed = f.maxSpeed
            }
            if (p.isAttackButtonPressed && !f.isAttacking) {


                if (dtProcessed-f.lastAttackTime > f.attackBreakDuration) {

                    let xyNew = move(f.x, f.y, f.angle+deg2rad(180),f.attackDistance*0.5, 1)

                    if (f.beans.size > 0) {
                        playAudio(f.soundAttack2);
                        addFartCloud(xyNew.x,xyNew.y,f.playerId,f.beans.size)
                    } else {
                        playAudio(f.soundAttack);
                    }
                    f.beans.forEach(b => f.beansFarted.add(b))
                    f.beans.clear()
                    f.lastAttackTime = dtProcessed

                }
            }
            f.isAttacking = dtProcessed-f.lastAttackTime < f.attackDuration ? true : false;
        }
    })
}

function handleAi(figures, time, oldNumberJoinedKeyboardPlayers, dt) {
    const numberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.type === 'fighter' && f.playerId).includes(k.playerId)).length;
    const startKeyboardMovement = oldNumberJoinedKeyboardPlayers === 0 && numberJoinedKeyboardPlayers > 0;
    const livingAIFigures = figures.filter(f => !f.playerId && !f.isDead && f.type === 'fighter');
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
                    f.xTarget = Math.random()*level.width
                    f.yTarget = Math.random()*level.height
                }

                if (numberJoinedKeyboardPlayers > 0) {
                    discreteAngle = getNextDiscreteAngle(angle(f.x, f.y, f.xTarget, f.yTarget), 8);
                    const direction = {x: Math.cos(discreteAngle), y: Math.sin(discreteAngle)};
                    let distanceToBorder;
                    if (direction.x !== 0) {
                        const xBorder = direction.x > 0 ? level.width : 0;
                        let t = (xBorder - f.x)/direction.x;
                        let y = t*direction.y + f.y;
                        if (y >= 0 && y < level.height) {
                            distanceToBorder = t;
                        }
                    }
                    if (direction.y !== 0) {
                        const yBorder = direction.y > 0 ? level.height : 0;
                        let t = (yBorder - f.y)/direction.y;
                        let x = t*direction.x + f.x;
                        if (x >= 0 && x < level.width) {
                            distanceToBorder = t;
                        }
                    }
                    const tRandom = Math.random() * distanceToBorder;
                    f.xTarget = tRandom * direction.x + f.x;
                    f.yTarget = tRandom * direction.y + f.y;
                }
            }
            
            if (f.xTarget > level.width) f.xTarget = level.width
            if (f.yTarget > level.height) f.yTarget = level.height
            if (f.xTarget < 0) f.xTarget = 0
            if (f.yTarget < 0) f.yTarget = 0

            f.angle = angle(f.x,f.y,f.xTarget,f.yTarget)
            f.speed = f.maxSpeed
        }
    })

    figures.filter(f => f.type === 'cloud').forEach(f => {
        f.lifetime+=dt
        if (f.lifetime > 2000) {
            if (!f.isAttacking) {
                f.isAttacking = true
                f.scale = 3.0*f.size
            }
            f.scale*=Math.pow(0.999,dt)
            if (f.scale < 0.1) {
                f.scale = 0
                f.isDead = true
            }

        } else {
            if (f.scale <0.1) {
                f.scale = 0.1*f.size
            }
            f.scale*=Math.pow(1.0008,dt)
        }
        
        
    })
    var toDelete = figures.findIndex(f => f.type === 'cloud' && f.isDead)
    if (toDelete >= 0)
        figures.splice(toDelete,1)
}

function draw(players, figures, dt, dtProcessed, layer) {
    ctx.save()
    ctx.transform(level.scale, 0, 0, level.scale, level.offsetX, level.offsetY)

    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tileMap, 0, 0, level.width, level.height, 0, 0, level.width, level.height);
    }

    ctx.save()
    ctx.strokeStyle = "rgba(165,24,24,0.5)";
    ctx.lineWidth = 7;
    ctx.lineJoin = "bevel";
    ctx.strokeRect(3, 3, level.width-6, level.height-6);
    ctx.restore()

    if (!isGameStarted) {
        ctx.save()
        ctx.font = level.width*0.06+"px serif";
        ctx.fillStyle = "rgba(139,69,19,1.0)";
        ctx.strokeStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline='middle'
        ctx.lineWidth = 2
        ctx.translate(0.5*level.width,level.height*0.3)
        ctx.fillText('Hidden Not Dangerous',0,0)
        ctx.strokeText('Hidden Not Dangerous',0,0)
        ctx.font = level.width*level.scale*0.03+"px serif";
        ctx.fillStyle = "black";
        ctx.fillText('WASDT',0,96)
        ctx.fillText(String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0',0,96*2)
        ctx.fillText('Gamepad',0,96*3)
        ctx.fillText('Mouse',0,96*4)
        ctx.restore()
    }

    //ctx.drawImage(texture, tile[0], tile[1], tile[2], tile[3], 0, 0, 100, 100)
    ctx.save()
    /*for (x = -2; x < 2;x ++) {
        for (y = -2;y < 2;y++) {
            ctx.beginPath();
            ctx.arc(mousePlayers[0].x + mousePlayers[0].offsetCursorX + x*level.width*0.5, mousePlayers[0].y + mousePlayers[0].offsetCursorY + y*level.height*0.5, 5, 0, 2 * Math.PI);
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(0,0,0,0.5)";
            ctx.stroke();
        }
    }*/
    ctx.beginPath();
    ctx.arc(mousePlayers[0].x, mousePlayers[0].y, 5, 0, 2 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.stroke();
    ctx.restore()

    figures.toSorted((f1,f2) => (f1.y +f1.zIndex) - (f2.y +f2.zIndex) ).forEach(f => {
        
        let deg = rad2limiteddeg(f.angle)
        let sprite = null
        let spriteShadow = null

        if (f.imageAnim) {
            let frame
            let frameShadow
            if (f.frame) {
                frame = f.frame
            } else if (f.imageAnim.hasDirections) {
                if (distanceAngles(deg, 0) < 45) {
                    frame = f.imageAnim.right.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.right.a
                } else if (distanceAngles(deg, 90) <= 45){
                    frame = f.imageAnim.down.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.down.a
                } else if (distanceAngles(deg, 180) < 45){
                    frame = f.imageAnim.left.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.left.a
                } else {
                    frame = f.imageAnim.up.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.up.a
                }
            } else {
                frame = f.imageAnim.default.a
                frameShadow = f.imageShadowAnim && f.imageShadowAnim.default.a
            }

            let indexFrame = 0;
            if (f.imageAnim?.animDefaultSpeed > 0 || f.speed > 0) {
                indexFrame = Math.floor(f.anim) % frame.length;
            }

            sprite = frame[indexFrame]
            spriteShadow = frameShadow && frameShadow[indexFrame]
        }
        
     

        ctx.save()
        ctx.translate(f.x, f.y)

        if (layer === 0) {
            if (f.isDead) {
                ctx.rotate(deg2rad(90))
                ctx.scale(0.5*f.scale,0.5*f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            } else if (f.imageShadow) {
                ctx.scale(1.0*f.scale,1.0*f.scale)
                ctx.drawImage(f.imageShadow, spriteShadow[0], spriteShadow[1], spriteShadow[2], spriteShadow[3], 0 - f.imageShadowAnim.width*0.5, 0 - f.imageShadowAnim.height*0.5, f.imageShadowAnim.width, f.imageShadowAnim.height)
            }
        } else {
            if (f.type === 'bean') {
                // bean image
                let startAngle = f.angle + deg2rad(135)
                let endAngle = startAngle + deg2rad(90)
  
                ctx.scale(1.0*f.scale,1.0*f.scale)
                ctx.beginPath();
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.arc(0,0,f.attackDistance, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.arc(0,0,f.attackDistance*0.8, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill();

                ctx.scale(0.5+0.1*Math.sin(dtProcessed*0.001), 0.5+0.1*Math.sin(dtProcessed*0.001))
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            } else if (!f.isDead) {
                if (f.isAttacking) {
                    if (f.type == 'fighter') {
                        if (distanceAngles(deg, 0) < 45) {
                            ctx.rotate(deg2rad(20))
                        } else if (distanceAngles(deg, 90) <= 45){
                            ctx.rotate(deg2rad(-20))
                        } else if (distanceAngles(deg, 180) < 45){
                            ctx.rotate(deg2rad(-20))
                        } else {
                            ctx.rotate(deg2rad(20))
                        }
                    } else if (f.type === 'cloud') {
                        ctx.globalCompositeOperation = "difference";
                    }
                } 
                ctx.scale(1.0*f.scale,1.0*f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            }
        }
        ctx.restore()  
       
        if (showDebug && layer === 1) {
            if (f.isAttacking) {
                ctx.save()
                let startAngle = f.angle + deg2rad(45+f.attackAngle)
                let endAngle = startAngle + deg2rad(f.attackAngle)
                ctx.translate(f.x, f.y)
                ctx.lineWidth = 1;
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.arc(0,0,f.attackDistance*f.scale, startAngle, endAngle)
                ctx.closePath()
                ctx.fill();
                ctx.restore()
            }

            ctx.beginPath()
            ctx.lineWidth = 1;
            ctx.fillStyle = "green";
            if (f.type === 'bean') {
                ctx.fillStyle = "blue";
            }
            if (f.playerId) {
                ctx.fillStyle = "red";
            }

            ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath()

            if (f.playerId && f.type === 'fighter') {
                ctx.fillStyle = "red";
                ctx.font = "16px serif";
                ctx.fillStyle = "white";
                ctx.fillText(f.playerId + ' ' + f.beans.size,f.x,f.y)
            }
        }
    })

    if (layer === 1) {
        const playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')
        const playerFiguresSortedByPoints = playerFigures.toSorted((f1,f2) => f1.points - f2.points);
        playerFigures.forEach((f,i) => {
            ctx.save()
            ctx.beginPath();
            const sortIndex = playerFiguresSortedByPoints.findIndex(fig => fig.playerId === f.playerId);
            const dt1 = dtProcessed - lastWinnerPlayerIdThen;
            const dt2 = dtProcessed - (lastWinnerPlayerIdThen + moveNewScoreDuration + sortIndex*moveScoreToPlayerDuration);
            const dt3 = dtProcessed - (lastWinnerPlayerIdThen + moveNewScoreDuration + playerFigures.length*moveScoreToPlayerDuration);
            const dt4 = dtProcessed - (lastWinnerPlayerIdThen + moveNewScoreDuration + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);
            let fillStyle = 'rgba(0, 0, 0, 0.5)';
            let points = f.points;

            if (dt1 < moveNewScoreDuration) {
                if (!lastWinnerPlayerIds.has(f.playerId)) {
                    ctx.translate(32+i*48, level.height-32)
                } else {
                    var lp = dt1 / moveNewScoreDuration
                    var lpi = 1-lp
                    ctx.translate(lpi * (level.width*0.5) + lp*(32+i*48), lpi*(level.height*0.5) + lp*(level.height-32))
                    ctx.scale(12.0*lpi + 1*lp,12.0*lpi +1*lp)
                }   
            } else if (lastFinalWinnerPlayerId && dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
                const lp = dt2 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*(32+i*48) + lp*f.x, lpi*(level.height-32) + lp*f.y)
                ctx.scale(1*lpi + 2.0*lp, 1*lpi + 2.0*lp)
                if (lastFinalWinnerPlayerId === f.playerId) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
            } else if (lastFinalWinnerPlayerId && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
                ctx.translate(f.x, f.y)
                ctx.scale(2.0, 2.0)
                if (lastFinalWinnerPlayerId === f.playerId) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
            } else if (lastFinalWinnerPlayerId && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
                const lp = dt4 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*f.x + lp*(32+i*48), lpi*f.y + lp*(level.height-32))
                ctx.scale(2.0*lpi + 1*lp, 2.0*lpi + 1*lp)
                points = 0;
            } else {
                ctx.translate(32+i*48, level.height-32)
            }

            ctx.arc(0,0,16,0, 2 * Math.PI);
            ctx.fillStyle = fillStyle;
            ctx.fill();
            ctx.closePath()
            ctx.textAlign = "center";
            ctx.textBaseline='middle'
            ctx.fillStyle = "white";
            ctx.font = "24px arial";
            ctx.fillText(points,0,0); // Punkte
            ctx.stroke();
            ctx.restore()

            if (f.playerId === lastFinalWinnerPlayerId && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
                ctx.save();
                ctx.font = level.width*0.06+"px serif";
                ctx.fillStyle = "rgba(178, 145, 70, 1.0)";
                ctx.strokeStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline='middle'
                ctx.lineWidth = 2
                ctx.translate(0.5*level.width,level.height*0.3)
                ctx.fillText(`Player ${i+1} wins`,0,0)
                ctx.strokeText(`Player ${i+1} wins`,0,0)
                ctx.restore()
            }
        })
    
        ctx.font = "16px serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline='top'
    
        ctx.save()
        ctx.textAlign = "right";
        ctx.fillText(fps + " FPS", level.width, 0);
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
            ctx.translate(0,canvas.height/level.scale)
            figures.forEach((g,i) => {
                ctx.fillText("playerId: " + g.playerId + " x: " + Math.floor(g.x) + " y: " + Math.floor(g.y) + " Beans: " + g.beans?.size,0,0) 
                ctx.translate(0,-16)
            })
            ctx.fillText('Figures',0,0)
            ctx.restore()
        }
    }

    ctx.restore()
}