console.log('no need to hide')
var loadPromises = []
var canvas = document.getElementById('canvas')
const ctx = canvas.getContext("2d");
var gamepadPlayers = []
var mousePlayers = [];
var mouses = [{pointerType: 'unknown', x: 0, y: 0, pressed: new Set()}]
const defaultkeyboardPlayer = {
    xAxis: 0,
    yAxis: 0,
    isMoving: false,
    type: 'keyboard',
    isAttackButtonPressed: false
};
var keyboardPlayers = [];
var botPlayers = []
var keyboards = [{bindings: {
    'KeyA': {playerId: 'k0', action: 'left'},
    'KeyD': {playerId: 'k0', action: 'right'},
    'KeyW': {playerId: 'k0', action: 'up'},
    'KeyS': {playerId: 'k0', action: 'down'},
    'KeyT': {playerId: 'k0', action: 'attack'},
    'Digit1': {playerId: 'k0', action: 'attack'},
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
var figures = [], maxPlayerFigures = 32, pointsToWin = 3, deadDuration = 5000, beanAttackDuration = 800, fartGrowDuration = 2000
var showDebug = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = {}
var tileMap, tileMap2;
var playerImage = new Image()
playerImage.src = 'gfx/character_base_32x32.png' // 'gfx/character_base_topview_32x32.png' beuelerjong
var playerImageAnim = {
    width: 62,
    height: 62,
    tileWidth: 31,
    tileHeight: 31,
    tileSpace: 32,
    hasDirections: true,
    animDefaultSpeed: 0,
    down: {a: [[0,0,31,31], [32*1,0,31,31], [32*2,0,31,31], [32*3,0,31,31]]},
    up: {a: [[0,32*1,31,31], [32*1,32*1,31,31], [32*2,32*1,31,31], [32*3,32*1,31,31]]},
    right: {a: [[0,32*2,31,31], [32*1,32*2,31,31], [32*2,32*2,31,31], [32*3,32*2,31,31]]},
    left: {a: [[0,32*3,31,31], [32*1,32*3,31,31], [32*2,32*3,31,31], [32*3,32*3,31,31]]},
    default: {a: [[0,0,31,31]]}
}

var playerShadowImage
var playerImageShadowAnim
loadPromises.push(new Promise((resolve, reject) => {
    playerImage.onload = () => {
        [playerShadowImage, playerImageShadowAnim] = shadowrize(playerImage,playerImageAnim)
        resolve()
    }
}))

var imageArrow = new Image()
imageArrow.src = 'gfx/arrow.png'
loadPromises.push(new Promise((resolve, reject) => {
    imageArrow.onload = () => {
        resolve()
    }
}))

var cloudImage = new Image()
cloudImage.src = 'gfx/fart.png'
loadPromises.push(new Promise((resolve, reject) => {
    cloudImage.onload = () => {
        resolve()
    }
}))
var texture = new Image()
texture.src = 'gfx/kacheln.png'
loadPromises.push(new Promise((resolve, reject) => {
    texture.onload = () => {
        resolve();
    }
}))

var btnStart = {
    radius: level.width*0.1,
    width: 0,
    height: 0,
    loadingSpeed: 1/3000,
    loadingPercentage: 0
}

var btnMute = {
    width: 0,
    height: 0,
    loadingSpeed: 1/2500,
    execute: toggleMusic
}

var btnBots = {
    width: 0,
    height: 0,
    loadingSpeed: 1/1500,
    execute: toggleBots
}

var btnsLobby = [btnMute, btnBots]

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
    flowers: [120*2, 0, 120, 120],
    grass: [120*1, 0, 120, 120],
    mushrooms: [120*0, 0, 120, 120]
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
    musicGame: [
        {title: 'sfx/music1.mp3', currentTime: 20, volume: 0.5},
        {title: 'sfx/music2.mp3', volume: 0.5},
        {title: 'sfx/music3.mp3', volume: 0.5}
    ],
    musicLobby: [
        {title: 'sfx/stealthy-stinkers.mp3', volume: 0.2}
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
var musicGame = shuffle(audio.musicGame.map(audio => getAudio(audio)));
var musicLobby = audio.musicLobby.map(audio => getAudio(audio));
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
        tileMap = tileMapFunc(texture,0);
        tileMap2 = tileMapFunc(texture,1)
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

window.addEventListener('blur', () => {
    windowHasFocus = false
}, { passive: false })

window.addEventListener('focus', () => {
    //windowHasFocus = true
}, { passive: false })

window.addEventListener('click', event => {
    
    if (mousePlayers.length > 0) {mousePlayers[0].pointerType = 'mouse'}
    mouses[0].pointerType = 'mouse'
    
}, { passive: false })

window.addEventListener('touchstart', event => {
    if (mousePlayers.length > 0) {mousePlayers[0].pointerType = 'touch'}
    mouses[0].pointerType = 'touch'

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
    if (event.code === 'KeyM') {
        toggleMusic()
    }
    keyboards.forEach(k => {
        k.pressed.delete(event.code);
    });
});
window.addEventListener("contextmenu", e => e.preventDefault());

var pointerEvents = {}
var windowHasFocus = false

window.addEventListener('pointerdown', event => {
    if (!windowHasFocus) {
        return
    }

    if (mousePlayers.length === 0) {mousePlayers.push(mouses[0])}

  
  
    if (event.pointerType === 'mouse') {
        mousePlayers[0].pressed.add(0);
    }

    if (event.pointerType === 'touch') {
        if (event.clientX < (btnTouchAction.radius > 0 ? (btnTouchAction.x + btnTouchController.x) >> 1 : canvas.width*0.7) || event.clientY < canvas.height * 0.5) {
            mousePlayers[0].pressed.add(0);
            pointerEvents[event.pointerId] = 0
        } else {
            mousePlayers[0].pressed.add(1);
            pointerEvents[event.pointerId] = 1
        }
    } 

    event.preventDefault();
    event.stopPropagation();
});


window.addEventListener('pointerup', event => {
    if (mousePlayers.length === 0 && windowHasFocus) {mousePlayers.push(mouses[0])}

    if (!windowHasFocus) {
        windowHasFocus = true
        return
    }
    
   
    if (event.pointerType === 'mouse') {
        mousePlayers[0].pressed.delete(0);
    } 

    if (event.pointerType === 'touch') {
        mousePlayers[0].pressed.delete( pointerEvents[event.pointerId]);
        delete pointerEvents[event.pointerId]
    } 

    event.preventDefault();
    event.stopPropagation();
});

canvas.addEventListener('pointermove', event => {
    if (!windowHasFocus || mousePlayers.length < 1) {
        return
    }
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
    Object.assign(btnStart, {x: level.width*(0.04+0.52), y: level.height*0.3, width: level.width*0.4, height: level.height*0.42,loadingPercentage: 0.0})
    Object.assign(btnMute,{x: btnStart.x + btnStart.width - level.width*0.12, y: level.height*0.1, width: level.width*0.12, height: level.height*0.1,loadingPercentage: 0.0})
    Object.assign(btnBots,{x: btnStart.x + btnStart.width - level.width*0.12, y: level.height*0.8, width: level.width*0.12, height: level.height*0.1,loadingPercentage: 0.0})
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

        if (completeRestart) {
            gamepadPlayers = []
            mousePlayers = []
            keyboardPlayers = []
        }

        figures.push(figure)
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

function gameLoop() {
    addjustAfterResizeIfNeeded(level, canvas)
    
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }
    botPlayers = []
    for (var b = 0; b < getBotCount(); b++) {

        var bot = {
            type: 'bot',
            isAttackButtonPressed: false,
            isAnyButtonPressed: !isGameStarted,
            xAxis: 0,
            yAxis: 0,
            isMoving: true,
            playerId: 'b' + b
        }

        var f = figures.find(f => f.playerId === bot.playerId && f.type === 'fighter')
        
        if (f && !f.isDead) {
            var xTarget = -1000
            var yTarget = -1000
    
            if (!isGameStarted) {
                xTarget = btnStart.x + btnStart.width*0.5
                yTarget = btnStart.y + btnStart.height*0.5
            } else {
                var beans = figures.filter(b => b.type === 'bean')
                if (f.beans.size === beans.length) {
                    const otherPlayerFigures = figures.filter(fig => fig.playerId && fig.playerId !== f.playerId && f.type === 'fighter');
                    xTarget = otherPlayerFigures.reduce((prevValue, fig) => prevValue+fig.x, 0)/otherPlayerFigures.length;
                    yTarget = otherPlayerFigures.reduce((prevValue, fig) => prevValue+fig.y, 0)/otherPlayerFigures.length;
                    if (distance(f.x,f.y,xTarget, yTarget) < 50) {
                        bot.isAttackButtonPressed = true
                    }
                } else {
                    beans.forEach((b, i, beans) => {
                        if (!f.beans.has(b.id) && (i < beans.length-1 || f.beans.size !== 1)) {
                            const beanTarget = {x: b.x, y: b.y-f.imageAnim.height*0.5}
                            let d1 = distance(f.x,f.y,beanTarget.x,beanTarget.y);
                            let d2 = distance(f.x,f.y,xTarget,yTarget);
                            if (f.beans.size === 0 && i === beans.length-1) {
                                d1 += level.shortestPathBean5;
                                d2 += level.shortestPathNotBean5;
                            }
                            if (d1 < d2) {
                                xTarget = beanTarget.x;
                                yTarget = beanTarget.y;
                            }
                        }
                    });
                }
            }

            bot.xAxis = xTarget - f.x
            bot.yAxis = yTarget - f.y
        }

        bot.isMoving = Math.abs(bot.xAxis) + Math.abs(bot.yAxis) > 4;
       
        botPlayers.push(bot)
    }

    navigator.getGamepads().filter(x => x && x.connected).map(x => {
        var gamepadPlayerIndex = gamepadPlayers.findIndex(g => g.id === x.id && g.index === x.index)
        if (gamepadPlayerIndex < 0) {
            if (x.buttons.some(b => b.pressed)) {
                gamepadPlayers.push(x)
            }
        } else {
            gamepadPlayers[gamepadPlayerIndex] = x
            //gamepadPlayers[gamepadPlayerIndex].buttons = x.buttons
            //gamepadPlayers[gamepadPlayerIndex].axes = x.axes
        }
    })

    gamepadPlayers.forEach(g => {
        g.isAttackButtonPressed = false
        g.isAnyButtonPressed = false
        if (g.buttons[0].pressed) {
            g.isAttackButtonPressed = true
        } 
        if (g.buttons.some(b => b.pressed)) {
            g.isAnyButtonPressed = true
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

    keyboardPlayers = keyboardPlayers.map((kp,i) => ({...defaultkeyboardPlayer, playerId: 'k' + i}));
    keyboards.forEach(k => {
        Array.from(k.pressed.values()).forEach(pressedButton => {
            const binding = k.bindings[pressedButton];
            if (binding) {
                const action = binding.action;
                let p = keyboardPlayers.find(kp => binding.playerId ===  kp.playerId);
                let isNew = false
                if (!p) {
                    isNew = true
                    p = {...defaultkeyboardPlayer, playerId: 'k' + keyboardPlayers.length};
                }
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
                isNew && keyboardPlayers.push(p)
                p.isMoving = p.xAxis !== 0 || p.yAxis !== 0;
            }
        })
    });

    
    mousePlayers.forEach((mp,i) => {
        mp.type = 'mouse'
        mp.playerId = 'm' + i
        mp.isAttackButtonPressed = mp.pressed.has(0)
        mp.xAxis = 0
        mp.yAxis = 0
        mp.isMoving = 0

        var f = figures.find(f => f.playerId ===  mp.playerId && f.type === 'fighter')
        if (f) {
            if (mp.pointerType === 'touch') {
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
               

            } else if (mp.pointerType === 'mouse') {
                let x = mp.x- (canvas.width*0.5-canvas.offsetLeft-level.offsetX)/level.scale;
                let y = mp.y- (canvas.height*0.5-canvas.offsetTop-level.offsetY)/level.scale
                mp.xAxis = x
                mp.yAxis = y   
                mp.isMoving = Math.abs(mp.xAxis) + Math.abs(mp.yAxis) > level.width*0.05
            }
        
        }
       
    })

    let players = [...gamepadPlayers, ...keyboardPlayers, ...mousePlayers, ...botPlayers];
    const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.type === 'fighter' && f.playerId).includes(k.playerId)).length;

    // remove figures without valid playerId
    figures.filter(f => f.playerId).forEach((f) => {
        if (!players.some(p => p.playerId === f.playerId)) {
            f.playerId = null
        }
    })

    if (windowHasFocus) {
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
            if (!isMusicMuted()) {
                stopPlaylist(musicLobby);
                playPlaylist(musicGame);
            }
            
        } else if(!isGameStarted) {
            if (!isMusicMuted()) {
                stopPlaylist(musicGame);
            }
        }
        gameInit(!!lastFinalWinnerPlayerId);
    }

    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt, dtProcessed) {
    let figuresAlive = figures.filter(f => !f.isDead);
    let figuresDead = figures.filter(f => f.isDead);

    if (!isGameStarted) {
        btnStart.playerPercentage = 0.0
        var playersWithId = figures.filter(f => f.playerId && f.type === 'fighter')
        var playersNear = playersWithId.filter(f => isInRect(f.x,f.y+f.imageAnim.height*0.5,btnStart.x,btnStart.y,btnStart.width,btnStart.height))
        btnStart.playersNear = playersNear
        btnStart.playersPossible = playersWithId
        const maxLoadingPercentage = playersWithId.length > 1 ? playersNear.length / playersWithId.length : playersNear.length*0.5;
        const minLoadingPercentage = Math.max(playersNear.length-1, 0) / Math.max(playersWithId.length, 1);

        if (btnStart.loadingPercentage <= maxLoadingPercentage) {
            btnStart.loadingPercentage += btnStart.loadingSpeed * dt;
            btnStart.loadingPercentage = Math.min(btnStart.loadingPercentage, maxLoadingPercentage);
        } else {
            btnStart.loadingPercentage -= btnStart.loadingSpeed * dt;
            btnStart.loadingPercentage = Math.max(btnStart.loadingPercentage, minLoadingPercentage);
        }
        if (btnStart.loadingPercentage >= 1) {
            restartGame = true;
        }

  
        btnsLobby.forEach(btn => {
            btn.playersNear = playersWithId.filter(f => isInRect(f.x,f.y+f.imageAnim.height*0.5,btn.x,btn.y,btn.width,btn.height))
            if (btn.playersNear.length > 0) {
                btn.loadingPercentage += btn.loadingSpeed * dt;
            } else {
                btn.loadingPercentage -= btn.loadingSpeed * dt
            }
            btn.loadingPercentage = btn.loadingPercentage > 0 ? btn.loadingPercentage : 0;
    
            if (btn.loadingPercentage > 1) {
                btn.loadingPercentage = 0
                btn.execute()
            }
        })
       


        figuresDead.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
            f.isDead = false
            f.y-=f.imageAnim.height*0.25
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
    figures.filter(b => b.type === 'bean').forEach(b => {
        playerFigures.forEach(fig => {
            if (distance(b.x,b.y,fig.x,fig.y + b.imageAnim.height*0.5) < b.attackDistance) {
                if (!fig.beans.has(b.id)) {
                    playAudio(soundEat[fig.beans.size]);
                    fig.beans.add(b.id);
                    b.lastAttackTime = dtProcessed
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
                fig.y+=f.imageAnim.height*0.25
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
    
    // player join first
    var joinedFighters = figures.filter(f => f.playerId)
    // join by doing anything
    players.filter(p => p.isAnyButtonPressed || p.isAttackButtonPressed || (p.isMoving && p.type !== 'gamepad')).forEach(p => {
        var figure = figures.find(f => f.playerId === p.playerId && f.type === 'fighter')
        if (!figure) {
            if (p.type === 'bot' && joinedFighters.length === 0) {
                return
            }
            var figure = figures.find(f => !f.playerId && f.type === 'fighter')
            figure.isDead = false
            figure.playerId = p.playerId
            playAudio(soundJoin);
            newPlayerIds.clear();
            newPlayerIds.add(figure.playerId);
            newPlayerIdThen = dtProcessed

            if (joinedFighters.length === 0) {
                if (!isMusicMuted()) {
                    playPlaylist(musicLobby);
                }
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
