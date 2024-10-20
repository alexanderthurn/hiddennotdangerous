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

        if (multikillCounter === 2) {
            playAudio(soundDoubleKill);
        } else if (multikillCounter === 3) {
            playAudio(soundTripleKill);
        } else if (multikillCounter === 4) {
            playAudio(soundMultiKill);
        } else if (multikillCounter === 5) {
            playAudio(soundMegaKill);
        } else if (multikillCounter === 6) {
            playAudio(soundUltraKill);
        } else if (multikillCounter === 7) {
            playAudio(soundMonsterKill);
        } else if (multikillCounter === 8) {
            playAudio(soundLudicrousKill);
        } else if (multikillCounter > 8) {
            playAudio(soundHolyShit);
        }

        if (totalkillCounter >= 5*(lastTotalkillAudio+1)) {
            if (lastTotalkillAudio === 0) {
                playAudio(soundKillingSpree);
            } else if (lastTotalkillAudio === 1) {
                playAudio(soundRampage);
            } else if (lastTotalkillAudio === 2) {
                playAudio(soundDominating);
            } else if (lastTotalkillAudio === 3) {
                playAudio(soundUnstoppable);
            } else if (lastTotalkillAudio === 4) {
                playAudio(soundGodlike);
            } else if (lastTotalkillAudio > 4) {
                playAudio(soundWickedSick);
            }
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