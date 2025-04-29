document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

const cnv = document.getElementById(`cnv_element`);
cnv.width = innerWidth;
cnv.height = innerHeight;

const ctx = cnv.getContext(`2d`);

let audioContext;
let masterGain;

function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.2;
    masterGain.connect(audioContext.destination);
  } catch (e) {
    console.warn("Web Audio API is not supported in this browser");
  }
}

function playTone(frequency, duration, volume = 0.1) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start();

  setTimeout(() => {
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.1
    );
    setTimeout(() => oscillator.stop(), 100);
  }, duration * 1000);
}

function noise(x, y, z) {
  return (
    (Math.sin(x * 10 + y * 8 + z * 6) * 0.5 +
      Math.cos(x * 8 - y * 12 + z * 4) * 0.3 +
      Math.sin(y * 6 - x * 4 + z * 8) * 0.2) *
      0.5 +
    0.5
  );
}

function hsbToRgb(h, s, b) {
  h = h % 360;
  s = s / 100;
  b = b / 100;

  const k = (n) => (n + h / 60) % 6;
  const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

  return [
    Math.round(255 * f(5)),
    Math.round(255 * f(3)),
    Math.round(255 * f(1)),
  ];
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

class Particle {
  constructor(x, y) {
    this.x = x || Math.random() * cnv.width;
    this.y = y || Math.random() * cnv.height;
    this.vx = 0;
    this.vy = 0;
    this.size = 3 + Math.random() * 5;
    this.h = currentHueMin + Math.random() * (currentHueMax - currentHueMin);
    this.s = 80 + Math.random() * 20;
    this.b = 80 + Math.random() * 20;
    this.speed = 0.5 + Math.random() * 1.5;
    this.noiseScaleX = noiseScale * (0.7 + Math.random() * 0.6);
    this.noiseScaleY = noiseScale * (0.7 + Math.random() * 0.6);
    this.noiseOffsetX = Math.random() * 1000;
    this.noiseOffsetY = Math.random() * 1000;
  }

  update() {
    let nx = noise(
      this.x * this.noiseScaleX + this.noiseOffsetX,
      this.y * this.noiseScaleX,
      frameCount * 0.01
    );
    let ny = noise(
      this.x * this.noiseScaleY,
      this.y * this.noiseScaleY + this.noiseOffsetY,
      frameCount * 0.01 + 50
    );

    let angleX = (nx * 2 - 1) * Math.PI;
    let angleY = (ny * 2 - 1) * Math.PI;

    this.vx = Math.cos(angleX) * this.speed;
    this.vy = Math.sin(angleY) * this.speed;

    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 100) {
      let force = map(d, 0, 100, 5, 0);
      let angle = Math.atan2(this.y - mouseY, this.x - mouseX);
      this.vx += Math.cos(angle) * force;
      this.vy += Math.sin(angle) * force;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = cnv.width;
    if (this.x > cnv.width) this.x = 0;
    if (this.y < 0) this.y = cnv.height;
    if (this.y > cnv.height) this.y = 0;
  }

  draw() {
    const [r, g, b] = hsbToRgb(this.h, this.s, this.b);
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFractal(x, y, angle, length, depth) {
  if (depth <= 0) return;

  const endX = x + Math.cos(angle) * length;
  const endY = y + Math.sin(angle) * length;

  const hue = (frameCount % 360) + depth * 20;
  const [r, g, b] = hsbToRgb(hue, 80, 90);

  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${depth / 5})`;
  ctx.lineWidth = depth * 0.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  if (depth >= 3 && audioContext && Math.random() < 0.2) {
    const freq = map(depth, 1, 5, 800, 200);
    playTone(freq, 0.1, 0.05);
  }

  const branchCount = Math.max(2, Math.floor(Math.random() * (depth + 2)));

  for (let i = 0; i < branchCount; i++) {
    const angleChange = (Math.random() - 0.5) * 1.4;
    const lengthChange = 0.6 + Math.random() * 0.3;

    drawFractal(
      endX,
      endY,
      angle + angleChange,
      length * lengthChange,
      depth - 1
    );
  }
}

function createParticlesGrid(count) {
  const particles = [];
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const cellWidth = cnv.width / cols;
  const cellHeight = cnv.height / rows;

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (particles.length >= count) break;

      const x = j * cellWidth + Math.random() * cellWidth;
      const y = i * cellHeight + Math.random() * cellHeight;

      particles.push(new Particle(x, y));
    }
  }

  return particles;
}

let particles = [];
const num = 100;
const noiseScale = 0.005;

let currentHueMin = 180;
let currentHueMax = 240;

let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let mouseIsPressed = false;

let lastFractalTime = 0;
const fractalInterval = 300;

let frameCount = 0;

function changeParticleColor() {
  const colorSchemes = [
    { min: 180, max: 240 },
    { min: 0, max: 30 },
    { min: 270, max: 330 },
    { min: 60, max: 120 },
    { min: 30, max: 60 },
  ];

  const newScheme =
    colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
  currentHueMin = newScheme.min;
  currentHueMax = newScheme.max;

  if (audioContext) {
    playTone(220, 0.3, 0.1);
    setTimeout(() => playTone(277.18, 0.3, 0.1), 100);
    setTimeout(() => playTone(329.63, 0.3, 0.1), 200);
  }
}

const draw_frame = (ms) => {
  frameCount++;

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);

  if (mouseIsPressed) {
    const currentTime = Date.now();
    if (currentTime - lastFractalTime > fractalInterval) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      drawFractal(
        mouseX + offsetX,
        mouseY + offsetY,
        Math.random() * Math.PI * 2,
        20 + Math.random() * 20,
        5
      );

      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouseX + offsetX, mouseY + offsetY));
      }

      lastFractalTime = currentTime;
    }
  }

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      let p2 = particles[j];
      let distance = dist(particles[i].x, particles[i].y, p2.x, p2.y);
      if (distance < 120) {
        let alpha = map(distance, 0, 120, 1, 0);
        const [r, g, b] = hsbToRgb(
          particles[i].h,
          particles[i].s,
          particles[i].b
        );
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();

        if (distance < 30 && Math.random() < 0.001 && audioContext) {
          const freq = map(distance, 0, 30, 300, 800);
          playTone(freq, 0.05, 0.02);
        }
      }
    }
  }

  if (particles.length > 500) {
    particles.splice(0, particles.length - 500);
  }

  requestAnimationFrame(draw_frame);
};

function initParticles() {
  particles = createParticlesGrid(num);
}

cnv.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

cnv.addEventListener("mousedown", (e) => {
  mouseIsPressed = true;

  if (!audioContext) {
    initAudio();
  }

  drawFractal(e.clientX, e.clientY, -Math.PI / 2, 30, 5);

  if (audioContext) {
    playTone(300, 0.2, 0.1);
  }

  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(e.clientX, e.clientY));
  }
});

cnv.addEventListener("mouseup", () => {
  mouseIsPressed = false;
});

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    changeParticleColor();

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Colors Changed!", cnv.width / 2, 50);
  }
});

function init() {
  initParticles();

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Click and drag to grow mycelium network", cnv.width / 2, 30);
  ctx.fillText("Press spacebar to change colors", cnv.width / 2, 55);

  requestAnimationFrame(draw_frame);
}

onresize = () => {
  cnv.width = innerWidth;
  cnv.height = innerHeight;
};

init();
