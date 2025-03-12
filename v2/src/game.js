var loadPromises = []
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
var restartGame = false, lastWinnerPlayerIds = new Set(), lastRoundEndThen, lastFinalWinnerPlayerId;
const moveNewPlayerDuration = 1000, moveScoreToPlayerDuration = 1000, showFinalWinnerDuration = 5000;
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figuresPool = []
var figures = [], maxPlayerFigures = 32, numberGuards = 17, numberVIPs = 3, pointsToWin = 1, deadDuration = 5000, beanAttackDuration = 800, fartGrowDuration = 2000
var showDebug = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = createLevel()

const stages = {
    game: 'game',
    gameLobby: 'gameLobby',
    startLobby: 'startLobby',
}

let stage
let nextStage = stages.startLobby

const games = {
    food: {
        color: colors.darkgreen,
        text: 'FOOD'
    },
    battleRoyale: {
        color: colors.red,
        text: 'BATTLE ROYALE'
    },
    vip: {
        color: colors.blue,
        text: 'VIP'
    }
}

let game

var btnTouchController = {
    radius: 0,
}

var btnTouchAction = {
    radius:0
}

let tileArea = []
const tileWidth = 120;
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

var musicGame = audio.musicGame.map(audio => getAudio(audio));
var musicLobby = audio.musicLobby.map(audio => getAudio(audio));
var soundJoin = getAudio(audio.join);
var soundFirstBlood = getAudio(audio.firstBlood);
var soundMultiKill = audio.multiKill.map(audio => getAudio(audio));
var soundTotalKill = audio.totalKill.map(audio => getAudio(audio));
var soundWin = getAudio(audio.win);

var actualMusicPlaylist;

const foodAtlasData = {
    frames: {
        bean: {
            frame: { x: 32, y: 192, w: 32, h: 32 }
        },
        brokkoli: {
            frame: { x: 256, y: 32, w: 32, h: 32 }
        },
        onion: {
            frame: { x: 192, y: 64, w: 32, h: 32 }
        },
        salad: {
            frame: { x: 64, y: 64, w: 32, h: 32 }
        },
        taco: {
            frame: { x: 224, y: 256, w: 32, h: 32 }
        }
    },
    meta: {
        image: 'food'
    },
    textures: {
        bean: 'bean',
        brokkoli: 'brokkoli',
        onion: 'onion',
        salad: 'salad',
        taco: 'taco'
    }
};

const gameSelectionDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.65,
    innerRadius: level.width*0.1,
    outerRadius: level.width*0.15,
    loadingSpeed: 1/3000,
    execute: () => {
        restartGame = true
        const gamesValues = Object.values(games)
        game = gamesValues[getRandomIndex(gamesValues.map(game => game.votes))]
        nextStage = stages.gameLobby
    }
})

const gameStartButtonDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.65,
    innerRadius: level.width*0.1,
    outerRadius: level.width*0.15,
    loadingSpeed: 1/3000,
    execute: () => {
        restartGame = true
        nextStage = stages.game
    }
})

const buttonDefinition = () => ({
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
    selectGame: {},
    startGame: {},
    mute: {},
    bots: {}
}

const circleOfDeathDefinition = () => ({
    x: level.width/2,
    y: level.height/2,
    duration: 180000,
    radius: Math.hypot(level.width/2, level.height/2),
    startRadius: Math.hypot(level.width/2, level.height/2)
})

var circleOfDeath

const foodDefinition = () => ({
    bean: {
        x: stage === stages.gameLobby ? level.width*3.4/5 : level.width*4/5,
        y: stage === stages.gameLobby ? level.height*1.6/5 : level.height*4/5,
    },
    brokkoli: {
        x: stage === stages.gameLobby ? level.width*2.6/5 : level.width/5,
        y: stage === stages.gameLobby ? level.height*0.8/5 : level.height/5,
    },
    onion: {
        x: stage === stages.gameLobby ? level.width*2.6/5 : level.width/5,
        y: stage === stages.gameLobby ? level.height*1.6/5 : level.height*4/5,
    },
    salad: {
        x: stage === stages.gameLobby ? level.width*3.4/5 : level.width*4/5,
        y: stage === stages.gameLobby ? level.height*0.8/5 : level.height/5,
    },
    taco: {
        x: stage === stages.gameLobby ? level.width*3.0/5 : level.width/2,
        y: stage === stages.gameLobby ? level.height*1.2/5 : level.height/2,
    }
})

const grassAtlasData = {
    frames: {
        mushroom: {
            frame: { x: 0, y: 0, w: 120, h: 120 }
        },
        plain: {
            frame: { x: 120, y: 0, w: 120, h: 120 }
        },
        flowers: {
            frame: { x: 240, y: 0, w: 120, h: 120 }
        }
    },
    meta: {
        image: 'grass'
    },
    textures: {
        mushroom: 'mushroom',
        plain: 'plain',
        flowers: 'flowers'
    }
};

const figureAtlasData = createFigureAtlasData();
const cloudAtlasData = createCloudAtlasData();
var spriteSheets;
const app = new PIXI.Application();
var levelContainer;
const figureShadowLayer = new PIXI.RenderLayer();
const figureLayer = new PIXI.RenderLayer({sortableChildren: true});
const cloudLayer = new PIXI.RenderLayer();
const scoreLayer = new PIXI.RenderLayer({sortableChildren: true});
const overlayLayer = new PIXI.RenderLayer();
const debugLayer = new PIXI.RenderLayer({sortableChildren: true});

(async () =>
    {
        console.log('no need to hide');
    
        // Initialize the application.
        await app.init({antialias: true, backgroundAlpha: 0, resizeTo: window});
    
        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);

        const loadingText = createLoadingText(app);

        await Promise.all(loadPromises);

        const assets = [
            {alias: 'food', src: '../gfx/food-OCAL.png'},
            {alias: 'grass', src: '../gfx/kacheln.png'},
            {alias: 'players', src: '../gfx/character_base_32x32.png'},
            {alias: 'cloud', src: '../gfx/fart.png'}
        ];
    
        // Load the assets defined above.
        await PIXI.Assets.load(assets);

        const atlasData = {
            cloud: cloudAtlasData,
            figure: figureAtlasData,
            food: foodAtlasData,
            grass: grassAtlasData
        }
        
        spriteSheets = Object.entries(atlasData).reduce((acc, [key, value]) => ({...acc, [key]: new PIXI.Spritesheet(
            PIXI.Texture.from(value.meta.image),
            value
        )}), {})

        // Generate all the Textures asynchronously
        await Promise.all(Object.values(spriteSheets).map(async spriteSheet => 
            await spriteSheet.parse()
        ))

        destroyContainer(app, loadingText)
        levelContainer = createLevelContainer(app, level);
        app.stage.addChild(levelContainer, figureShadowLayer, figureLayer, cloudLayer, scoreLayer, overlayLayer, debugLayer)
        addGrass(Object.keys(atlasData.grass.frames), spriteSheets.grass);
        addHeadline();
        addLobbyItems(app);
        addFoods(app, spriteSheets.food);
        addLevelBoundary(app);
        addFigures(app, spriteSheets.figure);
        addWinningCeremony(app);
        addOverlay(app)
        addDebug(app);
       
        roundInit();
        window.requestAnimationFrame(gameLoop);
    }
)();

function roundInit() {
    then = Date.now();
    startTime = dtProcessed;
    stage = nextStage
    lastFinalWinnerPlayerId = undefined
    fpsTime = then
    lastKillTime = undefined;
    multikillCounter = 0;
    lastTotalkillAudio = 0;
    totalkillCounter = 0;

    if (stage === stages.startLobby) {
        gamepadPlayers = []
        mousePlayers = []
        keyboardPlayers = []
    }
    if (!isMusicMuted()) {
        if (stage === stages.startLobby) {
            stopMusicPlaylist();
        } else if (stage === stages.game) {
            playMusicPlaylist(musicGame, true);
        }
    }

    Object.values(buttons).forEach(button => button.loadingPercentage = 0);

    figures = []
    figuresPool.filter(figure => figure.type === 'fighter' && figure.team !== 'vip').forEach(figure => {

        if (stage !== stages.gameLobby) {
            initRandomPositionFigure(figure)
        }

        if (stage === stages.startLobby) {
            destroyContainer(app, figure.score)
            figure.playerId = null
        }

        figures.push(figure)
    })

    if (game === games.vip) {
        figuresPool.filter(figure => figure.type === 'fighter' && figure.team === 'vip').forEach(figure => {
            initRandomPositionFigure(figure)
            figures.push(figure)
        })
    }

    if (game === games.food) {
        figuresPool.filter(figure => figure.type === 'bean').forEach(figure => {
            const {x, y} = foodDefinition()[figure.id]
            Object.assign(figure, {
                x,
                y,
                lastAttackTime: undefined
            })
    
            figures.push(figure)
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

    players = collectInputs()
    const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => figures.map(f => f.type === 'fighter' && f.playerId).includes(k.playerId)).length;

    // remove figures without valid playerId
    figures.filter(f => f.playerId).forEach((f) => {
        if (!players.some(p => p.playerId === f.playerId)) {
            destroyContainer(app, f.score)
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
                updateGame(figures, dtFix, dtProcessed)
            }
            dtToProcess-=dtFix
            dtProcessed+=dtFix
            counter++
        }
        
    }

    const figuresPlayer = figures.filter(f => f.playerId && f.type === 'fighter')

    if (!restartGame) {
        var survivors = figuresPlayer.filter(f => !f.isDead)
        if ((stage === stages.game) && survivors.length < 2) {
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
        if (lastFinalWinnerPlayerId) {
            nextStage = stages.startLobby
        }
        roundInit();
    }
    
    then = now
    window.requestAnimationFrame(gameLoop);
}

function updateGame(figures, dt, dtProcessed) {
    let figuresAlive = figures.filter(f => !f.isDead);
    let figuresDead = figures.filter(f => f.isDead);
    let figuresRevived = []


    if (stage === stages.startLobby || stage === stages.gameLobby) {
        figuresRevived = figuresDead
    } else {
        switch (game) {
            case games.food:
                figuresRevived = figuresDead.filter(f => !f.playerId)
                break;
            case games.food:
                figuresRevived = figuresDead.filter(f => !f.playerId && !f.team === 'vip' || f.playerId && f.team === 'guard')
                break;
            default:
                break;
        }
    }

    figuresRevived.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
        f.isDead = false
        f.killTime = 0
    }})

    if (stage === stages.startLobby || stage === stages.gameLobby) {
            const minimumPlayers = figures.filter(f => f.playerId?.[0] === 'b' && f.type === 'fighter').length > 0 ? 1 : 2
            const playersPossible = figures.filter(f => f.playerId && f.playerId[0] !== 'b' && f.type === 'fighter')
        Object.values(buttons).forEach(btn => {
            btn.playersPossible = playersPossible
            btn.playersNear = playersPossible.filter(f => !f.isDead && btn.isInArea(f))
            
            let aimLoadingPercentage
            if (btn === buttons.startGame || btn === buttons.selectGame) {
                aimLoadingPercentage = btn.playersNear.length / Math.max(playersPossible.length, minimumPlayers);
            } else if (btn.game) {
                aimLoadingPercentage = btn.playersNear.length / Math.max(playersPossible.length, minimumPlayers)
                btn.game.votes = btn.playersNear.length
            } else {
                aimLoadingPercentage = btn.playersNear.length > 0 ? 1 : 0;
            }
            
            loadButton(btn, aimLoadingPercentage)
        })

        figuresDead.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
            f.isDead = false
            f.killTime = 0
        }})
    }

    figuresAlive.filter(f => f.speed > 0).forEach(f => {
        let xyNew = move(f.x, f.y, f.direction,f.speed, dt)
        if (xyNew) {
            [f.x, f.y] = cropXY(xyNew.x, xyNew.y, level)
        }
    })
    
    // eat beans
    if (stage !== stages.startLobby && game === games.food) {
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
    }

    // circle of death
    if (stage !== stages.startLobby && game === games.battleRoyale) {
        const scale =  1 - (dtProcessed - startTime)/circleOfDeath.duration
        circleOfDeath.radius = scale*circleOfDeath.startRadius
        figuresAlive.filter(f => f.type === 'fighter' ).forEach(f => {
            if (distance(f.x, f.y, level.width/2, level.height/2) > circleOfDeath.radius) {
                f.isDead = true
                f.killTime = dtProcessed
                f.speed = 0
                playAudioPool(soundDeathPool)
            }
        })
    }

    let numberKilledFigures = 0;
    let killTime;

    if (stage === stages.startLobby || game === games.battleRoyale || game === games.food) {
        figuresAlive.filter(f => f.isAttacking).forEach(f => {
            figuresAlive.filter(fig => fig.playerId !== f.playerId && fig.type === 'fighter').forEach(fig => {
                if (attackFigure(f, fig)) {
                    numberKilledFigures++
                    killTime = dtProcessed
                }
            });
        })
    } else {
        const assassinsAlive = figuresAlive.filter(f => f.team === 'assassin')
        const guardsAlive = figuresAlive.filter(f => f.team === 'guard')
        const vipsAlive = figuresAlive.filter(f => f.team === 'vip')
        const noTeamAlive = figuresAlive.filter(f => !f.team)

        guardsAlive.filter(f => f.isAttacking).forEach(f => {
            [...assassinsAlive, ...noTeamAlive].forEach(fig => {
                attackFigure(f, fig)
            })
        })

        assassinsAlive.filter(f => f.isAttacking).forEach(f => {
            [...guardsAlive, ...vipsAlive, ...noTeamAlive].forEach(fig => {
                attackFigure(f, fig)
            })
        })

        noTeamAlive.filter(f => f.isAttacking).forEach(f => {
            figuresAlive.filter(fig => fig.playerId !== f.playerId && fig.type === 'fighter').forEach(fig => {
                attackFigure(f, fig)
            })
        })
    }
    
    playKillingSounds(numberKilledFigures, killTime);
}

function handleInput(players, figures, dtProcessed) {
    
    // player join first
    var joinedFighters = figures.filter(f => f.playerId && f.type === 'fighter')
    // join by doing anything
    players.filter(p => p.isAnyButtonPressed || p.isAttackButtonPressed || (p.isMoving && p.type !== 'gamepad')).forEach(p => {
        var figure = joinedFighters.find(f => f.playerId === p.playerId)
        if (!figure) {
            p.joinedTime = dtProcessed
            if (p.type === 'bot' && joinedFighters.length === 0) {
                return
            }
            var figure = figures.find(f => !f.playerId && f.type === 'fighter')
            addPlayerScore(figure, p)
            figure.isDead = false
            figure.playerId = p.playerId
            if (stage === stages.startLobby) {
                figure.x = level.width*0.04+ Math.random() * level.width*0.4
                figure.y = level.height*0.05+Math.random() * level.height*0.42
            }
            playAudio(soundJoin);

            if (joinedFighters.length === 0) {
                if (!isMusicMuted()) {
                    playMusicPlaylist(musicLobby);
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
                        addFartCloud(spriteSheets.cloud, {x: xyNew.x, y: xyNew.y, playerId: f.playerId, size: f.beans.size})
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
    var toDeleteIndex = figures.findIndex(f => f.type === 'cloud' && f.isDead)
    figures.filter(f => f.type === 'cloud' && f.isDead).forEach(cloud => destroyContainer(app, cloud))
    if (toDeleteIndex >= 0)
        figures.splice(toDeleteIndex,1)
}
