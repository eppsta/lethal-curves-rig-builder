// =======================================================
// === Config: Region Value Ranges (new system) =========
// =======================================================

const ranges = {
  chest:        [-1, -0.5, 0, 0.5, 1, 1.5, 2],
  buttocks:     [-1, -0.5, 0, 0.5, 1, 1.5, 2],
  arms:         [-1, 0, 1, 2],
  upper_thighs: [-1, 0, 1, 2],
  lower_thighs: [-1, 0, 1, 2],
  calves:       [-1, 0, 1, 2]
};

// Store the CURRENT INDEX for each region (index of value 0)
const values = {
  chest: ranges.chest.indexOf(0),
  arms: ranges.arms.indexOf(0),
  buttocks: ranges.buttocks.indexOf(0),
  upper_thighs: ranges.upper_thighs.indexOf(0),
  lower_thighs: ranges.lower_thighs.indexOf(0),
  calves: ranges.calves.indexOf(0)
};

// =======================================================
// === Asset Hosting (MANUAL SWITCH) =====================
// =======================================================

// Change to "local" for offline builds
const IMAGE_SOURCE = "r2"; // "r2" | "local"

const IMAGE_BASE_URL =
  IMAGE_SOURCE === "r2"
    ? "https://pub-8cab3ae969184a09bdd86318aec09d57.r2.dev/images"
    : "assets/images";



// =======================================================
// === Precision Mode State ==============================
// =======================================================

const precisionEnabled = {
  chest: false,
  buttocks: false
};

function isHalfStep(value) {
  return value % 1 !== 0;
}

function isWholeStep(value) {
  return value % 1 === 0;
}

function findNearestWholeIndex(region, startIndex, direction) {
  const arr = ranges[region];

  let i = startIndex + direction;
  while (i >= 0 && i < arr.length) {
    if (isWholeStep(arr[i])) return i;
    i += direction;
  }

  return startIndex; // fallback (should not happen)
}



// =======================================================
// === Angle Control =====================================
// =======================================================

let currentAngleIndex = 7;
const angles = ["000", "045", "090", "135", "180", "225", "270", "315"];

// =======================================================
// === DOM References ====================================
// =======================================================

const archiveOut = document.getElementById("archiveName");
const previewSprite = document.getElementById("previewSprite");
const frameworkSelect = document.getElementById("framework");
const tppSelect = document.getElementById("tpp");

// =======================================================
// === Body Mod Selection ================================
// =======================================================

const bodyModButtons = document.querySelectorAll("[data-bodymod]");
let currentBodyMod = localStorage.getItem("lc_body_mod") || "solo";

function setActiveBodyMod(mod) {
  currentBodyMod = mod;
  localStorage.setItem("lc_body_mod", mod);

  bodyModButtons.forEach(btn =>
    btn.classList.toggle("active", btn.dataset.bodymod === mod)
  );

  updateArchiveAndPreview();
}

if (bodyModButtons.length > 0) {
  setActiveBodyMod(currentBodyMod);

  bodyModButtons.forEach(btn => {
    btn.addEventListener("click", () => setActiveBodyMod(btn.dataset.bodymod));
  });
}

// =======================================================
// === Slider Initialization =============================
// =======================================================

document.querySelectorAll(".slider").forEach(slider => {
  const region = slider.dataset.region;
  const valueElem = slider.querySelector(".value");
  const decBtn = slider.querySelector(".decrease");
  const incBtn = slider.querySelector(".increase");

  slider.setIndex = function (newIndex) {
    const arr = ranges[region];
    const maxIndex = arr.length - 1;

    values[region] = Math.min(maxIndex, Math.max(0, newIndex));
    const realValue = arr[values[region]];

    valueElem.textContent = realValue;

    decBtn.disabled = values[region] === 0;
    incBtn.disabled = values[region] === maxIndex;

    updatePrecisionVisuals(slider, region);
    updateArchiveAndPreview();
  };



  decBtn.addEventListener("click", () => handleStep(slider, region, -1));
  incBtn.addEventListener("click", () => handleStep(slider, region, +1));


  // Clicking the number resets to the 0-value position
  valueElem.addEventListener("click", () => {
    const zeroIndex = ranges[region].indexOf(0);
    slider.setIndex(zeroIndex === -1 ? 0 : zeroIndex);
  });

  slider.setIndex(values[region]);
});

function setIndexFallback(region, newIndex) {
  const slider = document.querySelector(`.slider[data-region="${region}"]`);
  slider?.setIndex(newIndex);
}


// =======================================================
// === Precision-Aware Stepping ==========================
// =======================================================

function handleStep(slider, region, direction) {
  const arr = ranges[region];
  const currentIndex = values[region];
  const currentValue = arr[currentIndex];
  const precisionOn = precisionEnabled[region] === true;

  // Regions without precision behave as before
  if (!(region in precisionEnabled)) {
    slider.querySelector(
      direction > 0 ? ".increase" : ".decrease"
    ).disabled || slider.setIndex(currentIndex + direction);
    return;
  }

  // Precision ON → normal fine stepping
  if (precisionOn) {
    slider.setIndex(currentIndex + direction);
    return;
  }

  // Precision OFF
  // If currently on half-step → snap first
  if (!isWholeStep(currentValue)) {
    const snapIndex = findNearestWholeIndex(region, currentIndex, direction);
    setIndexFallback(region, snapIndex);
    return;
  }

  // Precision OFF + already whole → step to next whole
  const nextWholeIndex = findNearestWholeIndex(region, currentIndex, direction);
  setIndexFallback(region, nextWholeIndex);
}


// =======================================================
// === Precision Visual Updates ===========================
// =======================================================

function updatePrecisionVisuals(slider, region) {
  const valueElem = slider.querySelector(".value");
  const decBtn = slider.querySelector(".decrease");
  const incBtn = slider.querySelector(".increase");

  const currentValue = ranges[region][values[region]];
  const precisionOn = precisionEnabled[region] === true;
  const halfStep = isHalfStep(currentValue);

  // Clear previous accent state
  valueElem.classList.remove("accent");
  decBtn.classList.remove("accent");
  incBtn.classList.remove("accent");

  // Precision ON → arrows + value
  if (precisionOn) {
    valueElem.classList.add("accent");
    decBtn.classList.add("accent");
    incBtn.classList.add("accent");
    return;
  }

  // Precision OFF + half-step → value only
  if (halfStep) {
    valueElem.classList.add("accent");
  }
}


// =======================================================
// === Precision Toggle Handlers ==========================
// =======================================================

document.querySelectorAll(".precision-toggle").forEach(btn => {
  const slider = btn.closest(".slider");
  const region = slider?.dataset.region;

  // Safety: only chest / buttocks should have precision
  if (!region || !(region in precisionEnabled)) return;

  btn.addEventListener("click", () => {
    precisionEnabled[region] = !precisionEnabled[region];

    btn.setAttribute("aria-pressed", precisionEnabled[region]);
    btn.classList.toggle("active", precisionEnabled[region]);

    updatePrecisionVisuals(slider, region);
  });

});


// =======================================================
// === Sprite Atlas Frame Selection ======================
// =======================================================

function setAtlasFrame(index) {
  const cols = 4, rows = 2;
  const col = index % cols;
  const row = Math.floor(index / cols);

  const x = (col / (cols - 1)) * 100;
  const y = (row / (rows - 1)) * 100;

  previewSprite.style.backgroundPosition = `${x}% ${y}%`;
}

// =======================================================
// === Preload Helper ====================================
// =======================================================

function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

// =======================================================
// === Encode Value → Filename Token =====================
// =======================================================

function encodeValue(v) {
  const scaled = Math.round(v * 10);        // e.g., -0.5 → -5
  const sign = scaled >= 0 ? "+" : "-";
  const absVal = Math.abs(scaled).toString().padStart(2, "0");  // always 2 digits
  return sign + absVal;
}

// =======================================================
// === Archive Filename + Sprite Updating ===============
// =======================================================

async function updateArchiveAndPreview() {

  // Build encoded MDX suffix
  const suffix = Object.entries(values)
    .map(([region, idx]) => encodeValue(ranges[region][idx]))
    .join("_");

  // Detect the "all zero" state
  const allZero = Object.entries(values)
    .every(([region, idx]) => ranges[region][idx] === 0);

  const framework = frameworkSelect.value;
  const tpp = tppSelect.value;
  const variant = [framework, tpp].filter(Boolean).join("_");

  const filename = `004_LethalCurves_${variant}__MDX_${suffix}`;
  const atlasFilename = `LC_MDX_${suffix}.webp`;
  const encodedFilename = encodeURIComponent(atlasFilename);

  const atlasPath =
    `${IMAGE_BASE_URL}/${currentBodyMod}/${encodedFilename}`;



  // Load sprite atlas
  if (previewSprite.dataset.currentSrc !== atlasPath) {
    try {
      await preloadImage(atlasPath);
      previewSprite.style.backgroundImage = `url("${atlasPath}")`;
      previewSprite.dataset.currentSrc = atlasPath;
    } catch (e) {
      console.warn("Failed to load atlas:", atlasPath, e);
    }
  }

  setAtlasFrame(currentAngleIndex);

  archiveOut.innerHTML = allZero
    ? "<em>Adjust a body region to view filename</em>"
    : filename + ".archive";
}

// =======================================================
// === Dropdown Behaviors ================================
// =======================================================

frameworkSelect.addEventListener("change", () => {
  const value = frameworkSelect.value;

  // Only UV and Global support TPP options
  if (value !== "UV" && value !== "Global") {
    tppSelect.value = "";
    for (const opt of tppSelect.options) {
      opt.disabled = opt.value !== "";
    }
  } else {
    for (const opt of tppSelect.options) {
      opt.disabled = false;
    }
  }

  updateArchiveAndPreview();
});

tppSelect.addEventListener("change", updateArchiveAndPreview);

// =======================================================
// === Copy Filename =====================================
// =======================================================

const copyBtn = document.getElementById("copyBtn");

copyBtn.addEventListener("click", () => {
  const text = archiveOut.textContent;

  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  }).catch(() => {
    // Fallback for older browsers
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(ta);
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  });
});

// =======================================================
// === Angle Buttons =====================================
// =======================================================

document.getElementById("anglePrev").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex - 1 + angles.length) % angles.length;
  setAtlasFrame(currentAngleIndex);
});

document.getElementById("angleNext").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex + 1) % angles.length;
  setAtlasFrame(currentAngleIndex);
});

// =======================================================
// === Initial Render ====================================
// =======================================================

updateArchiveAndPreview();
