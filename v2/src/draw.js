const defaultFilterVert = `in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition( void )
{
    vec2 position = aPosition * (2.0) - 1.0;
    position.y *= uOutputTexture.z;

    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    vec2 position = (aPosition * uOutputTexture.xy - uOutputFrame.xy) / uOutputFrame.zw ;
    return position;
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}`

const shadowDefinition = {
    alpha: 0.25,
    angle: 0,
    scale: {x: 1, y: 1.28},
    skew: {x: -0.68, y: 0},
    color: 0x000000
}

const createLoadingText = app => {
    const text = new PIXI.BitmapText({
        text: 'Loading...',
        style: app.textStyleDefault,
    })

    app.stage.addChild(text)
    return text
}

const addHeadline = () => {
    const title = new PIXI.BitmapText({
        text: 'KNIRPS UND KNALL',
        style: app.textStyleDefault,
        anchor: {x: 0.5, y: 1},
        position: {x: level.width/2, y: -level.width*0.005},
        tint: colors.white,
        scale: {x: 1.5, y: 1.5}
    });

    const authors = new PIXI.BitmapText({
        text: 'made by TORSTEN STELLJES & ALEXANDER THURN',
        style: app.textStyleDefault
    });

    authors.anchor.set(1, 1);
    authors.x = level.width;
    authors.y = -level.width*0.005;

    const code = new PIXI.BitmapText({
        text: '',
        style: app.textStyleDefault,
        anchor: {x: 0, y: 1},
        position: {x: 0, y: -level.width*0.005}
    });

  
    levelContainer.addChild(title, authors, code);
    levelContainer.code = code
}

const animateCircleButton = button => {
    const loadingCircle = button.getChildAt(1)
    loadingCircle.scale = button.loadingPercentage
}

const animateLobbyStartButton = button => {
    button.visible = stage === stages.startLobby && players.filter(p => p.joinedTime >= 0).length > 0

    let text = 'Walk here to\nVOTE\n\n'+button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    if (button.playersPossible?.length === 1) {
        text = 'Walk here to\nVOTE\n\nmin 2 players\nor 1 player +1 bot'
    } else if (button.playersPossible?.length > 1 && button.playersNear?.length === button.playersPossible?.length ) {
        text ='Entering LOBBY'
    } else if (button.playersNear?.length > 0) {
        text = 'Walk here to\nVOTE\n\n' + button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    }
    button.getChildAt(2).text = text
}

const animateGameStartButton = button => {
    button.visible = stage === stages.gameLobby

    let text = 'Walk here to\nSTART\n\n'+button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    if (dtProcessed - startTime <= 5000) {
        text = 'PREPARE\nfor the game'
    } else if (button.playersPossible?.length === 1) {
        text = 'Walk here to\nSTART\n\nmin 2 players\nor 1 player +1 bot'
    } else if (button.playersPossible?.length > 1 && button.playersNear?.length === button.playersPossible?.length ) {
        text ='Starting GAME'
    } else if (button.playersNear?.length > 0) {
        text = 'Walk here to\nSTART\n\n' + button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    }
    button.getChildAt(2).text = text
}

const createCircleButton = (props, lobbyContainer) => {
    const {innerRadius} = props

    let button = new PIXI.Container()
    button = Object.assign(button, props)

    const area = new PIXI.Graphics()
    .circle(0, 0, innerRadius)
    .fill({alpha: 0.5, color: colors.darkBrown})

    const loadingCircle = new PIXI.Graphics()
    .circle(0, 0, innerRadius)
    .fill({alpha: 0.5, color: colors.grey})

    const buttonText = new PIXI.BitmapText({
        style: {...app.textStyleDefault, align: 'center'},
        anchor: {x: 0.5, y: 0.5}
    });

    button.addChild(area, loadingCircle, buttonText)
    lobbyContainer.addChild(button)

    addAnimation(button, () => animateCircleButton(button))
    return button
}

const animateRingPartButton = button => {
    button.visible = stage === stages.startLobby && players.filter(p => p.joinedTime >= 0).length > 0

    let votes = 0, oldVotes
    Object.values(players).forEach(player => player.vote === button.gameId && votes++)

    if (button.playersPossible && (oldVotes !== votes || button.numberOldPlayersPossible !== button.playersPossible.length)) {
        oldVotes = votes
        button.numberOldPlayersPossible = button.playersPossible.length

        const loadingArea = button.getChildAt(1)
        loadingArea.clear()

        if (votes > 0) {
            const height = button.outerRadius - button.innerRadius
            const rel = 8
            const partHeight = rel * height / (button.playersPossible.length*rel+button.playersPossible.length-1)
            const margin = partHeight / rel

            let startRadius = button.innerRadius
            for (let index = 0; index < votes; index++) {
                const innerRadius = startRadius
                const outerRadius = innerRadius + partHeight
                startRadius = outerRadius + margin

                loadingArea.arc(0, 0, innerRadius, button.startAngle, button.endAngle)
                .lineTo(Math.cos(button.endAngle)*outerRadius, Math.sin(button.endAngle)*outerRadius)
                .arc(0, 0, outerRadius, button.endAngle, button.startAngle, true)
                .fill({alpha: 0.5, color: games[button.gameId].color})
            }
        }
    }
}

const createRingPartButton = (props, lobbyContainer) => {
    const {x, y, startAngle, endAngle, innerRadius, outerRadius, gameId, getExecute} = props
    const width = distanceAnglesRad(startAngle, endAngle)
    const centerAngle = startAngle + width/2

    let button = new PIXI.Container()
    button = Object.assign(button, {x, y, startAngle, endAngle, innerRadius, outerRadius, gameId, execute: getExecute(button)})
    button.isInArea = f => new PIXI.Circle(x, y, outerRadius).contains(f.x, f.y+f.bodyHeight*0.5) && !(new PIXI.Circle(x, y, innerRadius)).contains(f.x, f.y+f.bodyHeight*0.5) && (distanceAnglesRad(angle(x, y, f.x, f.y+f.bodyHeight*0.5), centerAngle) < width/2)

    const area = new PIXI.Graphics()
    .arc(0, 0, innerRadius, startAngle, endAngle)
    .lineTo(Math.cos(endAngle)*outerRadius, Math.sin(endAngle)*outerRadius)
    .arc(0, 0, outerRadius, endAngle, startAngle, true)
    .fill({alpha: 0.5, color: games[gameId].color})

    const loadingArea = new PIXI.Graphics()

    const buttonText = new PIXI.BitmapText({
        text: games[gameId].text,
        style: {...app.textStyleDefault, align: 'center'}
    });
    buttonText.x = Math.cos(centerAngle)*((innerRadius+outerRadius)/2)
    buttonText.y = Math.sin(centerAngle)*((innerRadius+outerRadius)/2)
    buttonText.anchor.set(0.5)

    button.addChild(area, loadingArea, buttonText)
    lobbyContainer.addChild(button)

    addAnimation(button, () => animateRingPartButton(button))
    return button
}

const addGameRing = (lobbyContainer) => {
    const gameIds = Object.keys(games)
    const startAngle = 270
    const diffAngle = 360/gameIds.length

    gameIds.forEach((gameId, index) => {
        const button = createRingPartButton({...gameVoteButtonDefinition(), startAngle: deg2limitedrad(startAngle+index*diffAngle), endAngle:deg2limitedrad(startAngle+(index+1)*diffAngle), gameId}, lobbyContainer);
        buttons['vote_' + gameId] = button
    })
}

const addGameSelection = (app, lobbyContainer) => {
    const circleButton = createCircleButton(lobbyStartButtonDefinition(), lobbyContainer)
    circleButton.isInArea = f => stage === stages.startLobby && new PIXI.Circle(circleButton.x, circleButton.y, circleButton.innerRadius).contains(f.x, f.y+f.bodyHeight*0.5)
    addGameRing(lobbyContainer)

    buttons.selectGame = circleButton

    app.ticker.add(() => animateLobbyStartButton(circleButton))
}

const addGameStartButton = (app, lobbyContainer) => {
    const circleButton = createCircleButton(gameStartButtonDefinition(), lobbyContainer)
    circleButton.isInArea = f => stage === stages.gameLobby && dtProcessed - startTime > 5000 && new PIXI.Circle(circleButton.x, circleButton.y, circleButton.innerRadius).contains(f.x, f.y+f.bodyHeight*0.5)

    buttons.startGame = circleButton

    app.ticker.add(() => animateGameStartButton(circleButton))
}

const addNetworkQrCode = (app, lobbyContainer) => { 

    const nw = FWNetwork.getInstance();
    nw.qrCodeOptions.background = 'green',
    nw.qrCodeOptions.backgroundAlpha = 1.0,
    nw.qrCodeOptions.foreground = 'white',
    nw.qrCodeOptions.foregroundAlpha = 1.0,
    nw.gamepadLayout = 'simple'
    nw.hostRoom();

    const qrCodeContainer = new PIXI.Container()
    qrCodeContainer.sprite = new PIXI.Sprite()
    qrCodeContainer.sprite.anchor.set(0., 0)
    qrCodeContainer.label = new PIXI.BitmapText( {
        text: '', 
        style: {...app.textStyleDefault, align: 'center'},
    })
    qrCodeContainer.label.anchor.set(0.5, 0)
    qrCodeContainer.addChild(qrCodeContainer.sprite, qrCodeContainer.label)
    lobbyContainer.addChild(qrCodeContainer)

    app.ticker.add(() => {
        const qrWidth = Math.min(level.width,level.height) * 0.25;
        qrCodeContainer.position.set(level.width*0.05, level.height*0.6)
        qrCodeContainer.sprite.texture = nw.qrCodeTexture
        qrCodeContainer.sprite.width = qrCodeContainer.sprite.height = qrWidth;

        qrCodeContainer.label.text = nw.qrCodeBaseUrl + "\n" + nw.roomNumber
        qrCodeContainer.label.position.set(qrCodeContainer.sprite.width*0.5, qrCodeContainer.sprite.height*1)
        qrCodeContainer.label.width =  qrCodeContainer.sprite.width*0.8;
        qrCodeContainer.label.scale.y = qrCodeContainer.label.scale.x;

        levelContainer.code.text = (nw.roomNumber && nw.qrCodeBaseUrl + " " + nw.roomNumber || '')
        levelContainer.code.visible = (stage !== stages.startLobby)
        qrCodeContainer.visible = (stage === stages.startLobby)
    })
}
const animateRectangleButton = button => {
    button.visible = stage === stages.startLobby && players.filter(p => p.joinedTime >= 0).length > 0

    const loadingBar = button.getChildAt(1)
    loadingBar.width = button.width*button.loadingPercentage
}

const createRectangleButton = (props, lobbyContainer) => {
    const {x, y, width, height, loadingPercentage, loadingSpeed, execute} = props

    let button = new PIXI.Container()
    button = Object.assign(button, {x, y, loadingPercentage, loadingSpeed, execute})
    button.isInArea = f => new PIXI.Rectangle(x, y, width, height).contains(f.x, f.y+f.bodyHeight*0.5)

    const loadingBar = new PIXI.Graphics()
    .rect(0, 0, 0.1, height)
    .fill({alpha: 0.5, color: colors.darkBrown})

    const buttonText = new PIXI.BitmapText({
        style: app.textStyleDefault,
        anchor: {x: 0.5, y: 0.5},
        position: {x: width/2, y: height/2},
    });


    const buttonSprite = new PIXI.NineSliceSprite({
        texture: PIXI.Assets.get('fenceAtlas').textures['button'],
        width: width,
        height: height
    })


    button.addChild(buttonSprite, loadingBar, buttonText)
    lobbyContainer.addChild(button)




    addAnimation(button, () => animateRectangleButton(button))
    return button
}

const animateMuteButton = button => {
    button.getChildAt(2).text = isMusicMuted() ? 'Music: OFF' : 'Music: ON'
}

const animateBotsButton = button => {
    button.getChildAt(2).text = 'Bots: ' + getBotCount()
}

const addButtons = (app, lobbyContainer) => {
    Object.entries(rectangleButtonsDefinition()).forEach(([id, button]) => {buttons[id] = createRectangleButton(button, lobbyContainer)})
    
    app.ticker.add(() => animateMuteButton(buttons.mute))
    app.ticker.add(() => animateBotsButton(buttons.bots))
}

const animateShootingRange = button => {
    button.visible = game === games.rampage || game === games.rampagev2
}

const addShootingRange = (app, props, lobbyContainer) => {
    const {x, y, team} = props
    const width = 512
    const height = 128
    const newX = x - width/2
    const newY = y - height/2

    const padding = Math.min(width, height)/4
    const widthInside = width-2*padding
    const heightInside = height-2*padding
    const newXInside = x - widthInside/2
    const newYInside = y - heightInside/2

    const buttonOutside = new PIXI.Graphics()
    .rect(newX, newY, width, height)
    .fill({color: colors.white})
    buttonOutside.execute = () => buttonOutside.playersNear.forEach(f => f.justShot = false) 
    buttonOutside.isInArea = f => stage === stages.gameLobby && (game === games.rampage || game === games.rampagev2) && !(new PIXI.Rectangle(newX, newY, width, height)).contains(f.x, f.y+f.bodyHeight*0.5)

    const buttonInside = new PIXI.Graphics()
    .rect(newXInside, newYInside, widthInside, heightInside)
    .fill({color: teams[team].color})
    buttonInside.execute = () => buttonInside.playersNear.forEach(f => {
        if (f.team === 'sniper' && !f.inactive && !f.justShot) {
            f.inactive = true
            f.justShot = true
            const crosshair = createCrosshair({...f, x: f.x, y: f.y})
            figures.push(crosshair)
        }
    }) 
    buttonInside.isInArea = f => stage === stages.gameLobby && (game === games.rampage || game === games.rampagev2) && new PIXI.Rectangle(newXInside, newYInside, widthInside, heightInside).contains(f.x, f.y+f.bodyHeight*0.5)

    buttons.shootingRangeInside = buttonInside
    buttons.shootingRangeOutside = buttonOutside
    lobbyContainer.addChild(buttonOutside, buttonInside)
    app.ticker.add(() => {
        buttonInside.visible = game === games.rampage || game === games.rampagev2
        buttonOutside.visible = game === games.rampage || game === games.rampagev2
    })
}

const animateTeamSwitcher = (button, games) => {
    button.visible = games.has(game)
   
    //put in createSpriteWithShadowContainer later
    button.house.sprite.zIndex = button.house.y + (1-button.house.sprite.anchor.y)*button.house.sprite.height
}

const createTeamSwitcher = (app, props, lobbyContainer) => {
    const {x, y, games, team} = props
    const width = 128
    const height = 128
    const newX = x - width/2
    const newY = y - height/2

    const button = new PIXI.Container()

    const marker = new PIXI.Graphics()
    .rect(newX, newY, width, height)
    .fill({color: teams[team]?.color >= 0 ? teams[team].color : colors.white})

    const house = createSpriteWithShadowContainer({
        texture: PIXI.Assets.get('house_' + team),
        scaleFactor: { x: 1, y: 1 },
        skewFactor: { x: 1, y: 1 },
        position: { x: newX + width * 0.5, y: newY + height + 3},
        options: {} // ggf. Optionen einfügen
    });

    button.house = house
    button.execute = () => button.playersNear.forEach(f => switchTeam(f, team)) 
    button.isInArea = f => stage === stages.gameLobby && games.has(game) && new PIXI.Rectangle(newX, newY, width, height).contains(f.x, f.y+f.bodyHeight*0.5)
    button.addChild(marker, house)
    lobbyContainer.addChild(button)

    app.ticker.add(() => animateTeamSwitcher(button, games))

    return button
}

const addTeamSwitchers = (app, lobbyContainer) => {
    Object.entries(teamSwitchersDefinition()).forEach(([id, button]) => {buttons[id] = createTeamSwitcher(app, button, lobbyContainer)})
}

const animateLobbyItems = lobbyContainer => {
    lobbyContainer.visible = stage === stages.startLobby || stage === stages.gameLobby
}

const addLobbyItems = (app) => {
    const lobbyContainer = new PIXI.Container()
    addGameSelection(app, lobbyContainer)
    addGameStartButton(app, lobbyContainer)
    addButtons(app, lobbyContainer)
    addShootingRange(app, shootingRangeDefinition(), lobbyContainer)
    addTeamSwitchers(app, lobbyContainer)
    addNetworkQrCode(app, lobbyContainer)

    const fontHeight = 32
    const howToPlay = new PIXI.BitmapText({
        text: 'HOW TO PLAY\n\nJoin by pressing any key on your Gamepad' 
            + '\nor WASDT(Key1) or ' + String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0(RSHIFT)\nor touch' 
            + '\n\n1.) Find your player 2.) Fart to knock out others\n3.) Stay hidden 4.) Eat to power up your farts' 
            + '\n\nBe the last baby standing!',
        style: {
            align: 'center',
            fontSize: fontHeight,
            fill: colors.white
        }
    });

    howToPlay.anchor.set(0.5, 0)
    howToPlay.x = level.width*0.22+fontHeight
    howToPlay.y = level.height*0.1
    howToPlay.visible = false

    lobbyContainer.addChild(howToPlay)
    levelContainer.addChild(lobbyContainer)

    app.ticker.add(() => animateLobbyItems(lobbyContainer))
}

const getScoreDefaultX = player => {
    const offx = 48*1.2
    const playerIndex = playersSortedByJoinTime.indexOf(player)
    return 32+playerIndex*offx
}

const animatePlayerScore = figure => {
    const {player} = figure
    if (figure.team !== figure.oldTeam) {
        player.score.getChildAt(0).tint = teams[figure.team]?.color || colors.black
        figure.oldTeam = figure.team
    }

    if (!restartStage) {
        var lp = Math.min((dtProcessed - player.joinedTime) / moveNewPlayerDuration, 1)

        player.score = Object.assign(player.score, getLinePoint(lp, {x: level.width*0.5, y: level.height*0.5}, {x: getScoreDefaultX(player), y: player.score.yDefault}))
        player.score.scale = getIntervalPoint(lp, 12, 1)
    }

    player.score.getChildAt(1).text = player.score.shownPoints

    if (player.isMarkerButtonPressed) {
        const shakeMargin = 10
        player.score.x += (Math.random()-0.5)*shakeMargin*player.score.scale.x
        player.score.y += (Math.random()-0.5)*shakeMargin*player.score.scale.y
    }
}

const botCircleContext = new PIXI.GraphicsContext().rect(-24,-24, 48,48).fill({alpha: 0.5, color: colors.white}).stroke({alpha: 0.5, color: colors.black, width: 1})
const playerCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: colors.white}).stroke({alpha: 0.5, color: colors.black, width: 1})

const addPlayerScore = figure => {
    let playerScore = new PIXI.Container()
    playerScore.yDefault = level.height+32
    initPlayerScore(playerScore)

    let circle
    if (figure.player.type === 'bot') {
        circle = new PIXI.Graphics(botCircleContext)
    } else {
        circle = new PIXI.Graphics(playerCircleContext)
    }
    circle.tint = colors.black
    
    const text = new PIXI.BitmapText({
        text: 0,
        style: app.textStyleDefault,
        anchor: {x: 0.5, y: 0.5},
        scale: {x: 1.1, y: 1.1},
    });

    figure.player.score = playerScore
    playerScore.addChild(circle, text)
    levelContainer.addChild(playerScore)
    scoreLayer.attach(playerScore)

    addAnimation(playerScore, () => animatePlayerScore(figure))
}

const animateWinningCeremony = winnerText => {
    if (!lastRoundEndThen) {
        return
    }

    let playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')

    if (game === games.rampage) {
        playerFigures = playerFigures.filter(f => f.team === 'killer')
    }

    const playerFiguresSortedByNewPoints = playerFigures.toSorted((f1,f2) => (f1.player.score.points-f1.player.score.oldPoints) - (f2.player.score.points-f2.player.score.oldPoints))

    const dt3 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration);
    const dt4 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);

    playerFiguresSortedByNewPoints.forEach((f, i) => {
        f.player.score.zIndex = i
        const dt2 = dtProcessed - (lastRoundEndThen + i*moveScoreToPlayerDuration);
        
        if (dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
            const lp = dt2 / moveScoreToPlayerDuration

            f.player.score = Object.assign(f.player.score, getLinePoint(lp, {x: getScoreDefaultX(f.player), y: f.player.score.yDefault}, f))

            if (lastFinalWinnerPlayerIds?.has(f.playerId)) {
                f.player.score.scale = getIntervalPoint(lp, 1, 2)*getIntervalPoint(lp, 1, 2)
            } else {
                f.player.score.scale = getIntervalPoint(lp, 1, 2)
            }

            if (lastWinnerPlayerIds?.has(f.playerId)) {
                f.player.score.getChildAt(0).tint = colors.gold
            }
        } else if (dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
            f.player.score.x = f.x
            f.player.score.y = f.y
            if (lastFinalWinnerPlayerIds?.has(f.playerId)) {
                f.player.score.scale = 4
            } else {
                f.player.score.scale = 2
            }
            f.player.score.shownPoints = f.player.score.points
        } else if (dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
            const lp = dt4 / moveScoreToPlayerDuration

            f.player.score = Object.assign(f.player.score, getLinePoint(lp, f, {x: getScoreDefaultX(f.player), y: f.player.score.yDefault}))

            f.player.score.scale = f.player.score.scale = getIntervalPoint(lp, 2, 1)
            if (lastFinalWinnerPlayerIds) {
                f.player.score.shownPoints = 0
            }

            f.player.score.getChildAt(0).tint = teams[f.team] ? teams[f.team].color : colors.black
        }
    })
    
    if (gameOver && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
        winnerText.visible = true
        if (game === games.rampage) {
            const points = playerFigures[0].player.score.shownPoints
            winnerText.text = `${points} innocents were killed`
        } else if (finalWinnerTeam) {
            winnerText.tint = teams[finalWinnerTeam].color
            winnerText.text = `${teams[finalWinnerTeam].label} win`
        } else {
            const lastFinalWinnerFigure = playerFigures.find(f => lastFinalWinnerPlayerIds?.has(f.playerId))
            const lastFinalWinnerIndex = playersSortedByJoinTime.indexOf(lastFinalWinnerFigure?.player)
            const lastFinalWinnerNumber = lastFinalWinnerIndex+1
            if (figureIsBot(lastFinalWinnerFigure)) {
                winnerText.text = `Player ${lastFinalWinnerNumber} (Bot) wins`
            } else {
                winnerText.text = `Player ${lastFinalWinnerNumber} wins`
            }
        }
    } else {
        winnerText.visible = false
    }

    if (dt4 >= moveScoreToPlayerDuration) {
        ceremonyOver = true
    }
}

const addWinningCeremony = app => {
    let winnerText = new PIXI.BitmapText({
        style: {
            fontFamily: 'KnallWinning',
            fontSize: 256
        },
        anchor: {x: 0.5, y: 0.5},
        position: {x: level.width/2, y: level.height/2},
    })

    levelContainer.addChild(winnerText)
    overlayLayer.attach(winnerText)

    app.ticker.add(() => animateWinningCeremony(winnerText))
}

const animateFood = figure => {
    figure.visible = stage !== stages.startLobby && game === games.food

    const plate = figure.getChildByLabel('plate')
    let durationLastAttack = dtProcessed-figure.lastAttackTime
    if (figure.lastAttackTime && durationLastAttack < figure.attackDuration) {
        const perc = durationLastAttack/figure.attackDuration
        figure.scale = 1 - 0.2 * Math.sin(perc*Math.PI)
    }

    const marker = figure.getChildByLabel('marker')
    marker.visible = showDebug
}

const addFood = (app, texture, props) => {
    let food = new PIXI.Container()
    food = Object.assign(food, props)

    const plate = new PIXI.Sprite({texture: PIXI.Assets.get('plate'), 
        width: food.attackDistance*2,
        height: food.attackDistance*2,
        label: 'plate',
        anchor: {x: 0.5, y: 0.5},
    })
    
    const meal = new PIXI.Sprite(texture)
    meal.scale = 1.2

    const marker = new PIXI.Graphics(figureMarker)
    marker.tint = colors.blue
    marker.label = 'marker'

    food.addChild(plate, meal, marker)
    figuresInitialPool.add(food)
    levelContainer.addChild(food)
    debugLayer.attach(marker)

    app.ticker.add(() => animateFood(food))
}

const addFoods = (app) => {
    Object.keys(foodDefinition()).forEach(key => {
        addFood(app, PIXI.Assets.get(key), {
            id: key,
            type: 'bean',
            attackDistance: 48,
            lastAttackTime: undefined,
            attackDuration: beanAttackDuration
        })
    })
}

const addGrass = () => {
    levelContainer.addChild(PIXI.Sprite.from('background_grass'))
}


const addLevelBoundary = (app) => {
    const spritesheet = PIXI.Assets.get('fenceAtlas')

    const tree1 = createSpriteWithShadowContainer({ texture: spritesheet.textures['tree1'], scaleFactor: { x: 1, y: 1 }, skewFactor: { x: 1, y: 1 }, position: { x: level.width * 0.3, y: level.height * 0.1 }, options: {} });
    const tree2 = createSpriteWithShadowContainer({ texture: spritesheet.textures['tree2'], scaleFactor: { x: 1, y: 1 }, skewFactor: { x: 1, y: 1 }, position: { x: level.width * 0.8, y: level.height * 0.6 }, options: {} });
    const tree3 = createSpriteWithShadowContainer({ texture: spritesheet.textures['tree3'], scaleFactor: { x: 1, y: 1 }, skewFactor: { x: 1, y: 1 }, position: { x: level.width * 0.9, y: level.height * 0.9 }, options: {} });

    
    const fenceLower = createSpriteWithShadowContainer({ texture: spritesheet.textures['fence_horizontal'], scaleFactor: { x: 1, y: 1.3 }, skewFactor: { x: 1, y: 1 }, position: { x: level.width * 0.0, y: level.height * 1 }, anchor: { x: 0.0, y: 0.9 }, options: { tilingSprite: { tileScale: { x: 0.28, y: 0.28 }, tilePosition: { x: 0, y: 0 } } } });
    fenceLower.shadow.width = fenceLower.sprite.width=level.width
    fenceLower.shadow.height = fenceLower.sprite.height=level.height*0.04

    const fenceUpper = createSpriteWithShadowContainer({ texture: spritesheet.textures['fence_horizontal'], scaleFactor: { x: 1, y: 1.3 }, skewFactor: { x: 1, y: 1 }, position: { x: level.width * 0.0, y: level.height * 0.03 }, anchor: { x: 0.0, y: 0.9 }, options: { tilingSprite: { tileScale: { x: 0.28, y: 0.28 }, tilePosition: { x: 0, y: 0 } } } });
    fenceUpper.shadow.width = fenceUpper.sprite.width=level.width
    fenceUpper.shadow.height = fenceUpper.sprite.height=level.height*0.04
    fenceUpper.sprite.zIndex = -level.height
    
    const fenceLeft = createSpriteWithShadowContainer({ texture: spritesheet.textures['fence_horizontal'], scaleFactor: { x: 1.5 / shadowDefinition.scale.x, y: 1 / shadowDefinition.scale.y }, skewFactor: { x: 0, y: 0 }, position: { x: -level.width * 0.001, y: level.height * 0.00 }, anchor: { x: 0.0, y: 0.0 }, options: { tilingSprite: { tileScale: { x: 0.4, y: 0.4 }, tilePosition: { x: 0, y: 0 } } } });
    fenceLeft.shadow.width = fenceLeft.sprite.width=level.width*0.006
    fenceLeft.shadow.height = fenceLeft.sprite.height=level.height
    fenceLeft.sprite.zIndex = level.height
   // fenceLeft.shadow.position.x = 5

    
    const fenceRight = createSpriteWithShadowContainer({ texture: spritesheet.textures['fence_horizontal'], scaleFactor: { x: 1.5 / shadowDefinition.scale.x, y: 1 / shadowDefinition.scale.y }, skewFactor: { x: 0, y: 0 }, position: { x: level.width * 1, y: level.height * 0.00 }, anchor: { x: 1, y: 0.0 }, options: { tilingSprite: { tileScale: { x: 0.4, y: 0.4 }, tilePosition: { x: 0, y: 0 } } } });
    fenceRight.shadow.width = fenceRight.sprite.width=level.width*0.006
    fenceRight.shadow.height = fenceRight.sprite.height=level.height
    fenceRight.sprite.zIndex = level.height
    
    const randomStuffTextureNames = ['bush1', 'bush2', 'bush3', 'chair', 'bush4', 'bush5', 'bush6', 'flower1', 'flower2', 'mushroom', 'lamp']
    const randomStuffTextureNamesFlat = ['butterfly', 'cap', 'kite']
    
    const randomStuff = new PIXI.Container()

    for (let i = 0; i < randomStuffTextureNamesFlat.length; i++) {
        const randomX =  level.width*0.05 + Math.random() * level.width*0.3
        const randomY = level.height*0.05 + Math.random() * level.height*0.4
        const elem =  new PIXI.Sprite({ texture: PIXI.Assets.get(randomStuffTextureNamesFlat[i]), position: { x:randomX, y: randomY } });
        randomStuff.addChild(elem)
    }

    for (let i = 0; i < randomStuffTextureNames.length; i++) {
        const randomX =  level.width*0.05 + Math.random() * level.width*0.3
        const randomY = level.height*0.05 + Math.random() * level.height*0.4
        const elem =  createSpriteWithShadowContainer({ texture: PIXI.Assets.get(randomStuffTextureNames[i]), position: { x:randomX, y: randomY }, options: {} });
        randomStuff.addChild(elem)
    }




    levelContainer.addChild(randomStuff, tree1, tree2, tree3, fenceLower, fenceUpper, fenceLeft, fenceRight)
}

const createSpriteWithShadowContainer = ({texture, scaleFactor, skewFactor, position, anchor, options}) => { 
    const container = new PIXI.Container()
    container.position.set(position.x, position.y)
    if (options?.tilingSprite) {
        container.sprite = new PIXI.TilingSprite({texture: texture, tileScale: options.tilingSprite.tileScale, tilePosition: options.tilingSprite.tilePosition}) 
    } else {
        container.sprite = new PIXI.Sprite(texture)
    }
    anchor && container.sprite.anchor.set(anchor.x, anchor.y)
    container.sprite.zIndex = container.y + (1-container.sprite.anchor.y)*container.sprite.height
    figureLayer.attach(container.sprite)
    container.shadow = createShadow(container.sprite, scaleFactor, skewFactor, container.y)
    container.addChild(container.sprite, container.shadow)
    return container
}

const createShadow = (spriteOriginal, scaleFactor, skewFactor, zIndex) => {
    let shadow = new PIXI.Sprite(spriteOriginal.texture)
    if (spriteOriginal instanceof PIXI.TilingSprite) {
        shadow = new PIXI.TilingSprite({texture: spriteOriginal.texture, tileScale: spriteOriginal.tileScale, tilePosition: spriteOriginal.tilePosition}) 
  
    }
    shadow.scale.set((scaleFactor?.x ?? 1)* shadowDefinition.scale.x, (scaleFactor?.y ?? 1)* shadowDefinition.scale.y)
    shadow.skew.set((skewFactor?.x ?? 1)* shadowDefinition.skew.x, (skewFactor?.y ?? 1)*shadowDefinition.skew.y)
    shadow.alpha = shadowDefinition.alpha
    shadow.tint = shadowDefinition.color
    shadow.anchor.set(spriteOriginal.anchor.x, spriteOriginal.anchor.y)
    shadow.zIndex = zIndex
    figureShadowLayer.attach(shadow)
    return shadow
}

const animateFigure = (figure, spritesheet) => {
    const deg = rad2limiteddeg(figure.direction)
    const body = figure.getChildByLabel('body')
    const marker = figure.getChildByLabel('marker')
    const shadow = figure.getChildByLabel('shadow')
    let animation

    if (distanceAnglesDeg(deg, 0) < 45) {
        animation = 'right'
    } else if (distanceAnglesDeg(deg, 90) <= 45) {
        animation = 'down'
    } else if (distanceAnglesDeg(deg, 180) < 45) {
        animation = 'left'
    } else {
        animation = 'up'
    }
    animation = figure.currentSprite + '_' + animation

    if (figure.isDead && (!(stage === stages.game && (game === games.rampage || game === games.rampagev2)) || figure.isDeathDetected)) {
        body.angle = 90
        body.y = figure.bodyHeight/4
        figureLayer.detach(body)
        shadow.visible = false
    } else {
        if (figure.isAttacking && (!(stage === stages.game && (game === games.rampage || game === games.rampagev2)) || figure.isDetected)) {
            if (distanceAnglesDeg(deg, 0) < 45) {
                body.angle = 20
            } else if (distanceAnglesDeg(deg, 90) <= 45) {
                body.angle = -20
            } else if (distanceAnglesDeg(deg, 180) < 45) {
                body.angle = -20
            } else {
                body.angle = 20
            }
        } else {
            body.angle = 0
        }
        body.y = 0
        figureLayer.attach(body)
        shadow.visible = true
    }

    if (figure.player?.isMarkerButtonPressed && !restartStage) {
        body.tint = colors.purple
    } else {
        body.tint = undefined
    }

    if (body.currentAnimation != animation) {
        body.currentAnimation = animation
        body.textures = spritesheet.animations[animation]

        shadow.currentAnimation = animation
        shadow.textures = spritesheet.animations[animation]
    }

    body.anchor.x = body.textures[body.currentFrame].defaultAnchor.x
    body.anchor.y = body.textures[body.currentFrame].defaultAnchor.y
    shadow.anchor.x = 0.1
    shadow.anchor.y = body.textures[body.currentFrame].defaultAnchor.y
    
    if (!(figure.speed === 0 || !windowHasFocus || restartStage) && !body.playing) {
        body.play()
        shadow.play()
    } else if ((figure.speed === 0 || !windowHasFocus || restartStage) && body.playing) {
        if (figure.speed === 0 && body.playing) {
            body.currentFrame = 0
            shadow.currentFrame = 0
        }
        body.stop()
        shadow.stop()
    }

    if (figure.speed > 0) {
        const animationSpeedFactor = 1.5
        body.animationSpeed = animationSpeedFactor * figure.speed
        shadow.animationSpeed = animationSpeedFactor * figure.speed
    }
   
    body.zIndex = figure.y + (1-body.anchor.y)*body.height
    marker.zIndex = figure.y
}

const figureMarker = new PIXI.GraphicsContext().circle(0, 0, 5).fill()

const animateFigureMarker = (attackArc, figure) => {
    attackArc.rotation = figure.direction
    attackArc.visible = showDebug && figure.isAttacking
}

createFigureMarker = figure => {
    const markerContainer = new PIXI.Container()
    const marker = new PIXI.Graphics(figureMarker)

    const markerText = new PIXI.BitmapText({
        style: app.textStyleDefault,
        scale: 0.5,
        anchor: {x: 0, y: 1},
    })

    markerContainer.addChild(marker, markerText)

    app.ticker.add(() => {
        marker.tint = figure.playerId ? colors.red : colors.green
        markerText.text = figure.playerId ? figure.playerId + ' ' + figure.beans.size : ''
        markerContainer.visible = showDebug
    })
    return markerContainer
}

const animateAttackArc = (attackArc, figure) => {
    attackArc.rotation = figure.direction + Math.PI
    attackArc.visible = showDebug && figure.isAttacking
}

const createAttackArc = figure => {
    const attackArcContainer = new PIXI.Container()
    
    let startAngle = deg2rad(-figure.attackAngle/2)
    let endAngle = startAngle + deg2rad(figure.attackAngle)
    const attackArc = new PIXI.Graphics().moveTo(0, 0).arc(0, 0, figure.attackDistance, startAngle, endAngle).fill({alpha: 0.2, color: colors.black})
    attackArcContainer.addChild(attackArc)

    app.ticker.add(() => animateAttackArc(attackArcContainer, figure))
    return attackArcContainer
}

const createFigure = (app, spritesheet, props) => {
    let figure = new PIXI.Container({sortableChildren: false});
    figure = Object.assign(figure, props)

    const body = new PIXI.AnimatedSprite(spritesheet.animations.baby_down)
    //body.anchor.set(0.5)
    body.scale = 2
    body.label = 'body'

    const shadow = new PIXI.AnimatedSprite(spritesheet.animations.baby_down)
    //shadow.anchor.set(0.1, 0.5)
    shadow.alpha = shadowDefinition.alpha
    shadow.scale.set(2*shadowDefinition.scale.x, 2*shadowDefinition.scale.y)
    shadow.skew.set(shadowDefinition.skew.x, shadowDefinition.skew.y)
    shadow.tint = shadowDefinition.color
    shadow.label = 'shadow'

    const attackArc = createAttackArc(figure)
    attackArc.label = 'attackArc'
    const marker = createFigureMarker(figure)
    marker.label = 'marker'

    figure.bodyHeight = body.height
    figure.currentSprite = 'baby'
    figure.defaultSprite = 'baby'
    figure.addChild(body, attackArc, marker, shadow)
    figureShadowLayer.attach(shadow)
    figureLayer.attach(body)
    debugLayer.attach(attackArc, marker)
    levelContainer.addChild(figure)

    addAnimation(figure, () => animateFigure(figure, spritesheet))
    return figure
}

const addSniperFigures = (app, sniperFigures) => {
    let spritesheet = PIXI.Assets.get('figureAtlas')
    sniperFigures.forEach(f => {
        const crosshair = createCrosshair({...f, x: f.x, y: f.y, ammo: 3})
        
        // NPC replacement in level
        const figure = createFigure(app, spritesheet, {
            maxBreakDuration: 5000,
            maxSpeed: 0.08,
            attackDuration: 500,
            attackBreakDuration: 2000,
            points: 0,
            attackDistance: 80,
            attackAngle: 90,
            type: 'fighter',
        })

        figuresPool.add(crosshair)
        figuresPool.add(figure)
    })
}

const addFiguresInitialPool = (app) => {
    let spritesheet = PIXI.Assets.get('figureAtlas')
    for (var i = 0; i < maxPlayerFigures; i++) {
        const figure = createFigure(app, spritesheet, {
            maxBreakDuration: 5000,
            maxSpeed: 0.08,
            attackDuration: 500,
            attackBreakDuration: 2000,
            points: 0,
            attackDistance: 80,
            attackAngle: 90,
            type: 'fighter',
        })
        figuresInitialPool.add(figure)
    }
    for (var i = 0; i < numberVIPs; i++) {
        const figure = createFigure(app, spritesheet, {
            maxBreakDuration: 5000,
            attackDuration: 500,
            attackBreakDuration: 2000,
            points: 0,
            attackDistance: 80,
            attackAngle: 90,
            type: 'fighter',
        })
        switchTeam(figure, 'vip')

        app.ticker.add(() => {
            figure.visible = game === games.vip
        })
        figuresInitialPool.add(figure)
    }
}

const createCrosshair = props => {
    const {x, y, player, team, ammo} = props

    const crosshair = PIXI.Sprite.from('crosshair')
    crosshair.x = x
    crosshair.y = y
    crosshair.scale = 2
    crosshair.anchor.set(0.5)
    crosshair.alpha = 0.5
    crosshair.ammo = ammo || Infinity
    crosshair.maxAmmo = ammo || Infinity
    crosshair.attachRadius = 80
    crosshair.attackBreakDuration = 500
    crosshair.attackDuration = 0
    crosshair.attackRectX = 32
    crosshair.attackRectY = 64
    crosshair.detectRadius = detectRadius
    crosshair.maxSpeed = 0.32
    crosshair.playerId = player.playerId
    crosshair.player = player
    crosshair.team = team
    crosshair.tint = player.crosshairColor
    crosshair.type = 'crosshair'

    levelContainer.addChild(crosshair)
    crosshairLayer.attach(crosshair)

    return crosshair
}

const addOverlay = app => {
    const circleOfDeathGraphic = createCircleOfDeath(app)
    const countdown = createCountdown(app)
    const touchControl = createTouchControl(app)
    const fpsText = createFpsText(app)
    const pauseOverlay = createPauseOverlay(app)

    circleOfDeath = circleOfDeathGraphic
    levelContainer.addChild(circleOfDeathGraphic, countdown)
    app.stage.addChild(touchControl, fpsText, pauseOverlay)
    overlayLayer.attach(circleOfDeathGraphic, countdown, touchControl, fpsText, pauseOverlay)
}

const animateCircleOfDeath = circle => {
    circle.visible = stage === stages.game && game === games.battleRoyale
    
    if (circle.visible) {
        circle.clear().circle(0, 0, circle.radius)
        .stroke({alpha: 0.8, color: colors.darkBrown, width: 30})
    }
}

const createCircleOfDeath = app => {
    let circle = new PIXI.Graphics()
    Object.assign(circle, circleOfDeathDefinition())

    app.ticker.add(() => animateCircleOfDeath(circle))
    return circle
}

const animateCountdown = countdown => {
    countdown.visible = false
    if (stage === stages.game && game.countdown) {
        countdown.visible = true
        if (!restartStage ) {
            countdown.text = getCountdownText(dtProcessed, startTime+game.countdown*1000)
        }
    }
}

const createCountdown = app => {
    const countdown = new PIXI.BitmapText({
        style: {
            fontFamily: 'KnallStroke'
        },
        anchor: {x: 0.5, y: 0.5},
        position: {x: level.width/2, y: 0.9*level.height},
        scale: {x: 2, y: 2},
    })

    app.ticker.add(() => animateCountdown(countdown))
    return countdown
}

const animatePauseOverlay = (app, overlay, time) => {
    const background = overlay.getChildByLabel('background')
    const text = overlay.getChildByLabel('text')
    background.height = app.screen.height
    background.width = app.screen.width
    background.y = 0
    text.text = (stage !== stages.startLobby) ? 'Pause' : '   Welcome to\nKnirps und Knall\n \n Press any key'
    text.x = Math.sin(time.lastTime/1000)*10 + app.screen.width/2
    text.y = Math.cos(time.lastTime/1000)*10 + app.screen.height/2
    overlay.visible = !windowHasFocus
}

const createPauseOverlay = app => {
    const overlay = new PIXI.Container();

    const background = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height)
    .fill({alpha: 0.3, color: colors.darkBrown})
    background.label = 'background'

    const text = new PIXI.BitmapText({
        style: {
            fontFamily: 'KnallTitle'},
        anchor: {x: 0.5, y: 0.5},
        label: 'text',
        scale: {x: 2, y: 2},
        position: {x: app.screen.width/2, y: app.screen.height/2},

    })

    overlay.addChild(background, text)

    app.ticker.add((time) => animatePauseOverlay(app, overlay, time))
    return overlay
}

const animateFpsText = (app, fpsText) => {
    fpsText.x = app.screen.width
    fpsText.text = fps + ' FPS'
    fpsText.visible = windowHasFocus
}

const createFpsText = app => {
    const fpsText = new PIXI.BitmapText({
        style: app.textStyleDefault,
        anchor: {x: 1, y: 0},
        position: {x: app.screen.width, y: 0},
        scale: {x: 0.5, y: 0.5},
    })

    app.ticker.add(() => animateFpsText(app, fpsText))
    return fpsText
}

const animatePlayersText = playersText => {
    const text = ['Players']
    players.forEach(p => {
        text.push(p.playerId + ' xAxis: ' + p.xAxis.toFixed(2) + ' yAxis: ' + p.yAxis.toFixed(2) + ' Attack?: ' + p.isAttackButtonPressed)
    })
    playersText.text = text.join('\n')
}

const createPlayersText = app => {
    const playersText = new PIXI.BitmapText({
        style: app.textStyleDefault,
        anchor: {x: 0, y: 0},   
        position: {x: 0, y: 0},
        scale: {x: 0.5, y: 0.5},
    })

    app.ticker.add(() => animatePlayersText(playersText))
    return playersText
}

const animateFiguresText = (app, figuresText) => {
    const text = ['Figures with player']
    figures.filter(f => f.playerId).forEach(f => {
        text.push('playerId: ' + f.playerId + ' x: ' + Math.floor(f.x) + ' y: ' + Math.floor(f.y) + ' Beans: ' + f.beans?.size + ' Team: ' + f.team)
    })
    figuresText.text = text.join('\n')
    figuresText.y = app.screen.height
}

const createFiguresText = app => {
    const figuresText = new PIXI.BitmapText({
        style: app.textStyleDefault,
        anchor: {x: 0, y: 1},   
        position: {x: 0, y: 0},
        scale: {x: 0.5, y: 0.5}
    })

    app.ticker.add(() => animateFiguresText(app, figuresText))
    return figuresText
}

const createTouchControl = app => {
    const touchControl = new PIXI.Container()

    let minHeightWidth = Math.min(app.screen.width, app.screen.height)
    const radius = 0.18*minHeightWidth

    const moveControl = new PIXI.Container()
    const moveControlBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.3, color: colors.white})
    const moveControlStick = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 0.3, color: colors.white})
    moveControl.addChild(moveControlBackground, moveControlStick)
    moveControl.startRadius = radius

    const attackControl = new PIXI.Container()
    const attackControlButton = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.4, color: colors.white})
    attackControl.addChild(attackControlButton)
    attackControl.startRadius = radius

    btnTouchController = moveControl
    btnTouchAction = attackControl
    touchControl.addChild(moveControl, attackControl)

    app.ticker.add(() => {
        let minHeightWidth = Math.min(app.screen.width, app.screen.height)
        const distanceToBorder = 0.3*minHeightWidth
        const radius = 0.18*minHeightWidth

        const mp = touchPlayers.length > 0 ? touchPlayers[0] : touches[0]
        touchControl.visible = false // mp.pointerType === 'touch' TODO: Alex touch not working nicely

        moveControl.radius = radius
        moveControl.scale = radius/moveControl.startRadius
        moveControl.x = distanceToBorder
        moveControl.y = app.screen.height - distanceToBorder

        attackControl.radius = radius
        attackControl.scale = radius/attackControl.startRadius
        attackControl.x = app.screen.width - distanceToBorder
        attackControl.y = app.screen.height - distanceToBorder

        const xy = move(0, 0, angle(0, 0, mp.xAxis, mp.yAxis), radius/2, mp.isMoving)
        moveControlStick.x = xy.x || 0
        moveControlStick.y = xy.y || 0
        attackControl.alpha = mp.isAttackButtonPressed ? 1 : 0.75
    })

    return touchControl
}

const addDebug = app => {
    const debugContainer = new PIXI.Container();

    const playersText = createPlayersText(app)
    const figuresText = createFiguresText(app)

    debugContainer.addChild(playersText, figuresText)
    app.stage.addChild(debugContainer)
    debugLayer.attach(debugContainer)

    app.ticker.add(() => {
        debugContainer.visible = showDebug
    })
}

const animateFartCloud = cloud => {
    if (cloud.attackDistanceMultiplier) {
        cloud.scale = cloud.attackDistanceMultiplier
    }

    if (!(!windowHasFocus || restartStage) && !cloud.playing) {
        cloud.play()
    }
    if ((!windowHasFocus || restartStage) && cloud.playing) {
        cloud.stop()
    }
}

const addFartCloud = (props) => {
    let cloud = new PIXI.AnimatedSprite(PIXI.Assets.get('fenceAtlas').animations.vapor_cloud)
    cloud = Object.assign(cloud, {
        type: 'cloud',
        attackAngle: 360,
        direction: 0,
        isAttacking: false,
        attackDuration: 10000000,
        attackDistance: 64,
        lifetime: 0,
        ...props
    })
    cloud.tint = colors.lightBrown
    cloud.animationSpeed = 0.1
    figures.push(cloud)
    levelContainer.addChild(cloud)
    cloudLayer.attach(cloud)

    addAnimation(cloud, () => animateFartCloud(cloud))
}

const addFog = app => {
    let uViewPointDefinition = ''
    let uViewPointExecution = ''
    let uViewPointUniforms = {}

    for (let i = 0; i < maxPlayerFigures; i++) {
        uViewPointDefinition += `uniform vec2 uViewPoint${i};`
        uViewPointExecution += `if(${i} < uNumViewPoints) {updateVisibility(pixelPos, uViewPoint${i});}`
        uViewPointUniforms[`uViewPoint${i}`] = {type: 'vec2<f32>'}
    }

    const fogFilter = new PIXI.Filter({
        glProgram: new PIXI.GlProgram({
            fragment: `
            precision mediump float;
            in vec2 vTextureCoord;

            uniform sampler2D uTexture;
            uniform vec2 uResolution;
            ${uViewPointDefinition}
            uniform int uNumViewPoints;
            uniform float uRadius;

            const float baseFog = 0.5;
            float visibility = 0.0;

            void updateVisibility(vec2 pixelPos, vec2 center) {
                float dist = distance(pixelPos, center);
                float softness = uRadius * 0.3;
                float localVis = 1.0-smoothstep(uRadius-softness, uRadius, dist);
                visibility = max(visibility, localVis);
            }

            void main() {
                vec2 pixelPos = vec2(vTextureCoord.x, vTextureCoord.y)*uResolution;

                ${uViewPointExecution}

                vec4 fg = texture2D(uTexture, vTextureCoord);
                fg.a = mix(baseFog, 0.0, visibility);

                gl_FragColor = fg;
            }`,
            vertex: defaultFilterVert
        }),
        resources: {
            myUniforms: {
                uResolution: {value: [level.width, level.height], type: 'vec2<f32>'},
                uRadius: {value: detectRadius, type: 'f32'},
                uNumViewPoints: {type: 'i32'},
                ...uViewPointUniforms
            },
        },
    });

    const fog = new PIXI.Sprite(PIXI.Texture.WHITE)
    fog.width = level.width
    fog.height = level.height
    fog.tint = 0x000000
    fog.filters = [fogFilter]
    levelContainer.addChild(fog)
    fogLayer.attach(fog)

    app.ticker.add(() =>
    {
        fog.visible = stage === stages.game && (game === games.rampage || game === games.rampagev2)

        const crosshairs = figures.filter(f => f.playerId && f.type === 'crosshair')
        fogFilter.resources.myUniforms.uniforms.uNumViewPoints = crosshairs.length
        crosshairs.forEach((f, i) => {
            fogFilter.resources.myUniforms.uniforms[`uViewPoint${i}`] = [f.x, f.y]
        })
    })
}

