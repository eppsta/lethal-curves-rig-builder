// === Config ===
const min = 0;
const max = 2;
const step = 1;

// === Angle Control ===
let currentAngleIndex = 7;
const angles = ["000", "045", "090", "135", "180", "225", "270", "315"];

// === Track current slider values ===
const values = { chest: 0, arms: 0, buttocks: 0, upper_thighs: 0, lower_thighs: 0, calves: 0 };

// === DOM References ===
const archiveOut = document.getElementById("archiveName");
const previewSprite = document.getElementById("previewSprite");
const frameworkSelect = document.getElementById("framework");
const tppSelect = document.getElementById("tpp");

// === Body Mod Pills ===
const bodyModButtons = document.querySelectorAll("[data-bodymod]");
let currentBodyMod = localStorage.getItem("lc_body_mod") || "solo";

function setActiveBodyMod(mod) {
  currentBodyMod = mod;
  localStorage.setItem("lc_body_mod", mod);
  bodyModButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bodymod === mod));
  updateArchiveAndPreview();
}

if (bodyModButtons.length > 0) {
  setActiveBodyMod(currentBodyMod);
  bodyModButtons.forEach(btn => {
    btn.addEventListener("click", () => setActiveBodyMod(btn.dataset.bodymod));
  });
}

// === Initialize Sliders ===
document.querySelectorAll(".slider").forEach(slider => {
  const region = slider.dataset.region;
  const valueElem = slider.querySelector(".value");
  const decBtn = slider.querySelector(".decrease");
  const incBtn = slider.querySelector(".increase");

  function setValue(newVal) {
    values[region] = Math.min(max, Math.max(min, newVal));
    valueElem.textContent = values[region];
    decBtn.disabled = values[region] <= min;
    incBtn.disabled = values[region] >= max;
    updateArchiveAndPreview();
  }

  decBtn.addEventListener("click", () => setValue(values[region] - step));
  incBtn.addEventListener("click", () => setValue(values[region] + step));
  valueElem.addEventListener("click", () => setValue(0));
  setValue(values[region]);
});

// === Angle frame helper ===
function setAtlasFrame(index) {
  const cols = 4, rows = 2;
  const col = index % cols;
  const row = Math.floor(index / cols);

  const x = (col / (cols - 1)) * 100;
  const y = (row / (rows - 1)) * 100;

  previewSprite.style.backgroundPosition = `${x}% ${y}%`;
}

// === Preload helper ===
function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

// === Archive Filename + Sprite Updater ===
async function updateArchiveAndPreview() {
  const suffix = Object.values(values).join("_");
  const allZero = Object.values(values).every(v => v === 0);
  const framework = frameworkSelect.value;
  const tpp = tppSelect.value;
  const variant = [framework, tpp].filter(Boolean).join("_");
  const filename = `004_LethalCurves_${variant}__MDX_${suffix}`;

  const atlasPath = `assets/images/${currentBodyMod}/LC_MDX_${suffix}.webp`;

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

// === Dropdown Handlers ===
frameworkSelect.addEventListener("change", () => {
  const value = frameworkSelect.value;

  if (value !== "UV" && value !== "Global") {
    // Reset TPP to None
    tppSelect.value = "";

    // Disable all except None
    for (const opt of tppSelect.options) {
      if (opt.value === "") {
        opt.disabled = false;
      } else {
        opt.disabled = true;
      }
    }
  } else {
    // Re-enable all TPP options
    for (const opt of tppSelect.options) {
      opt.disabled = false;
    }
  }

  updateArchiveAndPreview();
});

tppSelect.addEventListener("change", updateArchiveAndPreview);


// === Copy to Clipboard ===
const copyBtn = document.getElementById("copyBtn");
copyBtn.addEventListener("click", () => {
  const text = archiveOut.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  }).catch(() => {
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


// === Angle Button Handlers ===
document.getElementById("anglePrev").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex - 1 + angles.length) % angles.length;
  setAtlasFrame(currentAngleIndex);
});
document.getElementById("angleNext").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex + 1) % angles.length;
  setAtlasFrame(currentAngleIndex);
});

// Initial render
updateArchiveAndPreview();
