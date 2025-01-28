
function draw(players, figuresSorted, figuresPlayer, dt, dtProcessed, layer) {

    
    ctx.save()

    if (layer === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    ctx.translate(level.offsetX, level.offsetY)
    ctx.scale(level.scale, level.scale)
    //ctx.transform(level.scale, 0, 0, level.scale, level.offsetX, level.offsetY)
    
    figuresSorted.forEach(f => {
        
        let deg = rad2limiteddeg(f.angle)
        let sprite = null
        
        ctx.save()
        ctx.translate(f.x, f.y)

        if (!f.isDead) {
            if (f.isAttacking) {
                if (f.type === 'cloud') {
                    ctx.globalCompositeOperation = "difference";
                }
            } 
            ctx.scale( f.scale, f.scale)
            ctx.drawImage(f.image, sprite[0], sprite[1], sprite[2], sprite[3], 0 - f.imageAnim.width*0.5, 0 - f.imageAnim.height*0.5, f.imageAnim.width, f.imageAnim.height)
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

    ctx.restore()

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