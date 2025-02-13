const addHeadline = () => {
    const title = new PIXI.Text({
        text: 'KNIRPS UND KNALL',
        style: {
            fontSize: level.width*0.02,
            fill: 0xFFFFFF
        }
    });

    title.anchor.set(0.5, 1);
    title.x = level.width/2;
    title.y = -level.width*0.005;

    levelContainer.addChild(title);

    const authors = new PIXI.Text({
        text: 'made by TORSTEN STELLJES & ALEXANDER THURN',
        style: {
            fontSize: level.width*0.012,
            fill: 0xFFFFFF
        }
    });

    authors.anchor.set(1, 1);
    authors.x = level.width;
    authors.y = -level.width*0.005;

    levelContainer.addChild(authors);
}

const animateButton = button => {
    button.visible = !isGameStarted && figures.filter(f => f.playerId && f.type === 'fighter').length > 0

    const loadingBar = button.getChildAt(1)
    loadingBar.width = button.width*button.loadingPercentage
}

const addButton = props => {
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

    button.addChild(area, loadingBar, buttonText)
    levelContainer.addChild(button)

    addAnimation(button, () => animateButton(button))
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
    Object.entries(buttonDefinition()).forEach(([id, button]) => {buttons[id] = addButton(button)})

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

    howToPlay.anchor.set(0.5, 0);
    howToPlay.x = level.width*0.22+fontHeight;
    howToPlay.y = level.height*0.1;

    levelContainer.addChild(howToPlay);

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

    figure.score.getChildAt(1).text = figure.score.shownPoints

    if (figure.isAttacking && !restartGame) {
        figure.score.x += -5+10*Math.random()
        figure.score.y += -5+10*Math.random()
    }
}

const addPlayerScore = (figure, player) => {
    let playerScore = new PIXI.Container()
    const offx = 48*1.2
    const figureIndex = figures.filter(f => f.type === 'fighter').findIndex(f => !f.playerId)
    playerScore.xDefault = 32+figureIndex*offx
    playerScore.yDefault = level.height+32
    playerScore.shownPoints = 0
    playerScore.points = 0

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
    playerScore.addChild(circle, text)
    levelContainer.addChild(playerScore)
    scoreLayer.attach(playerScore)

    addAnimation(playerScore, () => animatePlayerScore(figure))
}

const animateWinningCeremony = winnerText => {
    const playerFigures = figures.filter(f => f.playerId && f.type === 'fighter')
    const playerFiguresSortedByNewPoints = playerFigures.toSorted((f1,f2) => (f1.score.points-f1.score.oldPoints) - (f2.score.points-f2.score.oldPoints))
    const lastFinalWinnerIndex = playerFigures.findIndex(f => f.playerId === lastFinalWinnerPlayerId)
    const lastFinalWinnerFigure = playerFigures[lastFinalWinnerIndex]
    const lastFinalWinnerNumber = lastFinalWinnerIndex+1
    const dt3 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration);
    const dt4 = dtProcessed - (lastRoundEndThen + playerFigures.length*moveScoreToPlayerDuration + showFinalWinnerDuration);

    playerFiguresSortedByNewPoints.forEach((f, i) => {
        f.score.zIndex = i
        const dt2 = dtProcessed - (lastRoundEndThen + i*moveScoreToPlayerDuration);
        
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
        } else if (lastRoundEndThen && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
            f.score.x = f.x
            f.score.y = f.y
            if (lastFinalWinnerPlayerId === f.playerId) {
                f.score.scale = 4
            } else {
                f.score.scale = 2
            }
            f.score.shownPoints = f.score.points
        } else if (lastRoundEndThen && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
            const lp = dt4 / moveScoreToPlayerDuration
            const lpi = 1-lp

            f.score.x = lpi*f.x + lp*f.score.xDefault
            f.score.y = lpi*f.y + lp*f.score.yDefault
            f.score.scale = 2*lpi + lp
            if (lastFinalWinnerPlayerId) {
                f.score.shownPoints = 0
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

    levelContainer.addChild(winnerText)
    overlayLayer.attach(winnerText)

    app.ticker.add(() => animateWinningCeremony(winnerText))
}

const animateFood = figure => {
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
    .fill({color: 0xFFFFFF})
    .circle(0, 0 , 0.8*food.attackDistance)
    .stroke({color: 0x000000, width: 2})
    plate.label = 'plate'

    const meal = new PIXI.Sprite(texture)
    meal.anchor.set(0.5)
    meal.scale = 1.2

    const marker = new PIXI.Graphics(figureMarker)
    marker.tint = 0x0000FF
    marker.label = 'marker'

    food.addChild(plate, meal, marker)
    figures.push(food)
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

const addGrass = (textures, spritesheet) => {
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
            levelContainer.addChild(grass)
        }
    }
}

const createHorizontalFence = level => {
    return new PIXI.GraphicsContext().rect(0,0,level.width,level.padding*0.6)
    .fill({color: 0x969696})
    .rect(level.padding*0.5,level.padding*0.8,level.width-level.padding,level.padding*0.6)
    .fill({color: 0x787878})
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

const animateFigure = (figure, spritesheet) => {
    const deg = rad2limiteddeg(figure.direction)
    const body = figure.getChildByLabel('body')
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

    if (body.currentAnimation != animation) {
        body.currentAnimation = animation
        body.textures = spritesheet.animations[animation]
    }

    if (!(figure.speed === 0 || !windowHasFocus || restartGame) && !body.playing) {
        body.play()
    }
    if ((figure.speed === 0 || !windowHasFocus || restartGame) && body.playing) {
        if (figure.speed === 0 && body.playing) {
            body.currentFrame = 0
        }
        body.stop()
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
            fill: 0xFFFFFF
        }
    })
    markerText.anchor.set(0, 1)

    markerContainer.addChild(marker, markerText)

    app.ticker.add(() => {
        marker.tint = figure.playerId ? 0xFF0000 : 0x008000
        markerText.text = figure.playerId ? figure.playerId + ' ' + figure.beans.size : ''
        markerContainer.visible = showDebug
    })
    return markerContainer
}

const animateAttackArc = (attackArc, figure) => {
    attackArc.rotation = figure.direction
    attackArc.visible = showDebug && figure.isAttacking
}

const createAttackArc = figure => {
    const attackArcContainer = new PIXI.Container()
    
    let startAngle = deg2rad(45+figure.attackAngle)
    let endAngle = startAngle + deg2rad(figure.attackAngle)
    const attackArc = new PIXI.Graphics().moveTo(0, 0).arc(0, 0, figure.attackDistance, startAngle, endAngle).fill({alpha: 0.2, color: 0x000000})
    attackArcContainer.addChild(attackArc)

    app.ticker.add(() => animateAttackArc(attackArcContainer, figure))
    return attackArcContainer
}

const createFigure = (app, spritesheet, props) => {
    let figure = new PIXI.Container({sortableChildren: false});
    figure = Object.assign(figure, props)

    const body = new PIXI.AnimatedSprite(spritesheet.animations.down)
    body.anchor.set(0.5)
    body.animationSpeed = 0.125
    body.scale = 2
    body.currentAnimation = 'down'
    body.label = 'body'

    const attackArc = createAttackArc(figure)
    const marker = createFigureMarker(figure)

    figure.addChild(body, attackArc, marker)
    figures.push(figure)
    figureLayer.attach(body)
    debugLayer.attach(attackArc, marker)

    app.ticker.add(() => animateFigure(figure, spritesheet))
    return figure
}

const addFigures = (app, spritesheet) => {
    const upperFence = createUpperFence(level)
    const lowerFence = createLowerFence(level)
    levelContainer.addChild(upperFence, lowerFence)

    for (var i = 0; i < maxPlayerFigures; i++) {
        const figure = createFigure(app, spritesheet, {
            maxBreakDuration: 5000,
            maxSpeed: 0.08,
            index: i,
            attackDuration: 500,
            attackBreakDuration: 2000,
            points: 0,
            attackDistance: 80,
            attackAngle: 90,
            type: 'fighter',
        })
        levelContainer.addChild(figure)
    }
    
    figureLayer.attach(upperFence, lowerFence)
}

const addOverlay = app => {
    const mouseControl = createMouseControl(app)
    const touchControl = createTouchControl(app)
    const fpsText = createFpsText(app)
    const pauseOverlay = createPauseOverlay(app)

    app.stage.addChild(mouseControl, touchControl, fpsText, pauseOverlay)
    overlayLayer.attach(mouseControl, touchControl, fpsText, pauseOverlay)
}

const animatePauseOverlay = (app, overlay) => {
    const background = overlay.getChildByLabel('background')
    const text = overlay.getChildByLabel('text')
    background.height = app.screen.height/2
    background.width = app.screen.width
    background.y = app.screen.height/4
    text.text = isGameStarted ? 'Pause' : 'Welcome to Knirps und Knall'
    text.style.fontSize = 0.05*app.screen.width
    text.x = app.screen.width/2
    text.y = app.screen.height/2
    overlay.visible = !windowHasFocus
}

const createPauseOverlay = app => {
    const overlay = new PIXI.Container();

    const background = new PIXI.Graphics().rect(0, 0, app.screen.width, app.screen.height/2)
    .fill({alpha: 0.9, color: 0x57412f})
    background.label = 'background'

    const text = new PIXI.Text({
        style: {
            fill: 0xFFFFFF
        }
    })
    text.anchor.set(0.5)
    text.label = 'text'

    overlay.addChild(background, text)

    app.ticker.add(() => animatePauseOverlay(app, overlay))
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
    fpsText.anchor.set(1, 0)
    fpsText.x = app.screen.width
    fpsText.y = 0

    app.ticker.add(() => animateFpsText(fpsText))
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
            fill: 0xFFFFFF
        }
    })
    playersText.anchor.set(0)
    playersText.x = 0
    playersText.y = 0

    app.ticker.add(() => animatePlayersText(playersText))
    return playersText
}

const animateFiguresText = figuresText => {
    const text = ['Figures with player']
    figures.filter(f => f.playerId).forEach(f => {
        text.push('playerId: ' + f.playerId + ' x: ' + Math.floor(f.x) + ' y: ' + Math.floor(f.y) + ' Beans: ' + f.beans?.size)
    })
    figuresText.text = text.join('\n')
}

const createFiguresText = app => {
    const figuresText = new PIXI.Text({
        style: {
            fontSize: 16,
            fill: 0xFFFFFF
        }
    })
    figuresText.anchor.set(0, 1)
    figuresText.x = 0
    figuresText.y = app.screen.height

    app.ticker.add(() => animateFiguresText(figuresText))
    return figuresText
}

const createTouchControl = app => {
    const touchControl = new PIXI.Container()

    let minHeightWidth = Math.min(app.screen.width, app.screen.height)
    const distanceToBorder = 0.3*minHeightWidth
    const radius = 0.18*minHeightWidth

    const moveControl = new PIXI.Container()
    const moveControlBackground = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.3, color: 0xFFFFFF})
    const moveControlStick = new PIXI.Graphics().circle(0, 0, radius/2).fill({alpha: 0.3, color: 0xFFFFFF})
    moveControl.addChild(moveControlBackground, moveControlStick)
    moveControl.radius = radius
    moveControl.x = distanceToBorder
    moveControl.y = app.screen.height - distanceToBorder

    const attackControl = new PIXI.Container()
    const attackControlButton = new PIXI.Graphics().circle(0, 0, radius).fill({alpha: 0.4, color: 0xFFFFFF})
    attackControl.addChild(attackControlButton)
    attackControl.radius = radius
    attackControl.x = app.screen.width - distanceToBorder
    attackControl.y = app.screen.height - distanceToBorder

    btnTouchController = moveControl
    btnTouchAction = attackControl
    touchControl.addChild(moveControl, attackControl)

    app.ticker.add(() => {
        const mp = mousePlayers.length > 0 ? mousePlayers[0] : mouses[0]
        touchControl.visible = mp.pointerType === 'touch'
        const xy = move(0, 0, angle(0, 0, mp.xAxis, mp.yAxis), radius/2, mp.isMoving)
        moveControlStick.x = xy.x || 0
        moveControlStick.y = xy.y || 0
        attackControl.alpha = mp.isAttackButtonPressed ? 1 : 0.75
    })

    return touchControl
}

const createMouseControl = app => {
    const mouseControl = new PIXI.Container()
    mouseControl.alpha = 0.5

    mp = mousePlayers.length > 0 ? mousePlayers[0] : mouses[0]
    const circle = new PIXI.Graphics().circle(0, 0,level.width*0.03)
    .stroke({color: 0xFFFFFF, width:8})

    const arrow = new PIXI.Container()
    const arrowBody = new PIXI.Graphics().rect(0, -4, 1, 8).fill(0xFFFFFF)
    const arrowHead = new PIXI.Graphics().moveTo(0, -12).lineTo(12, 0).lineTo(0,12).fill(0xFFFFFF)
    arrow.addChild(arrowBody, arrowHead)

    const circlePointer = new PIXI.Graphics().circle(0, 0, 12)
    .fill(0xFFFFFF)

    app.ticker.add(() => {
        const mp = mousePlayers.length > 0 ? mousePlayers[0] : mouses[0]
        if (mp.xCenter !== undefined && mp.yCenter !== undefined) {
            circle.x = mp.xCenter
            circle.y = mp.yCenter
            arrow.visible = mp.isMoving
            if (mp.isMoving) {
                const length = distance(mp.xCenter, mp.yCenter, mp.x, mp.y)
                arrow.x = mp.xCenter
                arrow.y = mp.yCenter
                arrow.rotation = angle(mp.xCenter, mp.yCenter, mp.x, mp.y)
                arrow.getChildAt(0).width = length-12
                arrow.getChildAt(1).x = length-12
            }
        }
        circlePointer.x = mp.x
        circlePointer.y = mp.y

        arrow.visible = mp.isMoving
        circlePointer.visible = !mp.isMoving
        mouseControl.visible = mp.pointerType !== 'touch' && mp.xCenter !== undefined && mp.yCenter !== undefined
    })
    mouseControl.addChild(circle, arrow, circlePointer)

    return mouseControl
}

const addDebug = app => {
    const debugContainer = new PIXI.Container();

    const playersText = createPlayersText(app)
    const figuresText = createFiguresText(app)

    debugContainer.addChild(playersText, figuresText)
    app.stage.addChild(debugContainer)
    debugLayer.attach(debugContainer)

    app.ticker.add(() => debugContainer.visible = showDebug)
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