/*
This code visualizes a mycelium network inspired by Merlin Sheldrake's essay "What Is It Like to Be A Fungus?". 
It combines fractal, moiré, glitch, and 3D techniques to create a postdigital aesthetic experience.

Key interactive features:
1. Mouse click and drag: Creates new mycelium growth at the cursor position, mimicking how fungal spores land and develop in new environments.
2. Mouse movement: Particles react to the cursor's presence, representing how fungi respond to environmental changes.
3. Spacebar: Changes the color scheme to showcase the visual diversity of different fungal species.
4. Audio feedback: All interactions generate sounds, creating a multisensory experience of mycelial communication.
5. Ecological simulation: Particles exchange "nutrients" when close to each other, modeling how real mycelium networks share resources.

This piece invites viewers to explore fungal ecology and experience the essay's core question "What is it like to be a fungus?" through visual, auditory, and tactile means.
*/

// Remove margins and hide overflow for a clean canvas
document.body.style.margin = 0;
document.body.style.overflow = `hidden`;

// Set up canvas to fill the entire window - creates an immersive space
const cnv = document.getElementById(`cnv_element`);
cnv.width = innerWidth;
cnv.height = innerHeight;

// Get the drawing context we'll use for everything
const ctx = cnv.getContext(`2d`);

// Audio variables for creating the sonic dimension of our network
let audioContext;
let masterGain;

// Set up the audio system - this creates sounds that respond to mycelium growth
// Each sound represents signals traveling through the fungal network
function initAudio() {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.2; // Keep volume at a reasonable level
    masterGain.connect(audioContext.destination);
  } catch (e) {
    console.warn("Web Audio API is not supported in this browser");
  }
}

// Play a tone with specific frequency, duration and volume
// These sounds represent the subtle communications between fungal nodes
function playTone(frequency, duration, volume = 0.1) {
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  oscillator.type = "sine"; // Using sine waves for a soft, organic feel
  oscillator.frequency.value = frequency;

  const gainNode = audioContext.createGain();
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  oscillator.start();

  // Gentle fade out for a more natural sound
  setTimeout(() => {
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.1
    );
    setTimeout(() => oscillator.stop(), 100);
  }, duration * 1000);
}

// Simple noise function that creates organic, flowing movement patterns
// I wanted to mimic the non-linear growth patterns of mycelium
function noise(x, y, z) {
  return (
    (Math.sin(x * 10 + y * 8 + z * 6) * 0.5 +
      Math.cos(x * 8 - y * 12 + z * 4) * 0.3 +
      Math.sin(y * 6 - x * 4 + z * 8) * 0.2) *
      0.5 +
    0.5
  );
}

// Convert HSB to RGB - I find HSB much more intuitive for creating organic color schemes
// Fungi have amazing diversity in color and this helps create that rich palette
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

// Calculate distance between two points
// This is crucial for determining connections in our fungal network
function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Map values from one range to another
// Helps transform between different measurement scales throughout the code
function map(value, start1, stop1, start2, stop2) {
  return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}

// Particle class - each particle represents a node in our mycelium network
// I thought of each one as a hyphal tip or spore in the fungal system
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
    this.z = Math.random() * 2 - 1; // Z-position for 3D effect
    this.vz = (Math.random() - 0.5) * 0.02; // Z-axis movement
    this.nutrients = Math.random(); // Nutrient level for ecological simulation
  }

  // Update particle position based on noise and interactions
  // This creates organic movement patterns similar to how fungi explore their environment
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

    // Mouse interaction - fungi respond to environmental stimuli
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 100) {
      let force = map(d, 0, 100, 5, 0);
      let angle = Math.atan2(this.y - mouseY, this.x - mouseX);
      this.vx += Math.cos(angle) * force;
      this.vy += Math.sin(angle) * force;
    }

    this.x += this.vx;
    this.y += this.vy;
    this.z += this.vz;

    // Z-axis boundaries - keeps particles in visible range
    if (Math.abs(this.z) > 1) this.vz *= -1;

    // Wrap around screen edges - creates continuous space for the network
    if (this.x < 0) this.x = cnv.width;
    if (this.x > cnv.width) this.x = 0;
    if (this.y < 0) this.y = cnv.height;
    if (this.y > cnv.height) this.y = 0;
  }

  // Draw the particle with 3D depth effect
  // The z-position affects size and opacity to create a sense of depth
  draw() {
    const sizeMultiplier = map(this.z, -1, 1, 0.5, 1.5);
    const alphaMultiplier = map(this.z, -1, 1, 0.7, 1);
    const actualSize = this.size * sizeMultiplier;

    const [r, g, b] = hsbToRgb(this.h, this.s, this.b);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alphaMultiplier})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, actualSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw fractal structure recursively - represents branching mycelium growth
// I'm using recursion to mimic how fungi branch and explore their surroundings
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

  // Play sounds based on growth - sonifying the fungal growth process
  if (depth >= 3 && audioContext && Math.random() < 0.2) {
    const freq = map(depth, 1, 5, 800, 200);
    playTone(freq, 0.1, 0.05);
  }

  // Create multiple branches - demonstrating fungal branching patterns
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

// Draw moiré pattern - adds visual texture and depth
// This represents the layered, complex structures within fungal networks
function drawMoirePattern() {
  const patternSize = 20;
  const patternOpacity = 0.05;

  ctx.fillStyle = `rgba(255, 255, 255, ${patternOpacity})`;

  // First pattern set - static background layer
  for (let i = 0; i < cnv.width; i += patternSize) {
    ctx.beginPath();
    ctx.rect(i, 0, patternSize / 2, cnv.height);
    ctx.fill();
  }

  // Second rotating pattern set - creates interference patterns
  ctx.save();
  ctx.translate(cnv.width / 2, cnv.height / 2);
  ctx.rotate(frameCount * 0.001);
  ctx.translate(-cnv.width / 2, -cnv.height / 2);

  for (let i = 0; i < cnv.width * 1.5; i += patternSize) {
    ctx.beginPath();
    ctx.rect(i - cnv.width / 2, 0, patternSize / 2, cnv.height);
    ctx.fill();
  }

  ctx.restore();
}

// Apply random glitch effects - adds postdigital aesthetic
// I wanted to represent the chaotic, unpredictable nature of fungal ecosystems
function applyGlitchEffect() {
  if (Math.random() < 0.01) {
    // Occasional glitch effect
    const sliceHeight = Math.random() * 30 + 10;
    const yPos = Math.random() * cnv.height;

    // Capture random area
    const imageData = ctx.getImageData(0, yPos, cnv.width, sliceHeight);

    // Apply glitch transformation
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (Math.random() < 0.1) {
        // Randomly shift pixels
        const offset = Math.floor(Math.random() * 100) * 4;
        if (i + offset < imageData.data.length) {
          imageData.data[i] = imageData.data[i + offset];
          imageData.data[i + 1] = imageData.data[i + offset + 1];
          imageData.data[i + 2] = imageData.data[i + offset + 2];
        }
      }
    }

    // Draw modified image data
    ctx.putImageData(imageData, 0, yPos);

    // Play glitch sound
    if (audioContext) {
      const noiseLength = 0.1;
      const noiseFreq = 1000 + Math.random() * 2000;
      playTone(noiseFreq, noiseLength, 0.05);
    }
  }
}

// Simulate nutrient exchange between connected particles
// This models how fungi share resources through their networks
function simulateMyceliumBehavior() {
  for (let i = 0; i < particles.length; i++) {
    // Exchange nutrients with nearby particles
    for (let j = 0; j < particles.length; j++) {
      if (i === j) continue;

      let distance = dist(
        particles[i].x,
        particles[i].y,
        particles[j].x,
        particles[j].y
      );

      if (distance < 50) {
        // Nutrient exchange based on concentration gradient
        const diffRate = 0.001 * (1 - distance / 50);
        const diff =
          (particles[i].nutrients - particles[j].nutrients) * diffRate;

        particles[i].nutrients -= diff;
        particles[j].nutrients += diff;

        // Visual changes based on nutrient levels
        particles[i].size = 3 + particles[i].nutrients * 5;
        particles[i].b = 70 + particles[i].nutrients * 30;
      }
    }
  }
}

// Create evenly distributed particles across the canvas
// This ensures a balanced initial distribution of the mycelium network
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

// Global variables and settings
let particles = [];
const num = 100; // Initial particle count
const noiseScale = 0.005; // Scale of noise pattern - affects movement smoothness

// Color range settings
let currentHueMin = 180;
let currentHueMax = 240;

// Mouse tracking variables
let mouseX = innerWidth / 2;
let mouseY = innerHeight / 2;
let mouseIsPressed = false;

// Fractal growth timing
let lastFractalTime = 0;
const fractalInterval = 300;

// Animation frame counter
let frameCount = 0;

// Change color scheme - represents diversity in fungi appearance
// The colors are inspired by different species of mushrooms and fungi
function changeParticleColor() {
  const colorSchemes = [
    { min: 180, max: 240 }, // Blue tones - like some Lactarius species
    { min: 0, max: 30 }, // Red/orange - like Amanita muscaria
    { min: 270, max: 330 }, // Purple tones - like some Cortinarius
    { min: 60, max: 120 }, // Green tones - like lichen interactions
    { min: 30, max: 60 }, // Yellow/amber - like Chanterelles
  ];

  const newScheme =
    colorSchemes[Math.floor(Math.random() * colorSchemes.length)];
  currentHueMin = newScheme.min;
  currentHueMax = newScheme.max;

  // Play ascending arpeggio to signal color change
  if (audioContext) {
    playTone(220, 0.3, 0.1);
    setTimeout(() => playTone(277.18, 0.3, 0.1), 100);
    setTimeout(() => playTone(329.63, 0.3, 0.1), 200);
  }
}

// Main animation loop - orchestrates all the visual and audio elements
const draw_frame = (ms) => {
  frameCount++;

  // Fade previous frame - creates trailing effect like fungal growth
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, cnv.width, cnv.height);

  // Add moiré pattern layer
  drawMoirePattern();

  // Handle mouse interaction for growing new mycelia
  if (mouseIsPressed) {
    const currentTime = Date.now();
    if (currentTime - lastFractalTime > fractalInterval) {
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;

      // Create new fractal growth from mouse position
      drawFractal(
        mouseX + offsetX,
        mouseY + offsetY,
        Math.random() * Math.PI * 2,
        20 + Math.random() * 20,
        5
      );

      // Add new particles at growth location
      for (let i = 0; i < 3; i++) {
        particles.push(new Particle(mouseX + offsetX, mouseY + offsetY));
      }

      lastFractalTime = currentTime;
    }
  }

  // Update nutrient flow within the network
  simulateMyceliumBehavior();

  // Update and draw all particles
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    // Draw connections between nearby particles - represents mycelium network
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

        // Occasional sounds based on connection distance
        if (distance < 30 && Math.random() < 0.001 && audioContext) {
          const freq = map(distance, 0, 30, 300, 800);
          playTone(freq, 0.05, 0.02);
        }
      }
    }
  }

  // Add glitch effect for postdigital aesthetic
  applyGlitchEffect();

  // Limit particle count to prevent performance issues
  if (particles.length > 500) {
    particles.splice(0, particles.length - 500);
  }

  requestAnimationFrame(draw_frame);
};

// Initialize particles at startup
function initParticles() {
  particles = createParticlesGrid(num);
}

// Event listeners for user interaction
cnv.addEventListener("mousemove", (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

cnv.addEventListener("mousedown", (e) => {
  mouseIsPressed = true;

  // Initialize audio on first interaction
  if (!audioContext) {
    initAudio();
  }

  // Create initial growth at click position
  drawFractal(e.clientX, e.clientY, -Math.PI / 2, 30, 5);

  // Play sound to confirm interaction
  if (audioContext) {
    playTone(300, 0.2, 0.1);
  }

  // Add new particles at click position
  for (let i = 0; i < 5; i++) {
    particles.push(new Particle(e.clientX, e.clientY));
  }
});

cnv.addEventListener("mouseup", () => {
  mouseIsPressed = false;
});

// Spacebar changes color scheme
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    changeParticleColor();
  }
});

// Initialize everything
function init() {
  initParticles();

  // Display instructions
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("Click and drag to grow mycelium network", cnv.width / 2, 30);
  ctx.fillText("Press spacebar to change colors", cnv.width / 2, 55);

  requestAnimationFrame(draw_frame);
}

// Handle window resizing
onresize = () => {
  cnv.width = innerWidth;
  cnv.height = innerHeight;
};

// Start the simulation
init();
