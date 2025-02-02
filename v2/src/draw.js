
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
}