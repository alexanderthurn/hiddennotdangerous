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

function addjustAfterResizeIfNeeded(level, canvas) {
    if (resizeCanvasToDisplaySize(canvas)) {
        adjustLevelToCanvas(level, canvas)
    }
}

function resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;
    canvasRatio = height / width
    /*if (canvas.clientWidth > 1920) {
        width = 1920
        height = 1920*canvasRatio
    }*/
    // If it's resolution does not match change it
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }

    return false;
}

function adjustLevelToCanvas(level, canvas) {
    level.width = 1920
    level.height = 1080
    level.padding = 16
    level.scale = Math.min(canvas.width / level.width, canvas.height / level.height)*0.9
    level.offsetX = (canvas.width - level.scale * level.width) / 2
    level.offsetY = (canvas.height - level.scale * level.height) / 2
    level.shortestPathNotBean5 = 2*0.6*level.height+2*0.3*Math.hypot(level.height, level.width);
    level.shortestPathBean5 = 2*0.6*level.height+0.6*level.width+0.3*Math.hypot(level.height, level.width);
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

const colorize = (image, r, g, b) => {
    const imageSize = image.width;
  
    const offscreen = new OffscreenCanvas(imageSize, imageSize);
    const ctx = offscreen.getContext("2d");
  
    ctx.drawImage(image, 0, 0);
  
    const imageData = ctx.getImageData(0, 0, imageSize, imageSize);
  
    for (let i = 0; i < imageData.data.length; i += 4) {
      imageData.data[i + 0] *= r;
      imageData.data[i + 1] *= g;
      imageData.data[i + 2] *= b;
    }
  
    ctx.putImageData(imageData, 0, 0);
  
    return offscreen;
}

const tileMapFunc = (image, layer) => {
    const offscreen = new OffscreenCanvas(level.width+level.padding*2, level.height+level.padding*2);
    const ctx = offscreen.getContext("2d");

    ctx.translate(level.padding, level.padding)
    
    if (layer < 1) {
        ctx.save()
        const heightInTiles = getHeightInTiles();
        const widthInTiles = getWidthInTiles();
        for (let i = 0; i < tileArea.length; i++) {
            for (let j = tileArea[i].length; j < heightInTiles; j++) {
                tileArea[i][j] = getRandomInt(3);
            }
        }
        for (let i = tileArea.length; i < widthInTiles; i++) {
            tileArea[i] = [];
            for (let j = 0; j < heightInTiles; j++) {
                tileArea[i][j] = getRandomInt(3);
            }
        }

        maxI = Math.min(tileArea.length, widthInTiles);
        for (let i = 0; i < maxI; i++) {
            maxJ = Math.min(tileArea[i].length, heightInTiles);
            for (let j = 0; j < Math.min(tileArea[i].length, heightInTiles); j++) {
                const tile = textureTilesList[tileArea[i][j]];
                let relTileWidth = 1;
                let relTileHeight = 1;
                if (i === maxI-1) {
                    relTileWidth = (level.width % tileWidth) / tileWidth;
                    relTileWidth = relTileWidth > 0 ? relTileWidth : 1;
                }
                if (j === maxJ-1) {
                    relTileHeight = (level.height % tileWidth) / tileWidth;
                    relTileHeight = relTileHeight > 0 ? relTileHeight : 1;
                }
                ctx.drawImage(image, tile[0], tile[1], relTileWidth * tile[2], relTileHeight * tile[3], 0, 0, relTileWidth * tileWidth, relTileHeight * tileWidth)
                if(j < Math.min(tileArea[i].length, heightInTiles)-1) {
                    ctx.translate(0, tileWidth);
                } else {
                    ctx.translate(tileWidth, -tileWidth * j);
                }   
            }
        }
        ctx.restore()

        drawFence(0, ctx, level)
        drawFence(1, ctx, level)

    } else {
        drawFence(1, ctx, level, true)
    }

    return offscreen;
}

const shadowrize = (image, anim) => {
    const tileWidth = anim.tileSpace
    const tileHeight = anim.tileSpace
    const scale = 2
    const w = image.width / tileWidth
    const h = image.height / tileHeight
    const offscreen = new OffscreenCanvas(image.width*scale, image.height*scale);
    const ctx = offscreen.getContext("2d");
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowOffsetX = -image.width*10;
    ctx.shadowOffsetY = -anim.tileWidth*0.5;
    ctx.shadowBlur = 2;
    
    for (var x = 0; x < w;x++) {
        for (var y=0; y <h;y++) {
            ctx.save()
            ctx.translate(x*tileWidth*scale+image.width*10+tileWidth*scale*0.6,y*tileHeight*scale+tileHeight*scale*0.5)
            ctx.transform(1, 0.1, -0.8, 1, 0, 0);
            ctx.drawImage(image, x*tileWidth,y*tileHeight, tileWidth, tileHeight, 0,0, tileWidth, tileHeight)
            ctx.restore()
        }
    }
    
    animOut = JSON.parse(JSON.stringify(anim))
    animOut.width*=scale
    animOut.height*=scale
    animOut.down.a = animOut.down.a.map(array => array.map(a => a*scale))
    animOut.up.a = animOut.up.a.map(array => array.map(a => a*scale))
    animOut.left.a = animOut.left.a.map(array => array.map(a => a*scale))
    animOut.right.a = animOut.right.a.map(array => array.map(a => a*scale))
    animOut.default.a = animOut.default.a.map(array => array.map(a => a*scale))

    return [offscreen,animOut];
} 

const drawFence = (layer, ctx, level, shadow) => {

    ctx.save()
    ctx.lineWidth = level.padding;
    var y = 0
    var x = 0
    
    if (!shadow) {
        ctx.shadowColor = "rgba(0,0,0,0.5)"
        ctx.shadowOffsetX = 12;
        ctx.shadowOffsetY = -12;
        ctx.shadowBlur = 8;
    } else {

        ctx.fillStyle = "rgba(150,150,150,1.0)";
    }

    if (layer === 1) {
        ctx.fillRect(x,level.padding*2, level.padding*0.5, level.height-level.padding)
        ctx.fillRect(x+level.width-level.padding*0.5,level.padding*2, level.padding*0.5, level.height-level.padding)
        y = level.height-level.padding-level.padding
    } else {
        ctx.fillRect(x,0, level.padding, level.padding*2)
        ctx.fillRect(x+level.width-level.padding*0.5,0, level.padding*0.5, level.padding*2)
        y = 0
    }

    ctx.fillRect(x,y,level.width,level.padding*0.6)
    ctx.fillStyle = "rgba(120,120,120,1.0)";
    ctx.fillRect(x+level.padding*0.5,y+level.padding*0.8,level.width-level.padding,level.padding*0.6)
    ctx.fillStyle = "rgba(90,90,90,1.0)";
    ctx.fillRect(x+level.padding*0.5,y+level.padding*1.6,level.width-level.padding,level.padding*0.6)

    

    ctx.restore()

    if (!shadow) {
        drawFence(layer,ctx,level,true)
    }

}

var fillTextWithStroke = (ctx, text,x,y) => {
    ctx.fillText(text,x,y)
    ctx.strokeText(text,x,y)
}

var fillTextWithStrokeMultiline = (ctx, text, x,y, fontHeight) => {
    text?.split("\n").forEach(t => {
        fillTextWithStroke(ctx, t, x,y)
        ctx.translate(0,fontHeight*1.1)
    })
}

var fillTextMultiline = (ctx, text, x,y, fontHeight) => {
    text?.split("\n").forEach(t => {
        ctx.fillText(t,x,y)
        ctx.translate(0,fontHeight*1.1)
    })
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
        angle: 0,
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


function drawButton(btn) {
    ctx.save()
    ctx.translate(btn.x,btn.y)
    ctx.save()
        // ctx.translate(level.width*(0.04+0.52),level.height*0.3)
        ctx.beginPath();

        ctx.fillStyle = "rgba(87,65,47,0.5)";
        ctx.fillRect(0,0, btn.width, btn.height)
        ctx.fillStyle = "rgba(120,120,120,0.5)";
        ctx.globalCompositeOperation = "color-burn";
       // ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fillRect(0,0, btn.width*btn.loadingPercentage, btn.height)
        ctx.closePath()
        ctx.fill();
    ctx.restore()

    if (btn.text) {
        var fontHeight = level.width*0.017  
        ctx.font = fontHeight+"px Arial";
        ctx.fillStyle = "white";
        ctx.strokeStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline='middle'
        ctx.lineWidth = 0
        ctx.font = level.width*0.02+"px Arial";
        ctx.translate(btn.width*0.5,btn.height*0.5)
        ctx.translate(0,-fontHeight*Math.max(0,btn.text.split('\n').length-1)*0.5)
        fillTextMultiline(ctx,btn.text,0,0,fontHeight) 
    }
    ctx.restore()
}