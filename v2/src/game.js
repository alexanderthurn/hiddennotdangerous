var loadPromises = []
var gamepadPlayers = []
var touchPlayers = [];
var touches = [{pointerType: 'unknown', x: 0, y: 0, xCenter: undefined, yCenter: undefined, pressed: new Set()}]
var keyboardPlayers = [];
var botPlayers = []
var players = []
var playersSortedByJoinTime = []
var keyboards = [{keys: {
    'KeyA': {playerId: 'k0', action: 'left'},
    'KeyD': {playerId: 'k0', action: 'right'},
    'KeyW': {playerId: 'k0', action: 'up'},
    'KeyS': {playerId: 'k0', action: 'down'},
    'KeyT': {playerId: 'k0', action: 'attack'},
    'ShiftLeft': {playerId: 'k0', action: 'speed'},
    'KeyR': {playerId: 'k0', action: 'marker'},
    'Digit1': {playerId: 'k0', action: 'attack'},
    'Digit2': {playerId: 'k0', action: 'speed'},
    'Digit3': {playerId: 'k0', action: 'marker'},
    'Delete': {action: 'restart'},
    'ArrowLeft': {playerId: 'k1', action: 'left'},
    'ArrowRight': {playerId: 'k1', action: 'right'},
    'ArrowUp': {playerId: 'k1', action: 'up'},
    'ArrowDown': {playerId: 'k1', action: 'down'},
    'Numpad0': {playerId: 'k1', action: 'attack'},
    'Numpad1': {playerId: 'k1', action: 'marker'},
    'Numpad2': {playerId: 'k1', action: 'speed'},
    'ShiftRight': {playerId: 'k1', action: 'attack'},
    'ControlRight': {playerId: 'k1', action: 'speed'},
    'AltRight': {playerId: 'k1', action: 'marker'}}, pressed: new Set()}];
var virtualGamepads = []
var startTime, then, now, dt, fps=0, fpsMinForEffects=30, fpsTime
var isRestartButtonPressed, restartStage = false, gameOver, ceremonyOver, lastRoundEndThen, lastWinnerPlayerIds, lastFinalWinnerPlayerIds, finalWinnerTeam
const moveNewPlayerDuration = 1000, moveScoreToPlayerDuration = 1000, showFinalWinnerDuration = 5000;
var dtFix = 10, dtToProcess = 0, dtProcessed = 0
var figuresInitialPool = new Set(), figuresPool = new Set()
var figures = [], maxPlayerFigures = 32, numberGuards = 17, numberVIPs = 3, pointsToWin = getQueryParam('wins') && Number.parseInt(getQueryParam('wins')) || 3, roundsToWin = 3, deadDuration = 3000, beanAttackDuration = 800, fartGrowDuration = 2000, baseAmmoFactor = 2, bonusAmmoFactor = 0.5, detectRadius = 200

var allPlayersSameTeam, isDebugMode = false
var lastKillTime, multikillCounter, multikillTimeWindow = 4000, lastTotalkillAudio, totalkillCounter;
var level = createLevel()

const stages = {
    game: 'game',
    gameLobby: 'gameLobby',
    startLobby: 'startLobby',
}

let stage

const games = {
    battleRoyale: {
        color: colors.red,
        text: 'BATTLE ROYALE',
        countdown: 90
    },
    food: {
        color: colors.green,
        text: 'FOOD'
    },
    rampage: {
        color: colors.yellow,
        text: 'RAMPAGE',
        countdown: 180,
        initialTeam: 'killer'
    },
    rampagev2: {
        color: colors.purple,
        text: 'RAMPAGE V2',
        countdown: 180,
        initialTeam: 'killer'
    },
    vip: {
        color: colors.blue,
        text: 'VIP',
        countdown: 180
    }
}

let game, roundCounter = 0

var btnTouchController = {
    radius: 0,
}

var btnTouchAction = {
    radius:0
}

let tileArea = []
const tileWidth = 120;
const audio = {
    fart: {title: './sfx/sound2.mp3', currentTime: 0.15},
    beanFart: {title: './sfx/sound1.mp3', currentTime: 0.15},
    shootHit: {title: './sfx/slingshotHit.mp3', currentTime: 1.5},
    shootMiss: {title: './sfx/slingshotMiss.mp3', currentTime: 1.5},
    death: {title: './sfx/gag-reflex-41207.mp3', currentTime: 0.0},
    join: {title: './sfx/sounddrum.mp3'},
    firstBlood: {title: './sfx/first-blood.mp3', volume: 0.2},
    win: {title: './sfx/audience-clapping-03-99963.mp3'},
    musicGame: [
        {title: './sfx/music1.mp3', currentTime: 20, volume: 0.5},
        {title: './sfx/music2.mp3', volume: 0.5},
        {title: './sfx/music3.mp3', volume: 0.5}
    ],
    musicLobby: [
        {title: './sfx/lobby.mp3', volume: 0.2}
    ],
    multiKill: [
        {title: './sfx/double-kill.mp3', volume: 0.3},
        {title: './sfx/triple-kill.mp3', volume: 0.4},
        {title: './sfx/multi-kill.mp3', volume: 0.5},
        {title: './sfx/mega-kill.ogg'},
        {title: './sfx/ultra-kill.mp3', volume: 0.5},
        {title: './sfx/monster-kill.mp3', volume: 0.5},
        {title: './sfx/ludicrous-kill.mp3', volume: 0.5},
        {title: './sfx/holy-shit.ogg'}
    ],
    totalKill: [
        {title: './sfx/killing-spree.mp3', volume: 0.5},
        {title: './sfx/rampage.mp3', volume: 0.5},
        {title: './sfx/dominating.mp3', volume: 0.5},
        {title: './sfx/unstoppable.ogg'},
        {title: './sfx/god-like.mp3', volume: 0.5},
        {title: './sfx/wicked-sick.ogg'}
    ],

    eat: [
        {title: './sfx/eatingsfxwav-14588.mp3'},
        {title: './sfx/carrotnom-92106.mp3'},
        {title: './sfx/eat-a-cracker-95783.mp3', volume: 0.5},
        {title: './sfx/game-eat-sound-83240.mp3'},
        {title: './sfx/game-eat-sound-83240.mp3'}
    ]
}

var soundFartPool = loadAudioPool(audio.fart, 10);
var soundBeanFartPool = loadAudioPool(audio.beanFart, 10);
var soundShootHitPool = loadAudioPool(audio.shootHit, 10);
var soundShootMissPool = loadAudioPool(audio.shootMiss, 10);
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

const gameVoteButtonDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.5,
    innerRadius: level.width*0.1,
    outerRadius: level.width*0.15,
    defaultLoadingSpeed: 1/3000,
    getExecute: button => () => button.playersNear.forEach(figure => figure.player.vote = button.gameId)
})

const lobbyStartButtonDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.5,
    innerRadius: level.width*0.1,
    outerRadius: level.width*0.15,
    defaultLoadingSpeed: 1/3000,
    execute: () => {
        game = voteGame()
        initStage(stages.gameLobby)
    }
})

const gameStartButtonDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.5,
    innerRadius: level.width*0.1,
    defaultLoadingSpeed: 1/3000,
    execute: () => {
        initStage(stages.game)
    }
})

const rectangleButtonsDefinition = () => ({
    mute: {
        x: level.width*(1.0 - 0.05 -0.15),
        y: level.height*0.12,
        width: level.width*0.15,
        height: level.height*0.1,
        defaultLoadingSpeed: 1/2500,
        execute: toggleMusic
    },
    bots: {
        x: level.width*(1.0 - 0.05 -0.15),
        y: level.height*0.12 + level.height*0.1 + 20,
        width: level.width*0.15,
        height: level.height*0.1,
        defaultLoadingSpeed: 1/2000,
        execute: toggleBots
    }
})

const teams = {
    assassin: {
        color: colors.red,
        games: new Set([games.vip]),
        label: 'Assassins',
        walkRectLength: 300,
        maxSpeed: 0.08,
        playerTeam: true,
        sprite: 'boy',
        size: 0
    },
    guard: {
        color: colors.blue,
        games: new Set([games.vip]),
        label: 'Guards',
        walkRectLength: 300,
        maxSpeed: 0.06,
        playerTeam: true,
        sprite: 'girl',
        size: 0
    },
    killer: {
        color: colors.red,
        games: new Set([games.rampage, games.rampagev2]),
        label: 'Killers',
        playerTeam: true,
        size: 0
    },
    sniper: {
        color: colors.blue,
        games: new Set([games.rampage, games.rampagev2]),
        label: 'Snipers',
        playerTeam: true,
        sprite: 'sniper',
        size: 0
    },
    vip: {
        color: colors.green,
        games: new Set([games.vip]),
        label: 'VIPs',
        walkRectLength: 150,
        maxSpeed: 0.04,
        playerTeam: false,
        sprite: 'vip',
        size: 0
    }
}

const shootingRangeDefinition = () => ({
    x: level.width*0.5,
    y: level.height*0.9,
    team: 'sniper'
})

const teamSwitchersDefinition = () => ({
    assassin: {
        x: level.width*0.4,
        y: level.height*0.75,
        team: 'assassin'
    },
    guard: {
        x: level.width*0.6,
        y: level.height*0.75,
        team: 'guard'
    },
    killer: {
        x: level.width*0.4,
        y: level.height*0.75,
        team: 'killer'
    },
    sniper: {
        x: level.width*0.6,
        y: level.height*0.75,
        team: 'sniper'
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
    radius: Math.hypot(level.width/2, level.height/2),
    startRadius: Math.hypot(level.width/2, level.height/2)
})

var circleOfDeath

const foodDefinition = () => ({
    oreo: {
        x: stage === stages.gameLobby ? level.width*1.4/5 : level.width*4/5,
        y: stage === stages.gameLobby ? level.height*3/5 : level.height*4/5,
    },
    broccoli: {
        x: stage === stages.gameLobby ? level.width*0.6/5 : level.width/5,
        y: stage === stages.gameLobby ? level.height*2/5 : level.height/5,
    },
    onion: {
        x: stage === stages.gameLobby ? level.width*0.6/5 : level.width/5,
        y: stage === stages.gameLobby ? level.height*3/5 : level.height*4/5,
    },
    salad: {
        x: stage === stages.gameLobby ? level.width*1.4/5 : level.width*4/5,
        y: stage === stages.gameLobby ? level.height*2/5 : level.height/5,
    },
    taco: {
        x: stage === stages.gameLobby ? level.width*1/5 : level.width/2,
        y: stage === stages.gameLobby ? level.height*2.5/5 : level.height/2,
    }
})

const app = new PIXI.Application();
window.__PIXI_DEVTOOLS__ = {
    app
  };
var levelContainer;
const figureShadowLayer = new PIXI.RenderLayer();
const figureLayer = new PIXI.RenderLayer({sortableChildren: true});
const cloudLayer = new PIXI.RenderLayer();
const fogLayer = new PIXI.RenderLayer();
const crosshairLayer = new PIXI.RenderLayer();
const scoreLayer = new PIXI.RenderLayer({sortableChildren: true});
const overlayLayer = new PIXI.RenderLayer();
const debugLayer = new PIXI.RenderLayer({sortableChildren: true});
app.textStyleDefault = {
    fontFamily: 'Knall',
    fontSize: 32
};

(async () =>
    {
        console.log('no need to hide');
    
        // Initialize the application.
        await app.init({antialias: true, backgroundAlpha: 0, resizeTo: window,resolution: window.devicePixelRatio || 1, autoDensity: true,});
    
        // Then adding the application's canvas to the DOM body.
        document.body.appendChild(app.canvas);

        const loadingText = createLoadingText(app);

        await Promise.all(loadPromises);
        const fontFamilyName = 'Rockboxcond12'
        PIXI.Assets.addBundle('main', {
            background_grass: './gfx/background_grass.jpg',
            crosshair: './gfx/crosshair.svg',
            fenceAtlas: './gfx/fence.json',
            figureAtlas: './gfx/figure.json',
            fontTTF: './gfx/'+fontFamilyName+'.ttf',
        });
        await PIXI.Assets.loadBundle('main')

        document.fonts.add(PIXI.Assets.get('fontTTF'))

        PIXI.BitmapFontManager.install({
            name: 'Knall', 
            style: {
                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?',
                fontFamily: fontFamilyName,
                fontSize: 32,
                fill: colors.white
            }
        })

        PIXI.BitmapFontManager.install({
            name: 'KnallStroke', 
            style: {
                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?',
                fontFamily: fontFamilyName,
                fontSize: 48,
                fill: colors.white,
                stroke: {
                    width: 1,
                }
            }
        })

        PIXI.BitmapFontManager.install({
            name: 'KnallTitle', 
            style: {
                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?',
                fontFamily: fontFamilyName,
                fontSize: 128,
                fill: colors.white,
                align: 'center',
                stroke: {
                    color: colors.black,
                    width: 12,
                }
            }
        })

        PIXI.BitmapFontManager.install({
            name: 'KnallWinning', 
            style: {
                chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?',
                fontFamily: fontFamilyName,
                fontSize: level.width*0.1,
                fill: {
                    alpha: 0.8,
                    color: colors.lightBrown,
                },
                stroke: {
                    color: colors.white,
                    width: 6,
                }
            }
        })

        initNetwork()
        destroyContainer(app, loadingText)
        levelContainer = createLevelContainer(app, level);
        app.stage.addChild(levelContainer, figureShadowLayer, figureLayer, cloudLayer, fogLayer, crosshairLayer, scoreLayer, overlayLayer, debugLayer)
        addGrass()
        addHeadline()
        addLobbyItems(app)
        addFoods(app)
        addLevelBoundary(app)
        addFiguresInitialPool(app)
        addFog(app)
        addWinningCeremony(app)
        addOverlay(app)
        addDebug(app)

        initStage(stages.startLobby)
        window.requestAnimationFrame(gameLoop);
    }
)();

function initStage(nextStage) {
    then = Date.now();
    startTime = dtProcessed;
    ceremonyOver = false
    gameOver = false
    isRestartButtonPressed = false
    restartStage = false
    stage = nextStage
    lastRoundEndThen = undefined
    lastFinalWinnerPlayerIds = undefined
    finalWinnerTeam = undefined
    fpsTime = then
    lastKillTime = undefined;
    multikillCounter = 0;
    lastTotalkillAudio = 0;
    totalkillCounter = 0;

    if (stage === stages.startLobby) {
        game = undefined
        roundCounter = 0
        players.forEach(player => {
            destroyContainer(app, player.score)
        })
        botPlayers = []
        gamepadPlayers = []
        touchPlayers = []
        keyboardPlayers = []
        players = []

        figuresPool.difference(figuresInitialPool).forEach(figure => {
            destroyContainer(app, figure)
        })

        figuresPool = new Set(figuresInitialPool)

        figures.filter(figure => figure.type === 'fighter').forEach(figure => {
            if (figure.team !== 'vip') {
                figure.currentSprite = 'baby'
                figure.defaultSprite = 'baby'
            }
            figure.inactive = false
            figure.playerId = null
            figure.player = null
        })
        Object.values(teams).forEach(team => team.points = 0)
    } else if (stage === stages.game) {
        roundCounter++
        if (roundCounter === 1) {
            players.forEach(player => initPlayerScore(player.score))
        }
    }

    figures.filter(figure => figure.type === 'cloud').forEach(cloud => destroyContainer(app, cloud))
    
    if (!isMusicMuted()) {
        if (stage === stages.startLobby) {
            stopMusicPlaylist();
        } else if (stage === stages.game) {
            playMusicPlaylist(musicGame, true);
        }
    }

    Object.values(buttons).forEach(button => button.loadingPercentage = 0);

    // Figuren in Pool laden

    let figuresPoolArray = Array.from(figuresPool)

    if (roundCounter === 1 && stage === stages.game && (game === games.rampage || game === games.rampagev2)) {
        const killerFigures = figuresPoolArray.filter(figure => figure.type === 'fighter' && figure.team === 'killer')
        const sniperFigures = figuresPoolArray.filter(figure => figure.type === 'fighter' && figure.team === 'sniper');
        const ammo = Math.ceil(baseAmmoFactor * killerFigures.length/sniperFigures.length + bonusAmmoFactor*Math.sqrt(maxPlayerFigures/killerFigures.length))
        addSniperFigures(app, sniperFigures, ammo)
    }

    figuresPoolArray = Array.from(figuresPool)

    figures = []

    // Figuren aus Pool laden
    if (game === games.vip) {
        figures = figures.concat(figuresPoolArray.filter(figure => figure.type === 'fighter'))
    } else {
        figures = figures.concat(figuresPoolArray.filter(figure => figure.type === 'fighter' && figure.team !== 'vip'))
    }
    if (game === games.rampage || game === games.rampagev2) {
        figures = figures.concat(figuresPoolArray.filter(figure => figure.type === 'crosshair'))
    }
    if (game === games.food) {
        figures = figures.concat(figuresPoolArray.filter(figure => figure.type === 'bean'))
    }

    // Figuren initialisieren
    if (stage === stages.gameLobby && game.initialTeam) {
        figures.filter(figure => figure.playerId).forEach(figure => {
            switchTeam(figure, game.initialTeam)
        })
    }
    if (game === games.vip) {
        if (stage === stages.gameLobby) {
            figures.filter(figure => figure.team === 'vip').forEach(figure => {
                initRandomPositionFigure(figure)
            })
        } else {
            initVIPGamePositions(figures)
        }
    } else if (game === games.rampage || game === games.rampagev2) {
        initRandomSpriteFigures(figures.filter(figure => figure.team !== 'sniper'), ['father', 'grandpa', 'guard', 'mother', 'samurai', 'zombie'])

        figures.filter(figure => figure.type === 'crosshair').forEach(figure => initCrosshair(figure))
        if (stage !== stages.gameLobby) {
            figures.filter(figure => figure.team !== 'sniper').forEach(figure => initRandomPositionFigure(figure))
            if (roundCounter === 1) {
                initSniperPositions(figures.filter(figure => figure.type === 'fighter' && figure.team === 'sniper'))
            }
        }
    } else if (stage !== stages.gameLobby) {
        figures.forEach(figure => initRandomPositionFigure(figure))
    }

    if (game === games.food) {
        figures.filter(figure => figure.type === 'bean').forEach(figure => {
            const {x, y} = foodDefinition()[figure.id]
            Object.assign(figure, {
                x,
                y,
                lastAttackTime: undefined
            })
        })
    }
}

function gameLoop() {
    now = Date.now();
    dt = now - then;

    if (windowHasFocus) {
        if (fpsTime < now - 1000) {
            fpsTime = now
            fps = Math.floor(1000/dt)
        }

        players = collectInputs()
        playersSortedByJoinTime = players.filter(player => player.joinedTime).sort((player1, player2) => player1.joinedTime - player2.joinedTime || player1.playerId - player2.playerId)

        const oldNumberJoinedKeyboardPlayers = keyboardPlayers.filter(k => k.joinedTime >= 0).length

        // remove figures without valid playerId
        figures.filter(f => f.playerId).forEach((f) => {
            if (!players.some(p => p.playerId === f.playerId)) {
                destroyContainer(app, f.player.score)
                f.playerId = null
                f.player = null
                if (f.type === 'crosshair') {
                    // will be deleted
                    f.isDead = true
                }
            }
        })

        dtToProcess += dt
        let counter = 0;
        while(dtToProcess > dtFix) {
            if (!restartStage) {
                handleInput(players, figures, dtProcessed) 
                handleNPCs(figures, dtProcessed, oldNumberJoinedKeyboardPlayers, dtFix)
                updateGame(figures, dtFix, dtProcessed)
            }
            dtToProcess-=dtFix
            dtProcessed+=dtFix
            counter++
        }

        if (!restartStage && stage === stages.game) {
            handleWinning()
        }

        if (restartStage && (!lastRoundEndThen || ceremonyOver)) {
            if (gameOver) {
                initStage(stages.startLobby)
            }
            initStage(stage)
        }

        if (isRestartButtonPressed) {
            initStage(stages.startLobby)
        }
    } else {
        FWNetwork.getInstance().getAllGamepads().filter(x => x && x.connected).map(x => {
            windowHasFocus = true
        })
    }
    then = now
    window.requestAnimationFrame(gameLoop);
}

const handleWinning = () => {
    const figuresPlayer = figures.filter(f => f.playerId && f.type === 'fighter')

    if (game === games.battleRoyale || game === games.food) {
        // players left, quit game
        if (figuresPlayer.length < 2) {
            lastFinalWinnerPlayerIds = new Set(figuresPlayer.map(f => f.playerId))
            gameOver = true
            winRoundFigures(figuresPlayer)
        }

        if (!gameOver) {
            // last survivor
            const survivors = figuresPlayer.filter(f => !f.isDead)
            if (survivors.length < 2) {
                winRoundFigures(survivors)
            }

            //countdown
            if (!restartStage && game.countdown && dtProcessed >= startTime+game.countdown*1000) {
                winRoundFigures([])
            }
        
            // max points hit
            const maxPoints = Math.max(...players.map(p => p.score?.points || 0))
            if (maxPoints >= pointsToWin) {
                const playersWithMaxPoints = players.filter(p => p.score?.points === maxPoints)
                lastFinalWinnerPlayerIds = new Set(playersWithMaxPoints.map(p => p.playerId))
                gameOver = true
            }
        }
    } else if (game === games.vip) {
        // players left, quit game
        const assassins = figuresPlayer.filter(f => f.team === 'assassin')
        const guards = figuresPlayer.filter(f => f.team === 'guard')
        if (assassins.length === 0 || guards.length === 0) {
            finalWinnerTeam = guards.length === 0 ? 'assassin' : 'guard'
            lastFinalWinnerPlayerIds = new Set(figuresPlayer.filter(f => f.team === finalWinnerTeam).map(f => f.playerId))
            gameOver = true
            winRoundTeam(finalWinnerTeam)
        }

        if (!gameOver) {
            // team dead
            const vips = figures.filter(f => f.team === 'vip')
            const assassinSurvivors = assassins.filter(f => !f.isDead)
            const vipSurvivors = vips.filter(f => !f.isDead)
            if (assassinSurvivors.length === 0 || vipSurvivors.length === 0) {
                winRoundTeam(vipSurvivors.length === 0 ? 'assassin' : 'guard')
            }

            //countdown
            if (!restartStage && game.countdown && dtProcessed >= startTime+game.countdown*1000) {
                winRoundTeam('guard')
            }
        
            // max points hit
            const maxPoints = Math.max(...Object.values(teams).map(team => team.points))
            if (maxPoints >= pointsToWin) {
                const teamsWithMaxPoints = Object.keys(teams).filter(team => teams[team].points === maxPoints)
                finalWinnerTeam = teamsWithMaxPoints[0]
                lastFinalWinnerPlayerIds = new Set(figuresPlayer.filter(f => f.team === finalWinnerTeam).map(f => f.playerId))
                gameOver = true
            }
        }
    } else if (game === games.rampage) {
        // players left, quit game
        const killers = figuresPlayer.filter(f => f.team === 'killer')
        const snipers = figuresPlayer.filter(f => f.team === 'sniper')
        if (killers.length === 0 || snipers.length === 0) {
            finishRound()
            gameOver = true
        }

        if (!gameOver) {
            // team dead
            const noTeamSurvivors = figures.filter(f => !f.team).filter(f => !f.isDead)
            const killerSurvivors = killers.filter(f => !f.isDead)
            if (killerSurvivors.length === 0 || noTeamSurvivors.length === 0) {
                finishRound()
            }

            // ammo out
            const crosshairs = figures.filter(f => f.type === 'crosshair')
            const sumAmmo = crosshairs.reduce((sum, f) => sum + f.ammo, 0)
            if (!restartStage && sumAmmo === 0) {
                killers.forEach(f => {
                    f.player.score.points += noTeamSurvivors.length
                })
                finishRound()
            }

            //countdown
            if (!restartStage && game.countdown && dtProcessed >= startTime+game.countdown*1000) {
                finishRound()
            }

            // max rounds hit
            if (restartStage && roundCounter >= roundsToWin) {
                gameOver = true
            }
        }
    } else if (game === games.rampagev2) {
        // players left, quit game
        const killers = figuresPlayer.filter(f => f.team === 'killer')
        const snipers = figuresPlayer.filter(f => f.team === 'sniper')
        if (killers.length === 0 || snipers.length === 0) {
            finalWinnerTeam = snipers.length === 0 ? 'killer' : 'sniper'
            lastFinalWinnerPlayerIds = new Set(figuresPlayer.filter(f => f.team === finalWinnerTeam).map(f => f.playerId))
            gameOver = true
            winRoundTeam(finalWinnerTeam)
        }

        if (!gameOver) {
            // team dead
            const noTeamSurvivors = figures.filter(f => !f.team).filter(f => !f.isDead)
            const killerSurvivors = killers.filter(f => !f.isDead)
            if (killerSurvivors.length === 0 || noTeamSurvivors.length === 0) {
                winRoundTeam(noTeamSurvivors.length === 0 ? 'killer' : 'sniper')
            }

            // ammo out
            const crosshairs = figures.filter(f => f.type === 'crosshair')
            const sumAmmo = crosshairs.reduce((sum, f) => sum + f.ammo, 0)
            if (!restartStage && sumAmmo === 0) {
                winRoundTeam('killer')
            }

            //countdown
            if (!restartStage && game.countdown && dtProcessed >= startTime+game.countdown*1000) {
                winRoundTeam('sniper')
            }

            // max points hit
            const maxPoints = Math.max(...Object.values(teams).map(team => team.points))
            if (maxPoints >= pointsToWin) {
                const teamsWithMaxPoints = Object.keys(teams).filter(team => teams[team].points === maxPoints)
                finalWinnerTeam = teamsWithMaxPoints[0]
                lastFinalWinnerPlayerIds = new Set(figuresPlayer.filter(f => f.team === finalWinnerTeam).map(f => f.playerId))
                gameOver = true
            }
        }
    }
    
    if (gameOver) {
        playAudio(soundWin)
    }
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
            case games.vip:
                figuresRevived = figuresDead.filter(f => !f.playerId && f.team !== 'vip' || f.playerId && f.team === 'guard')
                break;
            default:
                break;
        }
    }

    figuresRevived.forEach(f => {if (dtProcessed-f.killTime > deadDuration) {
        f.isDead = false
        f.isDeathDetected = false
        f.killTime = 0
    }})

    if (stage === stages.startLobby || stage === stages.gameLobby) {
        const minimumPlayers = figures.filter(f => f.playerId?.[0] === 'b' && f.type === 'fighter').length > 0 ? 1 : 2
        const playersPossible = figures.filter(f => f.playerId && f.playerId[0] !== 'b' && f.type === 'fighter')
        const allPlayers = figures.filter(f => f.playerId && f.type === 'fighter')
        allPlayersSameTeam = Object.values(teams).filter(team => team.playerTeam && team.games.has(game)).some(team => team.size == allPlayers.length)

        Object.values(buttons).forEach(btn => {
            if (!btn.visible) return
            btn.loadingSpeed = btn.defaultLoadingSpeed
            btn.playersPossible = playersPossible
            btn.playersNear = playersPossible.filter(f => !f.isDead && btn.isInArea(f))
            
            let aimLoadingPercentage
            if (btn === buttons.startGame || btn === buttons.selectGame) {
                if (allPlayersSameTeam) {
                    btn.loadingSpeed = 0
                }
                aimLoadingPercentage = btn.playersNear.length / Math.max(playersPossible.length, minimumPlayers);
            } else {
                aimLoadingPercentage = btn.playersNear.length > 0 ? 1 : 0;
            }
            
            if (btn.execute) {
                loadButton(btn, aimLoadingPercentage)
            }
        })
    }

    figures.filter(f => f.speed > 0 || f.recoilForce).forEach(f => {
        let xyNew = {x: f.x, y: f.y}

        // player movement
        if (f.speed > 0) {
            xyNew = move(xyNew.x, xyNew.y, f.direction,f.speed, dt)
        }
        
        // recoil movement
        if (f.recoilForce && dtProcessed-f.lastAttackTime <= f.recoilDuration) {
            if (!f.recoilAngle) {
                f.recoilAngle = Math.random()*2*Math.PI
            }
            xyNew = move(xyNew.x, xyNew.y, f.recoilAngle, f.recoilForce/(f.recoilOffset+dtProcessed-f.lastAttackTime), dt)
        } else if (f.recoilForce && dtProcessed-f.lastAttackTime > f.recoilDuration) {
            f.recoilAngle = undefined
        }
        
        if (xyNew) {
            [f.x, f.y] = cropXY(xyNew.x, xyNew.y, level)
        }
    })
    
    // eat beans
    if (stage !== stages.startLobby && game === games.food) {
        let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter');
        figures.filter(b => b.type === 'bean').forEach(b => {
            playerFigures.forEach(fig => {
                if (distance(b.x,b.y,fig.x,fig.y) < b.attackDistance) {
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
    if (stage === stages.game && game === games.battleRoyale) {
        const scale =  1 - (dtProcessed - startTime)/(game.countdown*1000)
        circleOfDeath.radius = scale*circleOfDeath.startRadius
        figuresAlive.filter(f => f.type === 'fighter' ).forEach(f => {
            if (distance(f.x, f.y, level.width/2, level.height/2) > circleOfDeath.radius) {
                killFigure(f)
            }
        })
    }

    // shooting range crosshair detaching
    if (stage === stages.gameLobby && (game === games.rampage || game === games.rampagev2)) {
        let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')
        figuresAlive.filter(f => f.type === 'crosshair' ).forEach(f => {
            const playerFigure = playerFigures.find(figure => figure.playerId === f.playerId)
            const dist = distance(f.x, f.y, playerFigure.x, playerFigure.y)
            if (f.detached && dist <= f.attachRadius) {
                playerFigure.inactive = false
                f.isDead = true
            } else if (!f.detached && dist > f.attachRadius) {
                f.detached = true
            }
        })
    }

    // attack/detect figures
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
    } else if (game === games.rampage || game === games.rampagev2) {
        const killers = figures.filter(f => f.team === 'killer')
        const snipers = figures.filter(f => f.team === 'sniper')
        const noTeam = figures.filter(f => !f.team)
        const killersAlive = figuresAlive.filter(f => f.team === 'killer')
        const snipersAlive = figuresAlive.filter(f => f.team === 'sniper')
        const noTeamAlive = figuresAlive.filter(f => !f.team)

        snipersAlive.filter(f => f.isAttacking).forEach(f => {
            [...killersAlive, ...noTeamAlive].forEach(fig => {
                attackFigure(f, fig)
            })
        })

        killersAlive.filter(f => f.isAttacking).forEach(f => {
            [...noTeamAlive].forEach(fig => {
                attackFigure(f, fig)
            })
        })

        if (stage === stages.game) {
            ([...killers, ...noTeam]).forEach(fig => {
                fig.isDetected = false
                snipers.forEach(f => {
                    detectFigure(f, fig)
                })
            })
        }
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
    
    figures.filter(f => f.type === 'fighter').forEach(f => {
        if (f.attacked) {
            if (f.beansFarted.size === 0) {
                playAudioPool(soundFartPool)
            } else {
                playAudioPool(soundBeanFartPool)
            }
        }
        if (f.died) {
            playAudioPool(soundDeathPool)
        }
    })
    figures.filter(f => f.type === 'crosshair').forEach(f => {
        if (f.attacked) {
            if (f.hasHit) {
                playAudioPool(soundShootHitPool)
            } else {
                console.log('play audio miss')
                playAudioPool(soundShootMissPool)
            }
        }
    })

    playKillingSounds(numberKilledFigures, killTime);
}

function handleInput(players, figures, dtProcessed) {
    figures.filter(f => f.type === 'crosshair' || f.type === 'fighter').forEach(f => {
        f.beansFarted?.clear()
        f.died = false
        f.attacked = false
        f.hasHit = false
    })

    if (stage !== stages.game) {
        var joinedFighters = figures.filter(f => f.playerId && f.type === 'fighter')
        // join by doing anything
        players.filter(p => p.isAnyButtonPressed || (p.isMoving && p.type !== 'gamepad')).forEach(p => {
            var figure = joinedFighters.find(f => f.playerId === p.playerId)
            if (!figure) {
                // player join first
                if (p.type === 'bot') {
                    if (joinedFighters.length === 0) {
                        return
                    }
                } else {
                    p.crosshairColor = getCrosshairColor()
                }
                var figure = figures.find(f => !f.playerId && f.type === 'fighter')
                p.joinedTime = dtProcessed
                figure.isDead = false
                figure.isDeathDetected = false
                figure.playerId = p.playerId
                figure.player = p
                switchTeam(figure, game?.initialTeam)
                addPlayerScore(figure)
                if (stage === stages.startLobby) {
                    figure.x = level.width*0.04+ Math.random() * level.width*0.3
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
    }

    figures.filter(f => f.playerId && (f.type === 'crosshair' || f.type === 'fighter')).forEach(f => {
        var p = f.player

        f.speed = 0.0
        if (!f.isDead && !f.inactive) {
            if (p.isMoving) {
                f.direction = angle(0,0,p.xAxis,p.yAxis)
                f.speed = f.maxSpeed * (f.player.isSpeedButtonPressed && isDebugMode ? 2.2 : 1)
            }
            if (p.isAttackButtonPressed && !f.isAttacking) {
                if (!f.lastAttackTime || dtProcessed-f.lastAttackTime > f.attackBreakDuration) {

                    if (f.type === 'crosshair') {
                        f.ammo--
                        f.lastAttackX = f.x
                        f.lastAttackY = f.y
                    } else {

                        let xyNew = move(f.x, f.y, f.direction+deg2rad(180),f.attackDistance*0.5, 1)

                        if (f.beans.size > 0) {
                            addFartCloud({x: xyNew.x, y: xyNew.y, playerId: f.playerId, size: f.beans.size})
                        }
                        f.beans.forEach(b => f.beansFarted.add(b))
                        f.beans.clear()
                    }
                    f.attacked = true
                    f.lastAttackTime = dtProcessed
                }
            }
            f.isAttacking = f.lastAttackTime && (dtProcessed-f.lastAttackTime <= f.attackDuration) ? true : false;
        } else if (f.inactive) {
            const crosshairFigure = figures.find(fig => fig.playerId === f.playerId && fig.type === 'crosshair')
            f.direction = angle(f.x,f.y,crosshairFigure.x,crosshairFigure.y)
        }
    })
}

function handleNPCs(figures, time, oldNumberJoinedKeyboardPlayers, dt) {
    const numberJoinedKeyboardPlayers = keyboardPlayers.filter(k => k.joinedTime >= 0).length;
    const startKeyboardMovement = oldNumberJoinedKeyboardPlayers === 0 && numberJoinedKeyboardPlayers > 0;
    const NPCFigures = figures.filter(f => !f.playerId && f.type === 'fighter');

    let stoppedNPCFigures
    if (stage === stages.game && (game === games.rampage || game === games.rampagev2)) {
        stoppedNPCFigures = NPCFigures.filter(f => f.isDeathDetected || f.inactive)
    } else {
        stoppedNPCFigures = NPCFigures.filter(f => f.isDead || f.inactive)
    }

    stoppedNPCFigures.forEach(f => f.speed = 0)

    let movingNPCFigures
    if (stage === stages.game && (game === games.rampage || game === games.rampagev2)) {
        movingNPCFigures = NPCFigures.filter(f => !f.isDeathDetected && !f.inactive)
    } else {
        movingNPCFigures = NPCFigures.filter(f => !f.isDead && !f.inactive)
    }

    let shuffledIndexes;
    if (startKeyboardMovement) {
        shuffledIndexes = shuffle([...Array(movingNPCFigures.length).keys()]);
    }
    movingNPCFigures.forEach((f,i,array) => {
        if (((startKeyboardMovement && shuffledIndexes[i] < array.length/2) || distance(f.x,f.y,f.xTarget,f.yTarget) < 5) && f.speed > 0) {
            const breakDuration = startKeyboardMovement ? 0 : Math.random() * f.maxBreakDuration;
            f.startWalkTime = Math.random() * breakDuration + time
            f.speed = 0
        }
        if (time >= f.startWalkTime) {
            if (f.speed === 0) {
                if (!startKeyboardMovement) {
                    [f.xTarget, f.yTarget] = getCloseRandomXY(f)
                }

                if (numberJoinedKeyboardPlayers > 0) {
                    discreteAngle = getNextDiscreteAngle(angle(f.x, f.y, f.xTarget, f.yTarget), 8);
                    const direction = {x: Math.cos(discreteAngle), y: Math.sin(discreteAngle)};
                    if (direction.x !== 0) {
                        const xBorder = direction.x > 0 ? level.width-level.padding[2] : level.padding[0];
                        let t = (xBorder - f.x)/direction.x;
                        let y = t*direction.y + f.y;
                        if (y >= level.padding[1] && y < level.height-level.padding[3]) {
                            t = (f.xTarget - f.x)/direction.x;
                            f.yTarget = t*direction.y + f.y;
                        }
                    }
                    if (direction.y !== 0) {
                        const yBorder = direction.y > 0 ? level.height-level.padding[3] : level.padding[1];
                        let t = (yBorder - f.y)/direction.y;
                        let x = t*direction.x + f.x;
                        if (x >= level.padding[0] && x < level.width-level.padding[2]) {
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
    var toDeleteIndex = figures.findIndex(f => (f.type === 'cloud' || f.type === 'crosshair') && f.isDead)
    figures.filter(f => (f.type === 'cloud' || f.type === 'crosshair') && f.isDead).forEach(f => destroyContainer(app, f))
    if (toDeleteIndex >= 0)
        figures.splice(toDeleteIndex,1)
}
