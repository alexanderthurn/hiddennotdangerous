const shadowDefinition = {
    alpha: 0.3,
    angle: 0,
    scale: {x: 1, y: 1.28},
    skew: {x: -0.68, y: 0},
    color: 0x000000
}

const createLoadingText = app => {
    const text = new PIXI.Text({
        text: 'Loading...',
        style: {
            fontFamily: 'Serif',
            fontSize: app.screen.height*0.1,
            fill: colors.white
        }
    })

    app.stage.addChild(text)
    return text
}

const addHeadline = () => {
    const title = new PIXI.Text({
        text: 'KNIRPS UND KNALL',
        style: {
            fontSize: level.width*0.02,
            fill: colors.white
        }
    });

    title.anchor.set(0.5, 1);
    title.x = level.width/2;
    title.y = -level.width*0.005;

    const authors = new PIXI.Text({
        text: 'made by TORSTEN STELLJES & ALEXANDER THURN',
        style: {
            fontSize: level.width*0.012,
            fill: colors.white
        }
    });

    authors.anchor.set(1, 1);
    authors.x = level.width;
    authors.y = -level.width*0.005;

    const code = new PIXI.Text({
        text: '',
        style: {
            fontSize: level.width*0.012,
            fill: colors.white
        },
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
    button.visible = stage === stages.startLobby && figures.filter(f => f.playerId && f.type === 'fighter').length > 0

    let text = 'Vote to\nSTART\n\n'+button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    if (button.playersPossible?.length === 1) {
        text = 'Vote to\nSTART\n\nmin 2 players\nor 1 player +1 bot'
    } else if (button.playersPossible?.length > 1 && button.playersNear?.length === button.playersPossible?.length ) {
        text ='Prepare your\nbellies'
    } else if (button.playersNear?.length > 0) {
        text = 'Vote to\nSTART\n\n' + button.playersNear?.length + '/' + button.playersPossible?.length + ' players'
    }
    button.getChildAt(2).text = text
}

const animateGameStartButton = button => {
    button.visible = stage === stages.gameLobby

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

const createCircleButton = (props, lobbyContainer) => {
    const {x, y, innerRadius, outerRadius, loadingPercentage, loadingSpeed, execute} = props

    let button = new PIXI.Container()
    button = Object.assign(button, props)

    const area = new PIXI.Graphics()
    .circle(0, 0, innerRadius)
    .fill({alpha: 0.5, color: colors.darkbrown})

    const loadingCircle = new PIXI.Graphics()
    .circle(0, 0, innerRadius)
    .fill({alpha: 0.5, color: colors.grey})

    const buttonText = new PIXI.Text({
        style: {
            align: 'center',
            fontSize: level.width*0.017,
            fill: colors.white,
            stroke: colors.white
        }
    });
    buttonText.anchor.set(0.5)

    button.addChild(area, loadingCircle, buttonText)
    lobbyContainer.addChild(button)

    addAnimation(button, () => animateCircleButton(button))
    return button
}

const animateRingPartButton = button => {
    button.visible = stage === stages.startLobby && figures.filter(f => f.playerId && f.type === 'fighter').length > 0

    if (button.oldloadingPercentage != button.loadingPercentage) {
        button.oldloadingPercentage = button.loadingPercentage

        const loadingArea = button.getChildAt(1)
        loadingArea.clear()
        
        if (button.loadingPercentage > 0) {
            const height = button.outerRadius - button.innerRadius
            const outerRadius = (button.innerRadius+button.loadingPercentage*height)

            loadingArea.arc(0, 0, button.innerRadius, button.startAngle, button.endAngle)
            .lineTo(Math.cos(button.endAngle)*outerRadius, Math.sin(button.endAngle)*outerRadius)
            .arc(0, 0, outerRadius, button.endAngle, button.startAngle, true)
            .fill({alpha: 0.5, color: button.game.color})
        }
    }
}

const createRingPartButton = (props, lobbyContainer) => {
    const {x, y, startAngle, endAngle, innerRadius, outerRadius, game, loadingPercentage, execute} = props
    const width = distanceAnglesRad(startAngle, endAngle)
    const centerAngle = startAngle + width/2

    let button = new PIXI.Container()
    button = Object.assign(button, {x, y, startAngle, endAngle, innerRadius, outerRadius, game, loadingPercentage, execute})
    button.isInArea = f => new PIXI.Circle(x, y, outerRadius).contains(f.x, f.y+f.bodyHeight*0.5) && !(new PIXI.Circle(x, y, innerRadius)).contains(f.x, f.y+f.bodyHeight*0.5) && (distanceAnglesRad(angle(x, y, f.x, f.y+f.bodyHeight*0.5), centerAngle) < width/2)

    const area = new PIXI.Graphics()
    .arc(0, 0, innerRadius, startAngle, endAngle)
    .lineTo(Math.cos(endAngle)*outerRadius, Math.sin(endAngle)*outerRadius)
    .arc(0, 0, outerRadius, endAngle, startAngle, true)
    .fill({alpha: 0.5, color: game.color})

    const loadingArea = new PIXI.Graphics()

    const buttonText = new PIXI.Text({
        text: game.text,
        style: {
            align: 'center',
            fontSize: level.width*0.017,
            fill: colors.white,
            stroke: colors.white
        }
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
    const gameEntries = Object.entries(games)
    const startAngle = 270
    const diffAngle = 360/gameEntries.length

    gameEntries.forEach(([id, game], index) => {
        const button = createRingPartButton({...gameSelectionDefinition(), startAngle: deg2limitedrad(startAngle+index*diffAngle), endAngle:deg2limitedrad(startAngle+(index+1)*diffAngle), game, execute: undefined}, lobbyContainer);
        buttons['vote_' + id] = button
    })
}

const addGameSelection = (app, lobbyContainer) => {
    const circleButton = createCircleButton(gameSelectionDefinition(), lobbyContainer)
    circleButton.isInArea = f => stage === stages.startLobby && new PIXI.Circle(circleButton.x, circleButton.y, circleButton.outerRadius).contains(f.x, f.y+f.bodyHeight*0.5) && !(new PIXI.Circle(circleButton.x, circleButton.y, circleButton.innerRadius)).contains(f.x, f.y+f.bodyHeight*0.5)
    addGameRing(lobbyContainer)

    buttons.selectGame = circleButton

    app.ticker.add(() => animateLobbyStartButton(circleButton))
}

const addGameStartButton = (app, lobbyContainer) => {
    const circleButton = createCircleButton(gameStartButtonDefinition(), lobbyContainer)
    circleButton.isInArea = f => stage === stages.gameLobby && new PIXI.Circle(circleButton.x, circleButton.y, circleButton.innerRadius).contains(f.x, f.y+f.bodyHeight*0.5)

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
    qrCodeContainer.label = new PIXI.Text( {
        text: '', 
        style: {
            align: 'center',
            fontSize: 32,
            fill: colors.white,
            stroke: colors.white
             }
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
    button.visible = figures.filter(f => f.playerId && f.type === 'fighter').length > 0

    const loadingBar = button.getChildAt(1)
    loadingBar.width = button.width*button.loadingPercentage
}

const createRectangleButton = (props, lobbyContainer) => {
    const {x, y, width, height, loadingPercentage, loadingSpeed, execute} = props

    let button = new PIXI.Container()
    button = Object.assign(button, {x, y, loadingPercentage, loadingSpeed, execute})
    button.isInArea = f => new PIXI.Rectangle(x, y, width, height).contains(f.x, f.y+f.bodyHeight*0.5)

    const area = new PIXI.Graphics()
    .rect(0, 0, width, height)
    .fill({alpha: 0.5, color: colors.darkbrown})

    const loadingBar = new PIXI.Graphics()
    .rect(0, 0, 0.1, height)
    .fill({alpha: 0.5, color: colors.grey})

    const buttonText = new PIXI.Text({
        style: {
            align: 'center',
            fontSize: level.width*0.017,
            fill: colors.white,
            stroke: colors.white
        }
    });
    buttonText.anchor.set(0.5)
    buttonText.x = width/2
    buttonText.y = height/2

    button.addChild(area, loadingBar, buttonText)
    lobbyContainer.addChild(button)

    addAnimation(button, () => animateRectangleButton(button))
    return button
}

const animateMuteButton = button => {
    button.getChildAt(2).text = isMusicMuted() ? 'Music: OFF' : 'Music: ON'
    button.visible = stage === stages.startLobby 
}

const animateBotsButton = button => {
    button.getChildAt(2).text = 'Bots: ' + getBotCount()
    button.visible = stage === stages.startLobby 
}

const addButtons = (app, lobbyContainer) => {
    Object.entries(buttonDefinition()).forEach(([id, button]) => {buttons[id] = createRectangleButton(button, lobbyContainer)})
    
    app.ticker.add(() => animateMuteButton(buttons.mute))
    app.ticker.add(() => animateBotsButton(buttons.bots))
}

const animateTeamSwitcher = button => {
    button.visible = game === games.vip
}

const createTeamSwitcher = (app, props, lobbyContainer) => {
    const {x, y, team} = props
    const width = 128
    const height = 128
    const newX = x - width/2
    const newY = y - height/2

    const button = new PIXI.Graphics()
    .rect(newX, newY, width, height)
    .fill({color: teams[team].color})
    button.execute = () => button.playersNear.forEach(f => switchTeam(f, team)) 
    button.isInArea = f => stage === stages.gameLobby && game === games.vip && new PIXI.Rectangle(newX, newY, width, height).contains(f.x, f.y+f.bodyHeight*0.5)

    lobbyContainer.addChild(button)

    app.ticker.add(() => animateTeamSwitcher(button))

    return button
}

const addTeamSwitchers = (app, lobbyContainer) => {
    Object.entries(teamSwitchersDefinition()).forEach(([id, button]) => {buttons[id] = createTeamSwitcher(app, button, lobbyContainer)})
}

const animateLobbyItems = lobbyContainer => {
    lobbyContainer.visible = stage === stages.startLobby || stage === stages.gameLobby
}

const addLobbyItems = app => {
    const lobbyContainer = new PIXI.Container()
    addGameSelection(app, lobbyContainer)
    addGameStartButton(app, lobbyContainer)
    addButtons(app, lobbyContainer)
    addTeamSwitchers(app, lobbyContainer)
    addNetworkQrCode(app, lobbyContainer)

    const fontHeight = level.width*0.017  
    const howToPlay = new PIXI.Text({
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

const getScoreDefaultX = figure => {
    const offx = 48*1.2
    const sortedPlayers = players.filter(player => player.joinedTime).sort((player1, player2) => player1.joinedTime - player2.joinedTime || player1.playerId - player2.playerId)
    const playerIndex = sortedPlayers.findIndex(player => player.playerId === figure.playerId)
    return 32+playerIndex*offx
}

const animatePlayerScore = (figure, player) => {
    if (figure.team !== figure.oldTeam) {
        figure.score.getChildAt(0).tint = teams[figure.team] ? teams[figure.team].color : colors.black
        figure.oldTeam = figure.team
    }

    if (!restartGame) {
        var lp = Math.min((dtProcessed - player.joinedTime) / moveNewPlayerDuration, 1)
        var lpi = 1-lp

        figure.score.x = lpi * (level.width*0.5) + lp*getScoreDefaultX(figure)
        figure.score.y = lpi*(level.height*0.5) + lp*figure.score.yDefault
        figure.score.scale = 12*lpi + lp
    }

    figure.score.getChildAt(1).text = figure.score.shownPoints

    if (figure.isMarkerButtonPressed && !restartGame) {
        figure.score.x += -5+10*Math.random()
        figure.score.y += -5+10*Math.random()
    }
}

const botCircleContext = new PIXI.GraphicsContext().rect(-24,-24, 48,48).fill({alpha: 0.5, color: colors.white}).stroke({alpha: 0.5, color: colors.black, width: 1})
const playerCircleContext = new PIXI.GraphicsContext().circle(0, 0, 24).fill({alpha: 0.5, color: colors.white}).stroke({alpha: 0.5, color: colors.black, width: 1})

const addPlayerScore = (figure, player) => {
    let playerScore = new PIXI.Container()
    playerScore.yDefault = level.height+32
    playerScore.points = 0
    playerScore.oldPoints = 0
    playerScore.shownPoints = 0

    let circle
    if (player.type === 'bot') {
        circle = new PIXI.Graphics(botCircleContext)
    } else {
        circle = new PIXI.Graphics(playerCircleContext)
    }
    circle.tint = colors.black
    
    const text = new PIXI.Text({
        text: 0,
        style: {
            fontSize: 36,
            fill: colors.white
        }
    });
    text.anchor.set(0.5)

    figure.score = playerScore
    playerScore.addChild(circle, text)
    levelContainer.addChild(playerScore)
    scoreLayer.attach(playerScore)

    addAnimation(playerScore, () => animatePlayerScore(figure, player))
}

const animateWinningCeremony = winnerText => {
    const playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')

    const playerFiguresSortedByNewPoints = playerFigures.toSorted((f1,f2) => (f1.score.points-f1.score.oldPoints) - (f2.score.points-f2.score.oldPoints))

    const sortedPlayers = players.filter(player => player.joinedTime).sort((player1, player2) => player1.joinedTime - player2.joinedTime || player1.playerId - player2.playerId)
    const lastFinalWinnerFigure = playerFigures.find(f => lastFinalWinnerPlayerIds?.has(f.playerId))
    const lastFinalWinnerIndex = sortedPlayers.findIndex(player => player.playerId === lastFinalWinnerFigure?.playerId)
    const lastFinalWinnerNumber = lastFinalWinnerIndex+1

    const dt3 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration);
    const dt4 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);

    playerFiguresSortedByNewPoints.forEach((f, i) => {
        f.score.zIndex = i
        const dt2 = dtProcessed - (lastRoundEndThen + i*moveScoreToPlayerDuration);
        
        if (lastRoundEndThen && dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
            const lp = dt2 / moveScoreToPlayerDuration
            const lpi = 1-lp

            f.score.x = lpi*getScoreDefaultX(f) + lp*f.x
            f.score.y = lpi*f.score.yDefault + lp*f.y

            if (lastFinalWinnerPlayerIds?.has(f.playerId)) {
                f.score.scale = (lpi + 2*lp)*(lpi + 2*lp)
            } else {
                f.score.scale = lpi + 2*lp
            }

            if (lastWinnerPlayerIds.has(f.playerId)) {
                f.score.getChildAt(0).tint = colors.gold
            }
        } else if (lastRoundEndThen && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
            f.score.x = f.x
            f.score.y = f.y
            if (lastFinalWinnerPlayerIds?.has(f.playerId)) {
                f.score.scale = 4
            } else {
                f.score.scale = 2
            }
            f.score.shownPoints = f.score.points
        } else if (lastRoundEndThen && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
            const lp = dt4 / moveScoreToPlayerDuration
            const lpi = 1-lp

            f.score.x = lpi*f.x + lp*getScoreDefaultX(f)
            f.score.y = lpi*f.y + lp*f.score.yDefault
            f.score.scale = 2*lpi + lp
            if (lastFinalWinnerPlayerIds) {
                f.score.shownPoints = 0
            }

            f.score.getChildAt(0).tint = teams[f.team] ? teams[f.team].color : colors.black
        }
    })
    
    if ((lastFinalWinnerPlayerIds || finalWinnerTeam) && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
        winnerText.visible = true
        if (finalWinnerTeam) {
            winnerText.style.fill.color = teams[finalWinnerTeam].color
            winnerText.text = `${teams[finalWinnerTeam].label} win`
        } else if (figureIsBot(lastFinalWinnerFigure)) {
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
                color: colors.lightbrown,
            },
            stroke: {
                color: colors.white,
                width: 6,
            }
        }
    })
    winnerText.anchor.set(0.5)
    winnerText.x = level.width/2
    winnerText.y = level.height/2

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
        plate.scale = 1 - 0.2 * Math.sin(perc*Math.PI)
    }

    const marker = figure.getChildByLabel('marker')
    marker.visible = showDebug
}

const addFood = (app, texture, props) => {
    let food = new PIXI.Container()
    food = Object.assign(food, props)

    const plate = new PIXI.Graphics().circle(0, 0 , food.attackDistance)
    .fill({color: colors.white})
    .circle(0, 0 , 0.8*food.attackDistance)
    .stroke({color: colors.black, width: 2})
    plate.label = 'plate'

    const meal = new PIXI.Sprite(texture)
    meal.anchor.set(0.5)
    meal.scale = 1.2

    const marker = new PIXI.Graphics(figureMarker)
    marker.tint = colors.blue
    marker.label = 'marker'

    food.addChild(plate, meal, marker)
    figuresPool.push(food)
    levelContainer.addChild(food)
    debugLayer.attach(marker)

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

const addGrass = () => {
    levelContainer.addChild(PIXI.Sprite.from('background_grass'))
}

const createHorizontalFence = level => {
    return new PIXI.GraphicsContext().rect(0,0,level.width,level.padding*0.6)
    .fill({color: 0x969696})
    .rect(level.padding*0.5,level.padding*0.8,level.width-level.padding,level.padding*0.6)
    .fill({color: colors.grey})
    .rect(level.padding*0.5,level.padding*1.6,level.width-level.padding,level.padding*0.6)
    .fill({color: 0x5A5A5A})
}

const createUpperFence = level => {
    return new PIXI.Graphics(createHorizontalFence(level))
    .rect(0,0, level.padding*0.5, level.padding*2)
    .rect(level.width-level.padding*0.5,0, level.padding*0.5, level.padding*2)
    .fill({color: 0x969696})
}

const createLowerFence = level => {
    const offsetY = level.height-2*level.padding
    const lowerFence = new PIXI.Graphics(createHorizontalFence(level))
    .rect(0,level.padding*2-offsetY, level.padding*0.5, level.height-level.padding)
    .rect(level.width-level.padding*0.5,level.padding*2-offsetY, level.padding*0.5, level.height-level.padding)
    .fill({color: 0x969696})

    lowerFence.y = offsetY
    lowerFence.zIndex = level.height
    return lowerFence
}

const addLevelBoundary = () => {
    const upperFence = createUpperFence(level)
    //const upperFenceShadow = upperFence.clone()

    /*upperFenceShadow.x = upperFence.x+25
    upperFenceShadow.alpha = shadowDefinition.alpha
    upperFenceShadow.scale.set(shadowDefinition.scale.x,shadowDefinition.scale.y)
    upperFenceShadow.skew.set(shadowDefinition.skew.x, shadowDefinition.skew.y)
    upperFenceShadow.tint = shadowDefinition.color*/

    const lowerFence = createLowerFence(level)
    levelContainer.addChild(upperFence, lowerFence)
    figureLayer.attach(lowerFence)
}

const animateFigure = (figure, spritesheet) => {
    const deg = rad2limiteddeg(figure.direction)
    const body = figure.getChildByLabel('body')
    const shadow = figure.getChildByLabel('shadow')
    let animation

    if (distanceAnglesDeg(deg, 0) < 45) {
        animation = 'right_0_0'
    } else if (distanceAnglesDeg(deg, 90) <= 45) {
        animation = 'down_0_0'
    } else if (distanceAnglesDeg(deg, 180) < 45) {
        animation = 'left_0_0'
    } else {
        animation = 'up_0_0'
    }

    if (figure.isDead) {
        body.angle = 90
        body.y = figure.bodyHeight/4
        figureLayer.detach(body)
    } else {
        if (figure.isAttacking) {
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
    }

    if (figure.isMarkerButtonPressed && !restartGame) {
        body.tint = colors.purple
    } else {
        body.tint = teams[figure.team]?.color
    }

    if (body.currentAnimation != animation) {
        body.currentAnimation = animation
        body.textures = spritesheet.animations[animation]

        shadow.currentAnimation = animation
        shadow.textures = spritesheet.animations[animation]
    }

    shadow.visible = !figure.isDead

    if (!(figure.speed === 0 || !windowHasFocus || restartGame) && !body.playing) {
        body.play()
        shadow.play()
    } else if ((figure.speed === 0 || !windowHasFocus || restartGame) && body.playing) {
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

    figure.children.forEach(child => child.zIndex = figure.y)
}

const figureMarker = new PIXI.GraphicsContext().circle(0, 0, 5).fill()

const animateFigureMarker = (attackArc, figure) => {
    attackArc.rotation = figure.direction
    attackArc.visible = showDebug && figure.isAttacking
}

createFigureMarker = figure => {
    const markerContainer = new PIXI.Container()
    const marker = new PIXI.Graphics(figureMarker)

    const markerText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: colors.white
        }
    })
    markerText.anchor.set(0, 1)

    markerContainer.addChild(marker, markerText)

    app.ticker.add(() => {
        marker.tint = figure.playerId ? colors.red : colors.darkgreen
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

    const body = new PIXI.AnimatedSprite(spritesheet.animations.down_0_0)
    body.anchor.set(0.5)
    body.currentAnimation = 'down_0_0'
    body.scale = 2
    body.label = 'body'

    const shadow = new PIXI.AnimatedSprite(spritesheet.animations.down_0_0)
    shadow.anchor.set(0.1, 0.5)
    shadow.currentAnimation = 'down_0_0'
    shadow.alpha = shadowDefinition.alpha
    shadow.scale.set(2*shadowDefinition.scale.x, 2*shadowDefinition.scale.y)
    shadow.skew.set(shadowDefinition.skew.x, shadowDefinition.skew.y)
    shadow.tint = shadowDefinition.color
    shadow.label = 'shadow'

    const attackArc = createAttackArc(figure)
    const marker = createFigureMarker(figure)

    figure.bodyHeight = body.height
    figure.addChild(body, attackArc, marker, shadow)
    figuresPool.push(figure)
    figureShadowLayer.attach(shadow)
    figureLayer.attach(body)
    debugLayer.attach(attackArc, marker)

    app.ticker.add(() => animateFigure(figure, spritesheet))
    return figure
}

const addFigures = (app, spritesheet) => {
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
        levelContainer.addChild(figure)
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
        levelContainer.addChild(figure)
    }
}

const addOverlay = app => {
    const circleOfDeathGraphic = createCircleOfDeath(app)
    const touchControl = createTouchControl(app)
    const fpsText = createFpsText(app)
    const pauseOverlay = createPauseOverlay(app)

    circleOfDeath = circleOfDeathGraphic
    levelContainer.addChild(circleOfDeathGraphic)
    app.stage.addChild(touchControl, fpsText, pauseOverlay)
    overlayLayer.attach(circleOfDeathGraphic, touchControl, fpsText, pauseOverlay)
}

const animateCircleOfDeath = circle => {
    circle.visible = stage === stages.game && game === games.battleRoyale
    
    if (circle.visible) {
        circle.clear().circle(0, 0, circle.radius)
        .stroke({alpha: 0.8, color: colors.darkbrown, width: 30})
    }
}

const createCircleOfDeath = app => {
    let circle = new PIXI.Graphics()
    Object.assign(circle, circleOfDeathDefinition())

    app.ticker.add(() => animateCircleOfDeath(circle))
    return circle
}

const animatePauseOverlay = (app, overlay) => {
    const background = overlay.getChildByLabel('background')
    const text = overlay.getChildByLabel('text')
    background.height = app.screen.height/2
    background.width = app.screen.width
    background.y = app.screen.height/4
    text.text = (stage !== stages.startLobby) ? 'Pause' : '    Welcome to\nKnirps und Knall\n  Press any key'
    text.style.fontSize = 0.05*app.screen.width
    text.x = app.screen.width/2
    text.y = app.screen.height/2
    overlay.visible = !windowHasFocus
}

const createPauseOverlay = app => {
    const overlay = new PIXI.Container();

    const background = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height/2)
    .fill({alpha: 0.9, color: colors.darkbrown})
    background.label = 'background'

    const text = new PIXI.Text({
        style: {
            fill: colors.white
        }
    })
    text.anchor.set(0.5)
    text.label = 'text'

    overlay.addChild(background, text)

    app.ticker.add(() => animatePauseOverlay(app, overlay))
    return overlay
}

const animateFpsText = (app, fpsText) => {
    fpsText.x = app.screen.width
    fpsText.text = fps + ' FPS'
    fpsText.visible = windowHasFocus
}

const createFpsText = app => {
    const fpsText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: colors.white
        }
    })
    fpsText.anchor.set(1, 0)
    fpsText.y = 0

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
    const playersText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: colors.white
        }
    })
    playersText.anchor.set(0)
    playersText.x = 0
    playersText.y = 0

    app.ticker.add(() => animatePlayersText(playersText))
    return playersText
}

const animateFiguresText = (app, figuresText) => {
    const text = ['Figures with player']
    figures.filter(f => f.playerId).forEach(f => {
        text.push('playerId: ' + f.playerId + ' x: ' + Math.floor(f.x) + ' y: ' + Math.floor(f.y) + ' Beans: ' + f.beans?.size)
    })
    figuresText.text = text.join('\n')
    figuresText.y = app.screen.height
}

const createFiguresText = app => {
    const figuresText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: colors.white
        }
    })
    figuresText.anchor.set(0, 1)
    figuresText.x = 0

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

    if (!(!windowHasFocus || restartGame) && !cloud.playing) {
        cloud.play()
    }
    if ((!windowHasFocus || restartGame) && cloud.playing) {
        cloud.stop()
    }
}

const addFartCloud = (spritesheet, props) => {
    let cloud = new PIXI.AnimatedSprite(spritesheet.animations.explode)
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
    
    cloud.anchor.set(0.5)
    cloud.animationSpeed = 0.1
    cloud.currentAnimation = 'explode'

    figures.push(cloud)
    levelContainer.addChild(cloud)
    cloudLayer.attach(cloud)

    addAnimation(cloud, () => animateFartCloud(cloud))
}