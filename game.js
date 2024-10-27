console.log('no need to hide')
var loadPromises = []
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var mousePlayers = [{pointerType: 'unknown', x: 0, y: 0, offsetCursorX: 0, offsetCursorY: 0,pressed: new Set(), pressedLastFrame: false}];
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
    'Numpad0': {playerId: 'k1', action: 'attack'},
    'ShiftRight': {playerId: 'k1', action: 'attack'}}, pressed: new Set()}];
var virtualGamepads = []
var startTime, then, now, dt, fps=0, fpsMinForEffects=30, fpsTime
var isGameStarted = false, restartGame = false, newPlayerIds = new Set(), newPlayerIdThen, lastWinnerPlayerIds = new Set(), lastWinnerPlayerIdThen, lastFinalWinnerPlayerId;
const moveNewPlayerDuration = 1000, moveScoreToPlayerDuration = 1000, showFinalWinnerDuration = 5000;
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figures = [], maxPlayerFigures = 32, pointsToWin = 3, deadDuration = 5000, beanAttackDuration = 1000, fartGrowDuration = 2000
var showDebug = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = {}
var tileMap;
var playerImage = new Image()
playerImage.src = 'gfx/character_base_16x16.png'
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
cloudImage.src = 'gfx/fart.png'
/*loadPromises.push(new Promise((resolve, reject) => {
    cloudImage.onload = () => {
        cloudImage = colorize(cloudImage, 139.0/256,69.0/256,19.0/256)
        resolve()
    }
}))*/
var texture = new Image()
texture.src = 'gfx/texture_grass.jpg'
loadPromises.push(new Promise((resolve, reject) => {
    texture.onload = () => {
        resolve();
    }
}))

var btnStart = {
    radius: level.width*0.1,
    width: 0,
    height: 0,
    loadingSpeed: 1/3000
}

var btnTouchController = {
    radius: 0,
}

//btnTouchAction = {...btnTouchAction, x: canvas.width*0.85, y: canvas.height*0.5, loadingPercentage: 0.0, radius: canvas.width*0.02}


var btnTouchAction = {
    radius:0
}


cloudImageAnim = {
    hasDirections: false,
    width: 192,
    height: 192,
    animDefaultSpeed: 0.1,
    default: {a: [[0,0,64,64],[64,0,64,64],[128,0,64,64],[0,64,64,64],[64,64,64,64],[128,64,64,64],[0,128,64,64],[64,128,64,64],[128,128,64,64]]}
}
var foodImage = new Image()
foodImage.src = 'gfx/food-OCAL.png'
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
    attack: {title: 'sfx/sound2.mp3', currentTime: 0.15},
    attack2: {title: 'sfx/sound1.mp3', currentTime: 0.15},
    death: {title: 'sfx/gag-reflex-41207.mp3', currentTime: 0.0},
    join: {title: 'sfx/sounddrum.mp3'},
    firstBlood: {title: 'sfx/first-blood.mp3', volume: 0.2},
    win: {title: 'sfx/audience-clapping-03-99963.mp3'},
    music: [
        {title: 'sfx/music1.mp3', currentTime: 20, volume: 0.5},
        {title: 'sfx/music2.mp3', volume: 0.5},
        {title: 'sfx/music3.mp3', volume: 0.5}
    ],
    multiKill: [
        {title: 'sfx/double-kill.mp3', volume: 0.3},
        {title: 'sfx/triple-kill.mp3', volume: 0.4},
        {title: 'sfx/multi-kill.mp3', volume: 0.5},
        {title: 'sfx/mega-kill.ogg'},
        {title: 'sfx/ultra-kill.mp3', volume: 0.5},
        {title: 'sfx/monster-kill.mp3', volume: 0.5},
        {title: 'sfx/ludicrous-kill.mp3', volume: 0.5},
        {title: 'sfx/holy-shit.ogg'}
    ],
    totalKill: [
        {title: 'sfx/killing-spree.mp3', volume: 0.5},
        {title: 'sfx/rampage.mp3', volume: 0.5},
        {title: 'sfx/dominating.mp3', volume: 0.5},
        {title: 'sfx/unstoppable.ogg'},
        {title: 'sfx/god-like.mp3', volume: 0.5},
        {title: 'sfx/wicked-sick.ogg'}
    ],

    eat: [
        {title: 'sfx/eatingsfxwav-14588.mp3'},
        {title: 'sfx/carrotnom-92106.mp3'},
        {title: 'sfx/eat-a-cracker-95783.mp3', volume: 0.5},
        {title: 'sfx/game-eat-sound-83240.mp3'},
        {title: 'sfx/game-eat-sound-83240.mp3'}
    ]
}

var music = shuffle(audio.music.map(audio => getAudio(audio)));
var soundJoin = getAudio(audio.join);
var soundFirstBlood = getAudio(audio.firstBlood);
var soundWin = getAudio(audio.win);

var soundMultiKill = audio.multiKill.map(audio => getAudio(audio));
var soundTotalKill = audio.totalKill.map(audio => getAudio(audio));
var soundEat = audio.eat.map(audio => getAudio(audio));

document.addEventListener("DOMContentLoaded", function(event){
    addjustAfterResizeIfNeeded(level, canvas)

    // loading images
    ctx.save()
    ctx.font = canvas.height*0.1+"px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText('Loading...',0,0)
    ctx.restore()

    Promise.all(loadPromises).then(() => { 
        tileMap = tileMapFunc(texture);
        gameInit()
        window.requestAnimationFrame(gameLoop);
    })
   
})

window.addEventListener("resize", function(event){
    addjustAfterResizeIfNeeded(level, canvas)
});

window.addEventListener("orientationchange", function(event){
    addjustAfterResizeIfNeeded(level, canvas)
});

window.addEventListener('keydown', event => {
    keyboards.forEach(k => {
        k.pressed.add(event.code);
    });

    if (event.code === 'ArrowDown' || event.code === 'ArrowUp') { /* prevent scrolling of website */
        event.preventDefault();
    }
  
});

window.addEventListener('click', event => {
    mousePlayers[0].pointerType = 'touch'
}, { passive: false })

window.addEventListener('touchstart', event => {
    mousePlayers[0].pointerType = 'touch'
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
window.addEventListener("contextmenu", e => e.preventDefault());

window.addEventListener('pointerdown', event => {
   
    if (event.pointerType === 'mouse' && event.button === 0) {
        mousePlayers[0].pressed.add(0);
    } else {
        mousePlayers[0].pressed.add(1);
    }

    if (event.pointerType === 'touch') {
        if (event.clientX < canvas.width*0.7 || event.clientY < canvas.height * 0.5) {
            mousePlayers[0].pressed.add(0);
        } else {
            mousePlayers[0].pressed.add(1);
        }
    } 

    event.preventDefault();
    event.stopPropagation();
});


window.addEventListener('pointerup', event => {

    if (event.pointerType === 'mouse' && event.button === 0) {
        mousePlayers[0].pressed.delete(0);
    } else {
        mousePlayers[0].pressed.delete(1);
    }

    if (event.pointerType === 'touch') {
        if (event.clientX < canvas.width*0.7 || event.clientY < canvas.height * 0.5) {
            mousePlayers[0].pressed.delete(0);
        } else {
            mousePlayers[0].pressed.delete(1);
        }
    } 

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
    then = Date.now();
    startTime = then;
    //dtProcessed = 0
    lastFinalWinnerPlayerId = undefined
    fpsTime = then
    lastKillTime = undefined;
    multikillCounter = 0;
    lastTotalkillAudio = 0;
    totalkillCounter = 0;
    btnStart = {...btnStart, x: level.width*(0.04+0.52), y: level.height*0.3, width: level.width*0.4, height: level.height*0.42,loadingPercentage: 0.0, radius: level.width*0.1}
    var activePlayerIds = figures.filter(f => f.playerId && f.type === 'fighter').map(f => f.playerId)
    var oldFigures = figures
    figures = []
    for (var i = 0; i < maxPlayerFigures; i++) {
        const [x, y] = getRandomXY(level)
        const [xTarget, yTarget] = getRandomXY(level)
        
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
            killTime: 0,
            angle: angle(x,y,xTarget,yTarget),
            anim: 0,
            isAttacking: false,
            attackDuration: 500,
            attackBreakDuration: 2000,
            lastAttackTime: 0,
            oldPoints: 0,
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

        if (!completeRestart && activePlayerIds.length > i) {
            figure.playerId = activePlayerIds[i]
            figure.points = oldFigures.find(f => f.playerId == figure.playerId).points
        }

        figures.push(figure)

        /*mousePlayers.forEach(mp => {
            mp.offsetCursorX = -level.width*0.1+Math.random()*level.width*0.2
            mp.offsetCursorY = -level.height*0.1+Math.random()*level.height*0.2
        })*/
    }
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
        zIndex: -level.height,
        lastAttackTime: 0,
        attackDuration: beanAttackDuration

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
        zIndex: -level.height,
        lastAttackTime: 0,
        attackDuration: beanAttackDuration
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
        zIndex: -level.height,
        lastAttackTime: 0,
        attackDuration: beanAttackDuration
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
        zIndex: -level.height,
        lastAttackTime: 0,
        attackDuration: beanAttackDuration
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
        zIndex: -level.height,
        lastAttackTime: 0,
        attackDuration: beanAttackDuration
    });
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
    addjustAfterResizeIfNeeded(level, canvas)
    
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
        mp.isAttackButtonPressed = mp.pressed.has(0)// && mp.pressedLastFrame || false
        mp.pressedLastFrame = mp.pressed.has(0)
        mp.xAxis = 0
        mp.yAxis = 0
        mp.isMoving = 0

        var f = figures.find(f => f.playerId ===  mp.playerId && f.type === 'fighter')
        if (f) {
           

            if (mousePlayers[0].pointerType === 'touch') {
                let touchLocalX = (btnTouchController.x - canvas.offsetLeft - level.offsetX)/level.scale;
                let touchLocalY = (btnTouchController.y - canvas.offsetTop - level.offsetY)/level.scale;
                let x = mp.x - touchLocalX
                let y = mp.y - touchLocalY
                mp.xAxis = x
                mp.yAxis = y   
                if (!mp.pressed.has(0)) {
                    mp.xAxis = 0
                    mp.yAxis = 0
                }
                mp.isAttackButtonPressed = mp.pressed.has(1)

                mp.isMoving = Math.abs(mp.xAxis) + Math.abs(mp.yAxis) > 4
               

            } else if (mousePlayers[0].pointerType === 'mouse') {
                let x = mp.x- f.x;
                let y = mp.y-f.y-playerImageAnim.height*0.5;
                mp.xAxis = x
                mp.yAxis = y   
                mp.isMoving = Math.abs(mp.xAxis) + Math.abs(mp.yAxis) > 4
            }
        
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
                figuresWithPlayer.forEach(f => f.oldPoints = f.points);
                survivors[0].points++
                lastWinnerPlayerIds.clear();
                lastWinnerPlayerIds.add(survivors[0].playerId);
                lastWinnerPlayerIdThen = dtProcessed
                restartGame = true;
            }
        }

        const maxPoints = Math.max(...figuresWithPlayer.map(f => f.points));
        if (maxPoints >= pointsToWin) {
            const figuresWithMaxPoints = figuresWithPlayer.filter(f => f.points === maxPoints);
            if (figuresWithMaxPoints.length === 1) {
                if (!lastFinalWinnerPlayerId) {
                   playAudio(soundWin)
                }
                lastFinalWinnerPlayerId = figuresWithMaxPoints[0].playerId;
            }
        }
    }

    const gameBreakDuration = (figuresWithPlayer.length+1)*moveScoreToPlayerDuration + showFinalWinnerDuration;
    if (restartGame && (!lastWinnerPlayerIdThen || dtProcessed - lastWinnerPlayerIdThen > gameBreakDuration)) {
        restartGame = false;
        const wasGameStarted = isGameStarted;
        isGameStarted = !lastFinalWinnerPlayerId;
        if (isGameStarted && !wasGameStarted) {
            playPlaylist(music);
        } else if(!isGameStarted) {
            stopPlaylist(music);
        }
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
    let figuresDead = figures.filter(f => f.isDead);

    if (!isGameStarted) {
        btnStart.playerPercentage = 0.0
        var playersWithId = figures.filter(f => f.playerId && f.type === 'fighter')
        var playersNear = playersWithId.filter(f => isInRect(f.x,f.y,btnStart.x,btnStart.y,btnStart.width,btnStart.height))
        btnStart.playersNear = playersNear
        btnStart.playersPossible = playersWithId

        if (playersNear.length > 0) {
            btnStart.playerPercentage = playersNear.length / playersWithId.length;

            if (playersWithId.length > 1 && playersNear.length === playersWithId.length) {
                btnStart.loadingPercentage += btnStart.loadingSpeed * dt;
            } else if (playersNear.length > 0) {
                btnStart.loadingPercentage += btnStart.loadingSpeed * dt;
                if ( btnStart.loadingPercentage > btnStart.playersNear.length / btnStart.playersPossible.length) {
                    btnStart.loadingPercentage = btnStart.playersNear.length / btnStart.playersPossible.length
                }
                if (btnStart.playersPossible.length === 1) {
                    btnStart.loadingPercentage = Math.min(0.5, btnStart.loadingPercentage)
                }
            } else {
                btnStart.loadingPercentage -= btnStart.loadingSpeed * dt
            }
        } else {
            btnStart.loadingPercentage -= btnStart.loadingSpeed * dt
        }
        btnStart.loadingPercentage = btnStart.loadingPercentage > 0 ? btnStart.loadingPercentage : 0;
        if (btnStart.loadingPercentage > 1) {
            restartGame = true;
        }


        figuresDead.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
            f.isDead = false
            f.y-=16
            f.killTime = 0
        }})
    }


    
    figuresAlive.forEach(f => {
        let xyNew = move(f.x, f.y, f.angle,f.speed, dt)
        if (xyNew) {
            [f.x, f.y] = cropXY(xyNew.x, xyNew.y, level)
        }
        f.anim += f.speed + f.imageAnim?.animDefaultSpeed
       // f.anim += f.isAttacking ? 0.5 : 0
    })
    
    let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter');
    figures.filter(f => f.type === 'bean').forEach(f => {
        playerFigures.forEach(fig => {
            if (distance(f.x,f.y,fig.x,fig.y + f.imageAnim.height*0.5) < f.attackDistance) {
                if (!fig.beans.has(f.id)) {
                    playAudio(soundEat[fig.beans.size]);
                    fig.beans.add(f.id);
                    f.lastAttackTime = dtProcessed
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
                fig.killTime = dtProcessed
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
            newPlayerIds.clear();
            newPlayerIds.add(figure.playerId);
            newPlayerIdThen = dtProcessed

            figures.forEach(f => f.isDead = false)
            if (figures.filter(f => f.playerId).length == 2) {
               // restartGame = true;
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
                    [f.xTarget, f.yTarget] = getRandomXY(level)
                }

                if (numberJoinedKeyboardPlayers > 0) {
                    discreteAngle = getNextDiscreteAngle(angle(f.x, f.y, f.xTarget, f.yTarget), 8);
                    const direction = {x: Math.cos(discreteAngle), y: Math.sin(discreteAngle)};
                    if (direction.x !== 0) {
                        const xBorder = direction.x > 0 ? level.width-level.padding : level.padding;
                        let t = (xBorder - f.x)/direction.x;
                        let y = t*direction.y + f.y;
                        if (y >= level.padding && y < level.height-level.padding) {
                            t = (f.xTarget - f.x)/direction.x;
                            f.yTarget = t*direction.y + f.y;
                        }
                    }
                    if (direction.y !== 0) {
                        const yBorder = direction.y > 0 ? level.height-level.padding : level.padding;
                        let t = (yBorder - f.y)/direction.y;
                        let x = t*direction.x + f.x;
                        if (x >= level.padding && x < level.width-level.padding) {
                            t = (f.yTarget - f.y)/direction.y;
                            f.xTarget = t*direction.x + f.x;
                        }
                    }
                }
            }
            f.angle = angle(f.x,f.y,f.xTarget,f.yTarget)
            f.speed = f.maxSpeed
        }
    })

    figures.filter(f => f.type === 'cloud').forEach(f => {
        f.lifetime+=dt
        if (f.lifetime > fartGrowDuration) {
            if (!f.isAttacking) {
                f.isAttacking = true
                if (f.size === 5) {
                    f.scale = 3*f.size
                } else if (f.size === 1) {
                    f.scale = 2*f.size
                } else {
                    f.scale = 1.5*f.size
                }
                
            }
            f.scale*=Math.pow(0.999,dt)
            if (f.scale < 0.1) {
                f.scale = 0
                f.isDead = true
            }

        } else {
           
            if (f.size === 5) {
                f.scale= f.lifetime/fartGrowDuration * 3*f.size
            } else if (f.size === 1) {
                f.scale= f.lifetime/fartGrowDuration * 2*f.size
            } else {
                f.scale= f.lifetime/fartGrowDuration * 1.5*f.size
            }

        }
        
        
    })
    var toDelete = figures.findIndex(f => f.type === 'cloud' && f.isDead)
    if (toDelete >= 0)
        figures.splice(toDelete,1)
}

function draw(players, figures, dt, dtProcessed, layer) {

    const playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')

    ctx.save()

    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.translate(level.offsetX, level.offsetY)
    ctx.scale(level.scale, level.scale)
    //ctx.transform(level.scale, 0, 0, level.scale, level.offsetX, level.offsetY)

    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tileMap,-level.padding, -level.padding) //, level.width+level.pading*2, level.height+level.pading*2, -level.pading, -level.pading, level.width+level.pading*2, level.height+level.pading*2);
    }
    if (!isGameStarted) {


        if (playerFigures.length > 0) {
            
            ctx.save()
                // start image
              /*  ctx.translate(btnStart.x,btnStart.y)
                ctx.beginPath();
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.arc(0,0,btnStart.radius, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill();

                ctx.beginPath();
                ctx.fillStyle = "rgba(255,255,255,0.3)";
                ctx.arc(0,0,btnStart.radius*btnStart.loadingPercentage, 0, 2 * Math.PI)
                ctx.closePath()
                ctx.fill();
            */
             
               ctx.translate(btnStart.x,btnStart.y)

               ctx.save()
              // ctx.translate(level.width*(0.04+0.52),level.height*0.3)
               ctx.beginPath();
               ctx.fillStyle = "rgba(255,255,255,0.2)";
               ctx.fillRect(0,0, btnStart.width, btnStart.height)
               ctx.fillStyle = "rgba(255,255,255,0.2)";
               ctx.fillRect(0,0, btnStart.width*btnStart.loadingPercentage, btnStart.height)
               ctx.closePath()
               ctx.fill();
               ctx.restore()
               var fontHeight = level.width*0.017  
                ctx.font = fontHeight+"px Arial";
                ctx.fillStyle = "rgba(139,69,19,0.8)";
               ctx.strokeStyle = "black";
               ctx.textAlign = "center";
               ctx.textBaseline='middle'
               ctx.lineWidth = 1
                ctx.font = level.width*0.02+"px Arial";

                var text = 'Walk here to\n\nSTART'
                if (btnStart.playersPossible.length === 1) {
                    text = 'Minimum\n2 players'
                } else if (btnStart.playersPossible.length > 1 && btnStart.playersNear.length === btnStart.playersPossible.length ) {
                    text ='Prepare your\nengines'
                } else if (btnStart.playersNear.length > 0) {
                    text = btnStart.playersNear.length + '/' + btnStart.playersPossible.length + ' players'
                } 
                ctx.translate(btnStart.width*0.5,btnStart.height*0.5)
                ctx.translate(0,-fontHeight*Math.max(0,text.split('\n').length-1)*0.5)
                fillTextWithStrokeMultiline(ctx,text,0,0,fontHeight)
                
            ctx.restore()

        }
        ctx.save()
        
        ctx.save()
        ctx.translate(level.width*0.04,level.height*0.3)
        ctx.beginPath();
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(0,0, level.width*0.4, level.height*0.42)
        ctx.closePath()
        ctx.fill();
        ctx.restore()

        var fontHeight = level.width*0.017  
        ctx.font = fontHeight+"px Arial";
        ctx.fillStyle = "rgba(139,69,19,0.8)";
        ctx.strokeStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline='top'
        ctx.lineWidth = 1
        ctx.translate(level.width*0.22+fontHeight,level.height*0.35)
        var txt = 'HOW TO PLAY\n\nJoin by pressing any key on your Gamepad' 
                  + '\nor WASDT or ' + String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0 or mouse or touch' 
                  + '\n\n1.) Find your player 2.) Don\'t get detected\n3.) Fart to kill 4.) Eat to get bigger farts' 
                  + '\n\nThe goal is to be the last survivor'
        
        fillTextWithStrokeMultiline(ctx, txt,0,0, fontHeight)
        ctx.restore()
    }

  
    

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
                ctx.scale(f.scale,f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            } else if (f.imageShadow) {
                ctx.scale(f.scale, f.scale)
                ctx.drawImage(f.imageShadow, spriteShadow[0], spriteShadow[1], spriteShadow[2], spriteShadow[3], 0 - f.imageShadowAnim.width*0.5, 0 - f.imageShadowAnim.height*0.5, f.imageShadowAnim.width, f.imageShadowAnim.height)
            }
        } else {
            if (f.type === 'bean') {
                // bean image
                let startAngle = f.angle + deg2rad(135)
                let endAngle = startAngle + deg2rad(90)
                let durationLastAttack = dtProcessed-f.lastAttackTime
                let perc = durationLastAttack/f.attackDuration
                if (f.lastAttackTime > 0 && durationLastAttack < f.attackDuration) {
                    ctx.scale(1.0 - 0.2*Math.sin(perc*Math.PI), 1.0 - 0.2*Math.sin(perc*Math.PI))
                } else {
                    ctx.scale(1.0, 1.0)
                }

                ctx.save()
        

                  ctx.scale(f.scale, f.scale)
                 
                 
                  ctx.lineWidth = 2
                  ctx.strokeStyle = 'black'
                  //ctx.transform(1, 1, -0.7, 1, 0, 0);
                  ctx.beginPath();
                  ctx.fillStyle = "rgba(255,255,255,1)";
                  ctx.arc(0,0,f.attackDistance, 0, 2 * Math.PI)
                  ctx.closePath()
                  ctx.fill();
                  
          
          
                  ctx.beginPath();
                  ctx.fillStyle = "rgba(255,255,255,1)";
                  ctx.arc(0,0,f.attackDistance*0.8, 0, 2 * Math.PI)
                  ctx.closePath()
                  ctx.fill();
                  ctx.stroke()

                ctx.restore()

                ctx.scale(0.6*f.scale, 0.6*f.scale)
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
                ctx.scale( f.scale, f.scale)
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
        drawFence(1, ctx, level, true)
    }
  
  


    if (layer === 1) {
        const playerFiguresSortedByPoints = playerFigures.toSorted((f1,f2) => f1.points - f2.points);
        playerFigures.forEach((f,i) => {
            ctx.save()
            ctx.beginPath();
            const sortIndex = playerFiguresSortedByPoints.findIndex(fig => fig.playerId === f.playerId);
            const dt1 = dtProcessed - newPlayerIdThen;
            const dt2 = dtProcessed - (lastWinnerPlayerIdThen + sortIndex*moveScoreToPlayerDuration);
            const dt3 = dtProcessed - (lastWinnerPlayerIdThen + playerFigures.length*moveScoreToPlayerDuration);
            const dt4 = dtProcessed - (lastWinnerPlayerIdThen + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);
            let fillStyle = 'rgba(0, 0, 0, 0.5)';
            let points = f.points;

            if (dt1 < moveNewPlayerDuration) {
                if (!newPlayerIds.has(f.playerId)) {
                    ctx.translate(32+i*48, level.height+32)
                } else {
                    var lp = dt1 / moveNewPlayerDuration
                    var lpi = 1-lp
                    ctx.translate(lpi * (level.width*0.5) + lp*(32+i*48), lpi*(level.height*0.5) + lp*(level.height+32))
                    ctx.scale(12*lpi + lp, 12*lpi + lp)
                }   
            } else if (lastWinnerPlayerIdThen && dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
                const lp = dt2 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*(32+i*48) + lp*f.x, lpi*(level.height+32) + lp*f.y)
                ctx.scale(lpi + 2*lp, lpi + 2*lp)
                if (lastWinnerPlayerIds.has(f.playerId)) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
                if (lastFinalWinnerPlayerId === f.playerId) {
                    ctx.scale(lpi + 2*lp, lpi + 2*lp)
                }
                points = f.oldPoints;
            } else if (lastWinnerPlayerIdThen && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
                ctx.translate(f.x, f.y)
                ctx.scale(2.0, 2.0)
                if (lastWinnerPlayerIds.has(f.playerId)) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
                if (lastFinalWinnerPlayerId === f.playerId) {
                    ctx.scale(2.0, 2.0)
                }
            } else if (lastWinnerPlayerIdThen && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
                const lp = dt4 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*f.x + lp*(32+i*48), lpi*f.y + lp*(level.height+32))
                ctx.scale(2*lpi + lp, 2*lpi + lp)
                if (lastFinalWinnerPlayerId) {
                    points = 0;
                }
            } else {
                ctx.translate(32+i*48, level.height+32)
            }


            ctx.arc(0,0,16,0, 2 * Math.PI);
            ctx.fillStyle = fillStyle;
            ctx.fill();
            ctx.closePath()
            ctx.textAlign = "center";
            ctx.textBaseline='middle'
            ctx.fillStyle = "white";
            ctx.font = "24px arial";
            if (f.isAttacking && !restartGame) {
              ctx.translate(-5+Math.random()*10,-Math.random()*10)
            }
            ctx.fillText(points,0,0); // Punkte
            ctx.stroke();
            ctx.restore()

            if (f.playerId === lastFinalWinnerPlayerId && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
                ctx.save();
                ctx.font = level.width*0.1+"px Arial";
                ctx.fillStyle = "rgba(139,69,19,0.8)";
                ctx.strokeStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline='middle'
                ctx.lineWidth = 6
                ctx.translate(0.5*level.width,level.height*0.3)
                fillTextWithStroke(ctx,`Player ${i+1} wins`,0,0)
                ctx.restore()
            }
        })
    
  
    }


    if (layer === 1) {
        ctx.save()
        ctx.font = level.width*0.02+"px Arial";
        ctx.fillStyle = "white"//rgba(139,69,19,0.4)";
        //ctx.strokeStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline='bottom'
        ctx.lineWidth = 0
        ctx.translate(0.5*level.width,-level.width*0.005)
        ctx.fillText('STEALTHY STINKERS',0,0)
        ctx.translate(0.5*level.width,0)
        //ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.lineWidth = 0
        ctx.font = level.width*0.012+"px Arial";
        ctx.fillText('made by TORSTEN STELLJES & ALEXANDER THURN',0,0)
        ctx.restore()
    }
    
    

    ctx.restore()

    if (layer === 1) {
        ctx.save()
        ctx.font = "16px serif";
        ctx.fillStyle = "white";
        ctx.textBaseline='top'
        ctx.textAlign = "right";
        ctx.fillText(fps + " FPS " + canvas.clientWidth + '('+canvas.width+')x' + canvas.clientHeight+ '('+canvas.height+') ', canvas.width, 0);
      ctx.restore()
    }


    if (layer === 1 && showDebug) {

      ctx.save()
        ctx.font = "16px serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline='top'
        
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
      ctx.restore()
  }


  if (layer === 1) {

    if (mousePlayers[0].pointerType === 'touch') {
        ctx.save()
        var maxHeightWidth = Math.max(canvas.width, canvas.height)
        var minHeightWidth = Math.min(canvas.width, canvas.height)
        btnTouchController = {...btnTouchController, x: minHeightWidth*0.3, y: canvas.height - minHeightWidth*0.3, loadingPercentage: 0.0, radius: minHeightWidth*0.18}
        btnTouchAction = {...btnTouchAction, x: canvas.width-minHeightWidth*0.3, y: canvas.height - minHeightWidth*0.3, loadingPercentage: 0.0, radius: minHeightWidth*0.18}
        
        ctx.save()
            ctx.translate(btnTouchController.x,btnTouchController.y)
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.arc(0,0,btnTouchController.radius, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill();
            var xy = move(0,0,angle(0,0,mousePlayers[0].xAxis,mousePlayers[0].yAxis),btnTouchController.radius*0.5,mousePlayers[0].isMoving)
            ctx.translate(xy.x,xy.y)
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.arc(0,0,btnTouchController.radius*0.5, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill();
        ctx.restore()

        ctx.translate(btnTouchAction.x,btnTouchAction.y)
        ctx.beginPath();
       
        if (mousePlayers[0].isAttackButtonPressed) {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.3)";
       }
        ctx.arc(0,0,btnTouchAction.radius, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.fill();

      

        ctx.restore()
    } else {
        ctx.save()
        ctx.beginPath();
        ctx.translate(level.offsetX, level.offsetY)
        ctx.scale(level.scale, level.scale)
        ctx.arc(mousePlayers[0].x, mousePlayers[0].y, 5, 0, 2 * Math.PI);
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0,0,0,0.5)";
        ctx.stroke();
        ctx.restore()
    }
  }
}