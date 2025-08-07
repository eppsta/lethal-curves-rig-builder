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
const values = {
  chest: 0,
  arms: 0,
  buttocks: 0,
  upper_thighs: 0,
  lower_thighs: 0,
  calves: 0
};

// === DOM References ===
const archiveOut = document.getElementById("archiveName");
const archiveMsg = document.getElementById("archiveMessage");
const previewImg = document.getElementById("previewImage");
const frameworkSelect = document.getElementById("framework");
const tppSelect = document.getElementById("tpp");

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

// === Archive Filename + Image Updater ===
function updateArchiveAndPreview() {
  const suffix = Object.values(values).join("_");
  const allZero = Object.values(values).every(v => v === 0);
  const angle = angles[currentAngleIndex];
  const framework = frameworkSelect.value;
  const tpp = tppSelect.value;
  const variant = [framework, tpp].filter(Boolean).join("_");
  const filename = `004_LethalCurves_${variant}__MDX_${suffix}`;

  // Update angle label and preview image
  document.getElementById("angleLabel").textContent = prettyAngleLabel[angle];
  previewImg.src = `images/LC_MDX_${suffix}_${angle}.webp`;

  // Toggle filename/message
  if (allZero) {
  archiveOut.innerHTML = "<em>Adjust a body region to view filename</em>";
  } else {
    archiveOut.textContent = filename + ".archive";
  }
}

// === Dropdown Handlers ===
frameworkSelect.addEventListener("change", updateArchiveAndPreview);
tppSelect.addEventListener("change", updateArchiveAndPreview);

// === Copy to Clipboard ===
const archiveInput = document.getElementById("archiveInput");
const copyBtn = document.getElementById("copyBtn");

copyBtn.addEventListener("click", () => {
  const text = archiveOut.textContent;
  navigator.clipboard.writeText(text).then(() => {
    copyBtn.textContent = "Copied!";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1000);
  }).catch(() => {
    alert("Copy failed. Please copy manually.");
  });
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
