document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

const cnv = document.getElementById(`cnv_element`);
cnv.width = innerWidth;
cnv.height = innerHeight;
const ctx = cnv.getContext(`2d`);

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

class Particle {
  constructor(x, y) {
    this.x = x || Math.random() * cnv.width;
    this.y = y || Math.random() * cnv.height;
    this.vx = Math.random() * 2 - 1;
    this.vy = Math.random() * 2 - 1;
    this.size = 2 + Math.random() * 2;
    this.speed = 1;
  }

  update() {
    this.vx += Math.random() * 0.2 - 0.1;
    this.vy += Math.random() * 0.2 - 0.1;

    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 80) {
      let angle = Math.atan2(this.y - mouseY, this.x - mouseX);
      this.vx += Math.cos(angle) * 0.5;
      this.vy += Math.sin(angle) * 0.5;
    }

    this.x += this.vx;
    this.y += this.vy;

    if (this.x < 0) this.x = cnv.width;
    if (this.x > cnv.width) this.x = 0;
    if (this.y < 0) this.y = cnv.height;
    if (this.y > cnv.height) this.y = 0;
  }

  draw() {
    ctx.fillStyle = `hsl(${hue}, 70%, 60%)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBranch(x, y, angle, len, depth) {
  if (depth <= 0) return;

  const endX = x + Math.cos(angle) * len;
  const endY = y + Math.sin(angle) * len;

  ctx.strokeStyle = `hsla(${hue}, 70%, 60%, 0.6)`;
  ctx.lineWidth = depth;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  drawBranch(endX, endY, angle + 0.5, len * 0.7, depth - 1);
  drawBranch(endX, endY, angle - 0.5, len * 0.7, depth - 1);
}

let particles = [];
let hue = 200;
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let isPressed = false;

function init() {
  for (let i = 0; i < 50; i++) {
    particles.push(new Particle());
  }
}

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);

  if (isPressed) {
    drawBranch(mouseX, mouseY, -Math.PI / 2, 20, 3);
    particles.push(new Particle(mouseX, mouseY));
  }

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      let d = dist(
        particles[i].x,
        particles[i].y,
        particles[j].x,
        particles[j].y
      );
      if (d < 80) {
        ctx.strokeStyle = `hsla(${hue}, 70%, 60%, ${1 - d / 80})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  if (particles.length > 100) {
    particles.splice(0, particles.length - 100);
  }

  requestAnimationFrame(draw);
}

cnv.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

cnv.addEventListener("mousedown", () => (isPressed = true));
cnv.addEventListener("mouseup", () => (isPressed = false));

document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    hue = (hue + 60) % 360;
  }
});

onresize = () => {
  cnv.width = innerWidth;
  cnv.height = innerHeight;
};

init();
draw();
