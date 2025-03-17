const colors = {
    black: 0x000000,
    blue: 0x0000FF,
    darkbrown: 0x57412F,
    darkgreen: 0x008000,
    gold: 0xB29146,
    grey: 0x787878,
    lightbrown: 0x8B4513,
    red: 0xFF0000,
    white: 0xFFFFFF
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
    //file.currentTime = 0;
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
    }
    playPlaylist(musicPlaylist, shuffle)
    actualMusicPlaylist = musicPlaylist
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
    
    if (btn.loadingPercentage >= 1) {
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
    const level = {width: 1920, height: 1080, padding: 16}
    level.shortestPathNotBean5 = 2*0.6*level.height+2*0.3*Math.hypot(level.height, level.width);
    level.shortestPathBean5 = 2*0.6*level.height+0.6*level.width+0.3*Math.hypot(level.height, level.width);

    return level
}

function getRandomXY(level) {
    return[level.padding+Math.random()*(level.width-level.padding*2), level.padding+Math.random()*(level.height-level.padding*2)]
}

const getRandomXYInCircle = (x, y, r) => {
    const angle = Math.random()*Math.PI, angleX = Math.cos(angle), angleY = Math.sin(angle)

    const t1 = Math.min(distanceToBorder(x, y, angleX, angleY), r)
    const t2 = Math.min(distanceToBorder(x, y, -angleX, -angleY), r)
    const t = Math.random()*(t1+t2)-t2

    return [t*angleX+x, t*angleY+y]
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

createFigureAtlasData = () => {
    const atlasData = {
        frames: {},
        meta: {
            image: 'players'
        },
        animations: {}
    }

    const animations = [
        "down",
        "up",
        "right",
        "left"
    ]

    animations.forEach((e, j) => {
        atlasData.animations[e] = []
        for (let i = 0; i < 4; i++) {
            const frameName = e + i
            atlasData.frames[frameName] = {
                frame: {x: i*32, y: j*32, w:32, h:32}
            }
            atlasData.animations[e].push(frameName)
        }
    });

    return atlasData
}

createCloudAtlasData = () => {
    const atlasData = {
        frames: {},
        meta: {
            image: 'cloud',
            scale: 1/3
        },
        animations: {}
    }

    atlasData.animations.explode = []
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const frameName = 'explode' + (i+3*j)
            atlasData.frames[frameName] = {
                frame: {x: i*64, y: j*64, w:64, h:64}
            }
            atlasData.animations.explode.push(frameName)
        }
    }

    return atlasData
}

const initVIPGamePositions = figures => {
    // distribute neutral players evenly
    const numberPlayerAssassins = figures.filter(figure => figure.playerId && figure.team === 'assassin').length
    const numberPlayerGuards = figures.filter(figure => figure.playerId && figure.team === 'guard').length
    const neutralPlayerFigures = shuffle(figures.filter(figure => figure.playerId && !figure.team))
    const numberJoinSmallerTeam = Math.abs(numberPlayerAssassins - numberPlayerGuards)
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

    // put neutrals in teams
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

    // guard positions
    const guards = shuffle(figures.filter(figure => figure.team === 'guard'))
    const guardPositions = []
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            if (i > 0 || j === 0 || j === 4) {
                guardPositions.push({x: ((2*j+1)/10)*level.width, y: ((2*i+1)/8)/2*level.height})
            }
        }
    }
    guards.forEach((f, i) => {
        initFigure(f, guardPositions[i].x, guardPositions[i].y, deg2rad(90))
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
    if (distance(figureAttacker.x,figureAttacker.y,figureAttacked.x,figureAttacked.y) < attackDistance) {
        if (2*distanceAnglesDeg(rad2deg(figureAttacker.direction), rad2deg(angle(figureAttacker.x,figureAttacker.y,figureAttacked.x,figureAttacked.y))+180) <= figureAttacker.attackAngle) {
            figureAttacked.isDead = true;
            figureAttacked.killTime = dtProcessed
            figureAttacked.speed = 0;
            playAudioPool(soundDeathPool);
            return true
        }
    }
    return false
}

const winRound = winnerFigures =>{
    winnerFigures.forEach(f => {
        f.score.oldPoints = f.score.points
        f.score.points++
    })
    lastWinnerPlayerIds = new Set(winnerFigures.map(f => f.playerId))
    lastRoundEndThen = dtProcessed
    restartGame = true
}