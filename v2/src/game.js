

var laststep = 0, logit;
var loadPromises = []
var canvas = document.body;

var gamepadPlayers = []
var mousePlayers = [];
var mouses = [{pointerType: 'unknown', x: 0, y: 0, xCenter: undefined, yCenter: undefined, pressed: new Set()}]
const defaultkeyboardPlayer = {
    xAxis: 0,
    yAxis: 0,
    isMoving: false,
    type: 'keyboard',
    isAttackButtonPressed: false
};
var keyboardPlayers = [];
var botPlayers = []
var players = []
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
var isGameStarted = false, restartGame = false, newPlayerIds = new Set(), newPlayerIdThen, lastWinnerPlayerIds = new Set(), lastRoundEndThen, lastFinalWinnerPlayerId;
const moveNewPlayerDuration = 1000, moveScoreToPlayerDuration = 1000, showFinalWinnerDuration = 5000;
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figuresV2 = []
var figures = [], maxPlayerFigures = 32, pointsToWin = 3, deadDuration = 5000, beanAttackDuration = 800, fartGrowDuration = 2000
var showDebug = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = {}
var tileMap, tileMap2;
var playerImage = new Image()
playerImage.src = '../gfx/character_base_32x32.png' // '../gfx/character_base_topview_32x32.png' beuelerjong
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
imageArrow.src = '../gfx/arrow.png'
loadPromises.push(new Promise((resolve, reject) => {
    imageArrow.onload = () => {
        resolve()
    }
}))

var cloudImage = new Image()
cloudImage.src = '../gfx/fart.png'
loadPromises.push(new Promise((resolve, reject) => {
    cloudImage.onload = () => {
        resolve()
    }
}))
var texture = new Image()
texture.src = '../gfx/kacheln.png'
loadPromises.push(new Promise((resolve, reject) => {
    texture.onload = () => {
        resolve();
    }
}))

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
foodImage.src = '../gfx/food-OCAL.png'
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
    attack: {title: '../sfx/sound2.mp3', currentTime: 0.15},
    attack2: {title: '../sfx/sound1.mp3', currentTime: 0.15},
    death: {title: '../sfx/gag-reflex-41207.mp3', currentTime: 0.0},
    join: {title: '../sfx/sounddrum.mp3'},
    firstBlood: {title: '../sfx/first-blood.mp3', volume: 0.2},
    win: {title: '../sfx/audience-clapping-03-99963.mp3'},
    musicGame: [
        {title: '../sfx/music1.mp3', currentTime: 20, volume: 0.5},
        {title: '../sfx/music2.mp3', volume: 0.5},
        {title: '../sfx/music3.mp3', volume: 0.5}
    ],
    musicLobby: [
        {title: '../sfx/lobby.mp3', volume: 0.2}
    ],
    multiKill: [
        {title: '../sfx/double-kill.mp3', volume: 0.3},
        {title: '../sfx/triple-kill.mp3', volume: 0.4},
        {title: '../sfx/multi-kill.mp3', volume: 0.5},
        {title: '../sfx/mega-kill.ogg'},
        {title: '../sfx/ultra-kill.mp3', volume: 0.5},
        {title: '../sfx/monster-kill.mp3', volume: 0.5},
        {title: '../sfx/ludicrous-kill.mp3', volume: 0.5},
        {title: '../sfx/holy-shit.ogg'}
    ],
    totalKill: [
        {title: '../sfx/killing-spree.mp3', volume: 0.5},
        {title: '../sfx/rampage.mp3', volume: 0.5},
        {title: '../sfx/dominating.mp3', volume: 0.5},
        {title: '../sfx/unstoppable.ogg'},
        {title: '../sfx/god-like.mp3', volume: 0.5},
        {title: '../sfx/wicked-sick.ogg'}
    ],

    eat: [
        {title: '../sfx/eatingsfxwav-14588.mp3'},
        {title: '../sfx/carrotnom-92106.mp3'},
        {title: '../sfx/eat-a-cracker-95783.mp3', volume: 0.5},
        {title: '../sfx/game-eat-sound-83240.mp3'},
        {title: '../sfx/game-eat-sound-83240.mp3'}
    ]
}

var soundAttackPool = loadAudioPool(audio.attack, 10);
var soundAttack2Pool = loadAudioPool(audio.attack2, 10);
var soundDeathPool = loadAudioPool(audio.death, 10);
var soundEatPool = audio.eat.map(audio => loadAudioPool(audio, 4));

var musicGame = shuffle(audio.musicGame.map(audio => getAudio(audio)));
var musicLobby = audio.musicLobby.map(audio => getAudio(audio));
var soundJoin = getAudio(audio.join);
var soundFirstBlood = getAudio(audio.firstBlood);
var soundMultiKill = audio.multiKill.map(audio => getAudio(audio));
var soundTotalKill = audio.totalKill.map(audio => getAudio(audio));
var soundWin = getAudio(audio.win);

const foodAtlasData = {
    frames: {
        bean: {
            frame: { x: 32, y: 192, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        brokkoli: {
            frame: { x: 256, y: 32, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        onion: {
            frame: { x: 192, y: 64, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        salad: {
            frame: { x: 64, y: 64, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        },
        taco: {
            frame: { x: 224, y: 256, w: 32, h: 32 },
            sourceSize: { w: 32, h: 32 },
            spriteSourceSize: { x: 0, y: 0, w: 32, h: 32 }
        }
    },
    meta: {
        image: 'food',
        format: 'RGBA8888',
        size: { w: 320, h: 320 },
        scale: 1
    },
    textures: {
        bean: 'bean',
        brokkoli: 'brokkoli',
        onion: 'onion',
        salad: 'salad',
        taco: 'taco'
    }
};

const buttonDefinition = () => ({
    start: {
        x: level.width*(0.5-0.1),
        y: level.height*0.55,
        width: level.width*0.2,
        height: level.width*0.2,
        loadingSpeed: 1/3000,
        execute: () => {restartGame = true}
    },
    mute: {
        x: level.width*(1.0 - 0.05 -0.15),
        y: level.height*0.12,
        width: level.width*0.15,
        height: level.height*0.1,
        loadingSpeed: 1/2500,
        execute: toggleMusic
    },
    bots: {
        x: level.width*(1.0 - 0.05 -0.15),
        y: level.height*0.12 + level.height*0.1 + 20,
        width: level.width*0.15,
        height: level.height*0.1,
        loadingSpeed: 1/1500,
        execute: toggleBots
    }
})

const buttons = {
    start: {},
    mute: {},
    bots: {}
}

const foodDefinition = completeRestart => ({
    bean: {
        x: completeRestart ? level.width*3.4/5 : level.width*4/5,
        y: completeRestart ? level.height*1.6/5 : level.height*4/5,
    },
    brokkoli: {
        x: completeRestart ? level.width*2.6/5 : level.width/5,
        y: completeRestart ? level.height*0.8/5 : level.height/5,
    },
    onion: {
        x: completeRestart ? level.width*2.6/5 : level.width/5,
        y: completeRestart ? level.height*1.6/5 : level.height*4/5,
    },
    salad: {
        x: completeRestart ? level.width*3.4/5 : level.width*4/5,
        y: completeRestart ? level.height*0.8/5 : level.height/5,
    },
    taco: {
        x: completeRestart ? level.width*3.0/5 : level.width/2,
        y: completeRestart ? level.height*1.2/5 : level.height/2,
    }
})


const grassAtlasData = {
    frames: {
        mushroom: {
            frame: { x: 0, y: 0, w: 120, h: 120 },
            sourceSize: { w: 120, h: 120 },
            spriteSourceSize: { x: 0, y: 0, w: 120, h: 120 }
        },
        plain: {
            frame: { x: 120, y: 0, w: 120, h: 120 },
            sourceSize: { w: 120, h: 120 },
            spriteSourceSize: { x: 0, y: 0, w: 120, h: 120 }
        },
        flowers: {
            frame: { x: 240, y: 0, w: 120, h: 120 },
            sourceSize: { w: 120, h: 120 },
            spriteSourceSize: { x: 0, y: 0, w: 120, h: 120 }
        }
    },
    meta: {
        image: 'grass',
        format: 'RGBA8888',
        size: { w: 360, h: 120 },
        scale: 1
    },
    textures: {
        mushroom: 'mushroom',
        plain: 'plain',
        flowers: 'flowers'
    }
};

const figureAtlasData = createFigureAtlasData();
var app;

(async () =>
    {
        console.log('no need to hide');

        // Create a PixiJS application.
        app = new PIXI.Application();
    
        // Initialize the application.
        await app.init({ background: '#1099bb', resizeTo: window });
    
        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);

        const assets = [
            {alias: 'food', src: '../gfx/food-OCAL.png'},
            {alias: 'grass', src: '../gfx/kacheln.png'},
            {alias: 'players', src: '../gfx/character_base_32x32.png'}
        ];
    
        // Load the assets defined above.
        await PIXI.Assets.load(assets);

        const foodSpritesheet = new PIXI.Spritesheet(
            PIXI.Texture.from(foodAtlasData.meta.image),
            foodAtlasData
        );

        const grassSpritesheet = new PIXI.Spritesheet(
            PIXI.Texture.from(grassAtlasData.meta.image),
            grassAtlasData
        );

        const figureSpritesheet = new PIXI.Spritesheet(
            PIXI.Texture.from(figureAtlasData.meta.image),
            figureAtlasData
        );
        
        // Generate all the Textures asynchronously
        await foodSpritesheet.parse();
        await figureSpritesheet.parse();
        await grassSpritesheet.parse();

        adjustStageToScreen(app, level)

        addGrass(app, Object.keys(grassAtlasData.frames), grassSpritesheet);
        addFence(app, level);
        addHeadline(app);
        addMenuItems(app);
        addFoods(app, foodSpritesheet);
        addFigures(app, figureSpritesheet);
        app.ticker.add(() => animateWinningCeremony(figures));
        //addPlayerScore(app, {x:0, y:0});
        roundInit(true);
        window.requestAnimationFrame(gameLoop);
    }
)();


document.addEventListener("DOMContentLoaded", function(event){
    /*addjustAfterResizeIfNeeded(level, canvas)

    // loading images
    ctx.save()
    ctx.font = canvas.height*0.1+"px serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.textBaseline='top'
    ctx.fillText('Loading...',0,0)
    ctx.restore()

    Promise.all(loadPromises).then(() => {
        //playAudioPool(soundAttackPool, 0);
        tileMap = tileMapFunc(texture,0);
        tileMap2 = tileMapFunc(texture,1)
        gameInit(true)
        window.requestAnimationFrame(gameLoop);
    })*/
   
})

function roundInit(completeRestart) {
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
    if (completeRestart) {
        gamepadPlayers = []
        mousePlayers = []
        keyboardPlayers = []
    }
    Object.values(buttons).forEach(button => button.loadingPercentage = 0);
    figures.filter(figure => figure.type === 'fighter').forEach((figure, i) => {
        const [x, y] = getRandomXY(level)
        const [xTarget, yTarget] = getRandomXY(level)

        Object.assign(figure, {
            x,
            y,
            xTarget,
            yTarget,
            startWalkTime: Math.random() * 5000 + dtProcessed,
            speed: 0,
            isDead: false, 
            playerId: activePlayerIds[i] || null,
            killTime: 0,
            direction: angle(x,y,xTarget,yTarget),
            isAttacking: false,
            lastAttackTime: undefined,
            beans: new Set(),
            beansFarted: new Set()
        })

        if (completeRestart && figure.score) {
            figure.score.points = 0
        }
    })

    figures.filter(figure => figure.type === 'bean').forEach(figure => {
        const {x, y} = foodDefinition(completeRestart)[figure.id]
        Object.assign(figure, {
            x,
            y,
            lastAttackTime: undefined
        })
    })
}

function gameLoop() {
    now = Date.now();
    dt = now - then;
    if (fpsTime < now - 1000) {
        fpsTime = now
        fps = Math.floor(1000/dt)
    }

    players = collectInputs()
    const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.type === 'fighter' && f.playerId).includes(k.playerId)).length;

    // remove figures without valid playerId
    figures.filter(f => f.playerId).forEach((f) => {
        if (!players.some(p => p.playerId === f.playerId)) {
            f.playerId = null
        }
    })

    if (windowHasFocus) {
        dtToProcess += dt
        let counter = 0;
        while(dtToProcess > dtFix) {
            if (!restartGame) {
                handleInput(players, figures, dtProcessed) 
                handleAi(figures, dtProcessed, oldNumberJoinedKeyboardPlayers, dtFix)
                updateGame(figures, dtFix,dtProcessed)
            }
            dtToProcess-=dtFix
            dtProcessed+=dtFix
            counter++
        }
        
    }

    const figuresSorted = figures.toSorted((f1,f2) => (f1.y +f1.zIndex) - (f2.y +f2.zIndex) )
    const figuresPlayer = figures.filter(f => f.playerId && f.type === 'fighter')

    //draw(players, figuresSorted, figuresPlayer, dt, dtProcessed, 0);
    //draw(players, figuresSorted, figuresPlayer, dt, dtProcessed, 1);

    then = now

    if (!restartGame) {
        var survivors = figuresPlayer.filter(f => !f.isDead)
        if (isGameStarted && survivors.length < 2) {
            lastWinnerPlayerIds.clear();
            if (survivors.length == 1) {
                figuresPlayer.forEach(f => f.score.oldPoints = f.score.points);
                survivors[0].score.points++
                lastWinnerPlayerIds.add(survivors[0].playerId);
                lastRoundEndThen = dtProcessed
            }
            restartGame = true;
        }

        const maxPoints = Math.max(...figuresPlayer.map(f => f.score.points));
        if (maxPoints >= pointsToWin) {
            const figuresWithMaxPoints = figuresPlayer.filter(f => f.score.points === maxPoints);
            if (figuresWithMaxPoints.length === 1) {
                if (!lastFinalWinnerPlayerId) {
                   playAudio(soundWin)
                }
                lastFinalWinnerPlayerId = figuresWithMaxPoints[0].playerId;
            }
        }
    }

    const gameBreakDuration = (figuresPlayer.length+1)*moveScoreToPlayerDuration + showFinalWinnerDuration;
    if (restartGame && (!lastRoundEndThen || dtProcessed - lastRoundEndThen > gameBreakDuration)) {
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
        roundInit(!!lastFinalWinnerPlayerId);
    }
    
    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt, dtProcessed) {
    let figuresAlive = figures.filter(f => !f.isDead);
    let figuresDead = figures.filter(f => f.isDead);

    if (!isGameStarted) {
        Object.values(buttons).forEach(btn => {
            btn.playerPercentage = 0.0
            btn.playersPossible = figures.filter(f => f.playerId && f.type === 'fighter')
            btn.playersNear = btn.playersPossible.filter(f => isInRect(f.x,f.y+f.height*0.5,btn.x,btn.y,btn.width,btn.height))
            
            if (btn === buttons.start) {
                const maxLoadingPercentage = btn.playersPossible.length > 1 ? btn.playersNear.length / btn.playersPossible.length : btn.playersNear.length*0.5;
                const minLoadingPercentage = Math.max(btn.playersNear.length-1, 0) / Math.max(btn.playersPossible.length, 1);
                
                if (btn.loadingPercentage <= maxLoadingPercentage) {
                    btn.loadingPercentage += btn.loadingSpeed * dt;
                    btn.loadingPercentage = Math.min(btn.loadingPercentage, maxLoadingPercentage);
                } else {
                    btn.loadingPercentage -= btn.loadingSpeed * dt;
                    btn.loadingPercentage = Math.max(btn.loadingPercentage, minLoadingPercentage);
                }

            } else {
                
                 if (btn.playersNear.length > 0) {
                    btn.loadingPercentage += btn.loadingSpeed * dt;
                } else {
                    btn.loadingPercentage -= btn.loadingSpeed * dt
                }
                btn.loadingPercentage = btn.loadingPercentage > 0 ? btn.loadingPercentage : 0;
            }

            if (btn.loadingPercentage >= 1) {
                btn.loadingPercentage = 0
                btn.execute()
            }
        })
       


        figuresDead.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
            f.isDead = false
            f.y-=f.height*0.25
            f.killTime = 0
        }})
    }

    figuresAlive.filter(f => f.type === 'fighter').forEach(f => {
        let xyNew = move(f.x, f.y, f.direction,f.speed, dt)
        if (xyNew) {
            [f.x, f.y] = cropXY(xyNew.x, xyNew.y, level)
        }
        f.anim += f.speed + f.imageAnim?.animDefaultSpeed
       // f.anim += f.isAttacking ? 0.5 : 0
    })
    
    let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter');
    figures.filter(b => b.type === 'bean').forEach(b => {
        playerFigures.forEach(fig => {
            if (distance(b.x,b.y,fig.x,fig.y + b.height*0.5) < b.attackDistance) {
                if (!fig.beans.has(b.id)) {                    
                    playAudioPool(soundEatPool[fig.beans.size]);
                    fig.beans.add(b.id);
                    b.lastAttackTime = dtProcessed
                }
            }
        })
    })

    let numberKilledFigures = 0;
    let killTime;
    figuresAlive.filter(f => f.isAttacking).forEach((f,i) => {
        figures.filter(fig => fig !== f && fig.playerId !== f.playerId && !fig.isDead && fig.type === 'fighter').forEach(fig => {
            const attackDistance = f.attackDistanceMultiplier ? f.attackDistanceMultiplier*f.attackDistance : f.attackDistance
            if (distance(f.x,f.y,fig.x,fig.y) < attackDistance) {
                if (2*distanceAngles(rad2deg(f.direction), rad2deg(angle(f.x,f.y,fig.x,fig.y))+180) <= f.attackAngle) {
                    fig.isDead = true;
                    fig.speed = 0;
                    fig.y+=f.height*0.25
                    playAudioPool(soundDeathPool);
                    numberKilledFigures++;
                    fig.killTime = dtProcessed
                    killTime = dtProcessed;
                }
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
            addPlayerScore(app, figure, p)
            figure.isDead = false
            figure.playerId = p.playerId
            if (!isGameStarted) {
                figure.x = level.width*0.04+ Math.random() * level.width*0.4
                figure.y = level.height*0.05+Math.random()*level.height*0.42
            }
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
                f.direction = angle(0,0,p.xAxis,p.yAxis)
                f.speed = f.maxSpeed
            }
            if (p.isAttackButtonPressed && !f.isAttacking) {
                if (!f.lastAttackTime || dtProcessed-f.lastAttackTime > f.attackBreakDuration) {

                    let xyNew = move(f.x, f.y, f.direction+deg2rad(180),f.attackDistance*0.5, 1)

                    if (f.beans.size > 0) {
                        playAudioPool(soundAttack2Pool);
                        addFartCloud(xyNew.x,xyNew.y,f.playerId,f.beans.size)
                    } else {
                        playAudioPool(soundAttackPool);
                    }
                    f.beans.forEach(b => f.beansFarted.add(b))
                    f.beans.clear()
                    f.lastAttackTime = dtProcessed
                }
            }
            f.isAttacking = f.lastAttackTime && dtProcessed-f.lastAttackTime < f.attackDuration ? true : false;
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
            f.direction = angle(f.x,f.y,f.xTarget,f.yTarget)
            f.speed = f.maxSpeed
        }
    })

    figures.filter(f => f.type === 'cloud').forEach(f => {
        f.lifetime+=dt
        if (f.lifetime > fartGrowDuration) {
            if (!f.isAttacking) {
                f.isAttacking = true
                if (f.size === 5) {
                    f.attackDistanceMultiplier = 3*f.size
                } else if (f.size === 1) {
                    f.attackDistanceMultiplier = 2*f.size
                } else {
                    f.attackDistanceMultiplier = 1.5*f.size
                }
                
            }
            f.attackDistanceMultiplier*=Math.pow(0.999,dt)
            if (f.attackDistanceMultiplier < 0.1) {
                f.attackDistanceMultiplier = 0
                f.isDead = true
            }

        } else {
           
            if (f.size === 5) {
                f.attackDistanceMultiplier= f.lifetime/fartGrowDuration * 3*f.size
            } else if (f.size === 1) {
                f.attackDistanceMultiplier= f.lifetime/fartGrowDuration * 2*f.size
            } else {
                f.attackDistanceMultiplier= f.lifetime/fartGrowDuration * 1.5*f.size
            }

        }
        
        
    })
    var toDelete = figures.findIndex(f => f.type === 'cloud' && f.isDead)
    if (toDelete >= 0)
        figures.splice(toDelete,1)
}
