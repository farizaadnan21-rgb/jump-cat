// script.js – Polished Indie Pixel-Art Endless Runner Cat Game
// -----------------------------------------------------------------

// Canvas utility (fixed coordinate space)
function getCanvasContext() {
  const canvas = document.getElementById('gfxCanvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  return ctx;
}

// Simple AABB collision detection
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// Color interpolation helpers for dynamic background transitions
function parseColor(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return { r, g, b };
}

function interpolateColor(color1, color2, factor) {
  const c1 = parseColor(color1);
  const c2 = parseColor(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * factor);
  const g = Math.round(c1.g + (c2.g - c1.g) * factor);
  const b = Math.round(c1.b + (c2.b - c1.b) * factor);
  return `rgb(${r},${g},${b})`;
}

// Background stages definition based on score milestones
const STAGES = [
  {
    score: 0,
    skyTop: '#040b1e',      // Night
    skyMid: '#0f172a',
    skyBottom: '#1b1c3c',
    starsAlpha: 1.0,
    cityColor: '#070b13',
    groundColor: '#0a0d18',
  },
  {
    score: 800,
    skyTop: '#1e1b4b',      // Sunset / Dawn
    skyMid: '#581c87',
    skyBottom: '#f97316',
    starsAlpha: 0.2,
    cityColor: '#1a1226',
    groundColor: '#120d18',
  },
  {
    score: 1600,
    skyTop: '#0284c7',      // Day
    skyMid: '#38bdf8',
    skyBottom: '#bae6fd',
    starsAlpha: 0.0,
    cityColor: '#0c2340',
    groundColor: '#091c32',
  }
];

function getStageParams(score) {
  if (score <= STAGES[0].score) return STAGES[0];
  if (score >= STAGES[STAGES.length - 1].score) return STAGES[STAGES.length - 1];

  let i = 0;
  for (; i < STAGES.length - 1; i++) {
    if (score >= STAGES[i].score && score < STAGES[i + 1].score) {
      break;
    }
  }

  const s1 = STAGES[i];
  const s2 = STAGES[i + 1];
  const factor = (score - s1.score) / (s2.score - s1.score);

  return {
    skyTop: interpolateColor(s1.skyTop, s2.skyTop, factor),
    skyMid: interpolateColor(s1.skyMid, s2.skyMid, factor),
    skyBottom: interpolateColor(s1.skyBottom, s2.skyBottom, factor),
    starsAlpha: s1.starsAlpha + (s2.starsAlpha - s1.starsAlpha) * factor,
    cityColor: interpolateColor(s1.cityColor, s2.cityColor, factor),
    groundColor: interpolateColor(s1.groundColor, s2.groundColor, factor),
  };
}

// -----------------------------------------------------------------
// Game Configuration
const CONFIG = {
  gravity: 0.8,
  jumpVelocity: -16,
  catScale: 0.5, // Scaled slightly down for better proportion

  // Original drawing reference size
  playerBaseWidth: 145,
  playerBaseHeight: 165,

  // Obstacle spawn thresholds (ms) - Spawn more frequently
  obstacleGapMin: 1400,
  obstacleGapMax: 2000,

  // Speed scaling - Slower progression
  initialSpeed: 5,
  speedIncreaseInterval: 5000, // ms
  speedIncrement: 0.25,
};

// -----------------------------------------------------------------
// Audio Manager (synthesizes nostalgic 8-bit sound effects)
class AudioManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  playHit() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playScore() {
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1300, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
}

// -----------------------------------------------------------------
// UI Manager
class UIManager {
  constructor() {
    this.currentScoreEl = document.getElementById('current-score');
    this.highScoreEl = document.getElementById('high-score');
    this.speedLevelEl = document.getElementById('speed-level');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.finalScoreEl = document.getElementById('final-score');
    this.restartBtn = document.getElementById('restart-btn');
  }

  update(score, highScore, speedLevel) {
    if (this.currentScoreEl) this.currentScoreEl.textContent = score;
    if (this.highScoreEl) this.highScoreEl.textContent = highScore;
    if (this.speedLevelEl) this.speedLevelEl.textContent = speedLevel;
  }

  showSarcasm(message) {
    const el = document.getElementById('sarcasm-notification');
    if (el) {
      el.textContent = message;
      el.classList.remove('hidden');
      el.classList.add('show');
      
      if (this.sarcasmTimeout) clearTimeout(this.sarcasmTimeout);
      
      this.sarcasmTimeout = setTimeout(() => {
        el.classList.remove('show');
      }, 3500);
    }
  }

  showGameOver(score) {
    if (this.finalScoreEl) this.finalScoreEl.textContent = score;
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.remove('hidden');
    }
  }

  hideGameOver() {
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.add('hidden');
    }
  }

  setupRestartHandler(callback) {
    if (this.restartBtn) {
      // Clear old listeners by cloning
      const newBtn = this.restartBtn.cloneNode(true);
      this.restartBtn.parentNode.replaceChild(newBtn, this.restartBtn);
      this.restartBtn = newBtn;
      
      this.restartBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        callback();
      });
      this.restartBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        callback();
      });
    }
  }
}

// -----------------------------------------------------------------
// Renderer (sky, parallax background, scroll floor, particles)
class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.skyGradient = null;

    // Parallax layers
    this.clouds = [
      { x: 100, y: 60, size: 50, speed: 0.05 },
      { x: 450, y: 90, size: 70, speed: 0.08 },
      { x: 800, y: 40, size: 60, speed: 0.04 },
    ];
    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * 1200,
        y: Math.random() * 250,
        size: Math.random() * 2 + 1,
        alpha: Math.random(),
        speed: 0.015,
      });
    }
    this.city = [];
    for (let i = 0; i < 18; i++) {
      this.city.push({
        x: i * 80,
        width: 60 + Math.random() * 40,
        height: 60 + Math.random() * 130,
        speed: 0.2,
      });
    }

    this.groundOffset = 0;
    this.particles = [];
    this.screenShakeTime = 0;
    this.screenShakeIntensity = 0;
  }

  triggerShake(intensity, duration) {
    this.screenShakeIntensity = intensity;
    this.screenShakeTime = duration;
  }

  update(gameSpeed, dt) {
    // Parallax scroll
    this.clouds.forEach((c) => {
      c.x -= gameSpeed * c.speed;
      if (c.x + c.size * 2.5 < 0) c.x = this.canvas.width + 100;
    });

    this.stars.forEach((s) => {
      s.x -= gameSpeed * s.speed;
      if (s.x < 0) s.x = this.canvas.width;
      s.alpha += (Math.random() - 0.5) * 0.08;
      s.alpha = Math.max(0.1, Math.min(1.0, s.alpha));
    });

    this.city.forEach((b) => {
      b.x -= gameSpeed * b.speed;
      if (b.x + b.width < 0) {
        b.x = this.canvas.width + Math.random() * 30;
        b.height = 60 + Math.random() * 130;
      }
    });

    this.groundOffset = (this.groundOffset + gameSpeed) % 40;

    // Update particles
    this.particles.forEach((p) => p.update(dt));
    this.particles = this.particles.filter((p) => p.life > 0);

    // Update screen shake
    if (this.screenShakeTime > 0) {
      this.screenShakeTime -= dt;
    }
  }

  addParticle(x, y, vx, vy, color, size, maxLife) {
    this.particles.push({
      x,
      y,
      vx,
      vy,
      color,
      size,
      life: maxLife,
      maxLife,
      update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= dt;
      },
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.restore();
      },
    });
  }

  drawSky(score) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const params = getStageParams(score);

    const gradient = this.ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, params.skyTop);
    gradient.addColorStop(0.6, params.skyMid);
    gradient.addColorStop(1, params.skyBottom);

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, w, h);
  }

  drawParallax(score) {
    const h = this.canvas.height;
    const params = getStageParams(score);

    // Stars (fade out during day)
    if (params.starsAlpha > 0.05) {
      this.ctx.fillStyle = '#ffffff';
      this.stars.forEach((s) => {
        this.ctx.globalAlpha = s.alpha * params.starsAlpha;
        this.ctx.fillRect(s.x, s.y, s.size, s.size);
      });
      this.ctx.globalAlpha = 1.0;
    }

    // Skyline silhouette
    this.ctx.fillStyle = params.cityColor;
    this.city.forEach((b) => {
      this.ctx.fillRect(b.x, h - b.height - 30, b.width, b.height);
      
      // Neon windows fade out during day
      const windowAlpha = Math.max(0, params.starsAlpha);
      if (windowAlpha > 0.05) {
        this.ctx.fillStyle = `rgba(34, 211, 238, ${0.25 * windowAlpha})`;
        for (let wy = h - b.height + 10; wy < h - 45; wy += 25) {
          for (let wx = b.x + 8; wx < b.x + b.width - 10; wx += 16) {
            if (Math.random() > 0.45) {
              this.ctx.fillRect(wx, wy, 4, 6);
            }
          }
        }
        this.ctx.fillStyle = params.cityColor;
      }
    });

    // Clouds
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    this.clouds.forEach((c) => {
      const cx = c.x;
      const cy = c.y;
      this.ctx.fillRect(cx, cy, c.size, c.size * 0.4);
      this.ctx.fillRect(cx + c.size * 0.2, cy - c.size * 0.2, c.size * 0.6, c.size * 0.4);
      this.ctx.fillRect(cx - c.size * 0.1, cy + c.size * 0.1, c.size * 1.2, c.size * 0.3);
    });
    this.ctx.globalAlpha = 1.0;
  }

  drawGround(score) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const groundY = h - 30;
    const params = getStageParams(score);

    // Dark grid base
    this.ctx.fillStyle = params.groundColor;
    this.ctx.fillRect(0, groundY, w, 30);

    // Separation line (non-flashy slate gray)
    this.ctx.fillStyle = '#475569';
    this.ctx.fillRect(0, groundY, w, 2);

    // Grass texturing
    this.ctx.fillStyle = '#10b981';
    for (let x = -this.groundOffset; x < w; x += 40) {
      this.ctx.fillRect(x + 5, groundY + 6, 4, 3);
      this.ctx.fillRect(x + 18, groundY + 14, 6, 2);
      this.ctx.fillRect(x + 28, groundY + 8, 3, 4);
    }
  }

  drawParticles() {
    this.particles.forEach((p) => p.draw(this.ctx));
  }
}

// -----------------------------------------------------------------
// Player (accurate C# drawing with direction, squash/stretch & swing animations)
class Player {
  constructor(config) {
    this.config = config;
    this.x = 100;
    this.vy = 0;
    this.jumping = false;

    // Compute scaled dimension bounding box
    this.width = config.playerBaseWidth * config.catScale;
    this.height = config.playerBaseHeight * config.catScale;
    this.y = 0;

    // Dynamic animation parameters
    this.legSwing = 0;
    this.legForward = true;
    this.tailOffset = 0;
    this.tailGoingRight = true;
    this.headOffset = 0;
    this.headGoingUp = true;

    // Squash & Stretch
    this.squashX = 1;
    this.squashY = 1;
    this.jumpsLeft = 2; // Support double jump
  }

  jump() {
    if (this.jumpsLeft > 0) {
      if (this.jumping) {
        // Second jump: 72% height of first jump (weaker)
        this.vy = this.config.jumpVelocity * 0.72;
        this.squashX = 0.85;
        this.squashY = 1.25;
      } else {
        // First jump
        this.vy = this.config.jumpVelocity;
        this.jumping = true;
        this.squashX = 0.8;
        this.squashY = 1.35;
      }
      this.jumpsLeft--;
      return true;
    }
    return false;
  }

  update(gravity, groundY, gameSpeed) {
    this.vy += gravity;
    this.y += this.vy;

    // Base cat resting alignment Y (legs touch ground line)
    const restY = groundY - 110 * this.config.catScale;

    if (this.y >= restY) {
      this.y = restY;
      this.vy = 0;
      this.jumpsLeft = 2; // Reset double jump count

      if (this.jumping) {
        this.jumping = false;
        // Squash on hit ground
        this.squashX = 1.25;
        this.squashY = 0.75;
      }
    }

    // Ease squash/stretch factors back to 1
    this.squashX += (1 - this.squashX) * 0.15;
    this.squashY += (1 - this.squashY) * 0.15;

    // Animation speeds scale with game velocity
    const swingSpeed = 0.3 * gameSpeed;

    // Front/Back Leg swing
    if (this.legForward) {
      this.legSwing += swingSpeed;
      if (this.legSwing >= 5) this.legForward = false;
    } else {
      this.legSwing -= swingSpeed;
      if (this.legSwing <= -5) this.legForward = true;
    }

    // Tail swing
    if (this.tailGoingRight) {
      this.tailOffset += swingSpeed;
      if (this.tailOffset >= 10) this.tailGoingRight = false;
    } else {
      this.tailOffset -= swingSpeed;
      if (this.tailOffset <= -10) this.tailGoingRight = true;
    }

    // Head bob
    if (this.headGoingUp) {
      this.headOffset -= swingSpeed;
      if (this.headOffset <= -3) this.headGoingUp = false;
    } else {
      this.headOffset += swingSpeed;
      if (this.headOffset >= 0) this.headGoingUp = true;
    }
  }

  getHitbox() {
    // The visual body is from this.y to this.y + 105*scale.
    // Use a tighter hitbox for fairer physics (ignoring ears, tails, and feet tips)
    const scale = this.config.catScale;
    const pX = 25 * scale;
    const pY = 20 * scale;
    return {
      x: this.x + pX,
      y: this.y + pY,
      width: this.width - pX * 2,
      height: 80 * scale, // Fits visual bounds perfectly (bottom at y + 100 * scale, feet at 105 * scale)
    };
  }

  draw(ctx) {
    ctx.save();

    // Pivot squash/stretch at the bottom center of the cat body
    ctx.translate(this.x + this.width / 2, this.y + 110 * this.config.catScale);
    ctx.scale(this.squashX, this.squashY);

    // Mirroring math: Cat is drawn relative to coordinate (bx, by)
    // To make it face right, we scale -1 on X around the visual center (76.5)
    ctx.scale(-this.config.catScale, this.config.catScale);

    // Offset origin so it scales correctly relative to bottom-center of the body
    const bx = -72.5; 
    const by = -110; 

    // Colors (from original C# palette)
    const abuD = 'rgb(160,160,160)'; // light gray
    const abuG = 'rgb(80,80,80)';   // dark gray
    const abuB = 'rgb(130,130,130)'; // back legs
    const krem = 'rgb(210,210,190)'; // nose
    const pink = 'rgb(255,160,160)'; // tongue
    const eyeOpen = 'rgb(0,255,0)'; // lime green
    const eyeClosed = 'rgb(0,0,0)'; // black

    // Subtle dark drop shadow (tidak mencolok)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;

    // Back legs
    ctx.fillStyle = abuB;
    ctx.fillRect(bx + 30 - this.legSwing, by + 60, 22, 45);
    ctx.fillRect(bx + 110 + this.legSwing, by + 60, 22, 45);

    // Body
    ctx.fillStyle = abuD;
    ctx.fillRect(bx, by, 145, 65);

    // Belt / Details
    ctx.fillStyle = abuG;
    ctx.fillRect(bx + 30, by, 20, 10);
    ctx.fillRect(bx + 75, by, 20, 10);
    ctx.fillRect(bx + 120, by, 20, 10);

    // Tail
    ctx.fillRect(bx + 145, by + 15, 45, 18);
    ctx.fillRect(bx + 185, by + 15 + this.tailOffset, 25, 18);

    // Front legs
    ctx.fillStyle = abuD;
    ctx.fillRect(bx + 15 + this.legSwing, by + 65, 22, 45);
    ctx.fillRect(bx + 95 - this.legSwing, by + 65, 22, 45);

    // Head & Ears
    const hX = bx - 45;
    const hY = by - 35 + this.headOffset;

    // Outer ears
    ctx.fillStyle = abuD;
    ctx.fillRect(hX + 5, hY - 10, 15, 10);
    ctx.fillRect(hX + 45, hY - 10, 15, 10);

    // Inner ears
    ctx.fillStyle = abuG;
    ctx.fillRect(hX + 10, hY - 5, 5, 5);
    ctx.fillRect(hX + 50, hY - 5, 5, 5);

    // Head Base
    ctx.fillStyle = abuD;
    ctx.fillRect(hX, hY, 65, 65);

    // Forehead Stripes
    ctx.fillStyle = abuG;
    ctx.fillRect(hX + 12, hY, 10, 22);
    ctx.fillRect(hX + 28, hY, 10, 22);
    ctx.fillRect(hX + 43, hY, 10, 22);

    // Nose & Mouth
    ctx.fillStyle = krem;
    ctx.fillRect(hX + 10, hY + 38, 45, 27);
    ctx.fillStyle = pink;
    ctx.fillRect(hX + 28, hY + 43, 10, 5);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hX - 12, hY + 45);
    ctx.lineTo(hX + 5, hY + 45);
    ctx.moveTo(hX + 60, hY + 45);
    ctx.lineTo(hX + 77, hY + 45);
    ctx.stroke();

    // Eyes - Blinking
    const blink = Math.floor(performance.now() / 2200) % 2 === 0;
    ctx.fillStyle = blink ? eyeOpen : eyeClosed;
    ctx.fillRect(hX + 12, hY + 22, 12, blink ? 12 : 2);
    ctx.fillRect(hX + 43, hY + 22, 12, blink ? 12 : 2);

    ctx.restore();
  }
}

// -----------------------------------------------------------------
// Obstacle Manager (handles varied types, speeds, rendering)
class ObstacleManager {
  constructor(config, canvas) {
    this.config = config;
    this.canvas = canvas;
    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = config.obstacleGapMin;
  }

  update(gameSpeed, groundY, now, score) {
    this.obstacles.forEach((ob) => (ob.x -= gameSpeed));

    // Cleanup offscreen obstacles
    this.obstacles = this.obstacles.filter((ob) => ob.x + ob.width > 0);

    // Spawn ticker
    if (now - this.lastSpawnTime > this.spawnInterval) {
      this.spawn(groundY, score);
      this.lastSpawnTime = now;
      this.spawnInterval =
        this.config.obstacleGapMin +
        Math.random() * (this.config.obstacleGapMax - this.config.obstacleGapMin);
    }
  }

  spawn(groundY, score) {
    const types = ['spike', 'box', 'pillar', 'floating'];
    if (score >= 3500) {
      // 33% chance to spawn flappy gates above 3500 score
      types.push('gate', 'gate');
    }
    const type = types[Math.floor(Math.random() * types.length)];

    let ob = {
      x: this.canvas.width,
      type: type,
      passed: false,
    };

    switch (type) {
      case 'spike':
        ob.width = 20;
        ob.height = 25;
        ob.y = groundY - ob.height;
        break;
      case 'box':
        ob.width = 30;
        ob.height = 30;
        ob.y = groundY - ob.height;
        break;
      case 'pillar':
        ob.width = 18;
        ob.height = 52;
        ob.y = groundY - ob.height;
        break;
      case 'floating':
        ob.width = 28;
        ob.height = 18;
        ob.y = groundY - 120;
        break;
      case 'gate':
        ob.width = 30;
        // Make the gap 150px wide for much better playability.
        // Lock the safe path center height to always be perfectly reachable.
        // Single jump peak is ~160px from ground; double jump peak is ~240px from ground.
        const gapHeight = 150;
        const gapCenterMin = groundY - 170;
        const gapCenterMax = groundY - 80;
        const gapCenter = gapCenterMin + Math.random() * (gapCenterMax - gapCenterMin);

        const gapY = gapCenter - gapHeight / 2;
        ob.topHeight = gapY;
        ob.bottomHeight = groundY - (gapY + gapHeight);
        ob.y = 0;
        break;
    }

    this.obstacles.push(ob);
  }

  draw(ctx) {
    const groundY = this.canvas.height - 30;
    this.obstacles.forEach((ob) => {
      ctx.save();
      
      // Distinct but subtle slate/steel colors (pop from dark background)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2.5;

      switch (ob.type) {
        case 'spike':
          ctx.beginPath();
          ctx.moveTo(ob.x, ob.y + ob.height);
          ctx.lineTo(ob.x + ob.width / 2, ob.y);
          ctx.lineTo(ob.x + ob.width, ob.y + ob.height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'box':
          ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
          ctx.strokeRect(ob.x, ob.y, ob.width, ob.height);
          // Inner detail cross
          ctx.strokeRect(ob.x + 6, ob.y + 6, ob.width - 12, ob.height - 12);
          break;

        case 'pillar':
          ctx.fillRect(ob.x, ob.y, ob.width, ob.height);
          ctx.strokeRect(ob.x, ob.y, ob.width, ob.height);
          ctx.beginPath();
          ctx.moveTo(ob.x, ob.y + 15);
          ctx.lineTo(ob.x + ob.width, ob.y + 15);
          ctx.moveTo(ob.x, ob.y + 35);
          ctx.lineTo(ob.x + ob.width, ob.y + 35);
          ctx.stroke();
          break;

        case 'floating':
          ctx.fillStyle = 'rgba(71, 85, 105, 0.1)';
          ctx.beginPath();
          ctx.moveTo(ob.x + 6, ob.y);
          ctx.lineTo(ob.x + ob.width - 6, ob.y);
          ctx.lineTo(ob.x + ob.width, ob.y + 4);
          ctx.lineTo(ob.x + ob.width, ob.y + ob.height - 4);
          ctx.lineTo(ob.x + ob.width - 6, ob.y + ob.height);
          ctx.lineTo(ob.x + 6, ob.y + ob.height);
          ctx.lineTo(ob.x, ob.y + ob.height - 4);
          ctx.lineTo(ob.x, ob.y + 4);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'gate':
          // Top pipe (Flappy Bird style)
          ctx.fillRect(ob.x, 0, ob.width, ob.topHeight);
          ctx.strokeRect(ob.x, -5, ob.width, ob.topHeight + 5);
          // Lip on the end of the top pipe
          ctx.fillRect(ob.x - 3, ob.topHeight - 12, ob.width + 6, 12);
          ctx.strokeRect(ob.x - 3, ob.topHeight - 12, ob.width + 6, 12);

          // Bottom pipe
          const bottomY = groundY - ob.bottomHeight;
          ctx.fillRect(ob.x, bottomY, ob.width, ob.bottomHeight);
          ctx.strokeRect(ob.x, bottomY, ob.width, ob.bottomHeight + 5);
          // Lip on the end of the bottom pipe
          ctx.fillRect(ob.x - 3, bottomY, ob.width + 6, 12);
          ctx.strokeRect(ob.x - 3, bottomY, ob.width + 6, 12);
          break;
      }
      ctx.restore();
    });
  }
}

// -----------------------------------------------------------------
// Game Controller Core Class
class Game {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.config = CONFIG;

    this.player = null;
    this.renderer = null;
    this.obstacleManager = null;
    this.audioManager = null;
    this.uiManager = null;

    this.gameSpeed = CONFIG.initialSpeed;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('highScore') || '0');
    this.speedLevel = 1;
    this.gameOver = false;
    this.startTime = 0;
    this.lastTimestamp = 0;
    this.animationFrameId = null;
    this.lastSpeedIncrease = 0;

    this.init();
  }

  init() {
    this.canvas = document.getElementById('gfxCanvas');
    this.ctx = getCanvasContext();

    this.player = new Player(this.config);
    this.renderer = new Renderer(this.canvas, this.ctx);
    this.obstacleManager = new ObstacleManager(this.config, this.canvas);
    this.audioManager = new AudioManager();
    this.uiManager = new UIManager();

    // Inputs setup
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        this.triggerJump();
      }
    });

    this.canvas.addEventListener('mousedown', () => {
      this.triggerJump();
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault(); // Prevent default gestures (zooming, scrolling)
      this.triggerJump();
    }, { passive: false });

    this.uiManager.setupRestartHandler(() => this.restart());

    this.restart();
  }

  triggerJump() {
    if (this.gameOver) return;
    const jumpResult = this.player.jump();
    if (jumpResult) {
      this.audioManager.playJump();
      
      // If second jump (first jump left jumpsLeft=1, second leaves jumpsLeft=0)
      if (this.player.jumpsLeft === 0) {
        // Spawn cyber splash effect underneath cat's feet
        for (let i = 0; i < 8; i++) {
          this.renderer.addParticle(
            this.player.x + this.player.width / 2,
            this.player.y + 100 * this.config.catScale,
            (Math.random() - 0.5) * 3,
            (Math.random() + 0.5) * 2, // shoot downwards
            '#cbd5e1',
            Math.random() * 2 + 1.5,
            350
          );
        }
      }
    }
  }

  restart() {
    this.uiManager.hideGameOver();

    // Reset speeds, score, flags
    this.gameSpeed = this.config.initialSpeed;
    this.score = 0;
    this.scoreFraction = 0; // Fractional accumulator for framerate-independent scoring
    this.speedLevel = 1;
    this.gameOver = false;
    this.startTime = performance.now();
    this.lastTimestamp = performance.now();
    this.lastSpeedIncrease = performance.now();
    this.triggeredCheckpoints = new Set(); // Reset sarcasm messages

    const groundY = this.canvas.height - 30;
    this.player = new Player(this.config);
    this.player.y = groundY - 110 * this.config.catScale;

    this.obstacleManager = new ObstacleManager(this.config, this.canvas);
    this.obstacleManager.lastSpawnTime = performance.now();
    this.renderer.particles = [];

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  gameLoop(timestamp) {
    const dt = Math.min(timestamp - this.lastTimestamp, 100);
    this.lastTimestamp = timestamp;

    if (!this.gameOver) {
      this.update(timestamp, dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame((t) => this.gameLoop(t));
  }

  update(now, dt) {
    const groundY = this.canvas.height - 30;

    // Movement updates
    const wasJumping = this.player.jumping;
    this.player.update(this.config.gravity, groundY, this.gameSpeed);

    // Spawns landing smoke
    if (wasJumping && !this.player.jumping) {
      for (let i = 0; i < 10; i++) {
        this.renderer.addParticle(
          this.player.x + this.player.width / 2,
          groundY - 5,
          (Math.random() - 0.5) * 3,
          (Math.random() - 1.2) * 1.5,
          '#10b981',
          Math.random() * 3 + 2,
          450
        );
      }
    }

    // Running dust particles
    if (!this.player.jumping && Math.random() < 0.25) {
      this.renderer.addParticle(
        this.player.x + 10,
        groundY - 5,
        -this.gameSpeed * 0.4 + (Math.random() - 0.5) * 0.8,
        -Math.random() * 0.8,
        'rgba(255, 255, 255, 0.35)',
        Math.random() * 3 + 1,
        280
      );
    }

    this.obstacleManager.update(this.gameSpeed, groundY, now, this.score);
    this.renderer.update(this.gameSpeed, dt);

    // Sarcasm message triggers (every 1000 pts & flappy warning before 3500)
    const checkpoints = [1000, 2000, 3000, 3100, 3500, 4000, 5000, 6000, 7000, 8000];
    checkpoints.forEach(cp => {
      if (this.score >= cp && !this.triggeredCheckpoints.has(cp)) {
        this.triggeredCheckpoints.add(cp);
        let msg = "";
        if (cp === 3100) {
          msg = "WARNING: Flappy Mode incoming! Prepare to suffer.";
        } else if (cp === 1000) {
          msg = "Wow, you managed to stay awake?";
        } else if (cp === 2000) {
          msg = "Look at you, running from virtual blocks.";
        } else if (cp === 3000) {
          msg = "Still here? Go touch some real grass.";
        } else if (cp === 3500) {
          msg = "Welcome to Flappy Hell! Good luck.";
        } else if (cp === 4000) {
          msg = "Your index finger must be really athletic.";
        } else if (cp === 5000) {
          msg = "Flappy Hell, Part 2. Did you expect an award?";
        } else {
          msg = `Over ${cp} points! Do you even have a life?`;
        }
        this.uiManager.showSarcasm(msg);
      }
    });

    // Collisions
    const catBox = this.player.getHitbox();
    for (const ob of this.obstacleManager.obstacles) {
      let collided = false;
      if (ob.type === 'gate') {
        const topBox = { x: ob.x, y: 0, width: ob.width, height: ob.topHeight };
        const bottomBox = { x: ob.x, y: groundY - ob.bottomHeight, width: ob.width, height: ob.bottomHeight };
        collided = checkCollision(catBox, topBox) || checkCollision(catBox, bottomBox);
      } else {
        collided = checkCollision(catBox, ob);
      }

      if (collided) {
        this.triggerGameOver();
        break;
      }

      // Point scoring trigger
      if (!ob.passed && ob.x + ob.width < this.player.x) {
        ob.passed = true;
        this.scoreFraction += 100;
        this.score = Math.floor(this.scoreFraction);
        this.audioManager.playScore();

        // Sparks on pass (slate gray, not flashy cyan)
        for (let i = 0; i < 6; i++) {
          this.renderer.addParticle(
            ob.x + ob.width,
            ob.y + ob.height / 2,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            '#cbd5e1',
            2,
            350
          );
        }
      }
    }

    // Baseline score tick (even slower framerate independent progression, ~8 points per second)
    this.scoreFraction += dt * 0.008;
    this.score = Math.floor(this.scoreFraction);

    // Speed progression Scaling
    if (now - this.lastSpeedIncrease > this.config.speedIncreaseInterval) {
      this.gameSpeed += this.config.speedIncrement;
      this.lastSpeedIncrease = now;
      this.speedLevel = Math.floor((this.gameSpeed - this.config.initialSpeed) / 0.5) + 1;
    }

    this.uiManager.update(this.score, this.highScore, this.speedLevel);
  }

  triggerGameOver() {
    this.gameOver = true;
    this.audioManager.playHit();
    this.renderer.triggerShake(12, 350);

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('highScore', this.highScore);
    }
    this.uiManager.showGameOver(this.score);
  }

  render() {
    this.ctx.save();
    
    // Process Screen Shake
    if (this.renderer.screenShakeTime > 0) {
      const dx = (Math.random() - 0.5) * this.renderer.screenShakeIntensity;
      const dy = (Math.random() - 0.5) * this.renderer.screenShakeIntensity;
      this.ctx.translate(dx, dy);
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.renderer.drawSky(this.score);
    this.renderer.drawParallax(this.score);
    this.renderer.drawGround(this.score);
    this.obstacleManager.draw(this.ctx);
    this.player.draw(this.ctx);
    this.renderer.drawParticles();

    this.ctx.restore();
  }
}

// Start Game Loop on Load
window.addEventListener('load', () => {
  new Game();
});
