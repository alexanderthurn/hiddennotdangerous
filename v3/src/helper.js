import { sound } from '@pixi/sound'

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
const playerColors = new Set([colors.blue, colors.black, colors.cyan, colors.darkOrange, colors.deepPink, colors.dodgerBlue, colors.electricIndigo, colors.magenta, colors.red, colors.yellow])

const getPlayerColor = () => {
    const playerColorsUsage = new Map();
    playerColors.forEach(color => playerColorsUsage.set(color, 0))
    players.forEach(p => {
        if (p.color) {
            playerColorsUsage.set(p.color, playerColorsUsage.get(p.color) + 1)
        }
    })

    const minUsage = Math.min(...playerColorsUsage.values())
    const leastUsedColors = [...playerColorsUsage.entries()].filter(([, count]) => count === minUsage).map(([color]) => color)
    return leastUsedColors[getRandomInt(leastUsedColors.length)]
}

let _soundCounter = 0
let _activePlaylistId = null
const _musicAliases = new Set()
const _sfxAliases = new Set()

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
    figure.y += 0.25 * figure.height
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
        isAiming: false,
        isInRace: false,
        lastAttackTime: undefined,
        beans: new Set(),
        beansFarted: new Set()
    })
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

const getAudio = (config, { preload = true, singleInstance = true } = {}) => {
    const alias = 'snd_' + (_soundCounter++)
    if (preload) {
        loadPromises.push(new Promise((resolve) => {
            sound.add(alias, {
                url: config.title,
                preload: true,
                singleInstance,
                loaded: () => resolve(),
            })
        }))
    } else {
        sound.add(alias, { url: config.title, singleInstance })
    }
    const aliasSet = config.music ? _musicAliases : _sfxAliases
    aliasSet.add(alias)
    const s = sound.find(alias)
    if (s) s.volume = config.music ? musicVolume : sfxVolume
    return { alias, end: config.end, start: config.start ?? 0, volume: config.volume ?? 1 }
}

const playAudio = (audio, props = {}) => {
    sound.play(audio.alias, { end: audio.end, start: audio.start, volume: audio.volume * (props.volume ?? 1) })
}

const stopAudio = (audio) => {
    sound.stop(audio.alias)
}

const isAudioPlaying = (audio) => {
    return sound.find(audio.alias)?.isPlaying ?? false
}

const loadAudioPool = (config) => getAudio(config, { singleInstance: false })

let musicVolume = parseFloat(window.localStorage.getItem('musicVolume'))
if (isNaN(musicVolume)) musicVolume = 1

let sfxVolume = parseFloat(window.localStorage.getItem('sfxVolume'))
if (isNaN(sfxVolume)) sfxVolume = 1

const updateAllSoundVolumes = () => {
    _musicAliases.forEach(alias => {
        const s = sound.find(alias)
        if (s) s.volume = musicVolume
    })
    _sfxAliases.forEach(alias => {
        const s = sound.find(alias)
        if (s) s.volume = sfxVolume
    })
}

const getMusicVolume = () => musicVolume
const setMusicVolume = (v) => {
    musicVolume = Math.max(0, Math.min(1, v))
    window.localStorage.setItem('musicVolume', musicVolume)
    updateAllSoundVolumes()
}

const getSfxVolume = () => sfxVolume
const setSfxVolume = (v) => {
    sfxVolume = Math.max(0, Math.min(1, v))
    window.localStorage.setItem('sfxVolume', sfxVolume)
    updateAllSoundVolumes()
}

const playPlaylist = (playlist, isShuffled) => {
    if (!playlist || playlist.length === 0) return
    const playlistId = Symbol()
    _activePlaylistId = playlistId
    const ordered = isShuffled ? shuffle([...playlist]) : playlist
    const playNext = async (index) => {
        if (_activePlaylistId !== playlistId) return
        const track = ordered[index]
        const soundPlaying = await sound.play(track.alias, {
            volume: track.volume,
            start: track.start,
        })
        soundPlaying.on('end', () => playNext((index + 1) % ordered.length))
    }
    playNext(0)
}

const stopPlaylist = (playlist) => {
    _activePlaylistId = null
    if (!playlist) return
    playlist.forEach(track => sound.stop(track.alias))
}

const stopMusicPlaylist = () => {
    stopPlaylist(actualMusicPlaylist)
    actualMusicPlaylist = undefined
}

const playMusicPlaylist = (musicPlaylist, isShuffled) => {
    if (actualMusicPlaylist !== musicPlaylist) {
        stopMusicPlaylist()
        playPlaylist(musicPlaylist, isShuffled)
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

const toggleRounds = (btn) => {
    const attackingFigures = btn.playersNear.filter(f => f.isAttacking)
    if (attackingFigures.length === 0) return
    const avgX = attackingFigures.reduce((sum, f) => sum + f.x, 0) / attackingFigures.length
    const relativeX = Math.max(0, Math.min(1, (avgX - btn.x) / btn.width))
    const count = Math.round(relativeX * 9) + 1 // 1-10
    setRoundCount(count)
}

const toggleMusicVolume = (btn) => {
    const attackingFigures = btn.playersNear.filter(f => f.isAttacking)
    if (attackingFigures.length === 0) return
    const avgX = attackingFigures.reduce((sum, f) => sum + f.x, 0) / attackingFigures.length
    const relativeX = Math.max(0, Math.min(1, (avgX - btn.x) / btn.width))
    setMusicVolume(relativeX)
}

const toggleSfxVolume = (btn) => {
    const attackingFigures = btn.playersNear.filter(f => f.isAttacking)
    if (attackingFigures.length === 0) return
    const avgX = attackingFigures.reduce((sum, f) => sum + f.x, 0) / attackingFigures.length
    const relativeX = Math.max(0, Math.min(1, (avgX - btn.x) / btn.width))
    setSfxVolume(relativeX)
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

const addFigure = figure => {
    figures.push(figure)
    figuresSet.add(figure)
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

function getRandomXYInCircle(cx, cy, radius) {
    const a = Math.random() * 2 * Math.PI
    const maxR = Math.min(radius, distanceToBorder(cx, cy, Math.cos(a), Math.sin(a)))
    const r = maxR * Math.sqrt(Math.random())
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

function getCloseRandomXY(figure) {
    if (figure.isInRace) {
        return [figure.x + Math.random() * getWalkRectLength(game, figure), figure.y]
    } else if (game?.walkRectLength) {
        const walkRectLength = getWalkRectLength(game, figure)
        return getRandomXYInRectangle(figure.x - walkRectLength, figure.y - walkRectLength, 2 * walkRectLength, 2 * walkRectLength)
    }
    if (stage === stages.game && game === games.battleRoyale && circleOfDeath) {
        // shrink by 0.8 so that figures don't run so much into the edges of the circle
        return getRandomXYInCircle(circleOfDeath.x, circleOfDeath.y, circleOfDeath.radius * 0.8)
    }
    return getRandomXY()
}

const getWalkRectLength = (game, figure) => game?.walkRectLength ? game.walkRectLength * figure.maxSpeed / defaultMaxSpeed : level.rectangle.width

// t: 0-1, start: start value, end: end value
const getIntervalPoint = (t, start, end) => start + t * (end - start)

// t: 0-1, start: start point, end: end point
const getLinePoint = (t, start, end) => ({ x: getIntervalPoint(t, start.x, end.x), y: getIntervalPoint(t, start.y, end.y) })

const getRandomOutsideLevelXY = () => {
    let t = Math.random() * (level.width + level.height)
    let x, y
    const inverseLevelScaleFactor = 1 / level.scale
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
const playerIsBot = player => player.type === 'bot'

const initSniperPositions = figures => {
    figures.forEach(figure => initRandomOutsidePositionFigure(figure))
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

    const neutralPlayerFigures = shuffle(figures.filter(figure => figure.playerId && !figure.faction))
    if (neutralPlayerFigures.length > 0) {
        // distribute neutral players evenly
        const numberPlayerAssassins = figures.filter(figure => figure.playerId && figure.faction === 'assassin').length
        const numberPlayerGuards = figures.filter(figure => figure.playerId && figure.faction === 'guard').length
        const smallerFaction = numberPlayerAssassins > numberPlayerGuards ? 'guard' : 'assassin'
        const shuffledFactions = shuffle(['assassin', 'guard'])

        neutralPlayerFigures.forEach((f, i) => switchFaction([f], i < Math.abs(numberPlayerAssassins - numberPlayerGuards) ? smallerFaction : shuffledFactions[i % 2]))
    }

    // put NPC neutrals in factions
    const numberMissingGuards = numberGuards - figures.filter(figure => figure.faction === 'guard').length
    const neutralFigures = shuffle(figures.filter(figure => !figure.faction))
    neutralFigures.forEach((f, i) => switchFaction([f], i < numberMissingGuards ? 'guard' : 'assassin'))

    // assassin positions
    const assassins = shuffle(figures.filter(figure => figure.faction === 'assassin'))
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
    const guards = figures.filter(figure => figure.faction === 'guard')

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
    const vips = figures.filter(figure => figure.faction === 'vip')
    const vipPositions = []
    for (let i = 0; i < 3; i++) {
        vipPositions.push({ x: (5 + (i - 1) / 3) / 10 * level.width, y: (1 / 8) / 2 * level.height })
    }
    vips.forEach((f, i) => {
        initFigure(f, vipPositions[i].x, vipPositions[i].y, deg2rad(90))
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
        }
    } else if (reduceBounds(figureAttacked.getBounds(), { left: 0.15, right: 0.45, top: 0.15, bottom: 0.15 }).contains(figureAttacker.worldTransform.tx, figureAttacker.worldTransform.ty)) {
        killFigure(figureAttacked)
        figureAttacker.hasHit = true
    }
}

const killFigure = (figure) => {
    if (!figure.isDead && !(buttons.selectGame?.isInArea(figure) || buttons.startGame?.isInArea(figure))) {
        figure.isDead = true
        figure.died = true
        figure.killTime = dtProcessed
        if (stage === stages.game && game === games.rampage && figure.faction !== 'killer') {
            const currentKillers = figures.filter(f => f.faction === 'killer' && f.type === 'fighter')
            currentKillers.forEach(f => {
                f.player.score.points++
                f.player.score.shownPoints = f.player.score.points
            })
            teams[currentKillers[0].team].score.points++
        }
    }
}

const finishRound = () => {
    lastRoundEndThen = dtProcessed
    restartStage = true
}

const winRoundTeam = team => {
    teams[team].score.points++
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
    const maxPoints = Math.max(...Object.values(teams).map(team => team.score?.points || 0))
    return Object.keys(teams).filter(team => teams[team].score?.points === maxPoints)
}

const switchFaction = (figures, faction, switchTeam = true) => {
    let sortNoTeamPlayers = false

    figures.forEach(figure => {
        if (figure.faction === faction) {
            return
        }

        if (figure.faction) {
            factions[figure.faction].size--
        }
        figure.faction = faction
        figure.currentSprite = factions[faction]?.sprites?.[factions[faction]?.size % factions[faction]?.sprites.length] || figure.defaultSprite
        if (figure.type !== 'crosshair') {
            figure.maxSpeed = factions[faction]?.maxSpeed || defaultMaxSpeed
        }
        if (figure.faction) {
            factions[figure.faction].size++
        }

        if (figure.player && switchTeam) {
            // remove player from old team
            teams[figure.team ?? 'none'].players = teams[figure.team ?? 'none'].players.filter(p => p !== figure.player)

            // set new team
            figure.team = factions[faction]?.team

            // add player to new team
            teams[figure.team ?? 'none'].players.push(figure.player)

            // sort no team players by join time
            if (!figure.team) {
                sortNoTeamPlayers = true
            }

            // update team score
            if (figure.playerId) {
                updateTeamScore()
            }
        }
    })

    if (sortNoTeamPlayers) {
        teams.none.players.sort((a, b) => a.joinedTime - b.joinedTime || a.playerId - b.playerId)
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
    gamesEntries.forEach(([, game]) => game.votes = 0)
    Object.values(players).forEach(player => player.vote && games[player.vote].votes++)

    spinningWheel.segments = gamesEntries.map(([key, game], index) => ({
        game: key,
        position: index,
        votes: game.votes
    }))
    let activeSegments = spinningWheel.segments.filter(segment => segment.votes > 0)

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

const stopSpinningWheel = (force = false) => {
    if (spinningWheel.finishTime && !force) {
        return
    }
    spinningWheel.mode = null
    spinningWheel.segment = undefined
    spinningWheel.speed = 0
    spinningWheel.stage = undefined
}

const processSpinningWheel = dtProcessed => {
    if (!spinningWheel.mode) {
        return
    }

    if (spinningWheel.stage !== 'boomerang' && spinningWheel.finishTime && dtProcessed > spinningWheel.pulseDuration + spinningWheel.finishTime) {
        spinningWheel.stage = 'boomerang'
        playAudio(soundBoomerang)
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
                segment = spinningWheel.segments[(segment.position + 1) % spinningWheel.segments.length]
                if (segment.votes > 0) {
                    break
                }
            }
            if (segment === spinningWheel.winner && spinningWheel.speed === spinningWheel.constantSpeedThreshold) {
                spinningWheel.finishTime = dtProcessed
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

Object.assign(window, {
    colors, playerColors, getPlayerColor,
    setDeadzone, pad, getCountdownText, getQueryParam,
    mod, getRandomInt, getRandomIndex,
    initRandomPositionFigure, initRandomOutsidePositionFigure, initStartPositionFigure,
    initCrosshair, initFigure, initPlayerScore,
    shuffle, distance, squaredDistance, angle, move,
    deg2rad, deg2limitedrad, rad2deg, rad2limiteddeg,
    distanceAngles, distanceAnglesRad, distanceAnglesDeg, getNextDiscreteAngle,
    getAudio, playAudio, stopAudio, isAudioPlaying, loadAudioPool,
    getMusicVolume, setMusicVolume, getSfxVolume, setSfxVolume,
    playPlaylist, stopPlaylist, stopMusicPlaylist, playMusicPlaylist,
    playKillingSounds, getRoundCount, setRoundCount, toggleRounds, toggleMusicVolume, toggleSfxVolume,
    voteGame, loadButton, addFigure, addAnimation, destroyContainer,
    createLevel, getRandomXY, getRandomXYInRectangle, getRandomXYInCircle,
    getCloseRandomXY, cropXY, reduceBounds,
    getWalkRectLength, getIntervalPoint, getLinePoint,
    getRandomOutsideLevelXY, distanceToBorder, getCloudMultiplier,
    figureIsBot, playerIsBot, initSniperPositions,
    initRandomSpriteFigures, initVIPGamePositions,
    detectFigure, attackFigure, killFigure, finishRound,
    winRoundTeam, winRoundFigures, getPlayersWithMaxScore, getTeamsWithMaxScore,
    switchFaction, initNetwork,
    spinningWheel, initSpinningWheel, stopSpinningWheel, processSpinningWheel, stepSpinningWheel,
    easeInOutCubic, quadraticBezier
})
