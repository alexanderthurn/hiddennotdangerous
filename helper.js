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
    file.load();
    Object.entries(props).forEach(([key, value]) => {
        if (value) {
            file[key] = value;
        }
    });
    file.play().catch((err) => {console.log(err)});
}

const getPlayAudio = (audio) => () => playAudio(audio)

const playPlaylist = (playlist) => {
    playlist.forEach((track, index, list) => track.file.addEventListener("ended", getPlayAudio(playlist[(index+1)%list.length])));
    playAudio(playlist[0]);
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

function resizeCanvasToDisplaySize(canvas) {
    // look up the size the canvas is being displayed
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
 
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
    level.scale = Math.min(canvas.width / level.width, canvas.height / level.height)
    level.offsetX = (canvas.width - level.scale * level.width) / 2
    level.offsetY = (canvas.height - level.scale * level.height) / 2
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

  const shadowrize = (image, anim) => {
    const tileWidth = anim.tileWidth
    const tileHeight = anim.tileHeight
    const scale = 2
    const w = image.width / tileWidth
    const h = image.height / tileHeight
    const offscreen = new OffscreenCanvas(image.width*scale, image.height*scale);
    const ctx = offscreen.getContext("2d");
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowOffsetX = -image.width*10;
    ctx.shadowOffsetY = -8;
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


    const imageData = ctx.getImageData(0, 0, image.width*scale, image.height*scale);
    ctx.putImageData(imageData, 0, 0);
    animOut = JSON.parse(JSON.stringify(anim))
    animOut.width*=scale
    animOut.height*=scale
    animOut.down.a = animOut.down.a.map(array => array.map(a => a*scale))
    animOut.up.a = animOut.up.a.map(array => array.map(a => a*scale))
    animOut.left.a = animOut.left.a.map(array => array.map(a => a*scale))
    animOut.right.a = animOut.right.a.map(array => array.map(a => a*scale))
    animOut.default.a = animOut.default.a.map(array => array.map(a => a*scale))


       /* test for game.js draw
    ctx.save()
    ctx.scale(3.0,3.0)
    ctx.fillStyle = "white";
    ctx.fillRect(100,100,playerShadowImage.width, playerShadowImage.height)
    ctx.drawImage(playerShadowImage, 100,100)
    ctx.restore()

    ctx.save()
    ctx.translate(300,100)
    ctx.fillRect(-playerShadowImage.width*0.5,-playerShadowImage.height*0.5,playerShadowImage.width, playerShadowImage.height)
    var sprite = playerImageAnim.right.a[0]
    var spriteShadow = playerImageShadowAnim.right.a[0]
    ctx.drawImage(playerShadowImage, spriteShadow[0], spriteShadow[1], spriteShadow[2], spriteShadow[3], 0 - playerImageShadowAnim.width*0.5, 0 - playerImageShadowAnim.height*0.5, playerImageShadowAnim.width, playerImageShadowAnim.height)
    ctx.drawImage(playerImage, sprite[0], sprite[1], sprite[2], sprite[3], 0 - playerImageAnim.width*0.5, 0 - playerImageAnim.height*0.5, playerImageAnim.width, playerImageAnim.height)
    ctx.restore()        
*/


    return [offscreen,animOut];
  } 