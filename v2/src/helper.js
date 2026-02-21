const colors = {
    black: 0x000000,
    blue: 0x0000FF,
    blueGem: 0x4B3BB0,
    cardinal: 0xCC2244,
    chocolate: 0xD06820,
    cyan: 0x00FFFF,
    darkBrown: 0x57412F,
    darkOrange: 0xFF8000,
    dodgerBlue: 0x0080FF,
    deepPink: 0xFF0080,
    electricIndigo: 0x8000FF,
    elfGreen: 0x1A8A5C,
    green: 0x008000,
    gold: 0xB29146,
    grey: 0x787878,
    lightBrown: 0x8B4513,
    lime: 0x00FF00,
    lochmara: 0x2266AA,
    magenta: 0xFF00FF,
    neonBlue: 0x3355FF,
    purple: 0x800080,
    red: 0xFF0000,
    white: 0xFFFFFF,
    yellow: 0xFFFF00
}
const crosshairColors = new Set([colors.blue, colors.black, colors.cyan, colors.darkOrange, colors.deepPink, colors.dodgerBlue, colors.electricIndigo, colors.magenta, colors.red, colors.yellow, colors.white])

let crosshairColorsInUse = new Set()

const getCrosshairColor = () => {
    const freeColors = Array.from(crosshairColors.difference(crosshairColorsInUse))
    const color = freeColors[getRandomInt(freeColors.length)]
    crosshairColorsInUse.add(color)
    return color
}

let musicPlaylistEndHandlers = [];

function setDeadzone(m, deadzone = 0.2) {
    if (m < deadzone)
        return 0

    let over = m - deadzone  // 0 -> 1 - deadzone
    let nover = over / (1 - deadzone)  // 0 -> 1
    return nover
}

const pad = (num, size) => {
    num = num.toString()
    while (num.length < size) num = "0" + num
    return num
}

const getCountdownText = (now, countdownToTime) => {
    const distance = countdownToTime - now
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((distance % (1000 * 60)) / 1000)

    return minutes + ":" + pad(seconds, 2)
}

const getQueryParam = (key) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(key);
}
const mod = (n, m) => ((n % m) + m) % m;
const getRandomInt = max => Math.floor(Math.random() * max);
const getRandomIndex = intArray => {
    const randomInt = getRandomInt(intArray.reduce((sum, entry) => sum + entry, 0))
    let sum = 0;
    for (let index = 0; index < intArray.length; index++) {
        sum += intArray[index]
        if (randomInt < sum) {
            return index
        }
    }
}

const initRandomPositionFigure = figure => {
    const [x, y] = getRandomXY(level)
    const [xTarget, yTarget] = getRandomXY(level)

    initFigure(figure, x, y, angle(x, y, xTarget, yTarget))
}

const initRandomOutsidePositionFigure = figure => {
    const [x, y] = getRandomOutsideLevelXY()

    initFigure(figure, x, y)
    figure.isAiming = true
}

const initStartPositionFigure = (figure, i) => {
    let { xStart: x, y, height } = raceTrackDefinition()
    y += (i + 1) / (maxPlayerFigures + 1) * height

    initFigure(figure, x, y, 0)
    figure.isInRace = true
}

const initCrosshair = figure => {
    Object.assign(figure, {
        ammo: figure.maxAmmo
    })
}

const initFigure = (figure, x, y, direction) => {
    Object.assign(figure, {
        x,
        y,
        direction,
        startWalkTime: Math.random() * npcInitialWalkDelay + dtProcessed,
        speed: 0,
        isDead: false,
        isDeathDetected: false,
        killTime: 0,
        isAttacking: false,
        lastAttackTime: undefined,
        beans: new Set(),
        beansFarted: new Set()
    })
    if (stage === stages.startLobby) {
        switchTeam(figure, undefined)
    }
}

const initPlayerScore = score => {
    score.points = 0
    score.oldPoints = 0
    score.shownPoints = 0
}

const shuffle = (arr) => arr
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value)

const distance = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
const squaredDistance = (x1, y1, x2, y2) => (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1);
const move = (x1, y1, angle, speed, dt) => ({ x: x1 + Math.cos(angle) * speed * dt, y: y1 + Math.sin(angle) * speed * dt });
// Function ]-∞;∞[ -> ]-∞;∞[
const deg2rad = deg => deg * (Math.PI / 180);
// Function ]-∞;∞[ -> [0;2π[
const deg2limitedrad = deg => deg2rad(mod(deg, 360));
// Function ]-∞;∞[ -> ]-∞;∞[
const rad2deg = rad => (rad * 180.0) / Math.PI;
// Function ]-∞;∞[ -> [0;360[
const rad2limiteddeg = rad => mod(rad2deg(rad), 360);

const distanceAngles = base => (a1, a2) => { let d = Math.abs(a1 - a2) % base; return Math.min(d, base - d) };
const distanceAnglesRad = distanceAngles(2 * Math.PI);
const distanceAnglesDeg = distanceAngles(360);

const getNextDiscreteAngle = (angle, numberDiscreteAngles) => deg2rad(Math.round(rad2deg(angle) * numberDiscreteAngles / 360) * 360 / numberDiscreteAngles);

const getAudio = (audio) => {
    const { title, ...props } = audio;
    const file = new Audio(title);
    return { file, ...props };
};

const playAudio = (audio) => {
    const { file, ...props } = audio;
    file.load()
    Object.entries(props).forEach(([key, value]) => {
        if (value) {
            file[key] = value;
        }
    });
    const globalVolume = getGlobalVolume();
    file.volume = (file.volume !== undefined ? file.volume : 1.0) * globalVolume;
    file.play().catch((err) => { console.log(err) });
}

const stopAudio = (audio) => {
    const { file } = audio;
    file.load();
}

const isAudioPlaying = audio => audio.file.currentTime > 0 && !audio.file.ended

const playAudioPool = (audioPool, volume) => {
    const freeAudioEntry = audioPool.find(entry => entry.audio.file.ended || !entry.played);
    if (freeAudioEntry) {
        freeAudioEntry.played = true;
        if (volume) {
            freeAudioEntry.audio.file.volume = volume;
        }
        playAudio(freeAudioEntry.audio);
    }
}

const loadAudioPool = (audio, length) => {
    const audioPool = [];
    for (let i = 0; i < length; i++) {
        audioPool.push({ audio: getAudio(audio) });
    }
    audioPool.forEach(poolEntry => loadPromises.push(new Promise((resolve) => {
        const handler = () => {
            poolEntry.audio.file.removeEventListener('canplaythrough', handler);
            resolve();
        };
        poolEntry.audio.file.addEventListener('canplaythrough', handler);
    })));
    return audioPool;
}

const getGlobalVolume = () => {
    const volume = window.localStorage.getItem('volume');
    return volume === null ? 1.0 : parseFloat(volume);
}

const setGlobalVolume = (volume) => {
    window.localStorage.setItem('volume', volume);
}

const isMusicMuted = () => {
    return getGlobalVolume() === 0;
}

const getPlayAudio = (audio) => () => playAudio(audio)

const playPlaylist = (playlist, isShuffled) => {
    if (playlist) {
        if (isShuffled) {
            playlist = shuffle(playlist)
        }
        playlist.forEach((track, index, list) => {
            const handler = getPlayAudio(playlist[(index + 1) % list.length]);
            track.file.addEventListener("ended", handler);
            musicPlaylistEndHandlers.push({ track, handler });
        });
        playAudio(playlist[0]);
    }
}

const stopPlaylist = (playlist) => {
    if (playlist) {
        // Entferne alle Event-Listener
        musicPlaylistEndHandlers.forEach(({ track, handler }) => {
            track.file.removeEventListener("ended", handler);
        });
        musicPlaylistEndHandlers = [];

        playlist.forEach(track => track.file.load());
    }
}

const stopMusicPlaylist = () => {
    stopPlaylist(actualMusicPlaylist)
    actualMusicPlaylist = undefined
}

const playMusicPlaylist = (musicPlaylist, shuffle) => {
    if (actualMusicPlaylist != musicPlaylist) {
        stopMusicPlaylist()
        playPlaylist(musicPlaylist, shuffle)
        actualMusicPlaylist = musicPlaylist
    }
}

const playKillingSounds = (numberKilledFigures, killTime) => {
    if (numberKilledFigures > 0) {
        if (!lastKillTime || lastKillTime + multikillTimeWindow < dtProcessed) {
            multikillCounter = 0;
            if (!lastKillTime) {
                playAudio(soundFirstBlood);
            }
        }
        lastKillTime = killTime;
        multikillCounter += numberKilledFigures;
        totalkillCounter += numberKilledFigures;

        if (multikillCounter > 1) {
            playAudio(soundMultiKill[Math.min(multikillCounter - 2, soundMultiKill.length - 1)]);
        }
        if (totalkillCounter >= 5 * (lastTotalkillAudio + 1)) {
            playAudio(soundTotalKill[Math.min(lastTotalkillAudio, soundTotalKill.length - 1)]);
            lastTotalkillAudio++;
        }
    }
}

const getRoundCount = () => {
    const rounds = parseInt(window.localStorage.getItem('rounds'))
    return isNaN(rounds) ? 3 : rounds
}

const setRoundCount = (rounds) => {
    window.localStorage.setItem('rounds', rounds)
}

const toggleRounds = () => {
    let count = getRoundCount()
    count++
    if (count > 10) {
        count = 1
    }
    setRoundCount(count)
    return count
}

const cycleVolume = () => {
    let volume = getGlobalVolume();
    if (volume >= 1.0) volume = 0.5;
    else if (volume >= 0.5) volume = 0.0;
    else volume = 1.0;

    setGlobalVolume(volume);

    if (volume > 0 && !actualMusicPlaylist && stage === stages.startLobby) {
        playMusicPlaylist(musicLobby);
    } else if (volume === 0 && actualMusicPlaylist) {
        stopMusicPlaylist();
    } else if (actualMusicPlaylist) {
        actualMusicPlaylist.forEach(track => {
            const baseVolume = track.volume || 1.0;
            track.file.volume = baseVolume * volume;
        })
    }
}

const voteGame = () => {
    const gamesValues = Object.values(games)
    gamesValues.forEach(game => game.votes = 0)
    Object.values(players).forEach(player => player.vote && games[player.vote].votes++)
    return gamesValues[getRandomIndex(gamesValues.map(game => game.votes))]
}

const loadButton = (btn, aimLoadingPercentage) => {
    if (btn.loadingSpeed !== undefined) {
        if (btn.loadingPercentage < aimLoadingPercentage) {
            btn.loadingPercentage += btn.loadingSpeed * dt;
            btn.loadingPercentage = Math.min(btn.loadingPercentage, aimLoadingPercentage);
        } else if (btn.loadingPercentage > aimLoadingPercentage) {
            btn.loadingPercentage -= btn.loadingSpeed * dt;
            btn.loadingPercentage = Math.max(btn.loadingPercentage, aimLoadingPercentage);
        }
    } else {
        btn.loadingPercentage = aimLoadingPercentage
    }

    if (btn.loadingPercentage === undefined || btn.loadingPercentage >= 1) {
        if (btn.execute) {
            btn.loadingPercentage = 0
            btn.execute(btn)
        }
    }
}

const addAnimation = (container, callback) => {
    container.tickerCallback = callback
    app.ticker.add(callback)
}

const destroyContainer = (app, container) => {
    if (container) {
        app.ticker.remove(container.tickerCallback)

        const children = [...container.children]
        children.forEach(child => destroyContainer(app, child))

        container.destroy()
    }
}

const createGameContainer = (app, level, levelContainer) => {
    const gameContainer = new PIXI.Container()
    addGrass(gameContainer)

    levelContainer = createLevelContainer(level)
    gameContainer.addChild(levelContainer)

    app.ticker.add(() => {
        const scale = Math.min(app.screen.width / level.width, app.screen.height / level.height)
        gameContainer.scale.x = scale
        gameContainer.scale.y = scale
        gameContainer.x = (app.screen.width - scale * level.width) / 2
        gameContainer.y = (app.screen.height - scale * level.height) / 2
    })

    return gameContainer
}

const createLevelContainer = level => {
    const levelContainer = new PIXI.Container()

    levelContainer.scale.x = level.scale
    levelContainer.scale.y = level.scale
    levelContainer.x = (0.5 * (1 - level.scale) * level.width)
    levelContainer.y = (0.5 * (1 - level.scale) * level.height)
    levelContainer.label = 'level'

    return levelContainer
}

function createLevel() {
    const level = { width: 1920, height: 1080, padding: [30, 40, 30, 10], scale: 0.9 }
    level.rectangle = new PIXI.Rectangle(level.padding[0], level.padding[1], level.width - level.padding[0] - level.padding[2], level.height - level.padding[1] - level.padding[3])
    level.shortestPathNotBean5 = 2 * 0.6 * level.height + 2 * 0.3 * Math.hypot(level.height, level.width);
    level.shortestPathBean5 = 2 * 0.6 * level.height + 0.6 * level.width + 0.3 * Math.hypot(level.height, level.width);

    return level
}

function getRandomXY() {
    return [level.rectangle.x + Math.random() * level.rectangle.width, level.rectangle.y + Math.random() * level.rectangle.height]
}

function getRandomXYInRectangle(x, y, w, h) {
    const rectangle = new PIXI.Rectangle(x, y, w, h).fit(level.rectangle)
    return [rectangle.x + Math.random() * rectangle.width, rectangle.y + Math.random() * rectangle.height]
}

function getCloseRandomXY(figure) {
    if (figure.isInRace) {
        return [figure.x + Math.random() * getWalkRectLength(game, figure), figure.y]
    } else if (game?.walkRectLength) {
        const walkRectLength = getWalkRectLength(game, figure)
        return getRandomXYInRectangle(figure.x - walkRectLength, figure.y - walkRectLength, 2 * walkRectLength, 2 * walkRectLength)
    }
    return getRandomXY()
}

const getWalkRectLength = (game, figure) => game?.walkRectLength ? game.walkRectLength * figure.maxSpeed / defaultMaxSpeed : level.rectangle.width

const getIntervalPoint = (t, start, end) => start + t * (end - start)

const getLinePoint = (t, start, end) => ({ x: getIntervalPoint(t, start.x, end.x), y: getIntervalPoint(t, start.y, end.y) })

const getRandomOutsideLevelXY = () => {
    let t = Math.random() * (level.width + level.height)
    let x, y
    const inverseLevelScaleFactor = 1 / 0.9
    const margin = (inverseLevelScaleFactor - 1) / 4
    const start = -margin, end = 1 + margin
    if (t < level.width) {
        t *= 2 / level.width
        if (t < 1) {
            y = start
        } else {
            y = end
        }
        x = getIntervalPoint(t % 1, start, end)
    } else {
        t -= level.width
        t *= 2 / level.height
        if (t < 1) {
            x = start
        } else {
            x = end
        }
        y = getIntervalPoint(t % 1, start, end)
    }
    x *= level.width
    y *= level.height
    return [x, y]
}

const distanceToBorder = (x, y, angleX, angleY) => {
    const xBorder = angleX > 0 ? level.width - level.padding[2] : level.padding[0]
    const yBorder = angleY > 0 ? level.height - level.padding[3] : level.padding[1]
    const tX = (xBorder - x) / angleX
    const tY = (yBorder - y) / angleY

    return Math.min(!isNaN(tX) ? tX : Infinity, !isNaN(tY) ? tY : Infinity)
}

function cropXY(x, y, level) {
    if (x > level.width - level.padding[2]) x = level.width - level.padding[2]
    if (y > level.height - level.padding[3]) y = level.height - level.padding[3]
    if (x < level.padding[0]) x = level.padding[0]
    if (y < level.padding[1]) y = level.padding[1]
    return [x, y]
}

const getCloudMultiplier = size => {
    switch (size) {
        case 5:
            return 3 * size
        case 1:
            return 2 * size
        default:
            return 1.5 * size
    }
}

const figureIsBot = figure => figure.playerId?.includes('b')

const initSniperPositions = figures => {
    figures.forEach(figure => initRandomOutsidePositionFigure(figure))
}

const resetFiguresToBabys = figures => {
    figures.forEach(figure => {
        figure.currentSprite = 'baby'
    })
}
const initRandomSpriteFigures = figures => {
    const shuffledFigures = shuffle(figures)
    const shuffledSprites = shuffle(game.sprites)

    shuffledFigures.forEach((f, i) => {
        const sprite = shuffledSprites[i % shuffledSprites.length]
        f.currentSprite = sprite
        f.defaultSprite = sprite
    })
}

const initVIPGamePositions = figures => {

    const neutralPlayerFigures = shuffle(figures.filter(figure => figure.playerId && !figure.team))
    if (neutralPlayerFigures.length > 0) {
        // distribute neutral players evenly
        const numberPlayerAssassins = figures.filter(figure => figure.playerId && figure.team === 'assassin').length
        const numberPlayerGuards = figures.filter(figure => figure.playerId && figure.team === 'guard').length
        const smallerTeam = numberPlayerAssassins > numberPlayerGuards ? 'guard' : 'assassin'
        const shuffledTeams = shuffle(['assassin', 'guard'])

        neutralPlayerFigures.forEach((f, i) => switchTeam(f, i < Math.abs(numberPlayerAssassins - numberPlayerGuards) ? smallerTeam : shuffledTeams[i % 2]))
    }

    // put NPC neutrals in teams
    const numberMissingGuards = numberGuards - figures.filter(figure => figure.team === 'guard').length
    const neutralFigures = shuffle(figures.filter(figure => !figure.team))
    neutralFigures.forEach((f, i) => switchTeam(f, i < numberMissingGuards ? 'guard' : 'assassin'))

    // assassin positions
    const assassins = shuffle(figures.filter(figure => figure.team === 'assassin'))
    const assassinPositions = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            assassinPositions.push({ x: ((2 * j + 1) / 10) * level.width, y: (2 + (2 * i + 1) / 6) / 3 * level.height })
        }
    }
    assassins.forEach((f, i) => {
        initFigure(f, assassinPositions[i].x, assassinPositions[i].y, deg2rad(-90))
    })

    // guard positions, minimum guards in center columns
    const guards = figures.filter(figure => figure.team === 'guard')

    const minCenterPlayerGuards = 2
    let centerGuards = guards.filter(figure => figure.playerId).slice(0, minCenterPlayerGuards)
    const numberMinCenterPlayers = centerGuards.length
    let otherGuards = guards.filter(figure => !new Set(centerGuards).has(figure))
    centerGuards = shuffle(centerGuards.concat(otherGuards.slice(0, 9 - numberMinCenterPlayers)))
    otherGuards = otherGuards.slice(9 - numberMinCenterPlayers)

    const guardCenterPositions = [], guardOuterPositions = []
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            if (i > 0 || j === 0 || j === 4) {
                const position = { x: ((2 * j + 1) / 10) * level.width, y: ((2 * i + 1) / 8) / 2 * level.height }
                if (j === 0 || j === 4) {
                    guardOuterPositions.push(position)
                } else {
                    guardCenterPositions.push(position)
                }
            }
        }
    }
    centerGuards.forEach((f, i) => {
        initFigure(f, guardCenterPositions[i].x, guardCenterPositions[i].y, deg2rad(90))
    })
    otherGuards.forEach((f, i) => {
        initFigure(f, guardOuterPositions[i].x, guardOuterPositions[i].y, deg2rad(90))
    })

    // vip positions
    const vips = figures.filter(figure => figure.team === 'vip')
    const vipPositions = []
    for (let i = 0; i < 3; i++) {
        vipPositions.push({ x: (5 + (i - 1) / 3) / 10 * level.width, y: (1 / 8) / 2 * level.height })
    }
    vips.forEach((f, i) => {
        initFigure(f, vipPositions[i].x, vipPositions[i].y, deg2rad(90))
        f.currentSprite = teams.vip.sprites[i]
    })
}

const detectFigure = (figureDetector, figureDetected) => {
    const detectRadius = figureDetector.detectRadius
    if (detectRadius && squaredDistance(figureDetector.x, figureDetector.y, figureDetected.x, figureDetected.y) < detectRadius * detectRadius) {
        figureDetected.isDetected = true
        if (figureDetected.isDead === true) {
            figureDetected.isDeathDetected = true
        }
    }
}

function reduceBounds(bounds, { left = 0, right = 0, top = 0, bottom = 0 }) {
    const w = bounds.width;
    const h = bounds.height;

    return new PIXI.Rectangle(
        bounds.x + w * left,
        bounds.y + h * top,
        w * (1 - left - right),
        h * (1 - top - bottom)
    );
}

const attackFigure = (figureAttacker, figureAttacked) => {
    const attackDistance = figureAttacker.attackDistanceMultiplier ? figureAttacker.attackDistanceMultiplier * figureAttacker.attackDistance : figureAttacker.attackDistance
    if (attackDistance && squaredDistance(figureAttacker.x, figureAttacker.y, figureAttacked.x, figureAttacked.y) < attackDistance * attackDistance) {
        if (2 * distanceAnglesDeg(rad2deg(figureAttacker.direction), rad2deg(angle(figureAttacker.x, figureAttacker.y, figureAttacked.x, figureAttacked.y)) + 180) <= figureAttacker.attackAngle) {
            killFigure(figureAttacked)
            figureAttacker.hasHit = true
            return true
        }
    }
    else if (reduceBounds(figureAttacked.getBounds(), { left: 0.15, right: 0.45, top: 0.15, bottom: 0.15 }).contains(figureAttacker.worldTransform.tx, figureAttacker.worldTransform.ty)) {
        killFigure(figureAttacked)
        figureAttacker.hasHit = true
        return true
    }
    return false
}

const killFigure = (figure) => {
    if (!figure.isDead) {
        figure.isDead = true
        figure.died = true
        figure.killTime = dtProcessed
        if (game === games.rampage && figure.team !== 'killer') {
            figures.filter(f => f.team === 'killer' && f.type === 'fighter').forEach(f => {
                f.player.score.points++
                f.player.score.shownPoints = f.player.score.points
            })
        }
    }
}

const finishRound = () => {
    lastRoundEndThen = dtProcessed
    restartStage = true
}

const winRoundTeam = team => {
    teams[team].points++
    winRoundFigures(figures.filter(f => f.playerId && f.team === team && f.type === 'fighter'))
}

const winRoundFigures = winnerFigures => {
    winnerFigures.forEach(f => {
        f.player.score.oldPoints = f.player.score.points
        f.player.score.points++
    })
    lastWinnerPlayerIds = new Set(winnerFigures.map(f => f.playerId))
    finishRound()
}

const getPlayersWithMaxScore = () => {
    const maxPoints = Math.max(...players.map(p => p.score?.points || 0))
    return players.filter(p => p.score?.points === maxPoints)
}

const getTeamsWithMaxScore = () => {
    const maxPoints = Math.max(...Object.values(teams).map(team => team.points))
    return Object.keys(teams).filter(team => teams[team].points === maxPoints)
}

const switchTeam = (figure, team) => {
    if (figure.team) {
        teams[figure.team].size--
    }
    figure.team = team
    figure.currentSprite = teams[team]?.sprites?.[teams[team]?.size % teams[team]?.sprites.length] || figure.defaultSprite
    figure.maxSpeed = teams[team]?.maxSpeed || defaultMaxSpeed
    if (figure.team) {
        teams[figure.team].size++
    }
}

const initNetwork = () => {
    const nw = FWNetwork.getInstance()
    nw.qrCodeOptions.background = 'green'
    nw.qrCodeOptions.backgroundAlpha = 1.0
    nw.qrCodeOptions.foreground = 'white'
    nw.qrCodeOptions.foregroundAlpha = 1.0
    nw.gamepadLayout = 'simple'
    nw.hostRoom()
}


const spinningWheel = {
    acceleration: -0.25,
    constantSpeedThreshold: 0.5,
    startSpeed: 2.5,
    finishDuration: 6000,
    pulseDuration: 2500,
    boomerangDuration: 2000,
    readDuration: 1000
}

const initSpinningWheel = () => {
    if (spinningWheel.finishTime) {
        return
    }
    if (!spinningWheel.position) {
        spinningWheel.position = 0
    }
    spinningWheel.startTime = dtProcessed
    const playerFigureCount = figures.filter(figure => figure.playerId && !figureIsBot(figure)).length
    spinningWheel.segmentLength = 1 / playerFigureCount
    spinningWheel.speed = spinningWheel.startSpeed

    const gamesEntries = Object.entries(games)
    gamesEntries.forEach(([_, game]) => game.votes = 0)
    Object.values(players).forEach(player => player.vote && games[player.vote].votes++)

    spinningWheel.segments = gamesEntries.map(([key, game], index) => ({
        game: key,
        position: index,
        votes: game.votes
    }))
    activeSegments = spinningWheel.segments.filter(segment => segment.votes > 0)

    if (activeSegments.length === 1) {
        spinningWheel.mode = 'single'
        spinningWheel.segment = activeSegments[0]
    } else {
        spinningWheel.mode = 'multi'
        spinningWheel.segment = spinningWheel.segment || activeSegments[0]
    }
    spinningWheel.winner = activeSegments[getRandomIndex(activeSegments.map(segment => segment.votes))]
    spinningWheel.activeSegments = spinningWheel.segments.filter(segment => segment.votes > 0)
}

const stopSpinningWheel = () => {
    if (spinningWheel.finishTime) {
        return
    }
    spinningWheel.mode = null
    spinningWheel.speed = 0
    spinningWheel.segment = undefined
}

const processSpinningWheel = dtProcessed => {
    if (!spinningWheel.mode) {
        return
    }

    if (!isAudioPlaying(soundBoomerang) && spinningWheel.finishTime && dtProcessed > spinningWheel.pulseDuration + spinningWheel.finishTime && dtProcessed <= spinningWheel.finishDuration - spinningWheel.readDuration + spinningWheel.finishTime) {
        playAudio(soundBoomerang)
    }
    if (isAudioPlaying(soundBoomerang) && dtProcessed > spinningWheel.finishDuration - spinningWheel.readDuration + spinningWheel.finishTime) {
        stopAudio(soundBoomerang)
    }
    if (dtProcessed - spinningWheel.finishTime > spinningWheel.finishDuration) {
        stopSpinningWheel()
        game = games[spinningWheel.winner.game]
        initStage(stages.gameLobby)
        return
    }

    if (!spinningWheel.finishTime) {
        stepSpinningWheel(dtProcessed)
    }
}

const stepSpinningWheel = dtProcessed => {
    if (spinningWheel.speed > spinningWheel.constantSpeedThreshold) {
        spinningWheel.speed += 0.001 * spinningWheel.acceleration * dt
    } else {
        spinningWheel.speed = spinningWheel.constantSpeedThreshold
    }

    let distance = spinningWheel.segmentLength
    let segment = spinningWheel.segment
    if (segment !== undefined) {
        distance *= segment.votes
    }
    if (0.001 * spinningWheel.speed * (dtProcessed - spinningWheel.startTime) > distance) {
        playAudio(soundSpinningWheel)
        if (spinningWheel.mode === 'single' && segment !== undefined) {
            segment = undefined
        } else {
            segment = segment || spinningWheel.winner
            for (let index = 0; index < spinningWheel.segments.length; index++) {
                if (segment === spinningWheel.winner && spinningWheel.speed === spinningWheel.constantSpeedThreshold) {
                    spinningWheel.finishTime = dtProcessed
                }
                segment = spinningWheel.segments[(segment.position + 1) % spinningWheel.segments.length]
                if (segment.votes > 0) {
                    break
                }
            }
        }
        spinningWheel.segment = segment
        spinningWheel.startTime = dtProcessed
    }
}

// Easing function for smooth acceleration/deceleration
const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

const quadraticBezier = (t, p0, p1, p2) => ({
    x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
    y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
})
