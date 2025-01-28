/**
 * Set a value based on the deadzone
 */
function setDeadzone(x, y, deadzone=0.2) {
    let m = Math.sqrt(x*x + y*y);

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
    let m = Math.sqrt(x*x + y*y);

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

const distanceAngles = (a1, a2) => {let d = mod(Math.abs(a1 - a2),360); return Math.min(d, 360-d)};
const distanceAngles2 = (a1, a2) => Math.abs(a1 - a2) % 360;

const getNextDiscreteAngle = (angle, numberDiscreteAngles) => deg2rad(Math.round(rad2deg(angle)*numberDiscreteAngles/360)*360/numberDiscreteAngles);

const getHeightInTiles = () => Math.ceil(level.height/tileWidth);
const getWidthInTiles = () => Math.ceil(level.width/tileWidth);
const getLastAttackTime = (lastAttackTime, time) => lastAttackTime && time-lastAttackTime < 500 ? lastAttackTime : time;

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

const playPlaylist = (playlist) => {
    playlist.forEach((track, index, list) => track.file.addEventListener("ended", getPlayAudio(playlist[(index+1)%list.length])));
    playAudio(playlist[0]);
}

const stopPlaylist = (playlist) => {
    playlist.forEach(track => track.file.load());
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

function adjustStageToScreen(app, level) {
    level.width = 1920
    level.height = 1080
    level.padding = 16
    level.scale = Math.min(app.screen.width / level.width, app.screen.height / level.height) * 0.9
    level.offsetX = (app.screen.width - level.scale * level.width) / 2
    level.offsetY = (app.screen.height - level.scale * level.height) / 2
    level.shortestPathNotBean5 = 2*0.6*level.height+2*0.3*Math.hypot(level.height, level.width);
    level.shortestPathBean5 = 2*0.6*level.height+0.6*level.width+0.3*Math.hypot(level.height, level.width);

    app.stage.getChildAt(0).width = level.width
    app.stage.getChildAt(0).height = level.height
    app.stage.getChildAt(0).scale.x = level.scale
    app.stage.getChildAt(0).scale.y = level.scale
    app.stage.getChildAt(0).x = level.offsetX;
    app.stage.getChildAt(0).y = level.offsetY;
}

function getRandomXY(level) {
    return[level.padding+Math.random()*(level.width-level.padding*2), level.padding+Math.random()*(level.height-level.padding*2)]
}

function cropXY(x,y,level) {
    if (x > level.width-level.padding) x = level.width-level.padding
    if (y > level.height-level.padding) y = level.height-level.padding
    if (x < level.padding) x = level.padding
    if (y < level.padding) y = level.padding
    return [x,y]
}


function isInRect(x,y,rx,ry,rw,rh) {
    return x >= rx && x <= rx+rw && y >= ry && y < ry+rh
}

const addLevelContainer = app => {
    const levelContainer = new PIXI.Container()

    app.stage.addChild(levelContainer)
}

const addFence = (app, level) => {
    const horizontalFence = new PIXI.GraphicsContext().rect(0,0,level.width,level.padding*0.6)
    .fill({color: 0x969696})
    .rect(level.padding*0.5,level.padding*0.8,level.width-level.padding,level.padding*0.6)
    .fill({color: 0x787878})
    .rect(level.padding*0.5,level.padding*1.6,level.width-level.padding,level.padding*0.6)
    .fill({color: 0x5A5A5A})

    const upperFence = new PIXI.Graphics(horizontalFence)
    .rect(0,0, level.padding*0.5, level.padding*2)
    .rect(level.width-level.padding*0.5,0, level.padding*0.5, level.padding*2)
    .fill({color: 0x969696})
    app.stage.getChildAt(0).addChild(upperFence)

    const offsetY = level.height-2*level.padding
    const lowerFence = new PIXI.Graphics(horizontalFence.clone())
    .rect(0,level.padding*2-offsetY, level.padding*0.5, level.height-level.padding)
    .rect(level.width-level.padding*0.5,level.padding*2-offsetY, level.padding*0.5, level.height-level.padding)
    .fill({color: 0x969696})

    lowerFence.y = offsetY
    lowerFence.zIndex = level.height
    app.stage.getChildAt(0).addChild(lowerFence)
}

const addHeadline = app => {
    const title = new PIXI.Text({
        text: 'KNIRPS UND KNALL',
        style: {
            fontSize: level.width*0.02,
            fill: 0xFFFFFF
        }
    });

    title.anchor.set(0.5,1);
    title.x = level.width/2;
    title.y = -level.width*0.005;

    app.stage.getChildAt(0).addChild(title);

    const authors = new PIXI.Text({
        text: 'made by TORSTEN STELLJES & ALEXANDER THURN',
        style: {
            fontSize: level.width*0.012,
            fill: 0xFFFFFF
        }
    });

    authors.anchor.set(1,1);
    authors.x = level.width;
    authors.y = -level.width*0.005;

    app.stage.getChildAt(0).addChild(authors);
}

const animateButton = button => {
    button.visible = !isGameStarted && figures.filter(f => f.playerId && f.type === 'fighter').length > 0

    const loadingBar = button.getChildAt(1)
    loadingBar.width = button.width*button.loadingPercentage
}

const addButton = (app, props) => {
    const {x, y, width, height, loadingPercentage, loadingSpeed, execute} = props

    let button = new PIXI.Container()
    button = Object.assign(button, {x, y, loadingPercentage, loadingSpeed, execute})

    const area = new PIXI.Graphics()
    .rect(0, 0, width, height)
    .fill({alpha: 0.5, color: 0x57412F})

    const loadingBar = new PIXI.Graphics()
    .rect(0, 0, 0.1, height)
    .fill({alpha: 0.5, color: 0x787878})

    const buttonText = new PIXI.Text({
        style: {
            align: 'center',
            fontSize: level.width*0.017,
            fill: 0xFFFFFF,
            stroke: 0xFFFFFF
        }
    });
    buttonText.anchor.set(0.5)
    buttonText.x = width/2
    buttonText.y = height/2

    button.addChild(area)
    button.addChild(loadingBar)
    button.addChild(buttonText)
    app.stage.getChildAt(0).addChild(button)

    app.ticker.add(() => animateButton(button))
    return button
}

const animateStartButton = button => {
    let text = 'Walk here to\nSTART\n\n'+button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    if (button.playersPossible?.length === 1) {
        text = 'Walk here to\nSTART\n\nmin 2 players\nor 1 player +1 bot'
    } else if (button.playersPossible?.length > 1 && button.playersNear?.length === button.playersPossible?.length ) {
        text ='Prepare your\nbellies'
    } else if (button.playersNear?.length > 0) {
        text = 'Walk here to\nSTART\n\n' + button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    }
    button.getChildAt(2).text = text
}

const animateMuteButton = button => {
    button.getChildAt(2).text = isMusicMuted() ? 'Music: OFF' : 'Music: ON'
}

const animateBotsButton = button => {
    button.getChildAt(2).text = 'Bots: ' + getBotCount()
}

const addButtons = app => {
    Object.entries(buttonDefinition()).forEach(([id, button]) => {buttons[id] = addButton(app, button)})

    app.ticker.add(() => animateStartButton(buttons.start))
    app.ticker.add(() => animateMuteButton(buttons.mute))
    app.ticker.add(() => animateBotsButton(buttons.bots))
}

const animateMenuItems = menuItem => {
    menuItem.visible = !isGameStarted
}

const addMenuItems = app => {
    addButtons(app)

    const fontHeight = level.width*0.017  
    const howToPlay = new PIXI.Text({
        text: 'HOW TO PLAY\n\nJoin by pressing any key on your Gamepad' 
            + '\nor WASDT(Key1) or ' + String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0(RSHIFT)\nor mouse or touch' 
            + '\n\n1.) Find your player 2.) Fart to knock out others\n3.) Stay hidden 4.) Eat to power up your farts' 
            + '\n\nBe the last baby standing!',
        style: {
            align: 'center',
            fontSize: fontHeight,
            fill: 0xFFFFFF
        }
    });

    howToPlay.anchor.set(0.5,0);
    howToPlay.x = level.width*0.22+fontHeight;
    howToPlay.y = level.height*0.1;

    app.stage.getChildAt(0).addChild(howToPlay);

    app.ticker.add(() => animateMenuItems(howToPlay))
}

const botCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: 0x000000}).stroke({alpha: 0.5, color: 0xFF0000, width: 2})
const playerCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: 0x000000}).stroke({alpha: 0.5, color: 0x000000, width: 1})
const botWinnerCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: 0xB29146}).stroke({alpha: 0.5, color: 0xFF0000, width: 2})
const playerWinnerCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: 0xB29146}).stroke({alpha: 0.5, color: 0x000000, width: 1})

const animatePlayerScore = figure => {
    if (!restartGame) {
        var lp = !newPlayerIds.has(figure.playerId) ? 1 : Math.min((dtProcessed - newPlayerIdThen) / moveNewPlayerDuration, 1)
        var lpi = 1-lp

        figure.score.x = lpi * (level.width*0.5) + lp*figure.score.xDefault
        figure.score.y = lpi*(level.height*0.5) + lp*figure.score.yDefault
        figure.score.scale = 12*lpi + lp
    }

    figure.score.getChildAt(1).text = figure.score.points

    if (figure.isAttacking && !restartGame) {
        figure.score.x += -5+10*Math.random()
        figure.score.y += -5+10*Math.random()
    }
}

const addPlayerScore = (app, figure, player) => {
    let playerScore = new PIXI.Container()
    const offx = 48*1.2
    const figureIndex = figures.filter(f => f.type === 'fighter').findIndex(f => !f.playerId)
    playerScore.xDefault = 32+figureIndex*offx
    playerScore.yDefault = level.height+32
    playerScore.points = 0
    playerScore.zIndex = 2*level.height

    let circle
    if (player.type === 'bot') {
        circle = new PIXI.Graphics(botCircleContext)
    } else {
        circle = new PIXI.Graphics(playerCircleContext)
    }
    
    const text = new PIXI.Text({
        text: 0,
        style: {
            fontSize: 36,
            fill: 0xFFFFFF
        }
    });
    text.anchor.set(0.5)

    figure.score = playerScore
    playerScore.addChild(circle)
    playerScore.addChild(text)
    app.stage.getChildAt(0).addChild(playerScore)

    app.ticker.add(() => animatePlayerScore(figure))
}

const figureIsBot = figure => figure.playerId?.includes('b')

const animateWinningCeremony = winnerText => {
    const playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')
    const playerFiguresSortedByNewPoints = playerFigures.toSorted((f1,f2) => (f1.score.points-f1.score.oldPoints) - (f2.score.points-f2.score.oldPoints))
    const lastFinalWinnerIndex = playerFigures.findIndex(f => f.playerId === lastFinalWinnerPlayerId)
    const lastFinalWinnerFigure = playerFigures[lastFinalWinnerIndex]
    const lastFinalWinnerNumber = lastFinalWinnerIndex+1
    const dt3 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration);
    const dt4 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);

    playerFiguresSortedByNewPoints.forEach((f, i) => {
        const dt2 = dtProcessed - (lastRoundEndThen + i*moveScoreToPlayerDuration);
        
        let points = f.points;

        if (lastRoundEndThen && dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
            const lp = dt2 / moveScoreToPlayerDuration
            const lpi = 1-lp

            f.score.x = lpi*f.score.xDefault + lp*f.x
            f.score.y = lpi*f.score.yDefault + lp*f.y

            if (lastFinalWinnerPlayerId === f.playerId) {
                f.score.scale = (lpi + 2*lp)*(lpi + 2*lp)
            } else {
                f.score.scale = lpi + 2*lp
            }

            if (lastWinnerPlayerIds.has(f.playerId)) {
                if (figureIsBot(f)) {
                    f.score.getChildAt(0).context = botWinnerCircleContext
                } else {
                    f.score.getChildAt(0).context = playerWinnerCircleContext
                }
            }
            points = f.oldPoints;
        } else if (lastRoundEndThen && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
            f.score.x = f.x
            f.score.y = f.y
            if (lastFinalWinnerPlayerId === f.playerId) {
                f.score.scale = 4
            } else {
                f.score.scale = 2
            }
        } else if (lastRoundEndThen && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
            const lp = dt4 / moveScoreToPlayerDuration
            const lpi = 1-lp

            f.score.x = lpi*f.x + lp*f.score.xDefault
            f.score.y = lpi*f.y + lp*f.score.yDefault
            f.score.scale = 2*lpi + lp
            if (lastFinalWinnerPlayerId) {
                points = 0;
            }
            if (figureIsBot(f)) {
                f.score.getChildAt(0).context = botCircleContext
            } else {
                f.score.getChildAt(0).context = playerCircleContext
            }
        }
    })
    
    if (!!lastFinalWinnerNumber && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
        winnerText.visible = true
        if (figureIsBot(lastFinalWinnerFigure)) {
            winnerText.text = `Player ${lastFinalWinnerNumber} (Bot) wins`
        } else {
            winnerText.text = `Player ${lastFinalWinnerNumber} wins`
        }
    } else {
        winnerText.visible = false
    }
}

const addWinningCeremony = app => {
    let winnerText = new PIXI.Text({
        style: {
            fontSize: level.width*0.1,
            fill: {
                alpha: 0.8,
                color: 0x8B4513
            },
            stroke: {
                color: 0xFFFFFF,
                width: 6,
            }
        }
    })
    winnerText.anchor.set(0.5)
    winnerText.x = level.width/2
    winnerText.y = level.height/2
    winnerText.zIndex = 3*level.height

    app.stage.getChildAt(0).addChild(winnerText)

    app.ticker.add(() => animateWinningCeremony(winnerText))
}

const animateFood = figure => {
    const plate = figure.getChildAt(0)
    let durationLastAttack = dtProcessed-figure.lastAttackTime
    if (figure.lastAttackTime && durationLastAttack < figure.attackDuration) {
        const perc = durationLastAttack/figure.attackDuration
        plate.scale = 1 - 0.2 * Math.sin(perc*Math.PI)
    }
}

const addFood = (app, texture, props) => {
    let food = new PIXI.Container()
    food = Object.assign(food, props)

    const plate = new PIXI.Graphics().circle(0, 0 , food.attackDistance)
    .fill({color: 0xFFFFFF})
    .circle(0, 0 , 0.8*food.attackDistance)
    .stroke({color: 0x000000, width: 2})

    const sprite = new PIXI.Sprite(texture)
    sprite.anchor.set(0.5)
    sprite.scale = 1.2

    food.addChild(plate)
    food.addChild(sprite)
    figures.push(food)
    app.stage.getChildAt(0).addChild(food)

    app.ticker.add(() => animateFood(food))
}

const addFoods = (app, spritesheet) => {
    Object.keys(foodDefinition()).forEach(key => {
        addFood(app, spritesheet.textures[key], {
            id: key,
            type: 'bean',
            attackDistance: 32,
            lastAttackTime: undefined,
            attackDuration: beanAttackDuration
        })
    })
}

const addGrass = (app, textures, spritesheet) => {
    const widthInTiles = 16
    const heightInTiles = 9

    for (let i = tileArea.length; i < widthInTiles; i++) {
        tileArea[i] = []
        for (let j = tileArea[i].length; j < heightInTiles; j++) {
            tileArea[i][j] = getRandomInt(3)
        }
    }

    for (let i = 0; i < widthInTiles; i++) {
        for (let j = 0; j < heightInTiles; j++) {
            const texture = textures[tileArea[i][j]]
            const grass = new PIXI.Sprite(spritesheet.textures[texture])
            grass.x = i*tileWidth
            grass.y = j*tileWidth
            app.stage.getChildAt(0).addChild(grass)
        }
    }
}

createFigureAtlasData = () => {
    const atlasData = {
        frames: {},
        meta: {
            image: '../gfx/character_base_32x32.png',
            format: 'RGBA8888',
            size: { w: 128, h: 128 },
            scale: 1
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
                frame: {x: i*32, y: j*32, w:32, h:32},
                sourceSize: {w: 32, h: 32},
                spriteSourceSize: {x:0, y:0, w: 32, h:32}
            }
            atlasData.animations[e].push(frameName)
        }
    });

    return atlasData
}

const animateFigure = (figure, spritesheet) => {
    const deg = rad2limiteddeg(figure.direction)
    const sprite = figure.getChildAt(0)
    let animation

    if (distanceAngles(deg, 0) < 45) {
        animation = 'right'
    } else if (distanceAngles(deg, 90) <= 45) {
        animation = 'down'
    } else if (distanceAngles(deg, 180) < 45) {
        animation = 'left'
    } else {
        animation = 'up'
    }

    if (figure.isDead) {
        figure.angle = 90
    } else if (figure.isAttacking) {
        if (distanceAngles(deg, 0) < 45) {
            figure.angle = 20
        } else if (distanceAngles(deg, 90) <= 45) {
            figure.angle = -20
        } else if (distanceAngles(deg, 180) < 45) {
            figure.angle = -20
        } else {
            figure.angle = 20
        }
    } else {
        figure.angle = 0
    }

    if (sprite.currentAnimation != animation) {
        sprite.currentAnimation = animation
        sprite.textures = spritesheet.animations[animation]
    }

    if (!(figure.speed === 0 || !windowHasFocus || restartGame) && !sprite.playing) {
        sprite.play()
    }
    if ((figure.speed === 0 || !windowHasFocus || restartGame) && sprite.playing) {
        if (figure.speed === 0 && sprite.playing) {
            sprite.currentFrame = 0
        }
        sprite.stop()
    }

    figure.zIndex = figure.y
}

const addFigure = (app, spritesheet, props) => {
    let figure = new PIXI.Container();
    figure = Object.assign(figure, props)

    const sprite = new PIXI.AnimatedSprite(spritesheet.animations.down);
    sprite.anchor.set(0.5)
    sprite.animationSpeed = 0.125
    sprite.scale = 2
    sprite.currentAnimation = 'down'

    figure.addChild(sprite)
    figures.push(figure)
    app.stage.getChildAt(0).addChild(figure)
    app.ticker.add(() => animateFigure(figure, spritesheet))
}

const addFigures = (app, spritesheet) => {
    for (var i = 0; i < maxPlayerFigures; i++) {
        addFigure(app, spritesheet, {
            maxBreakDuration: 5000,
            maxSpeed: 0.08,
            index: i,
            attackDuration: 500,
            attackBreakDuration: 2000,
            points: 0,
            attackDistance: 80,
            attackAngle: 90,
            type: 'fighter',
            zIndexBase: app.stage.getChildAt(0).height 
        })
    }
}

const animatePauseOverlay = overlay => {
    overlay.getChildAt(1).text = isGameStarted ? 'Pause' : 'Welcome to Knirps und Knall'
    overlay.visible = !windowHasFocus
}

const createPauseOverlay = app => {
    const overlay = new PIXI.Container();

    const background = new PIXI.Graphics().rect(0, app.screen.height/4, app.screen.width, app.screen.height/2)
    .fill({alpha: 0.9, color: 0x57412f})

    const text = new PIXI.Text({
        style: {
            fontSize: 0.05*app.screen.width,
            fill: 0xFFFFFF
        }
    })
    text.anchor.set(0.5)
    text.x = app.screen.width/2
    text.y = app.screen.height/2

    overlay.addChild(background)
    overlay.addChild(text)

    app.ticker.add(() => animatePauseOverlay(overlay))
    return overlay
}

const animateFpsText = fpsText => {
    fpsText.text = fps + ' FPS'
    fpsText.visible = windowHasFocus
}

const createFpsText = app => {
    const fpsText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: 0xFFFFFF
        }
    })
    fpsText.anchor.set(1,0)
    fpsText.x = app.screen.width
    fpsText.y = 0

    app.ticker.add(() => animateFpsText(fpsText))
    return fpsText
}

const addOverlay = app => {
    const overlay = new PIXI.Container();
    overlay.zIndex = 4*level.height

    const pauseOverlay = createPauseOverlay(app)
    const fpsText = createFpsText(app)

    overlay.addChild(pauseOverlay)
    overlay.addChild(fpsText)
    app.stage.addChild(overlay)
}

var fillTextWithStroke = (ctx, text,x,y) => {
    ctx.fillText(text,x,y)
    ctx.strokeText(text,x,y)
}

function toggleMusic() {
    if (isMusicMuted()) {
        unmuteAudio()
        if (isGameStarted) {
            playPlaylist(shuffle(musicGame))
        } else {
            playPlaylist(musicLobby)
        }
    } else {
        muteAudio()
        if (isGameStarted) {
            stopPlaylist(musicGame)
        } else {
            stopPlaylist(musicLobby)
        }
    }
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