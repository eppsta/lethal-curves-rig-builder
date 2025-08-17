// === Config ===
const min = 0;
const max = 2;
const step = 1;

// === Angle Control ===
let currentAngleIndex = 7;
const angles = ["000", "045", "090", "135", "180", "225", "270", "315"];
const prettyAngleLabel = {
  "000": "Front",
  "045": "Front-Side",
  "090": "Side",
  "135": "Back-Side",
  "180": "Back",
  "225": "Back-Side",
  "270": "Side",
  "315": "Front-Side"
};

// === Track current slider values ===
const values = { chest: 0, arms: 0, buttocks: 0, upper_thighs: 0, lower_thighs: 0, calves: 0 };

// === DOM References ===
const archiveOut = document.getElementById("archiveName");
const previewImg = document.getElementById("previewImage");
const frameworkSelect = document.getElementById("framework");
const tppSelect = document.getElementById("tpp");

// === Body Mod Pills ===
const bodyModButtons = document.querySelectorAll("[data-bodymod]");
let currentBodyMod = localStorage.getItem("lc_body_mod") || "solo";

// Mark the active pill on load
function setActiveBodyMod(mod) {
  currentBodyMod = mod;
  localStorage.setItem("lc_body_mod", mod);
  bodyModButtons.forEach(btn => btn.classList.toggle("active", btn.dataset.bodymod === mod));
  updateArchiveAndPreview();
}

// Add listeners if pills exist
if (bodyModButtons.length > 0) {
  setActiveBodyMod(currentBodyMod); // restore from localStorage
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

// === Helpers for images ===
function imageBase(suffix, angle) {
  return `images/${currentBodyMod}/LC_MDX_${suffix}_${angle}`;
}

function setPreviewWithFallback(base) {
  previewImg.onerror = () => {
    previewImg.onerror = null; // prevent infinite loop
    if (currentBodyMod !== "solo") {
      setActiveBodyMod("solo");
      previewImg.src = `${base.replace(`/${currentBodyMod}/`, "/solo/")}.webp`;
    }
  };
  previewImg.src = `${base}.webp`;
}

// === Archive Filename + Image Updater ===
function updateArchiveAndPreview() {
  const suffix = Object.values(values).join("_");
  const allZero = Object.values(values).every(v => v === 0);
  const angle = angles[currentAngleIndex];
  const framework = frameworkSelect.value;
  const tpp = tppSelect.value;
  const variant = [framework, tpp].filter(Boolean).join("_");
  const filename = `004_LethalCurves_${variant}__MDX_${suffix}`;

  document.getElementById("angleLabel").textContent = prettyAngleLabel[angle];
  const base = imageBase(suffix, angle);
  setPreviewWithFallback(base);

  archiveOut.innerHTML = allZero ? "<em>Adjust a body region to view filename</em>"
                                 : filename + ".archive";
}

// === Dropdown Handlers ===
frameworkSelect.addEventListener("change", updateArchiveAndPreview);
tppSelect.addEventListener("change", updateArchiveAndPreview);

// === Copy to Clipboard ===
const copyBtn = document.getElementById("copyBtn");
copyBtn.addEventListener("click", () => {
  const text = archiveOut.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  }).catch(() => alert("Copy failed. Please copy manually."));
});

// === Angle Button Handlers ===
document.getElementById("anglePrev").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex - 1 + angles.length) % angles.length;
  updateArchiveAndPreview();
});
document.getElementById("angleNext").addEventListener("click", () => {
  currentAngleIndex = (currentAngleIndex + 1) % angles.length;
  updateArchiveAndPreview();
});

// Initial render
updateArchiveAndPreview();
