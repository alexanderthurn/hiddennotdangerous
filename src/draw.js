
function draw(players, figuresSorted, figuresPlayer, dt, dtProcessed, layer) {

    
    ctx.save()

    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.translate(level.offsetX, level.offsetY)
    ctx.scale(level.scale, level.scale)
    //ctx.transform(level.scale, 0, 0, level.scale, level.offsetX, level.offsetY)

    if (layer === 0) {
        ctx.drawImage(tileMap,-level.padding, -level.padding) //, level.width+level.pading*2, level.height+level.pading*2, -level.pading, -level.pading, level.width+level.pading*2, level.height+level.pading*2);
    }

    if (!isGameStarted) {
        ctx.save()
        
        ctx.save()
        ctx.translate(level.width*0.05,level.height*0.05)
        ctx.beginPath();
        ctx.fillStyle = "rgba(120,120,120,0.5)";
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillRect(0,0, level.width*0.4, level.height*0.42)
        ctx.closePath()
        ctx.fill();
        ctx.restore()

        var fontHeight = level.width*0.017  
        ctx.font = fontHeight+"px Arial";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline='top'
        ctx.lineWidth = 0
        ctx.translate(level.width*0.22+fontHeight,level.height*0.1)
        var txt = 'HOW TO PLAY\n\nJoin by pressing any key on your Gamepad' 
                  + '\nor WASDT(Key1) or ' + String.fromCharCode(8592) + String.fromCharCode(8593)+ String.fromCharCode(8594)+ String.fromCharCode(8595) + '0(RSHIFT)\nor mouse or touch' 
                  + '\n\n1.) Find your player 2.) Fart to knock out others\n3.) Stay hidden 4.) Eat to power up your farts' 
                  + '\n\nBe the last baby standing!'
        
                 
        fillTextMultiline(ctx, txt,0,0, fontHeight)
        ctx.restore()


        if (figuresPlayer.length > 0) {
            var text = 'Walk here to\nSTART\n\n'+btnStart.playersNear.length + '/' + btnStart.playersPossible.length + ' players'
            if (btnStart.playersPossible.length === 1) {
                text = 'Walk here to\nSTART\n\nmin 2 players\nor 1 player +1 bot'
            } else if (btnStart.playersPossible.length > 1 && btnStart.playersNear.length === btnStart.playersPossible.length ) {
                text ='Prepare your\nbellies'
            } else if (btnStart.playersNear.length > 0) {
                text = 'Walk here to\nSTART\n\n' + btnStart.playersNear.length + '/' + btnStart.playersPossible.length + ' players'
            } 
            btnStart.text = text

            if (isMusicMuted()) {
                btnMute.text = 'Music: OFF'
            } else {
                btnMute.text = 'Music: ON'
            } 
            btnBots.text = 'Bots: ' + getBotCount()
            btnsLobby.forEach(btn => {
                drawButton(btn)
            })
        }
    }
    
    figuresSorted.forEach(f => {
        
        let deg = rad2limiteddeg(f.angle)
        let sprite = null
        let spriteShadow = null

        if (f.imageAnim) {
            let frame
            let frameShadow
            if (f.frame) {
                frame = f.frame
            } else if (f.imageAnim.hasDirections) {
                if (distanceAngles(deg, 0) < 45) {
                    frame = f.imageAnim.right.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.right.a
                } else if (distanceAngles(deg, 90) <= 45){
                    frame = f.imageAnim.down.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.down.a
                } else if (distanceAngles(deg, 180) < 45){
                    frame = f.imageAnim.left.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.left.a
                } else {
                    frame = f.imageAnim.up.a
                    frameShadow = f.imageShadowAnim && f.imageShadowAnim.up.a
                }
            } else {
                frame = f.imageAnim.default.a
                frameShadow = f.imageShadowAnim && f.imageShadowAnim.default.a
            }

            let indexFrame = 0;
            if (f.imageAnim?.animDefaultSpeed > 0 || f.speed > 0) {
                indexFrame = Math.floor(f.anim) % frame.length;
            }

            sprite = frame[indexFrame]
            spriteShadow = frameShadow && frameShadow[indexFrame]
        }
        
     

        ctx.save()
        ctx.translate(f.x, f.y)

        if (layer === 0) {
            if (f.isDead) {
                ctx.rotate(deg2rad(90))
                ctx.scale(f.scale,f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            } else if (f.imageShadow) {
                ctx.scale(f.scale, f.scale)
                ctx.drawImage(f.imageShadow, spriteShadow[0], spriteShadow[1], spriteShadow[2], spriteShadow[3], 0 - f.imageShadowAnim.width*0.5, 0 - f.imageShadowAnim.height*0.5, f.imageShadowAnim.width, f.imageShadowAnim.height)
            }
        } else {
            if (f.type === 'bean') {
                // bean image
                let startAngle = f.angle + deg2rad(135)
                let endAngle = startAngle + deg2rad(90)
                let durationLastAttack = dtProcessed-f.lastAttackTime
                let perc = durationLastAttack/f.attackDuration
                if (f.lastAttackTime > 0 && durationLastAttack < f.attackDuration) {
                    ctx.scale(1.0 - 0.2*Math.sin(perc*Math.PI), 1.0 - 0.2*Math.sin(perc*Math.PI))
                } else {
                    ctx.scale(1.0, 1.0)
                }

                ctx.save()
                  ctx.scale(f.scale, f.scale)
                  ctx.lineWidth = 2
                  ctx.strokeStyle = 'black'
                  //ctx.transform(1, 1, -0.7, 1, 0, 0);
                  ctx.beginPath();
                  ctx.fillStyle = "rgba(255,255,255,1)";
                  ctx.arc(0,0,f.attackDistance, 0, 2 * Math.PI)
                  ctx.closePath()
                  ctx.fill();
                  ctx.beginPath();
                  ctx.fillStyle = "rgba(255,255,255,1)";
                  ctx.arc(0,0,f.attackDistance*0.8, 0, 2 * Math.PI)
                  ctx.closePath()
                  ctx.fill();
                  ctx.stroke()
                ctx.restore()
                ctx.scale(0.6*f.scale, 0.6*f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            } else if (!f.isDead) {
                if (f.isAttacking) {
                    if (f.type == 'fighter') {
                        if (distanceAngles(deg, 0) < 45) {
                            ctx.rotate(deg2rad(20))
                        } else if (distanceAngles(deg, 90) <= 45){
                            ctx.rotate(deg2rad(-20))
                        } else if (distanceAngles(deg, 180) < 45){
                            ctx.rotate(deg2rad(-20))
                        } else {
                            ctx.rotate(deg2rad(20))
                        }
                    } else if (f.type === 'cloud') {
                        ctx.globalCompositeOperation = "difference";
                    }
                } 
                ctx.scale( f.scale, f.scale)
                ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
            }
        }
        ctx.restore()  
       
        if (showDebug && layer === 1) {
            if (f.isAttacking) {
                ctx.save()
                let startAngle = f.angle + deg2rad(45+f.attackAngle)
                let endAngle = startAngle + deg2rad(f.attackAngle)
                ctx.translate(f.x, f.y)
                ctx.lineWidth = 1;
                ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.arc(0,0,f.attackDistance*f.scale, startAngle, endAngle)
                ctx.closePath()
                ctx.fill();
                ctx.restore()
            }

            ctx.beginPath()
            ctx.lineWidth = 1;
            ctx.fillStyle = "green";
            if (f.type === 'bean') {
                ctx.fillStyle = "blue";
            }
            if (f.playerId) {
                ctx.fillStyle = "red";
            }

            ctx.arc(f.x, f.y, 5, 0, 2 * Math.PI);
            ctx.fill();
            ctx.closePath()

            if (f.playerId && f.type === 'fighter') {
                ctx.fillStyle = "red";
                ctx.font = "16px serif";
                ctx.fillStyle = "white";
                ctx.fillText(f.playerId + ' ' + f.beans.size,f.x,f.y)
            }
        }
    })

    if (layer === 1) {
        ctx.drawImage(tileMap2,-level.padding, -level.padding) //, level.width+level.pading*2, level.height+level.pading*2, -level.pading, -level.pading, level.width+level.pading*2, level.height+level.pading*2);
    }

    if (layer === 1) {
        const playerFiguresSortedByNewPoints = figuresPlayer.toSorted((f1,f2) => (f1.points-f1.oldPoints) - (f2.points-f2.oldPoints));
        figuresPlayer.forEach((f,i) => {
            
            var player = players.find(p => p.playerId === f.playerId)

            ctx.save()
            ctx.beginPath();
            const sortIndex = playerFiguresSortedByNewPoints.findIndex(fig => fig.playerId === f.playerId);
            const dt1 = dtProcessed - newPlayerIdThen;
            const dt2 = dtProcessed - (lastWinnerPlayerIdThen + sortIndex*moveScoreToPlayerDuration);
            const dt3 = dtProcessed - (lastWinnerPlayerIdThen + figuresPlayer.length*moveScoreToPlayerDuration);
            const dt4 = dtProcessed - (lastWinnerPlayerIdThen + figuresPlayer.length*moveScoreToPlayerDuration + showFinalWinnerDuration);
            let fillStyle = 'rgba(0, 0, 0, 0.5)';
            let points = f.points;
            let offx = 48*1.2

            if (dt1 < moveNewPlayerDuration) {
                if (!newPlayerIds.has(f.playerId)) {
                    ctx.translate(32+i*offx, level.height+32)
                } else {
                    var lp = dt1 / moveNewPlayerDuration
                    var lpi = 1-lp
                    ctx.translate(lpi * (level.width*0.5) + lp*(32+i*offx), lpi*(level.height*0.5) + lp*(level.height+32))
                    ctx.scale(12*lpi + lp, 12*lpi + lp)
                }   
            } else if (lastWinnerPlayerIdThen && dt2 >= 0 && dt2 < moveScoreToPlayerDuration) {
                const lp = dt2 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*(32+i*offx) + lp*f.x, lpi*(level.height+32) + lp*f.y)
                ctx.scale(lpi + 2*lp, lpi + 2*lp)
                if (lastWinnerPlayerIds.has(f.playerId)) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
                if (lastFinalWinnerPlayerId === f.playerId) {
                    ctx.scale(lpi + 2*lp, lpi + 2*lp)
                }
                points = f.oldPoints;
            } else if (lastWinnerPlayerIdThen && dt2 >= moveScoreToPlayerDuration && dt3 < showFinalWinnerDuration) {
                ctx.translate(f.x, f.y)
                ctx.scale(2.0, 2.0)
                if (lastWinnerPlayerIds.has(f.playerId)) {
                    fillStyle = 'rgba(178, 145, 70, 0.5)'
                }
                if (lastFinalWinnerPlayerId === f.playerId) {
                    ctx.scale(2.0, 2.0)
                }
            } else if (lastWinnerPlayerIdThen && dt4 >= 0 && dt4 < moveScoreToPlayerDuration) {
                const lp = dt4 / moveScoreToPlayerDuration
                const lpi = 1-lp
                ctx.translate(lpi*f.x + lp*(32+i*offx), lpi*f.y + lp*(level.height+32))
                ctx.scale(2*lpi + lp, 2*lpi + lp)
                if (lastFinalWinnerPlayerId) {
                    points = 0;
                }
            } else {
                ctx.translate(32+i*offx, level.height+32)
            }

            if (player.type === 'bot') {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
                ctx.lineWidth = 2
            } else {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
                ctx.lineWidth = 1
            }
            ctx.arc(0,0,24,0, 2 * Math.PI);
            ctx.fillStyle = fillStyle;
            ctx.fill();
            ctx.closePath()
            ctx.textAlign = "center";
            ctx.textBaseline='middle'
            ctx.fillStyle = "white";
            ctx.font = "36px arial";
            if (f.isAttacking && !restartGame) {
              ctx.translate(-5+Math.random()*10,-5+Math.random()*10)
            }
            ctx.fillText(points,0,2); // Punkte
            ctx.stroke();
            ctx.restore()

            if (f.playerId === lastFinalWinnerPlayerId && dt3 >= 0 && dt3 < showFinalWinnerDuration) {
                ctx.save();
                ctx.font = level.width*0.1+"px Arial";
                ctx.fillStyle = "rgba(139,69,19,0.8)";
                ctx.strokeStyle = "black";
                ctx.textAlign = "center";
                ctx.textBaseline='middle'
                ctx.lineWidth = 6
                ctx.translate(0.5*level.width,level.height*0.3)
                if (player.type === 'bot') {
                    fillTextWithStroke(ctx,`Player ${i+1} (Bot) wins`,0,0)
                } else {
                    fillTextWithStroke(ctx,`Player ${i+1} wins`,0,0)
                }

                ctx.restore()
            }
        })
    
  
    }


    if (layer === 1) {
        ctx.save()
        ctx.font = level.width*0.02+"px Arial";
        ctx.fillStyle = "white"//rgba(139,69,19,0.4)";
        //ctx.strokeStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline='bottom'
        ctx.lineWidth = 0
        ctx.translate(0.5*level.width,-level.width*0.005)
        ctx.fillText('STEALTHY STINKERS',0,0)
        ctx.translate(0.5*level.width,0)
        //ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.textAlign = "right";
        ctx.lineWidth = 0
        ctx.font = level.width*0.012+"px Arial";
        ctx.fillText('made by TORSTEN STELLJES & ALEXANDER THURN',0,0)
        ctx.restore()
    }
    
    

    ctx.restore()

    if (layer === 1 && showDebug) {
        ctx.save()
        ctx.font = "16px Arial";
        ctx.fillStyle = "white";
        ctx.textBaseline='top'
        ctx.textAlign = "right";
        if (windowHasFocus) {
            ctx.fillText(fps + " FPS", canvas.width, 0);
        } else {
            
        ctx.fillStyle = "rgba(87,65,47,0.9)";
            ctx.fillRect(canvas.width*0.0, canvas.height*0.25, canvas.width*1, canvas.height*0.5)
            ctx.fillStyle = "white";
            ctx.textBaseline='middle'
            ctx.textAlign = "center";
            ctx.font = canvas.width*0.05 + "px Arial";
            ctx.fillText(isGameStarted ? 'Pause' : 'Welcome to Stealthy Stinkers', canvas.width*0.5, canvas.height*0.5);
        }
        
      ctx.restore()
    }


    if (layer === 1 && showDebug) {

      ctx.save()
        ctx.font = "16px serif";
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline='top'
        
        ctx.save()

        

          ctx.fillText('Players',0,0)
          players.forEach((g,i) => {
              ctx.translate(0,16)
              ctx.fillText(g.playerId + " xAxis: " + g.xAxis.toFixed(2) + " yAxis: " + g.yAxis.toFixed(2) + " Attack?: " + g.isAttackButtonPressed,0,0) 
          })
        ctx.restore()
    
        ctx.save()
          ctx.textBaseline='bottom'
          ctx.translate(0,canvas.height)
          figures.filter(f => f.playerId).forEach((g,i) => {
              ctx.fillText("playerId: " + g.playerId + " x: " + Math.floor(g.x) + " y: " + Math.floor(g.y) + " Beans: " + g.beans?.size,0,0) 
              ctx.translate(0,-16)
          })
          ctx.fillText('Figures with player',0,0)
        ctx.restore()
      ctx.restore()
  }


  if (layer === 1) {
    var mp = mousePlayers.length > 0 ? mousePlayers[0] : mouses[0]

    if (mp.pointerType === 'touch') {
        ctx.save()
        var maxHeightWidth = Math.max(canvas.width, canvas.height)
        var minHeightWidth = Math.min(canvas.width, canvas.height)
        btnTouchController = {...btnTouchController, x: minHeightWidth*0.3, y: canvas.height - minHeightWidth*0.3, loadingPercentage: 0.0, radius: minHeightWidth*0.18}
        btnTouchAction = {...btnTouchAction, x: canvas.width-minHeightWidth*0.3, y: canvas.height - minHeightWidth*0.3, loadingPercentage: 0.0, radius: minHeightWidth*0.18}
        
        ctx.save()
            ctx.translate(btnTouchController.x,btnTouchController.y)
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.arc(0,0,btnTouchController.radius, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill();
            var xy = move(0,0,angle(0,0,mp.xAxis,mp.yAxis),btnTouchController.radius*0.5,mp.isMoving)
            ctx.translate(xy.x,xy.y)
            ctx.beginPath();
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.arc(0,0,btnTouchController.radius*0.5, 0, 2 * Math.PI)
            ctx.closePath()
            ctx.fill();
        ctx.restore()

        ctx.translate(btnTouchAction.x,btnTouchAction.y)
        ctx.beginPath();
       
        if (mp.isAttackButtonPressed) {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
        } else {
            ctx.fillStyle = "rgba(255,255,255,0.3)";
       }
        ctx.arc(0,0,btnTouchAction.radius, 0, 2 * Math.PI)
        ctx.closePath()
        ctx.fill();

      

        ctx.restore()
    } else {
        ctx.save()
       // ctx.beginPath();
       //var f = figures.find(f => f.playerId ===  mp.playerId && f.type === 'fighter')
       const w = imageArrow.width*0.5
       const h = imageArrow.height
       const x  = -w*0.5
       const y = -h*0.5




        ctx.translate(level.offsetX + level.scale*mp.x, level.offsetY + level.scale*mp.y)
        ctx.scale(level.scale, level.scale)

        if (mp.xCenter !== undefined && mp.yCenter !== undefined) {
            ctx.save()
            ctx.strokeStyle = "rgba(255,255,255,0.5)";
            ctx.lineWidth = 8

            if (mp.isMoving) {
                ctx.beginPath()
                ctx.moveTo(0,0);
                ctx.lineTo(mp.xCenter-mp.x,mp.yCenter-mp.y);
                ctx.stroke();
                ctx.closePath()
            }
           

            ctx.beginPath()
            ctx.arc(mp.xCenter-mp.x,mp.yCenter-mp.y,level.width*0.03,0, Math.PI * 2)
            ctx.stroke();
            ctx.closePath()
             ctx.restore()
        }
        

        ctx.globalAlpha = 0.5;
        //ctx.translate(-w*0.5,-h*0.5)
        ctx.rotate(angle(0,0,mp.xAxis,mp.yAxis))
        if (mp.isMoving) {
            ctx.drawImage(imageArrow, 0,0, w, h,x, y, w,h)
        } else {
            //ctx.drawImage(imageArrow,0,0)
            ctx.drawImage(imageArrow, w,0, w, h,x, y, w,h)
        }
     
       
       // ctx.arc(mp.x, mp.y, 5, 0, 2 * Math.PI);
       // ctx.lineWidth = 1;
       // ctx.strokeStyle = "rgba(0,0,0,0.5)";
        //ctx.stroke();
        ctx.restore()
    }
  }
}