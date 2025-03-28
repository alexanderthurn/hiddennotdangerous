window.addEventListener('keydown', event => {
    if (!windowHasFocus) {
        windowHasFocus = true
        return
    }

    keyboards.forEach(k => {
        k.pressed.add(event.code);
    });

    if (event.code === 'Escape') {
        showDebug =!showDebug
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
        k.pressed.delete(event.code);
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
    botPlayers = []
    for (var b = 0; b < getBotCount(); b++) {

        var bot = {
            type: 'bot',
            isAttackButtonPressed: false,
            isMarkerButtonPressed: false,
            isSpeedButtonPressed: false,
            isAnyButtonPressed: stage !== stages.game,
            xAxis: 0,
            yAxis: 0,
            isMoving: true,
            playerId: 'b' + b
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
                    if (distance(f.x,f.y,xTarget, yTarget) < 50) {
                        //turn around and fart
                        xTarget *= -1
                        yTarget *= -1
                        bot.isAttackButtonPressed = true
                    }
                } else {
                    beans.forEach((b, i, beans) => {
                        if (!f.beans.has(b.id) && (i < beans.length-1 || f.beans.size !== 1)) {
                            const beanTarget = {x: b.x, y: b.y-f.bodyHeight*0.5}
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

        bot.isMoving = Math.abs(bot.xAxis) + Math.abs(bot.yAxis) > 4;
       
        botPlayers.push(bot)
    }

    FWNetwork.getInstance().getAllGamepads().filter(x => x && x.connected).map(x => {
        var gamepadPlayerIndex = gamepadPlayers.findIndex(g => g.id === x.id && g.index === x.index)
        if (gamepadPlayerIndex < 0) {
            if (x.buttons.some(b => b.pressed)) {
                gamepadPlayers.push(x)
            }
        } else {
            gamepadPlayers[gamepadPlayerIndex] = x
            //gamepadPlayers[gamepadPlayerIndex].buttons = x.buttons
            //gamepadPlayers[gamepadPlayerIndex].axes = x.axes
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
        }
        let x = g.axes[0];
        let y = g.axes[1];
        [x, y] = setDeadzone(x, y,0.2);
        [x, y] = clampStick(x, y);
        g.xAxis = x
        g.yAxis = y
        g.isMoving = x !== 0 || y !== 0;
        g.type = 'gamepad'
        g.playerId = 'g' + g.index // id does not work as it returns just XBOX Controller
        return g
    });

    keyboardPlayers = keyboardPlayers.map((kp,i) => ({...defaultkeyboardPlayer, playerId: 'k' + i}));

    //keyboardPlayers = keyboardPlayers.map(kp => ({...kp, ...defaultkeyboardPlayer}));
    //console.log('WHAT', keyboardPlayers)
    
    keyboardPlayers.forEach(g => {
        g.isAttackButtonPressed = false
        g.isAnyButtonPressed = false
        g.isMarkerButtonPressed = false
        g.isSpeedButtonPressed = false
    })
    
    keyboards.forEach(k => {
        Array.from(k.pressed.values()).forEach(pressedButton => {
            const binding = k.bindings[pressedButton];
            if (binding) {
                const action = binding.action;
                let p = keyboardPlayers.find(kp => binding.playerId ===  kp.playerId);
                let isNew = false
                if (!p) {
                    isNew = true
                    p = {...defaultkeyboardPlayer, playerId: 'k' + keyboardPlayers.length};
                }
                p.isAnyButtonPressed = true
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
                    default:
                        break;
                }
                isNew && keyboardPlayers.push(p)
                p.isMoving = p.xAxis !== 0 || p.yAxis !== 0;
            }
        })
    });
    
    touchPlayers.forEach((mp,i) => {
        mp.type = 'touch'
        mp.playerId = 't' + i
        mp.isAttackButtonPressed = mp.pressed.has(0)
        mp.xAxis = 0
        mp.yAxis = 0
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

                mp.isMoving = Math.abs(mp.xAxis) + Math.abs(mp.yAxis) > 4
               
            }
        }
    })

    return [...gamepadPlayers, ...keyboardPlayers, ...botPlayers]; // ...touchPlayers  TODO: Alex touch not working nicely
}