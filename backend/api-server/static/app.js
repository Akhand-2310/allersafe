const imageInput = document.getElementById("menuImage");
const dropZone = document.getElementById("dropZone");
const uploadPrompt = document.getElementById("uploadPrompt");
const previewContainer = document.getElementById("previewContainer");
const menuPreview = document.getElementById("menuPreview");
const fileName = document.getElementById("fileName");
const fileSize = document.getElementById("fileSize");
const removeImage = document.getElementById("removeImage");
const analyzeButton = document.getElementById("analyzeButton");
const loading = document.getElementById("loading");
const results = document.getElementById("results");
const selectionCount = document.getElementById("selectionCount");
let previewUrl = null;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
    }[character]));
}

function selectedAllergens() {
    return [...document.querySelectorAll(".scanner-allergen-grid input:checked")].map(input => input.value);
}

function updateSelectionCount() {
    const count = selectedAllergens().length;
    selectionCount.textContent = `${count} allergen${count === 1 ? "" : "s"} selected`;
}

function setFile(file) {
    if (!file) return;
    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type)) {
        loading.textContent = "Please choose a JPG, PNG or WEBP image.";
        loading.className = "scan-status error-status";
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        loading.textContent = "That image is larger than 10 MB. Please choose a smaller file.";
        loading.className = "scan-status error-status";
        return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    menuPreview.src = previewUrl;
    fileName.textContent = file.name;
    fileSize.textContent = `${(file.size / 1024 / 1024).toFixed(2)} MB`;
    uploadPrompt.classList.add("is-hidden");
    previewContainer.classList.remove("is-hidden");
    loading.textContent = "";
    loading.className = "scan-status";
}

function clearFile() {
    imageInput.value = "";
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    previewContainer.classList.add("is-hidden");
    uploadPrompt.classList.remove("is-hidden");
}

function displayResults(data) {
    const dishes = data.dishes || [];
    const safeLevel = level => ({
        red: "high",
        yellow: "medium",
        green: "low",
        high: "high",
        medium: "medium",
        low: "low",
    }[String(level).toLowerCase()] || "medium");
    results.innerHTML = `
        <div class="results-heading">
            <div><p class="card-kicker">Your scan is ready</p><h2>Menu safety report</h2></div>
            <span class="result-count">${dishes.length} dish${dishes.length === 1 ? "" : "es"} reviewed</span>
        </div>
        <p class="results-summary">${escapeHtml(data.summary)}</p>
        <div class="dish-list">${dishes.map(dish => {
            const risk = dish.risk || {};
            const level = safeLevel(risk.level);
            const allergens = (dish.detected_allergens || []).map(escapeHtml).join(", ") || "None detected";
            return `<article class="dish-result risk-${level}">
                <div class="dish-topline"><h3>${escapeHtml(dish.dish)}</h3><span class="risk-pill">${escapeHtml(risk.level || "Review")}</span></div>
                <p>${escapeHtml(dish.explanation || risk.reason || "Review this dish with restaurant staff.")}</p>
                <div class="dish-meta"><span><strong>Allergens:</strong> ${allergens}</span><span><strong>Confidence:</strong> ${escapeHtml(dish.confidence || "Not available")}</span></div>
            </article>`;
        }).join("")}</div>
        <details class="ocr-details"><summary>View extracted menu text</summary><pre>${escapeHtml(data.ocr_text || "No OCR text available.")}</pre></details>`;
    results.classList.remove("is-hidden");
    results.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function analyzeMenu() {
    const allergens = selectedAllergens();
    if (!imageInput.files.length) {
        loading.textContent = "Choose a menu image before analyzing.";
        loading.className = "scan-status error-status";
        return;
    }
    if (!allergens.length) {
        loading.textContent = "Select at least one allergen to personalize your report.";
        loading.className = "scan-status error-status";
        return;
    }
    const formData = new FormData();
    formData.append("image", imageInput.files[0]);
    formData.append("allergens", JSON.stringify(allergens));
    analyzeButton.disabled = true;
    analyzeButton.innerHTML = '<span class="spinner" aria-hidden="true"></span> Analyzing menu…';
    loading.textContent = "Reading the menu and checking each dish.";
    loading.className = "scan-status";
    results.classList.add("is-hidden");
    try {
        const response = await fetch("/analyze", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Analysis failed. Please try again.");
        displayResults(data);
        loading.textContent = "Analysis complete.";
    } catch (error) {
        loading.textContent = error.message;
        loading.className = "scan-status error-status";
    } finally {
        analyzeButton.disabled = false;
        analyzeButton.innerHTML = '<span aria-hidden="true">✦</span> Analyze menu';
    }
}

document.querySelectorAll(".scanner-allergen-grid input").forEach(input => input.addEventListener("change", updateSelectionCount));
imageInput.addEventListener("change", event => setFile(event.target.files[0]));
dropZone.addEventListener("click", event => {
    if (event.target.closest("#removeImage")) return;
    imageInput.click();
});
dropZone.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        imageInput.click();
    }
});
["dragenter", "dragover"].forEach(eventName => dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    dropZone.classList.add("dragover");
}));
["dragleave", "drop"].forEach(eventName => dropZone.addEventListener(eventName, event => {
    event.preventDefault();
    dropZone.classList.remove("dragover");
}));
dropZone.addEventListener("drop", event => setFile(event.dataTransfer.files[0]));
removeImage.addEventListener("click", event => {
    event.stopPropagation();
    clearFile();
});
analyzeButton.addEventListener("click", analyzeMenu);
updateSelectionCount();
