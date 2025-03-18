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

window.addEventListener('click', event => {
    
    if (mousePlayers.length > 0) {mousePlayers[0].pointerType = 'mouse'}
    mouses[0].pointerType = 'mouse'
    
}, { passive: false })

window.addEventListener('touchstart', event => {
    if (mousePlayers.length > 0) {mousePlayers[0].pointerType = 'touch'}
    mouses[0].pointerType = 'touch'

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

    if (mousePlayers.length === 0) {mousePlayers.push(mouses[0]);}
  
    if (event.pointerType === 'mouse') {
        mousePlayers[0].pressed.add(event.button);
    }

    if (event.pointerType === 'touch') {
        if (event.clientX < (btnTouchAction.radius > 0 ? (btnTouchAction.x + btnTouchController.x) >> 1 : app.screen.width*0.7) || event.clientY < app.screen.height * 0.5) {
            mousePlayers[0].pressed.add(0);
            pointerEvents[event.pointerId] = 0
        } else {
            mousePlayers[0].pressed.add(1);
            pointerEvents[event.pointerId] = 1
        }
    } 

    event.preventDefault();
    event.stopPropagation();
});


window.addEventListener('pointerup', event => {
    if (mousePlayers.length === 0 && windowHasFocus) {mousePlayers.push(mouses[0])}

    if (!windowHasFocus) {
        windowHasFocus = true
        return
    }
   
    if (event.pointerType === 'mouse') {
        mousePlayers[0].pressed.delete(event.button);
    } 

    if (event.pointerType === 'touch') {
        mousePlayers[0].pressed.delete( pointerEvents[event.pointerId]);
        delete pointerEvents[event.pointerId]
    } 

    event.preventDefault();
    event.stopPropagation();
});

window.addEventListener('pointermove', event => {
    if (!windowHasFocus) {
        return
    }

    mouses[0].x = event.clientX
    mouses[0].y = event.clientY

    if (mousePlayers.length > 0) {
        mousePlayers[0].x = mouses[0].x
        mousePlayers[0].y =  mouses[0].y
    } else {
        mouses[0].xCenter = mouses[0].x
        mouses[0].yCenter = mouses[0].y
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
        if (g.buttons[0].pressed) {
            g.isAttackButtonPressed = true
        } 
        if (g.buttons.some(b => b.pressed)) {
            g.isAnyButtonPressed = true
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
                    default:
                        break;
                }
                isNew && keyboardPlayers.push(p)
                p.isMoving = p.xAxis !== 0 || p.yAxis !== 0;
            }
        })
    });

    
    mousePlayers.forEach((mp,i) => {
        mp.type = 'mouse'
        mp.playerId = 'm' + i
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
               
            } else if (mp.pointerType === 'mouse') {
                let x = mp.x- mp.xCenter
                let y = mp.y- mp.yCenter
                mp.xAxis = x
                mp.yAxis = y   
                if (mp.pressed.has(2)) {
                    mp.xAxis = 0
                    mp.yAxis = 0 
                    mp.xCenter = mp.x
                    mp.yCenter = mp.y
                }
                mp.isMoving = Math.abs(mp.xAxis) + Math.abs(mp.yAxis) > level.width*0.05
            }
        
        }
       
    })

    return [...gamepadPlayers, ...keyboardPlayers, ...mousePlayers, ...botPlayers];

}