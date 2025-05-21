const colors = {
    black: 0x000000,
    blue: 0x0000FF,
    cyan: 0x00FFFF,
    darkBrown: 0x57412F,
    darkOrange: 0xFF8000,
    dodgerBlue: 0x0080FF,
    deepPink: 0xFF0080,
    electricIndigo: 0x8000FF,
    green: 0x008000,
    gold: 0xB29146,
    grey: 0x787878,
    lightBrown: 0x8B4513,
    lime: 0x00FF00,
    magenta: 0xFF00FF,
    purple: 0x800080,
    red: 0xFF0000,
    white: 0xFFFFFF,
    yellow: 0xFFFF00
}
const crosshairColors = new Set([colors.blue, colors.black, colors.cyan, colors.darkOrange, colors.deepPink ,colors.dodgerBlue, colors.electricIndigo, colors.magenta, colors.red, colors.yellow, colors.white])

let crosshairColorsInUse = new Set()

const getCrosshairColor = () => {
    const freeColors = Array.from(crosshairColors.difference(crosshairColorsInUse))
    const color = freeColors[getRandomInt(freeColors.length)]
    crosshairColorsInUse.add(color)
    return color
}

/**
 * Set a value based on the deadzone
 */
function setDeadzone(x, y, deadzone=0.2) {
    let m = Math.hypot(x, y);

    if (m < deadzone)
        return [0, 0];

    let over = m - deadzone;  // 0 -> 1 - deadzone
    let nover = over / (1 - deadzone);  // 0 -> 1

    let nx = x / m;
    let ny = y / m;

    return [nx * nover, ny * nover];
}

function clampStick(x, y) {
    // Compute magnitude (length) of vector
    let m = Math.hypot(x, y);

    // If the length greater than 1, normalize it (set it to 1)
    if (m > 1) {
        x /= m;
        y /= m;
    }

    // Return the (possibly normalized) vector
    return [x, y];
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

    initFigure(figure, x, y, angle(x,y,xTarget,yTarget))
}

const initRandomOutsidePositionFigure = figure => {
    const [x, y] = getRandomOutsideLevelXY()

    initFigure(figure, x, y)
    figure.inactive = true
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
        startWalkTime: Math.random() * 5000 + dtProcessed,
        speed: 0,
        isDead: false,
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
const angle = (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1); 
const move = (x1, y1, angle, speed, dt) => ({x: x1 + Math.cos(angle)*speed*dt, y: y1 + Math.sin(angle)*speed*dt});
// Function ]-∞;∞[ -> ]-∞;∞[
const deg2rad = deg => deg * (Math.PI / 180);
// Function ]-∞;∞[ -> [0;2π[
const deg2limitedrad = deg => deg2rad(mod(deg,360));
// Function ]-∞;∞[ -> ]-∞;∞[
const rad2deg = rad => (rad * 180.0) / Math.PI;
// Function ]-∞;∞[ -> [0;360[
const rad2limiteddeg = rad => mod(rad2deg(rad),360);

const distanceAngles = base => (a1, a2) => {let d = Math.abs(a1 - a2) % base; return Math.min(d, base-d)};
const distanceAnglesRad = distanceAngles(2*Math.PI);
const distanceAnglesDeg = distanceAngles(360);

const getNextDiscreteAngle = (angle, numberDiscreteAngles) => deg2rad(Math.round(rad2deg(angle)*numberDiscreteAngles/360)*360/numberDiscreteAngles);

const getAudio = (audio) => {
    const {title, ...props} = audio;
    const file = new Audio(title);
    return {file, ...props};
};

const playAudio = (audio) => {
    const {file, ...props} = audio;
    file.load()
    Object.entries(props).forEach(([key, value]) => {
        if (value) {
            file[key] = value;
        }
    });
    file.play().catch((err) => {console.log(err)});
}

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

const canPlayThroughCallback = (resolve, audio, callback) => {
    audio.file.removeEventListener('canplaythrough', callback);
    resolve();
};

const loadAudioPool = (audio, length) => {
    var audioPool = [];
    for (let i = 0; i < length; i++) {
        audioPool.push({audio: getAudio(audio)});
    }
    audioPool.forEach(poolEntry => loadPromises.push(new Promise((resolve, reject) => poolEntry.audio.file.addEventListener('canplaythrough', canPlayThroughCallback(resolve, poolEntry.audio, canPlayThroughCallback)))));
    return audioPool;
}

const muteAudio = () => {
    window.localStorage.setItem('mute','true')
}
const unmuteAudio = () => {
    window.localStorage.removeItem('mute')
}
const isMusicMuted = () => {
    return window.localStorage.getItem('mute') === 'true'
}

const getPlayAudio = (audio) => () => playAudio(audio)

const playPlaylist = (playlist, isShuffled) => {
    if (playlist) {
        if (isShuffled) {
            playlist = shuffle(playlist)
        }
        playlist.forEach((track, index, list) => track.file.addEventListener("ended", getPlayAudio(playlist[(index+1)%list.length])));
        playAudio(playlist[0]);
    }
}

const stopPlaylist = (playlist) => {
    if (playlist) {
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
            playAudio(soundMultiKill[Math.min(multikillCounter - 2, soundMultiKill.length-1)]);
        }
        if (totalkillCounter >= 5*(lastTotalkillAudio+1)) {
            playAudio(soundTotalKill[Math.min(lastTotalkillAudio, soundTotalKill.length-1)]);
            lastTotalkillAudio++;
        }
    }
}

const getBotCount = () => {
    var bots = parseInt(window.localStorage.getItem('bots'))
    return isNaN(bots) ? 0 : bots
}

const setBotCount = (bots) => {
    window.localStorage.setItem('bots', bots)
}

const toggleBots = () => {
    var count = getBotCount()
    count++
    if (count > 3) {
        count = 0
    }
    setBotCount(count)
    return count
}

function toggleMusic() {
    if (isMusicMuted()) {
        unmuteAudio()
        playMusicPlaylist(musicLobby)
    } else {
        muteAudio()
        stopMusicPlaylist()
    }
}

const loadButton = (btn, aimLoadingPercentage) => {
    if (btn.loadingSpeed) {
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
            btn.execute()
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
        children.forEach(child => destroyContainer(app, child.destroy()))
        
        container.destroy()
    }
}

const createLevelContainer = (app, level) => {
    const levelContainer = new PIXI.Container()

    app.ticker.add(() => {
        const scale = Math.min(app.screen.width / level.width, app.screen.height / level.height) * 0.9
        const offsetX = (app.screen.width - scale * level.width) / 2
        const offsetY = (app.screen.height - scale * level.height) / 2

        levelContainer.scale.x = scale
        levelContainer.scale.y = scale
        levelContainer.x = offsetX
        levelContainer.y = offsetY
    })

    return levelContainer
}

function createLevel() {
    const level = {width: 1920, height: 1080, padding: 20}
    level.rectangle = new PIXI.Rectangle(level.padding, level.padding, level.width-2*level.padding, level.height-2*level.padding)
    level.shortestPathNotBean5 = 2*0.6*level.height+2*0.3*Math.hypot(level.height, level.width);
    level.shortestPathBean5 = 2*0.6*level.height+0.6*level.width+0.3*Math.hypot(level.height, level.width);

    return level
}

function getRandomXY() {
    return [level.rectangle.x+Math.random()*level.rectangle.width, level.rectangle.y+Math.random()*level.rectangle.height]
}

function getCloseRandomXY(figure) {
    if (figure.walkRectLength) {
        return getRandomXYInRectangle(figure.x-figure.walkRectLength, figure.y-figure.walkRectLength, 2*figure.walkRectLength, 2*figure.walkRectLength)
    }
    return getRandomXY()
}

const getIntervalPoint = (t, start, end) => start + t*(end-start)

const getLinePoint = (t, start, end) => ({x: getIntervalPoint(t, start.x, end.x), y: getIntervalPoint(t, start.y, end.y)})

const getRandomOutsideLevelXY = () => {
    let t = Math.random()*(level.width+level.height)
    let x,y
    const inverseLevelScaleFactor = 1/0.9
    const margin = (inverseLevelScaleFactor-1)/4
    const start = -margin , end = 1+margin
    if (t < level.width) {
        t *= 2/level.width
        if (t < 1) {
            y = start
        } else {
            y = end
        }
        x = getIntervalPoint(t % 1, start, end)
    } else {
        t -= level.width
        t *= 2/level.height
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

function getRandomXYInRectangle(x, y, w, h) {
    const rectangle = new PIXI.Rectangle(x, y, w, h).fit(level.rectangle)
    return [rectangle.x+Math.random()*rectangle.width, rectangle.y+Math.random()*rectangle.height]
}

const distanceToBorder = (x, y, angleX, angleY) => {
    const xBorder = angleX > 0 ? level.width-level.padding : level.padding
    const yBorder = angleY > 0 ? level.height-level.padding : level.padding
    const tX = (xBorder-x)/angleX
    const tY = (yBorder-y)/angleY

    return Math.min(!isNaN(tX) ? tX : Infinity, !isNaN(tY) ? tY : Infinity)
}

function cropXY(x,y,level) {
    if (x > level.width-level.padding) x = level.width-level.padding
    if (y > level.height-level.padding) y = level.height-level.padding
    if (x < level.padding) x = level.padding
    if (y < level.padding) y = level.padding
    return [x,y]
}

const figureIsBot = figure => figure.playerId?.includes('b')

const initSniperPositions = figures => {
    figures.forEach(figure => initRandomOutsidePositionFigure(figure))
}

const initVIPGamePositions = figures => {

    const neutralPlayerFigures = shuffle(figures.filter(figure => figure.playerId && !figure.team))
    if (neutralPlayerFigures.length > 0) {
        // distribute neutral players evenly
        const numberPlayerAssassins = figures.filter(figure => figure.playerId && figure.team === 'assassin').length
        const numberPlayerGuards = figures.filter(figure => figure.playerId && figure.team === 'guard').length
        const numberJoinSmallerTeam = Math.min(Math.abs(numberPlayerAssassins - numberPlayerGuards), neutralPlayerFigures.length)
        const numberEvenlyJoinTeam = Math.floor((neutralPlayerFigures.length-numberJoinSmallerTeam)/2)
        const smallerTeam = numberPlayerAssassins > numberPlayerGuards ? 'guard' : 'assassin'
        const randomTeam = getRandomInt(2) > 0 ? 'guard' : 'assassin'
        for (let i = 0; i < numberJoinSmallerTeam; i++) {
            switchTeam(neutralPlayerFigures[i], smallerTeam)
        }
        for (let i = 0; i < numberEvenlyJoinTeam; i++) {
            switchTeam(neutralPlayerFigures[i+numberJoinSmallerTeam], 'guard')
        }
        for (let i = 0; i < numberEvenlyJoinTeam; i++) {
            switchTeam(neutralPlayerFigures[i+numberJoinSmallerTeam+numberEvenlyJoinTeam], 'assassin')
        }
        for (let i = 0; i < (neutralPlayerFigures.length-numberJoinSmallerTeam) % 2; i++) {
            switchTeam(neutralPlayerFigures[i+neutralPlayerFigures.length-1], randomTeam)
        }
    }

    // put NPC neutrals in teams
    const numberMissingGuards = numberGuards - figures.filter(figure => figure.team === 'guard').length
    const neutralFigures = shuffle(figures.filter(figure => !figure.team))
    for (let i = 0; i < numberMissingGuards; i++) {
        switchTeam(neutralFigures[i], 'guard')
    }

    for (let i = numberMissingGuards; i < neutralFigures.length; i++) {
        switchTeam(neutralFigures[i], 'assassin')
    }

    // assassin positions
    const assassins = shuffle(figures.filter(figure => figure.team === 'assassin'))
    const assassinPositions = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 5; j++) {
            assassinPositions.push({x: ((2*j+1)/10)*level.width, y: (2+(2*i+1)/6)/3*level.height})
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
    centerGuards = shuffle(centerGuards.concat(otherGuards.slice(0, 9-numberMinCenterPlayers)))
    otherGuards = otherGuards.slice(9-numberMinCenterPlayers)

    const guardCenterPositions = [], guardOuterPositions = []
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            if (i > 0 || j === 0 || j === 4) {
                const position = {x: ((2*j+1)/10)*level.width, y: ((2*i+1)/8)/2*level.height}
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
        vipPositions.push({x: (5+(i-1)/3)/10*level.width, y: (1/8)/2*level.height})
    }
    vips.forEach((f, i) => {
        initFigure(f, vipPositions[i].x, vipPositions[i].y, deg2rad(90))
    })
}

const attackFigure = (figureAttacker, figureAttacked) => {
    const attackDistance = figureAttacker.attackDistanceMultiplier ? figureAttacker.attackDistanceMultiplier*figureAttacker.attackDistance : figureAttacker.attackDistance
    if (attackDistance && distance(figureAttacker.x,figureAttacker.y,figureAttacked.x,figureAttacked.y) < attackDistance) {
        if (2*distanceAnglesDeg(rad2deg(figureAttacker.direction), rad2deg(angle(figureAttacker.x,figureAttacker.y,figureAttacked.x,figureAttacked.y))+180) <= figureAttacker.attackAngle) {
            killFigure(figureAttacked)
            return true
        }
    } else if (new PIXI.Rectangle(figureAttacker.x-figureAttacker.attackRectX/2, figureAttacker.y-figureAttacker.attackRectY/2, figureAttacker.attackRectX, figureAttacker.attackRectY).contains(figureAttacked.x, figureAttacked.y)) {
        killFigure(figureAttacked)
        return true
    }
    return false
}

const killFigure = (figure) => {
    if (!figure.isDead) {
        figure.isDead = true
        figure.killTime = dtProcessed
        figure.speed = 0
        playAudioPool(soundDeathPool)
        if (game === games.rampage && figure.team !== 'killer') {
            figures.filter(f => f.team === 'killer' & f.type === 'fighter').forEach(f => {
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

const switchTeam = (figure, team) => {
    figure.team = team
    figure.currentSprite = teams[team]?.sprite || 'baby'
    figure.maxSpeed = teams[team]?.maxSpeed || 0.08
    figure.walkRectLength = teams[team]?.walkRectLength
}