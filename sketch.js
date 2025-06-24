let pg;
let worldWidth = 8000;
let worldHeight = 1000;
let xPos;
let yPos;
let gravity;
let playerKilled;
let dashReady = true;
let isDashing;
let dashDir = 0;
let dashDur = 150;
let dashSpeed = 10;
let lastDashTime = 0;
let dashCoolDown = 500;
let platforms = [];
let walls = [];
let teleporters = [];
let xLift = 1700;
let yLift;
let liftW = 250;
let liftH = 30;
let yLiftPrev = 730;
let landed;
let camX = 0;
let camY = 0;
let easing = 0.07;
let canvasW = 640;
let canvasH = 360;
let playerRest, playerRun, playerJump, playerDash;
let playerState = "rest";
let playerRestFrames = [];
let playerRunFrames = [];
let playerTravelFrames = [];
let smokeFrames = [];
let runFrameIndex = 0;
let restFrameIndex = 0;
let runFrameDelay = 5;
let restFrameDelay = 11;
let runFrameCounter = 0;
let restFrameCounter = 0;
let facingRight = true;
let yVelocity = 0;
let currentLift = null;
let onLift = false;
let reachedUp = false;
let canTravel = true;
let lastTravelTime = 0;
let travelCoolDown = 750;

function preload() {
  for (let i = 1; i <= 2; i++) {
    playerRestFrames.push(loadImage(`player_assets/playerrest_${i}.png`));
  }
  for (let i = 1; i <= 4; i++) {
    playerRunFrames.push(loadImage(`player_assets/playerrun_${i}.png`));
  }
  playerJump = loadImage("player_assets/playerjump.png");
  playerDash = loadImage("player_assets/playerdash.png");
  worldMap = loadImage("world_assets/map2teleporters.jpg");
  teleporterImg = loadImage("world_assets/teleporter_active.png");
  liftImg = loadImage("world_assets/lift.png");
}

function setup() {
  pixelDensity(1);
  pg = createGraphics(canvasW, canvasH);
  createCanvas(windowWidth, windowHeight);
  pg.noSmooth();
  xPos = 425;
  yPos = 615;
  yLift = 700;
  gravity = 1;
  angleMode(DEGREES);
  platforms.push({ x: 400, y: 625, w: 275, h: 375 });
  platforms.push({ x: 737, y: 587, w: 175, h: 15 });
  platforms.push({ x: 1050, y: 525, w: 225, h: 475 });
  platforms.push({ x: 1275, y: 730, w: 1187, h: 50 });
  platforms.push({ x: 2237, y: 435, w: 213, h: 25 });
  platforms.push({ x: 587, y: 227, w: 975, h: 25 });
  platforms.push({ x: 225, y: 475, w: 350, h: 10 });
  platforms.push({ x: 55, y: 412, w: 170, h: 25 });
  platforms.push({ x: 350, y: 488, w: 50, h: 135 });
  platforms.push({ x: 587, y: 252, w: 50, h: 50 });
  platforms.push({ x: 215, y: 437, w: 10, h: 50 });
  platforms.push({ x: 45, y: 0, w: 10, h: 437 });
  platforms.push({ x: 2725, y: 712, w: 287, h: 1000 });
  platforms.push({ x: 1975, y: 228, w: 253, h: 47 });
  platforms.push({ x: 2228, y: 129, w: 222, h: 40 });
  platforms.push({ x: 2237, y: 435, w: 213, h: 33 });
  platforms.push({ x: 4150, y: 923, w: 1250, h: 100 });
  platforms.push({ x: 2725, y: 711, w: 298, h: 289 });
  platforms.push({ x: 3012, y: 796, w: 776, h: 204 });
  platforms.push({ x: 3075, y: 591, w: 713, h: 25 });
  platforms.push({ x: 2450, y: 0, w: 269, h: 1000 });
  platforms.push({ x: 3788, y: 0, w: 362, h: 1000 });
  platforms.push({ x: 2895, y: 634, w: 130, h: 21 });
  platforms.push({ x: 5400, y: 0, w: 100, h: 1000 });
  //platforms.push({ x: xLift, y: yLift, w: liftW, h: liftH });
  teleporters.push({ x: 2347, y: 403, xTarget: 2844, yTarget: 678 });
  teleporters.push({ x: 2844, y: 678, xTarget: 2347, yTarget: 403 });
  teleporters.push({ x: 2343, y: 97, xTarget: 4744, yTarget: 890 });
  teleporters.push({ x: 4744, y: 890, xTarget: 2343, yTarget: 97 });
  //teleporters.push({x: 404,y: 469, xTarget: 5738, yTarget: 365});
}

function draw() {
  let targetCamX = constrain(xPos - canvasW / 2, 0, worldWidth - canvasW);
  let targetCamY = constrain(yPos - canvasH / 2, 0, worldHeight - canvasH);
  camX += (targetCamX - camX) * easing;
  camY += (targetCamY - camY) * easing;
  pg.push();
  pg.translate(-camX, -camY);
  pg.image(worldMap, 0, 0, worldWidth, worldHeight);
  //pg.background(220, 80, 100, 60);

  if (!playerKilled) {
    if (keyIsDown(65) || keyIsDown(97)) {
      xPos -= 5;
      facingRight = false;
    } else if (keyIsDown(68) || keyIsDown(100)) {
      xPos += 5;
      facingRight = true;
    }
  }
  gravityPull();
  playerJumping();
  speedDash();

  if (onLift) {
    yPos += yLift - yLiftPrev;
  }

  //pg.stroke(255, 0, 0);
  pg.noStroke();
  pg.noFill();
  for (let p of platforms) {
    pg.rect(p.x, p.y, p.w, p.h);
  }
  for (let w of walls) {
    pg.rect(w.x, w.y, w.w, w.h);
  }
  for (let t of teleporters) {
    let currentTravTime = millis();
    if (dist(xPos, yPos, t.x, t.y) < 100 && canTravel) {
      pg.imageMode(CENTER);
      pg.image(teleporterImg, t.x, t.y);
      if (keyIsDown(69)) {
        xPos = t.xTarget;
        yPos = t.yTarget - 150;
        lastTravelTime = currentTravTime;
        canTravel = false;
        break;
      }
    }
    if (!canTravel && currentTravTime - lastTravelTime >= travelCoolDown) {
      canTravel = true;
    }
  }

  if (!playerKilled) {
    if (isDashing) {
      if (millis() - dashStartTime < dashDur) {
        xPos += dashSpeed * dashDir;
      } else {
        isDashing = false;
      }
    }
    if (isDashing) {
      playerState = "dash";
    } else if (yVelocity < 0 || yVelocity > 2) {
      playerState = "jump";
    } else if (
      keyIsDown(65) ||
      keyIsDown(97) ||
      keyIsDown(68) ||
      keyIsDown(100)
    ) {
      playerState = "run";
    } else {
      playerState = "rest";
    }
    let currentSprite;
    if (playerState === "dash" && playerDash) currentSprite = playerDash;
    else if (playerState === "jump" && playerJump) currentSprite = playerJump;
    if (playerState === "rest") {
      restFrameCounter++;
      if (restFrameCounter >= restFrameDelay) {
        restFrameIndex = (restFrameIndex + 1) % playerRestFrames.length;
        restFrameCounter = 0;
      }
      if (playerRestFrames[restFrameIndex]) {
        currentSprite = playerRestFrames[restFrameIndex];
      }
    }
    if (playerState === "run") {
      runFrameCounter++;
      if (runFrameCounter >= runFrameDelay) {
        runFrameIndex = (runFrameIndex + 1) % playerRunFrames.length;
        runFrameCounter = 0;
      }
      if (playerRunFrames[runFrameIndex]) {
        currentSprite = playerRunFrames[runFrameIndex];
      }
    }
    pg.push();
    pg.imageMode(CENTER);
    if (currentSprite) {
      if (!facingRight) {
        pg.translate(xPos, yPos);
        pg.scale(-1, 1);
        pg.image(currentSprite, 0, 0);
      } else {
        pg.image(currentSprite, xPos, yPos);
      }
    }
    pg.pop();
  } else if (playerKilled) {
    playerState = "rest";
    xPos = 460;
    yPos = 561;
    yVelocity = 0;
    let currentSprite;
    if (playerState === "rest") {
      restFrameCounter++;
      if (restFrameCounter >= restFrameDelay) {
        restFrameIndex = (restFrameIndex + 1) % playerRestFrames.length;
        restFrameCounter = 0;
      }
      if (playerRestFrames[restFrameIndex]) {
        currentSprite = playerRestFrames[restFrameIndex];
      }
    }
    if (currentSprite) {
      pg.image(currentSprite, xPos, yPos);
    }
    playerKilled = false;
  }

  for (let p of platforms) {
    //this is for wall-pushing. too. ig.
    if (
      xPos + 15 > p.x &&
      xPos - 15 < p.x + p.w &&
      yPos + 15 > p.y &&
      yPos - 15 < p.y + p.h
    ) {
      if (xPos < p.x) xPos = p.x - 15;
      else if (xPos > p.x + p.w) xPos = p.x + p.w + 15;
    }
  }
  for (let p of platforms) {
    //this is for wall-pushing
    if (xPos >= p.x && xPos < p.x + p.w && yPos >= p.y && yPos <= p.y + p.h) {
      xPos = p.x - 15;
    } else if (
      xPos <= p.x + p.w &&
      xPos > p.x &&
      yPos >= p.y &&
      yPos <= p.y + p.h
    ) {
      xPos = p.x + p.w + 15;
    }
  }
  // for (let p of platforms) {  //code breaker?
  //   if (
  //     xPos >= p.x &&
  //     xPos <= p.x + p.w &&
  //     yPos <= p.y + p.h)
  //   {
  //     yPos = p.y + p.h - 5 ;
  //   }
  // }

  // if (onLift) {
  //   console.log("Player is on lift:", currentLift);
  // } else {
  //   console.log("Player is not on lift.");
  // }

  if (onLift && !reachedUp) {
    yLift -= 4;
    yPos = yLift - 32;
  }
  if (yLift < 200) {
    reachedUp = true;
    yLift = 200;
  }

  if (reachedUp && !onLift) {
    yLift += 4;
    if (yLift >= 700) {
      yLift = 700;
      reachedUp = false;
    }
  }
  if (yLift < 700 && yLift > 200 && !onLift) {
    yLift += 4;
    if (yLift >= 700) {
      yLift = 700;
    }
  }
  yLiftPrev = yLift;
  pg.image(liftImg, xLift, yLift, liftW, liftH);

  let scaleX = windowWidth / canvasW;
  let scaleY = windowHeight / canvasH;
  let scaleVal = min(scaleX, scaleY);
  let offsetX = (windowWidth - canvasW * scaleVal) / 2;
  let offsetY = (windowHeight - canvasH * scaleVal) / 2;
  image(pg, offsetX, offsetY, canvasW * scaleVal, canvasH * scaleVal);
  pg.pop();

  // console.log("Player X:", xPos, "Player Y:", yPos);
}

function gravityPull() {
  landed = false;
  onLift = false;
  for (let p of platforms) {
    let platformTop = p.y;
    let playerBottom = yPos + 32;

    if (
      playerBottom <= platformTop &&
      playerBottom + yVelocity >= platformTop &&
      xPos >= p.x &&
      xPos <= p.x + p.w
    ) {
      yPos = platformTop - 32;
      yVelocity = 0;
      landed = true;
      return;
    }
    let liftTop = yLift;
    if (
      playerBottom <= liftTop &&
      playerBottom + yVelocity >= liftTop &&
      xPos >= xLift &&
      xPos <= xLift + liftW
    ) {
      yPos = liftTop - 32;
      yVelocity = 0;
      landed = true;
      onLift = true;
      return;
    }
  }

  currentLift = null;
  yVelocity += gravity;
  yPos += yVelocity;
  if (yPos >= worldHeight - 32) {
    playerKilled = true;
  }
}

function playerJumping() {
  if (!playerKilled && keyIsDown(87) && landed === true) {
    yVelocity -= 15;
  }
}

function speedDash() {
  let currentTime = millis();
  if (dashReady && keyIsDown(16) && (keyIsDown(65) || keyIsDown(97))) {
    isDashing = true;
    dashDir = -1;
    dashStartTime = currentTime;
    lastDashTime = currentTime;
    dashReady = false;
  } else if (dashReady && keyIsDown(16) && (keyIsDown(68) || keyIsDown(100))) {
    isDashing = true;
    dashDir = 1;
    dashStartTime = currentTime;
    lastDashTime = currentTime;
    dashReady = false;
  }
  if (!dashReady && currentTime - lastDashTime >= dashCoolDown) {
    dashReady = true;
  }
}
