window.addEventListener('keydown', event => {
    if (!windowHasFocus) {
        windowHasFocus = true
        return
    }

    keyboards.forEach(k => {
        k.pressed.add(event.code);
    });

    if (event.code === 'Escape') {
        isDebugMode =!isDebugMode
    }

    if (event.code === 'ArrowDown' || event.code === 'ArrowUp') { /* prevent scrolling of website */
        event.preventDefault();
    }
});

window.addEventListener('blur', () => {
    windowHasFocus = false
}, { passive: false })

window.addEventListener('focus', () => {
    setTimeout(() => {windowHasFocus = true}, 100)
}, { passive: false })

window.addEventListener('touchstart', event => {
    if (touchPlayers.length > 0) {touchPlayers[0].pointerType = 'touch'}
    touches[0].pointerType = 'touch'

    event.preventDefault();
}, { passive: false });
window.addEventListener('touchend', event => {
    event.preventDefault();
}, { passive: false });
window.addEventListener('touchmove', event => {
    event.preventDefault();
}, { passive: false });


window.addEventListener('keyup', event => {
    keyboards.forEach(k => {
        k.pressed.delete(event.code)
    });
});
window.addEventListener("contextmenu", e => e.preventDefault());

var pointerEvents = {}
var windowHasFocus = false

window.addEventListener('pointerdown', event => {
    if (!windowHasFocus) {
        return
    }

    if (event.pointerType === 'touch') {
        if (touchPlayers.length === 0) {touchPlayers.push(touches[0]);}

        if (event.clientX < (btnTouchAction.radius > 0 ? (btnTouchAction.x + btnTouchController.x) >> 1 : app.screen.width*0.7) || event.clientY < app.screen.height * 0.5) {
            touchPlayers[0].pressed.add(0);
            pointerEvents[event.pointerId] = 0
        } else {
            touchPlayers[0].pressed.add(1);
            pointerEvents[event.pointerId] = 1
        }
    } 

    event.preventDefault();
    event.stopPropagation();
});


window.addEventListener('pointerup', event => {
    if (!windowHasFocus) {
        windowHasFocus = true
        return
    }

    if (event.pointerType === 'touch') {
        touchPlayers[0].pressed.delete( pointerEvents[event.pointerId]);
        delete pointerEvents[event.pointerId]
    } 

    event.preventDefault();
    event.stopPropagation();
});

window.addEventListener('pointermove', event => {
    if (!windowHasFocus) {
        return
    }

    touches[0].x = event.clientX
    touches[0].y = event.clientY

    if (touchPlayers.length > 0) {
        touchPlayers[0].x = touches[0].x
        touchPlayers[0].y =  touches[0].y
    } else {
        touches[0].xCenter = touches[0].x
        touches[0].yCenter = touches[0].y
    }

    event.preventDefault();
    event.stopPropagation();
}, false);


function collectInputs() {
    const botCount = getBotCount()
    botPlayers = botPlayers.slice(0, botCount)

    const defaultBotPlayer = {
        type: 'bot',
        isAttackButtonPressed: false,
        isMarkerButtonPressed: false,
        isSpeedButtonPressed: false,
        isAnyButtonPressed: stage !== stages.game,
        xAxis: 0,
        yAxis: 0,
        isMoving: false,
    };

    botPlayers = botPlayers.map(bp => Object.assign(bp, defaultBotPlayer));
    for (var b = 0; b < getBotCount(); b++) {
        const playerId = 'b' + b
        let bot = botPlayers.find(bp => bp.playerId === playerId);
        let isNew = false
        if (!bot) {
            isNew = true
            bot = {...defaultBotPlayer, playerId};
        }

        var f = figures.find(f => f.playerId === bot.playerId && f.type === 'fighter')
        if (f && !f.isDead) {
            var xTarget = -1000
            var yTarget = -1000
    
            if (stage === stages.startLobby) {
                xTarget = buttons.selectGame.x
                yTarget = buttons.selectGame.y
            } else if (stage === stages.gameLobby) {
                xTarget = buttons.startGame.x
                yTarget = buttons.startGame.y
            } else {
                var beans = figures.filter(b => b.type === 'bean')
                if (f.beans.size === beans.length) {
                    const otherPlayerFigures = figures.filter(fig => fig.playerId && fig.playerId !== f.playerId && !fig.isDead && fig.type === 'fighter');

                    //go to center of other players
                    xTarget = otherPlayerFigures.reduce((prevValue, fig) => prevValue+fig.x, 0)/otherPlayerFigures.length;
                    yTarget = otherPlayerFigures.reduce((prevValue, fig) => prevValue+fig.y, 0)/otherPlayerFigures.length;
                    if (squaredDistance(f.x,f.y,xTarget, yTarget) < 250) {
                        //turn around and fart
                        xTarget *= -1
                        yTarget *= -1
                        bot.isAttackButtonPressed = true
                    }
                } else {
                    beans.forEach((b, i, beans) => {
                        if (!f.beans.has(b.id) && (i < beans.length-1 || f.beans.size !== 1)) {
                            const beanTarget = {x: b.x, y: b.y}
                            let d1 = distance(f.x,f.y,beanTarget.x,beanTarget.y);
                            let d2 = distance(f.x,f.y,xTarget,yTarget);
                            if (f.beans.size === 0 && i === beans.length-1) {
                                d1 += level.shortestPathBean5;
                                d2 += level.shortestPathNotBean5;
                            }
                            if (d1 < d2) {
                                xTarget = beanTarget.x;
                                yTarget = beanTarget.y;
                            }
                        }
                    });
                }
            }

            bot.xAxis = xTarget - f.x
            bot.yAxis = yTarget - f.y
        }

        let m = Math.hypot(bot.xAxis, bot.yAxis)
        m = setDeadzone(m, 1)
        bot.direction = angle(0, 0, bot.xAxis, bot.yAxis)
        bot.speed = m
        bot.isMoving = m > 0

        isNew && botPlayers.push(bot)
    }

    FWNetwork.getInstance().getAllGamepads().filter(x => x && x.connected).map(x => {
        var gamepadPlayerIndex = gamepadPlayers.findIndex(g => g.id === x.id && g.index === x.index)
        if (gamepadPlayerIndex < 0) {
            if (x.buttons.some(b => b.pressed)) {
                gamepadPlayers.push(x)
            }
        } else {
            Object.assign(gamepadPlayers[gamepadPlayerIndex],x)
        }
    })

    gamepadPlayers.forEach(g => {
        g.isAttackButtonPressed = false
        g.isAnyButtonPressed = false
        g.isMarkerButtonPressed = false
        g.isSpeedButtonPressed = false
        if (g.buttons.some(b => b.pressed)) {
            if (!windowHasFocus) {
                windowHasFocus = true
                return
            }
            g.isAnyButtonPressed = true
            if (g.buttons[0].pressed) {
                g.isAttackButtonPressed = true
            }
            if (g.buttons[1].pressed) {
                g.isSpeedButtonPressed = true
            }
            if (g.buttons[2].pressed) {
                g.isMarkerButtonPressed = true
            }
            if (g.buttons[16].startpressed) {
                isRestartButtonPressed = true
            }
        }
        let x = g.axes[0];
        let y = g.axes[1];
        let m = Math.hypot(x, y)
        m = setDeadzone(m, 0.2)
        g.direction = angle(0, 0, x, y)
        g.speed = m
        g.xAxis = x
        g.yAxis = y
        g.isMoving = m > 0
        g.type = 'gamepad'
        g.playerId = 'g' + g.index // id does not work as it returns just XBOX Controller
        return g
    });

    const defaultkeyboardPlayer = {
        xAxis: 0,
        yAxis: 0,
        isMoving: false,
        type: 'keyboard',
        isAnyButtonPressed: false,
        isAttackButtonPressed: false,
        isMarkerButtonPressed: false,
        isSpeedButtonPressed: false
    };
    keyboardPlayers = keyboardPlayers.map(kp => (Object.assign(kp, defaultkeyboardPlayer)));
    keyboards.forEach(k => {
        Object.keys(k.keys).forEach(code => {
            const key = k.keys[code]
            if (k.pressed.has(code)) {
                key.pressed = true

                const action = key.action;
                let p
                let isNewPlayer = false
                if (key.playerId) {
                    p = keyboardPlayers.find(kp => key.playerId ===  kp.playerId);
                    if (!p) {
                        isNewPlayer = true
                        p = {...defaultkeyboardPlayer, playerId: 'k' + keyboardPlayers.length};
                    }
                    p.isAnyButtonPressed = true
                }
                
                switch (action) {
                    case 'left':
                        p.xAxis--;
                        break;
                    case 'right':
                        p.xAxis++;
                        break;
                    case 'up':
                        p.yAxis--;
                        break;
                    case 'down':
                        p.yAxis++;
                        break;
                    case 'attack':
                        p.isAttackButtonPressed = true
                        break;
                    case 'marker':
                        p.isMarkerButtonPressed = true
                        break;
                    case 'speed':
                        p.isSpeedButtonPressed = true
                        break;
                    case 'restart':
                        if (!key.waspressed) {
                            isRestartButtonPressed = true
                        }
                        break;
                    default:
                        break;
                }
                if (p) {
                    let m = Math.hypot(p.xAxis, p.yAxis)
                    p.direction = angle(0, 0, p.xAxis, p.yAxis)
                    p.speed = m
                    p.isMoving = m > 0
                    isNewPlayer && keyboardPlayers.push(p)
                }
                key.waspressed = true
            } else {
                key.pressed = false
                key.waspressed = false
            }
        })
    });
    
    touchPlayers.forEach((mp,i) => {
        mp.type = 'touch'
        mp.playerId = 't' + i
        mp.isAttackButtonPressed = mp.pressed.has(0)
        mp.xAxis = 0
        mp.yAxis = 0
        mp.direction = 0
        mp.isMoving = 0

        var f = figures.find(f => f.playerId ===  mp.playerId && f.type === 'fighter')
        if (f) {
            if (mp.pointerType === 'touch') {
                let x = mp.x - btnTouchController.x
                let y = mp.y - btnTouchController.y
                mp.xAxis = x
                mp.yAxis = y   
                if (!mp.pressed.has(0)) {
                    mp.xAxis = 0
                    mp.yAxis = 0
                }
                mp.isAttackButtonPressed = mp.pressed.has(1)
                let m = Math.hypot(mp.xAxis, mp.yAxis)
                mp.direction = angle(0, 0, mp.xAxis, mp.yAxis)
                mp.speed = m
                mp.isMoving = m > 0               
            }
        }
    })

    return [...gamepadPlayers, ...keyboardPlayers, ...botPlayers]; // ...touchPlayers  TODO: Alex touch not working nicely
}