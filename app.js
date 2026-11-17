// ============================================================
//  RetinaAI — Application Logic
//  AI-Based Retinopathy Screening Demo
// ============================================================

// ---- Data Definitions ----
const SEVERITY_DATA = {
  0: {
    label: 'No Diabetic Retinopathy',
    short: 'No DR',
    color: '#22c55e',
    colorBg: 'rgba(34,197,94,0.1)',
    colorBorder: 'rgba(34,197,94,0.3)',
    icon: '✅',
    recommendation: 'No signs of diabetic retinopathy detected. Maintain good blood sugar control and schedule a routine follow-up examination in 12 months.',
    recColor: '#22c55e',
    heatmapIntensity: 0.1,
  },
  1: {
    label: 'Mild NPDR',
    short: 'Mild DR',
    color: '#84cc16',
    colorBg: 'rgba(132,204,22,0.1)',
    colorBorder: 'rgba(132,204,22,0.3)',
    icon: '⚠️',
    recommendation: 'Mild Non-Proliferative Diabetic Retinopathy detected. Microaneurysms present. Recommend ophthalmologist review within 6 months and strict glycemic control.',
    recColor: '#84cc16',
    heatmapIntensity: 0.3,
  },
  2: {
    label: 'Moderate NPDR',
    short: 'Moderate DR',
    color: '#eab308',
    colorBg: 'rgba(234,179,8,0.1)',
    colorBorder: 'rgba(234,179,8,0.3)',
    icon: '⚠️',
    recommendation: 'Moderate Non-Proliferative Diabetic Retinopathy detected. Multiple hemorrhages and microaneurysms observed. Referral to ophthalmologist within 3 months is advised.',
    recColor: '#eab308',
    heatmapIntensity: 0.55,
  },
  3: {
    label: 'Severe NPDR',
    short: 'Severe DR',
    color: '#f97316',
    colorBg: 'rgba(249,115,22,0.1)',
    colorBorder: 'rgba(249,115,22,0.3)',
    icon: '🚨',
    recommendation: 'Severe Non-Proliferative Diabetic Retinopathy detected. Extensive vascular changes found. URGENT referral to a retinal specialist is required within 4 weeks.',
    recColor: '#f97316',
    heatmapIntensity: 0.75,
  },
  4: {
    label: 'Proliferative DR',
    short: 'Proliferative DR',
    color: '#ef4444',
    colorBg: 'rgba(239,68,68,0.1)',
    colorBorder: 'rgba(239,68,68,0.3)',
    icon: '🆘',
    recommendation: 'Proliferative Diabetic Retinopathy detected. Neovascularization is present — high risk of vision loss. IMMEDIATE specialist consultation and possible laser treatment required.',
    recColor: '#ef4444',
    heatmapIntensity: 0.95,
  },
};

// Simulated confidence values for each sample
const SAMPLE_RESULTS = {
  normal: {
    grade: 0,
    probs: [0.924, 0.044, 0.018, 0.009, 0.005],
  },
  moderate: {
    grade: 2,
    probs: [0.021, 0.088, 0.812, 0.063, 0.016],
  },
  severe: {
    grade: 4,
    probs: [0.004, 0.011, 0.038, 0.094, 0.853],
  },
};

// ---- State ----
let currentImage = null;
let currentResult = null;

// ---- DOM refs ----
const uploadZone = document.getElementById('uploadZone');
const fileInput  = document.getElementById('fileInput');
const resultsPlaceholder = document.getElementById('resultsPlaceholder');
const processingState    = document.getElementById('processingState');
const resultsState       = document.getElementById('resultsState');

// ---- Upload Zone Drag & Drop ----
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) processFile(file);
});
uploadZone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) processFile(e.target.files[0]);
});

// ---- Sample Buttons ----
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sample = btn.dataset.sample;
    const imgSrc = `sample_${sample}.png`;
    loadSampleImage(imgSrc, sample);
  });
});

// ---- Process uploaded file ----
function processFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      // For uploaded images, randomly pick a grade for demo
      const grades = [0, 1, 2, 3, 4];
      const grade = grades[Math.floor(Math.random() * grades.length)];
      const probs = generateProbsForGrade(grade);
      runAnalysis(img, { grade, probs });
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ---- Load sample image ----
function loadSampleImage(src, sampleKey) {
  const img = new Image();
  img.onload = () => {
    currentImage = img;
    runAnalysis(img, SAMPLE_RESULTS[sampleKey]);
  };
  img.onerror = () => {
    // Fallback: use canvas placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    drawPlaceholderRetina(ctx, 400, 400);
    const img2 = new Image();
    img2.onload = () => {
      currentImage = img2;
      runAnalysis(img2, SAMPLE_RESULTS[sampleKey]);
    };
    img2.src = canvas.toDataURL();
  };
  img.src = src;
}

// ---- Generate probability distribution ----
function generateProbsForGrade(grade) {
  const probs = [0.02, 0.02, 0.02, 0.02, 0.02];
  probs[grade] = 0.82;
  const remaining = 1 - 0.82 - 0.02 * 4;
  for (let i = 0; i < 5; i++) {
    if (i !== grade) probs[i] += Math.random() * remaining / 4;
  }
  // Normalize
  const sum = probs.reduce((a, b) => a + b, 0);
  return probs.map(p => p / sum);
}

// ---- Draw placeholder retina on canvas ----
function drawPlaceholderRetina(ctx, w, h) {
  const cx = w / 2, cy = h / 2;
  const r = Math.min(w, h) / 2 - 2;
  ctx.fillStyle = '#080b14'; ctx.fillRect(0, 0, w, h);
  // Draw circular mask
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, '#8B2500');
  grad.addColorStop(0.3, '#7B1A00');
  grad.addColorStop(0.7, '#5A0D00');
  grad.addColorStop(1, '#2a0500');
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  // Optic disc
  const dgrad = ctx.createRadialGradient(cx + 60, cy, 0, cx + 60, cy, 32);
  dgrad.addColorStop(0, '#ffe4b5');
  dgrad.addColorStop(1, '#d4a85a');
  ctx.beginPath(); ctx.arc(cx + 60, cy, 32, 0, Math.PI * 2);
  ctx.fillStyle = dgrad; ctx.fill();
  // Blood vessels
  ctx.strokeStyle = '#8B1A00'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx + 60, cy); ctx.quadraticCurveTo(cx - 30, cy - 60, cx - 100, cy - 90); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 60, cy); ctx.quadraticCurveTo(cx - 20, cy + 70, cx - 90, cy + 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 60, cy); ctx.quadraticCurveTo(cx + 100, cy - 50, cx + 80, cy - 120); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(cx + 60, cy); ctx.quadraticCurveTo(cx + 90, cy + 60, cx + 70, cy + 110); ctx.stroke();
  // Fovea (dark spot)
  const fgrad = ctx.createRadialGradient(cx - 60, cy, 0, cx - 60, cy, 20);
  fgrad.addColorStop(0, 'rgba(0,0,0,0.5)');
  fgrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.beginPath(); ctx.arc(cx - 60, cy, 20, 0, Math.PI * 2);
  ctx.fillStyle = fgrad; ctx.fill();
}

// ---- Main Analysis Pipeline ----
function runAnalysis(img, result) {
  currentResult = result;
  // Show processing
  resultsPlaceholder.style.display = 'none';
  processingState.style.display = 'flex';
  resultsState.style.display = 'none';

  // Scroll to results
  document.getElementById('screener').scrollIntoView({ behavior: 'smooth', block: 'start' });

  const steps = ['ps1','ps2','ps3','ps4'];
  let stepIdx = 0;
  steps.forEach(id => {
    document.getElementById(id).className = 'proc-step';
  });

  function activateStep(idx) {
    if (idx < steps.length) {
      document.getElementById(steps[idx]).classList.add('active');
    }
    if (idx > 0) {
      document.getElementById(steps[idx-1]).className = 'proc-step done';
    }
  }

  activateStep(0);
  setTimeout(() => { activateStep(1); }, 700);
  setTimeout(() => { activateStep(2); }, 1400);
  setTimeout(() => { activateStep(3); }, 2100);
  setTimeout(() => {
    // Mark all done
    steps.forEach(id => document.getElementById(id).className = 'proc-step done');
  }, 2800);
  setTimeout(() => {
    // Show results
    processingState.style.display = 'none';
    resultsState.style.display = 'flex';
    renderResults(img, result);
  }, 3200);
}

// ---- Render Results ----
function renderResults(img, result) {
  const { grade, probs } = result;
  const severity = SEVERITY_DATA[grade];

  // --- Draw original on canvas ---
  const origCanvas = document.getElementById('originalCanvas');
  const size = 300;
  origCanvas.width = size; origCanvas.height = size;
  const ctx = origCanvas.getContext('2d');
  // Draw circular clipped image
  ctx.save();
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, 0, 0, size, size);
  ctx.restore();

  // --- Generate Grad-CAM heatmap ---
  const gcCanvas = document.getElementById('gradcamCanvas');
  gcCanvas.width = size; gcCanvas.height = size;
  const gcCtx = gcCanvas.getContext('2d');
  renderGradCAM(gcCtx, img, size, severity.heatmapIntensity, grade);

  // --- Grade Card ---
  const gradeEl = document.getElementById('rgcGrade');
  gradeEl.textContent = severity.label;
  gradeEl.style.color = severity.color;
  document.getElementById('rgcDesc').textContent = `Grade ${grade} — ${getSeverityDescription(grade)}`;

  // --- Confidence ring ---
  const confidence = probs[grade];
  const confidencePct = Math.round(confidence * 100);
  animateConfidenceRing(confidencePct);
  document.getElementById('confText').textContent = confidencePct + '%';

  // Style the grade card border
  document.getElementById('resultGradeCard').style.borderColor = severity.colorBorder;
  document.getElementById('resultGradeCard').style.background = severity.colorBg;

  // --- Probability bars ---
  const labels = ['pb0','pb1','pb2','pb3','pb4'];
  labels.forEach((id, i) => {
    const row = document.getElementById(id);
    const fill = row.querySelector('.pb-fill');
    const val = row.querySelector('.pb-val');
    const pct = Math.round(probs[i] * 100);
    val.textContent = pct + '%';
    // Highlight the predicted class
    if (i === grade) {
      row.style.fontWeight = '700';
      fill.style.opacity = '1';
    } else {
      fill.style.opacity = '0.6';
    }
    setTimeout(() => {
      fill.style.width = pct + '%';
    }, 100 + i * 150);
  });

  // --- Recommendation ---
  const recCard = document.getElementById('recommendationCard');
  recCard.style.background = severity.colorBg;
  recCard.style.borderColor = severity.colorBorder;
  document.getElementById('recIcon').textContent = severity.icon;
  document.getElementById('recText').innerHTML = `<strong style="color:${severity.color}">${severity.short} Detected</strong><br>${severity.recommendation}`;
}

// ---- Draw Grad-CAM heatmap ----
function renderGradCAM(ctx, img, size, intensity, grade) {
  // Draw base image (darker)
  ctx.save();
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.filter = 'brightness(0.5) saturate(0.6)';
  ctx.drawImage(img, 0, 0, size, size);
  ctx.filter = 'none';
  ctx.restore();

  // Generate activation map using perlin-like noise blobs
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = size; tempCanvas.height = size;
  const tCtx = tempCanvas.getContext('2d');

  // Draw heatmap blobs based on grade
  const activationRegions = getActivationRegions(grade, size);
  activationRegions.forEach(region => {
    const rgrad = tCtx.createRadialGradient(
      region.x, region.y, 0,
      region.x, region.y, region.r
    );
    rgrad.addColorStop(0, `rgba(255,0,0,${region.alpha * intensity})`);
    rgrad.addColorStop(0.4, `rgba(255,165,0,${region.alpha * intensity * 0.7})`);
    rgrad.addColorStop(0.75, `rgba(0,255,255,${region.alpha * intensity * 0.3})`);
    rgrad.addColorStop(1, `rgba(0,0,128,0)`);
    tCtx.beginPath();
    tCtx.arc(region.x, region.y, region.r, 0, Math.PI * 2);
    tCtx.fillStyle = rgrad;
    tCtx.fill();
  });

  // Composite heatmap on top of darkened image
  ctx.save();
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.clip();
  ctx.globalAlpha = 0.75;
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  // Animate scan effect
  animateGradCAMReveal(ctx, size);
}

// ---- Get activation region positions per grade ----
function getActivationRegions(grade, size) {
  const cx = size / 2, cy = size / 2;
  if (grade === 0) {
    // Minimal activation
    return [{ x: cx + 30, y: cy - 10, r: 30, alpha: 0.15 }];
  } else if (grade === 1) {
    return [
      { x: cx - 40, y: cy + 30, r: 40, alpha: 0.4 },
      { x: cx + 60, y: cy - 40, r: 25, alpha: 0.3 },
    ];
  } else if (grade === 2) {
    return [
      { x: cx - 50, y: cy + 40, r: 55, alpha: 0.6 },
      { x: cx + 50, y: cy - 30, r: 40, alpha: 0.5 },
      { x: cx - 20, y: cy - 60, r: 30, alpha: 0.4 },
      { x: cx + 20, y: cy + 60, r: 25, alpha: 0.35 },
    ];
  } else if (grade === 3) {
    return [
      { x: cx - 60, y: cy + 50, r: 65, alpha: 0.75 },
      { x: cx + 60, y: cy - 40, r: 55, alpha: 0.65 },
      { x: cx - 20, y: cy - 70, r: 40, alpha: 0.55 },
      { x: cx + 30, y: cy + 70, r: 35, alpha: 0.5 },
      { x: cx + 80, y: cy + 30, r: 30, alpha: 0.45 },
    ];
  } else {
    // Grade 4 — widespread
    return [
      { x: cx - 60, y: cy + 50, r: 70, alpha: 0.9 },
      { x: cx + 60, y: cy - 50, r: 65, alpha: 0.85 },
      { x: cx - 20, y: cy - 80, r: 50, alpha: 0.8 },
      { x: cx + 30, y: cy + 80, r: 45, alpha: 0.75 },
      { x: cx + 90, y: cy + 20, r: 40, alpha: 0.7 },
      { x: cx - 90, y: cy - 30, r: 40, alpha: 0.65 },
      { x: cx + 10, y: cy - 20, r: 30, alpha: 0.6 },
    ];
  }
}

// ---- Animated reveal for Grad-CAM ----
function animateGradCAMReveal(ctx, size) {
  let progress = 0;
  const coverCanvas = document.createElement('canvas');
  coverCanvas.width = size; coverCanvas.height = size;
  const cCtx = coverCanvas.getContext('2d');

  function step() {
    if (progress >= 1) return;
    progress += 0.04;
    // We don't have the original context state here cleanly, so just let the main render be visible
    requestAnimationFrame(step);
  }
  step();
}

// ---- Confidence ring animation ----
function animateConfidenceRing(pct) {
  const arc = document.getElementById('confArc');
  const circumference = 213.6;
  const offset = circumference - (pct / 100) * circumference;
  // Start from full offset (empty)
  arc.style.strokeDashoffset = circumference;
  setTimeout(() => {
    arc.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
    arc.style.strokeDashoffset = offset;
  }, 200);
}

// ---- Severity descriptions ----
function getSeverityDescription(grade) {
  const descs = [
    'No retinal lesions detected',
    'Microaneurysms only',
    'Hemorrhages and hard exudates',
    'Severe vascular changes',
    'Neovascularization present',
  ];
  return descs[grade];
}

// ---- Reset screener ----
function resetScreener() {
  currentImage = null;
  currentResult = null;
  fileInput.value = '';
  resultsState.style.display = 'none';
  processingState.style.display = 'none';
  resultsPlaceholder.style.display = 'flex';

  // Reset probability bars
  document.querySelectorAll('.pb-fill').forEach(el => el.style.width = '0');
  document.querySelectorAll('.pb-val').forEach(el => el.textContent = '');

  // Reset confidence ring
  const arc = document.getElementById('confArc');
  arc.style.transition = 'none';
  arc.style.strokeDashoffset = '213.6';

  window.scrollTo({ top: document.getElementById('screener').offsetTop - 80, behavior: 'smooth' });
}

// ---- Severity bar tooltips ----
const sevLevels = document.querySelectorAll('.sev-level');
const sevTooltip = document.getElementById('sevTooltip');
sevLevels.forEach(el => {
  el.addEventListener('mouseenter', () => {
    sevTooltip.textContent = `${el.dataset.title}: ${el.dataset.desc}`;
    sevTooltip.classList.add('visible');
  });
  el.addEventListener('mouseleave', () => {
    sevTooltip.classList.remove('visible');
  });
});

// ---- Smooth nav scroll ----
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ---- Active nav on scroll ----
const sections = document.querySelectorAll('section[id]');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const top = section.offsetTop - 90;
    if (window.pageYOffset >= top) current = section.getAttribute('id');
  });
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });

  // Navbar shadow on scroll
  document.getElementById('navbar').style.boxShadow =
    window.pageYOffset > 20 ? '0 4px 30px rgba(0,0,0,0.4)' : 'none';
});

// ---- Animate numbers on scroll (Intersection Observer) ----
const metricCards = document.querySelectorAll('.mc-val');
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '0';
      setTimeout(() => {
        entry.target.style.transition = 'opacity 0.6s';
        entry.target.style.opacity = '1';
      }, Math.random() * 300);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });
metricCards.forEach(card => observer.observe(card));

// ---- Step cards entrance animation ----
const stepCards = document.querySelectorAll('.step-card');
const stepObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, i * 100);
      stepObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });
stepCards.forEach(card => {
  card.style.opacity = '0';
  card.style.transform = 'translateY(20px)';
  card.style.transition = 'opacity 0.5s, transform 0.5s';
  stepObserver.observe(card);
});

console.log('%c RetinaAI 🧠', 'color: #7c6cfc; font-size: 20px; font-weight: bold;');
console.log('%c AI-Based Retinopathy Screening Demo', 'color: #38d9f5; font-size: 14px;');
console.log('%c Model: EfficientNet-B3 | Dataset: APTOS 2019 | XAI: Grad-CAM', 'color: #8892b0;');
