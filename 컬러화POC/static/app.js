const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const DEFAULT_SETTINGS = {
  normalization: "linear",
  colormap: "nuclear_spectrum",
  invertGrayscale: true,
  gamma: 1.35,
  backgroundThreshold: 0.5,
  manualBounds: false,
  lowerBound: null,
  upperBound: null,
  lowerPercentile: 1,
  upperPercentile: 99,
  logStrength: 20,
  center: null,
  width: null,
  format: "PNG",
  jpegQuality: 95,
};

const STATUS_LABELS = {
  unsaved: "미저장",
  modified: "수정됨",
  saved: "저장됨",
  error: "오류",
};

const ROI_LABEL_COLORS = {
  "갑상샘": "#ff5a3d",
  "병변": "#ffd43b",
  "배경": "#30c7d7",
  "기타": "#b082ff",
};
const ROI_CUSTOM_COLORS = ["#7dd3fc", "#86efac", "#f9a8d4", "#fdba74", "#c4b5fd", "#fde047"];

const normalizationDescriptions = {
  linear: "현재 영상의 최솟값을 0, 최댓값을 1로 선형 변환합니다.",
  percentile: "이상치를 잘라낸 뒤 선형 변환합니다. 고대비 영상에 유용합니다.",
  histogram: "픽셀 분포가 넓게 퍼지도록 변환해 전체 대비를 강화합니다.",
  log: "낮은 강도의 신호를 확장해 어두운 영역을 강조합니다.",
  window: "DICOM 윈도우 또는 직접 입력한 Center/Width 범위를 사용합니다.",
};

const state = {
  user: null,
  savedBatches: [],
  authMode: "login",
  batch: null,
  items: [],
  selectedItem: null,
  source: null,
  drafts: new Map(),
  renderTimer: null,
  renderSequence: 0,
  selectionSequence: 0,
  busyCount: 0,
  previewBusyCount: 0,
  importTask: null,
  batchJobId: null,
  batchFormat: null,
  batchJobActive: false,
  batchPollTimer: null,
  listRenderPending: false,
  roi: {
    open: false,
    itemId: null,
    image: null,
    rows: 0,
    columns: 0,
    labels: [],
    regions: [],
    savedRegions: [],
    selectedRegionId: null,
    tool: "select",
    polygonDraft: [],
    ellipseDraft: null,
    drag: null,
    zoom: 1,
    panX: 0,
    panY: 0,
    smoothing: true,
    dirty: false,
    colorSettingsSnapshot: null,
    loadSequence: 0,
    resizeObserver: null,
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setBusy(active, message = "영상을 준비하고 있습니다") {
  state.busyCount = Math.max(0, state.busyCount + (active ? 1 : -1));
  $("#loading span").textContent = message;
  $("#loading").classList.toggle("hidden", state.busyCount === 0);
}

function setPreviewBusy(active, message = "DICOM 파일을 읽고 있습니다") {
  state.previewBusyCount = Math.max(0, state.previewBusyCount + (active ? 1 : -1));
  if (active) {
    $$(".image-loading-label").forEach((label) => { label.textContent = message; });
  }
  $(".comparison-grid").classList.toggle("is-loading", state.previewBusyCount > 0);
}

function showError(message) {
  const banner = $("#error-banner");
  banner.textContent = message;
  banner.classList.remove("hidden");
}

function clearError() {
  $("#error-banner").classList.add("hidden");
}

async function api(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    let message = `요청을 처리하지 못했습니다. (${response.status})`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch (_) {
      // Use the status-based fallback when an error response is not JSON.
    }
    if (response.status === 401 && !url.startsWith("api/auth/")) showAuthScreen();
    throw new Error(message);
  }
  return response;
}

function showAuthScreen() {
  state.user = null;
  $("#app-shell").classList.add("hidden");
  $("#auth-gate").classList.remove("hidden");
  $("#auth-password").value = "";
}

function updateAuthMode(mode) {
  state.authMode = mode;
  const registering = mode === "register";
  $("#auth-title").textContent = registering ? "작업 계정 만들기" : "컬러화 작업공간";
  $("#auth-description").textContent = registering
    ? "이 계정에 업로드 파일과 컬러 설정, ROI 라벨링이 독립적으로 저장됩니다."
    : "계정으로 로그인하면 업로드한 파일과 ROI 라벨링을 이어서 작업할 수 있습니다.";
  $("#auth-submit").textContent = registering ? "계정 만들기" : "로그인";
  $("#auth-toggle").textContent = registering
    ? "이미 계정이 있나요? 로그인"
    : "처음 이용하시나요? 계정 만들기";
  $("#auth-password").autocomplete = registering ? "new-password" : "current-password";
  $("#auth-error").classList.add("hidden");
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const error = $("#auth-error");
  const button = $("#auth-submit");
  error.classList.add("hidden");
  button.disabled = true;
  try {
    const response = await api(
      state.authMode === "register" ? "api/auth/register" : "api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: $("#auth-username").value.trim(),
          password: $("#auth-password").value,
        }),
      },
    );
    const result = await response.json();
    await enterWorkspace(result.user);
  } catch (authError) {
    error.textContent = authError.message;
    error.classList.remove("hidden");
  } finally {
    button.disabled = false;
  }
}

async function enterWorkspace(user) {
  state.user = user;
  $("#account-username").textContent = user.username;
  $("#auth-gate").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  $("#auth-password").value = "";
  await refreshSavedBatches(null, true);
}

async function logout() {
  try {
    await api("api/auth/logout", { method: "POST" });
  } finally {
    resetBatch({ batchId: null, label: "", sourceType: "upload", items: [] });
    state.savedBatches = [];
    showAuthScreen();
  }
}

function renderSavedBatchOptions(preferredBatchId = null) {
  const select = $("#saved-batches");
  select.innerHTML = "";
  if (!state.savedBatches.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "저장된 작업이 없습니다";
    select.appendChild(option);
  } else {
    state.savedBatches.forEach((batch) => {
      const option = document.createElement("option");
      option.value = batch.batchId;
      const date = batch.createdAt ? new Date(batch.createdAt).toLocaleDateString("ko-KR") : "";
      option.textContent = `${batch.label} · ${batch.itemCount}개${date ? ` · ${date}` : ""}`;
      select.appendChild(option);
    });
  }
  const candidate = preferredBatchId || state.batch?.batchId;
  if (candidate && state.savedBatches.some((batch) => batch.batchId === candidate)) {
    select.value = candidate;
  }
  $("#saved-batch-count").textContent = state.savedBatches.length;
  updateSavedBatchButtons();
}

function updateSavedBatchButtons() {
  const select = $("#saved-batches");
  const hasSelection = Boolean(select.value);
  $("#open-saved-batch").disabled = !hasSelection;
  $("#delete-saved-batch").disabled = !hasSelection;
}

async function refreshSavedBatches(preferredBatchId = null, openFirst = false) {
  const response = await api("api/batches");
  state.savedBatches = (await response.json()).batches || [];
  renderSavedBatchOptions(preferredBatchId);
  if (openFirst && $("#saved-batches").value) {
    await openSavedBatch($("#saved-batches").value);
  }
}

async function openSavedBatch(batchId) {
  if (!batchId) return;
  clearError();
  setBusy(true, "저장된 작업을 불러오고 있습니다");
  try {
    const response = await api(`api/batches/${batchId}`);
    const batch = await response.json();
    resetBatch(batch);
    renderSavedBatchOptions(batch.batchId);
    const first = state.items.find((item) => item.itemId && !item.error);
    if (first) await selectItem(first.itemId);
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(false);
  }
}

async function deleteSavedBatch() {
  const batchId = $("#saved-batches").value;
  const batch = state.savedBatches.find((candidate) => candidate.batchId === batchId);
  if (!batchId || !batch) return;
  if (!window.confirm(`“${batch.label}” 작업과 업로드 파일을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`)) return;
  clearError();
  try {
    await api(`api/batches/${batchId}`, { method: "DELETE" });
    if (state.batch?.batchId === batchId) {
      resetBatch({ batchId: null, label: "", sourceType: "upload", items: [] });
    }
    await refreshSavedBatches(null, true);
  } catch (error) {
    showError(error.message);
  }
}

function selectedRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`).value;
}

function updateBatchScopeHelp() {
  const scope = selectedRadio("batchScope");
  $("#batch-scope-help-text").textContent = scope === "saved"
    ? "ROI 라벨 선과 정보는 포함하지 않고, 컬러화 설정을 저장한 파일만 이미지로 내보냅니다."
    : "ROI 라벨 선과 정보는 포함하지 않고, 미저장 파일에는 현재 화면의 컬러화 설정을 적용해 함께 내보냅니다.";
}

function numberValue(selector) {
  const value = $(selector).value;
  return value === "" ? null : Number(value);
}

function normalizedSettings(raw, defaultInvert = true) {
  const settings = { ...DEFAULT_SETTINGS, invertGrayscale: defaultInvert, ...(raw || {}) };
  settings.normalization = String(settings.normalization);
  settings.colormap = String(settings.colormap);
  settings.invertGrayscale = Boolean(settings.invertGrayscale);
  settings.gamma = Number(settings.gamma);
  settings.backgroundThreshold = Number(settings.backgroundThreshold);
  settings.manualBounds = Boolean(settings.manualBounds) && settings.normalization === "linear";
  settings.lowerBound = settings.manualBounds && settings.normalization === "linear" && settings.lowerBound !== null ? Number(settings.lowerBound) : null;
  settings.upperBound = settings.manualBounds && settings.normalization === "linear" && settings.upperBound !== null ? Number(settings.upperBound) : null;
  settings.lowerPercentile = Number(settings.lowerPercentile);
  settings.upperPercentile = Number(settings.upperPercentile);
  settings.logStrength = Number(settings.logStrength);
  settings.center = settings.normalization === "window" && settings.center !== null ? Number(settings.center) : null;
  settings.width = settings.normalization === "window" && settings.width !== null ? Number(settings.width) : null;
  settings.format = String(settings.format).toUpperCase();
  settings.jpegQuality = Number(settings.jpegQuality);
  return settings;
}

function currentSettings() {
  const normalization = $("#normalization").value;
  const manualBounds = $("#manual-bounds").checked;
  return normalizedSettings({
    normalization,
    colormap: $("#colormap").value,
    invertGrayscale: $("#invert-grayscale").checked,
    gamma: Number($("#gamma").value),
    backgroundThreshold: Number($("#background-threshold").value),
    manualBounds,
    lowerBound: manualBounds ? numberValue("#lower-bound") : null,
    upperBound: manualBounds ? numberValue("#upper-bound") : null,
    lowerPercentile: Number($("#lower-percentile").value),
    upperPercentile: Number($("#upper-percentile").value),
    logStrength: Number($("#log-strength").value),
    center: normalization === "window" ? numberValue("#window-center") : null,
    width: normalization === "window" ? numberValue("#window-width") : null,
    format: DEFAULT_SETTINGS.format,
    jpegQuality: DEFAULT_SETTINGS.jpegQuality,
  });
}

function comparableColorSettings(settings) {
  const comparable = normalizedSettings(settings);
  delete comparable.format;
  delete comparable.jpegQuality;
  return comparable;
}

function settingsEqual(first, second) {
  return JSON.stringify(comparableColorSettings(first)) === JSON.stringify(comparableColorSettings(second));
}

function defaultSettingsFor(source) {
  return normalizedSettings(DEFAULT_SETTINGS, Boolean(source?.defaultInvert));
}

function itemStatus(item) {
  if (item.error) return "error";
  if (!item.savedSettings) return "unsaved";
  const draft = state.drafts.get(item.itemId);
  return draft && !settingsEqual(draft, item.savedSettings) ? "modified" : "saved";
}

function storeCurrentDraft() {
  if (!state.selectedItem || !state.source) return;
  state.drafts.set(state.selectedItem.itemId, currentSettings());
}

function effectiveItemSettings(item) {
  if (item.itemId === state.selectedItem?.itemId && state.source) return currentSettings();
  if (state.drafts.has(item.itemId)) return clone(state.drafts.get(item.itemId));
  if (item.savedSettings) return clone(item.savedSettings);
  return clone(DEFAULT_SETTINGS);
}

function updateRangeOutputs() {
  $("#gamma-value").textContent = Number($("#gamma").value).toFixed(2);
  $("#background-threshold-value").textContent = `${Number($("#background-threshold").value).toFixed(1)}%`;
  $("#log-strength-value").textContent = Number($("#log-strength").value).toFixed(1);
  $("#jpeg-quality-value").textContent = $("#jpeg-quality").value;
}

function updateNormalizationControls() {
  const method = $("#normalization").value;
  $("#normalization-help").textContent = normalizationDescriptions[method];
  $$(".method-controls").forEach((element) => element.classList.add("hidden"));
  const target = $(`#${method}-controls`);
  if (target) target.classList.remove("hidden");
  $("#manual-bound-fields").classList.toggle("hidden", !$("#manual-bounds").checked);
}

function updateSourceControls() {
  const selected = selectedRadio("sourceType");
  $$(".source-picker").forEach((element) => element.classList.add("hidden"));
  $(`#${selected}-source`).classList.remove("hidden");
}

function applySettings(settings, source) {
  const merged = normalizedSettings(settings, Boolean(source?.defaultInvert));
  $("#normalization").value = merged.normalization;
  $("#colormap").value = merged.colormap;
  $("#invert-grayscale").checked = merged.invertGrayscale;
  $("#gamma").value = merged.gamma;
  $("#background-threshold").value = merged.backgroundThreshold;
  $("#manual-bounds").checked = merged.manualBounds;
  $("#lower-bound").value = merged.lowerBound ?? source?.stats?.min ?? "";
  $("#upper-bound").value = merged.upperBound ?? source?.stats?.max ?? "";
  $("#lower-percentile").value = merged.lowerPercentile;
  $("#upper-percentile").value = merged.upperPercentile;
  $("#log-strength").value = merged.logStrength;
  $("#window-center").value = merged.center ?? source?.window?.center ?? "";
  $("#window-width").value = merged.width ?? source?.window?.width ?? "";
  updateNormalizationControls();
  updateRangeOutputs();
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 10000 || (Math.abs(value) > 0 && Math.abs(value) < 0.01)) return value.toExponential(3);
  return Number(value.toFixed(3)).toLocaleString("ko-KR");
}

function applyImageInfo(info, resetDerived = false) {
  const stats = info.stats;
  $("#metric-range").textContent = `${formatNumber(stats.min)} / ${formatNumber(stats.max)}`;
  $("#metric-percentile").textContent = `${formatNumber(stats.p01)} / ${formatNumber(stats.p99)}`;
  if (resetDerived && !$("#manual-bounds").checked) {
    $("#lower-bound").value = stats.min;
    $("#upper-bound").value = stats.max;
  }
  if (resetDerived && $("#normalization").value !== "window") {
    $("#window-center").value = info.window.center;
    $("#window-width").value = info.window.width;
  }
  $("#window-source").textContent = `초깃값: ${info.window.source}`;
}

function applySourceInfo(source) {
  state.source = source;
  state.selectedItem.error = null;
  $("#file-badge").textContent = source.relativePath;
  $("#metric-size").textContent = `${source.columns} × ${source.rows}`;
  $("#metric-modality").textContent = source.modality;
  $("#metric-photometric").textContent = source.photometricInterpretation;
  $("#metric-bits").textContent = source.bitsStored ?? "Unknown";
  $("#save-settings").disabled = false;
  const roiCount = Number(source.roiCount) || 0;
  $("#open-roi-editor").disabled = false;
  $("#open-roi-editor").textContent = roiCount ? `ROI 편집 · ${roiCount}개` : "ROI 라벨링";
}

function resetMainPanel() {
  clearTimeout(state.renderTimer);
  state.selectionSequence += 1;
  state.renderSequence += 1;
  state.source = null;
  state.selectedItem = null;
  $(".comparison-grid").classList.remove("is-loading");
  $("#file-badge").textContent = "파일을 선택하세요";
  $("#save-settings").disabled = true;
  $("#open-roi-editor").disabled = true;
  $("#open-roi-editor").textContent = "ROI 라벨링";
  ["#grayscale-image", "#color-image"].forEach((selector) => {
    $(selector).removeAttribute("src");
    $(selector).classList.remove("ready");
  });
  $("#colormap-scale").removeAttribute("src");
  $("#grayscale-caption").textContent = "파일 대기 중";
  $("#color-caption").textContent = "파일 대기 중";
  $("#metric-size").textContent = "—";
  $("#metric-range").textContent = "—";
  $("#metric-percentile").textContent = "—";
  $("#metric-modality").textContent = "—";
  $("#metric-photometric").textContent = "—";
  $("#metric-bits").textContent = "—";
}

function visibleItems() {
  const query = $("#file-search").value.trim().toLocaleLowerCase("ko-KR");
  const filter = $("#status-filter").value;
  return state.items.filter((item) => {
    const searchMatch = !query || item.relativePath.toLocaleLowerCase("ko-KR").includes(query);
    const statusMatch = filter === "all" || itemStatus(item) === filter;
    return searchMatch && statusMatch;
  });
}

function renderFileList() {
  const list = $("#file-list");
  list.innerHTML = "";
  const items = visibleItems();
  $("#file-count").textContent = `${items.length}/${state.items.length}`;
  $("#empty-list").classList.toggle("hidden", items.length > 0);
  list.classList.toggle("hidden", items.length === 0);

  items.forEach((item) => {
    const status = itemStatus(item);
    const path = item.relativePath.split("/");
    const filename = path.pop();
    const row = document.createElement("div");
    row.className = `file-row${item.itemId === state.selectedItem?.itemId ? " selected" : ""}`;
    row.tabIndex = item.itemId ? 0 : -1;
    row.role = "option";
    row.ariaSelected = item.itemId === state.selectedItem?.itemId ? "true" : "false";
    row.title = item.error || item.relativePath;

    const dot = document.createElement("i");
    dot.className = `status-dot ${status}`;
    dot.title = STATUS_LABELS[status];
    row.appendChild(dot);

    const name = document.createElement("div");
    name.className = "file-row-name";
    const titleLine = document.createElement("div");
    titleLine.className = "file-row-title";
    const strong = document.createElement("strong");
    strong.textContent = filename;
    titleLine.appendChild(strong);
    if (Number(item.roiCount) > 0) {
      const roiBadge = document.createElement("span");
      roiBadge.className = "roi-count-badge";
      roiBadge.textContent = `ROI ${item.roiCount}`;
      titleLine.appendChild(roiBadge);
    }
    const detail = document.createElement("span");
    detail.textContent = item.error ? item.error : `${path.join("/") || "최상위"} · ${STATUS_LABELS[status]}`;
    name.append(titleLine, detail);
    row.appendChild(name);

    const actions = document.createElement("div");
    actions.className = "file-row-actions";
    ["PNG", "JPG"].forEach((format) => {
      const downloadButton = document.createElement("button");
      downloadButton.className = `file-download-button ${format.toLowerCase()}`;
      downloadButton.textContent = format;
      downloadButton.title = `${format} 컬러 결과 다운로드`;
      downloadButton.disabled = !item.itemId || Boolean(item.error);
      downloadButton.addEventListener("click", (event) => {
        event.stopPropagation();
        downloadItem(item, format);
      });
      actions.append(downloadButton);
    });
    row.appendChild(actions);

    if (item.itemId && !item.error) {
      row.addEventListener("click", () => selectItem(item.itemId));
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectItem(item.itemId);
        }
      });
    }
    list.appendChild(row);
  });
  const batchDisabled = state.batchJobActive || !state.batch || !state.items.some((item) => item.itemId && !item.error);
  $$(".batch-start-button").forEach((button) => { button.disabled = batchDisabled; });
  const viaDisabled = state.batchJobActive || !state.batch || !state.items.some(
    (item) => item.itemId && !item.error && Number(item.roiCount) > 0,
  );
  $("#start-batch-via").disabled = viaDisabled;
}

function scheduleFileListRender() {
  if (state.listRenderPending) return;
  state.listRenderPending = true;
  requestAnimationFrame(() => {
    state.listRenderPending = false;
    renderFileList();
  });
}

async function selectItem(itemId) {
  const item = state.items.find((candidate) => candidate.itemId === itemId);
  if (!item || item.error || itemId === state.selectedItem?.itemId) return;
  storeCurrentDraft();
  const sequence = ++state.selectionSequence;
  state.selectedItem = item;
  state.source = null;
  renderFileList();
  clearError();
  setPreviewBusy(true, "DICOM 파일을 읽고 있습니다");
  try {
    const response = await api(`api/items/${itemId}`);
    const source = await response.json();
    if (sequence !== state.selectionSequence) return;
    Object.assign(item, source);
    applySourceInfo(source);
    const settings = state.drafts.get(itemId) || item.savedSettings || defaultSettingsFor(source);
    applySettings(settings, source);
    if (!state.drafts.has(itemId)) state.drafts.set(itemId, currentSettings());
    applyImageInfo(source, true);
    renderFileList();
    await renderPreview();
  } catch (error) {
    item.error = error.message;
    showError(`${item.relativePath}: ${error.message}`);
    renderFileList();
  } finally {
    setPreviewBusy(false);
  }
}

function scheduleRender(delay = 170) {
  clearTimeout(state.renderTimer);
  state.renderTimer = setTimeout(renderPreview, delay);
}

async function renderPreview() {
  if (!state.selectedItem || !state.source) return;
  storeCurrentDraft();
  scheduleFileListRender();
  const sequence = ++state.renderSequence;
  clearError();
  try {
    const payload = currentSettings();
    const response = await api(`api/items/${state.selectedItem.itemId}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (sequence !== state.renderSequence) return;
    const grayscale = $("#grayscale-image");
    const color = $("#color-image");
    grayscale.classList.remove("ready");
    color.classList.remove("ready");
    grayscale.src = result.grayscale;
    color.src = result.color;
    $("#colormap-scale").src = result.scale;
    await new Promise((resolve) => requestAnimationFrame(() => {
      if (sequence === state.renderSequence) {
        grayscale.classList.add("ready");
        color.classList.add("ready");
      }
      resolve();
    }));
    applyImageInfo(result, false);
    const normalizationLabel = $("#normalization").selectedOptions[0].textContent;
    const colormapLabel = $("#colormap").selectedOptions[0].textContent.split(" (")[0];
    $("#grayscale-caption").textContent = normalizationLabel;
    $("#color-caption").textContent = colormapLabel;
  } catch (error) {
    if (sequence === state.renderSequence) showError(error.message);
  }
}

function resetBatch(batch) {
  clearTimeout(state.batchPollTimer);
  state.batch = batch;
  state.items = batch.items || [];
  state.drafts.clear();
  state.batchJobId = null;
  state.batchFormat = null;
  state.batchJobActive = false;
  $("#batch-job").classList.add("hidden");
  $("#download-batch-result").classList.add("hidden");
  resetMainPanel();
  renderFileList();
}

function makeUploadChunks(entries) {
  const chunks = [];
  let current = [];
  let currentSize = 0;
  const maxChunkSize = 64 * 1024 * 1024;
  entries.forEach((entry) => {
    if (current.length && (current.length >= 10 || currentSize + entry.file.size > maxChunkSize)) {
      chunks.push(current);
      current = [];
      currentSize = 0;
    }
    current.push(entry);
    currentSize += entry.file.size;
  });
  if (current.length) chunks.push(current);
  return chunks;
}

function updateImportProgress(completed, total, message) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  $("#import-progress").classList.remove("hidden");
  $("#import-progress-bar").value = percent;
  $("#import-percent").textContent = `${percent}%`;
  $("#import-message").textContent = message;
}

function setImportSummary(message = "") {
  const summary = $("#import-summary");
  summary.textContent = message;
  summary.classList.toggle("hidden", !message);
}

function duplicateImageGroups(items) {
  const groupsByHash = new Map();
  items.forEach((item) => {
    if (!item.itemId || item.error || !item.imageHash) return;
    const group = groupsByHash.get(item.imageHash) || [];
    group.push(item);
    groupsByHash.set(item.imageHash, group);
  });
  return [...groupsByHash.values()].filter((group) => group.length > 1);
}

async function resolveDuplicateImages(batchId, items) {
  const groups = duplicateImageGroups(items);
  const duplicateItems = groups.flatMap((group) => group.slice(1));
  if (!duplicateItems.length) {
    return { items, duplicateCount: 0, excluded: false };
  }

  const examples = groups.slice(0, 3).map((group) => {
    const copies = group.slice(1, 4).map((item) => `  ↳ ${item.relativePath}`).join("\n");
    const remaining = group.length > 4 ? `\n  외 ${group.length - 4}개` : "";
    return `${group[0].relativePath}\n${copies}${remaining}`;
  }).join("\n\n");
  const moreGroups = groups.length > 3 ? `\n\n외 ${groups.length - 3}개 중복 묶음` : "";
  const exclude = window.confirm(
    `같은 영상 ${duplicateItems.length}개를 찾았습니다.\n\n${examples}${moreGroups}`
    + "\n\n[확인] 중복을 제외하고 불러오기\n[취소] 무시하고 모두 불러오기",
  );
  if (!exclude) {
    return { items, duplicateCount: duplicateItems.length, excluded: false };
  }

  const duplicateIds = duplicateItems.map((item) => item.itemId);
  await api(`api/batches/${batchId}/remove-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemIds: duplicateIds }),
  });
  const removedIds = new Set(duplicateIds);
  return {
    items: items.filter((item) => !removedIds.has(item.itemId)),
    duplicateCount: duplicateItems.length,
    excluded: true,
  };
}

function cancelImport() {
  if (!state.importTask) return;
  state.importTask.cancelled = true;
  state.importTask.controllers.forEach((controller) => controller.abort());
  state.importTask = null;
  $("#import-progress").classList.add("hidden");
}

async function uploadEntries(entries, sourceType, label) {
  cancelImport();
  clearError();
  setImportSummary();
  if (!entries.length) {
    showError("선택한 항목에 .dcm 또는 .dicom 파일이 없습니다.");
    return;
  }
  const skipped = entries.filter((entry) => entry.file.size > 512 * 1024 * 1024);
  entries = entries.filter((entry) => entry.file.size <= 512 * 1024 * 1024);
  if (!entries.length) {
    resetBatch({
      batchId: null,
      label,
      sourceType,
      items: skipped.map((entry, index) => ({
        itemId: null,
        relativePath: entry.relativePath,
        contentHash: null,
        imageHash: null,
        error: "파일당 최대 크기 512MB를 초과했습니다.",
        savedSettings: null,
        roiCount: 0,
        localErrorId: `oversize-${index}`,
      })),
    });
    showError("모든 파일이 512MB 제한을 초과했습니다.");
    return;
  }

  updateImportProgress(0, entries.length, `${entries.length}개 파일 준비 중`);
  const task = { cancelled: false, controllers: new Set() };
  state.importTask = task;
  let uploadedItems = [];
  let completed = 0;
  try {
    const createResponse = await api("api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceType, label }),
    });
    const batch = await createResponse.json();
    resetBatch(batch);
    await refreshSavedBatches(batch.batchId);
    const chunks = makeUploadChunks(entries);
    let nextChunk = 0;

    async function worker() {
      while (!task.cancelled) {
        const chunkIndex = nextChunk++;
        if (chunkIndex >= chunks.length) return;
        const chunk = chunks[chunkIndex];
        const formData = new FormData();
        chunk.forEach((entry) => {
          formData.append("files", entry.file, entry.file.name);
          formData.append("relativePaths", entry.relativePath);
        });
        const controller = new AbortController();
        task.controllers.add(controller);
        try {
          const response = await api(`api/batches/${batch.batchId}/files`, {
            method: "POST",
            body: formData,
            signal: controller.signal,
          });
          const result = await response.json();
          uploadedItems.push(...result.items);
          completed += chunk.length;
          updateImportProgress(completed, entries.length, `${completed}/${entries.length}개 불러옴`);
        } finally {
          task.controllers.delete(controller);
        }
      }
    }

    const workerResults = await Promise.allSettled(
      Array.from({ length: Math.min(3, chunks.length) }, () => worker()),
    );
    const failure = workerResults.find(
      (result) => result.status === "rejected" && result.reason?.name !== "AbortError",
    );
    if (failure) throw failure.reason;
    uploadedItems.sort((a, b) => a.relativePath.localeCompare(b.relativePath, "ko"));
    const duplicateResult = await resolveDuplicateImages(batch.batchId, uploadedItems);
    state.items = duplicateResult.items;
    if (skipped.length) {
      state.items.push(...skipped.map((entry, index) => ({
        itemId: null,
        relativePath: entry.relativePath,
        contentHash: null,
        imageHash: null,
        error: "파일당 최대 크기 512MB를 초과했습니다.",
        savedSettings: null,
        roiCount: 0,
        localErrorId: `oversize-${index}`,
      })));
    }
    renderFileList();
    const first = state.items.find((item) => item.itemId && !item.error);
    if (first) await selectItem(first.itemId);
    if (duplicateResult.duplicateCount) {
      const loadedCount = state.items.filter((item) => item.itemId && !item.error).length;
      setImportSummary(
        duplicateResult.excluded
          ? `동일 영상 ${duplicateResult.duplicateCount}개를 제외하고 ${loadedCount}개를 불러왔습니다.`
          : `동일 영상 ${duplicateResult.duplicateCount}개를 포함해 ${loadedCount}개를 모두 불러왔습니다.`,
      );
    }
    await refreshSavedBatches(batch.batchId);
    if (task.cancelled) showError(`불러오기를 취소했습니다. 완료된 ${completed}개 파일은 목록에 유지됩니다.`);
  } catch (error) {
    task.cancelled = true;
    task.controllers.forEach((controller) => controller.abort());
    if (error.name !== "AbortError") showError(error.message);
  } finally {
    if (state.importTask === task) state.importTask = null;
    $("#import-progress").classList.add("hidden");
  }
}

async function saveCurrentSettings() {
  if (!state.selectedItem || !state.source) return;
  storeCurrentDraft();
  const button = $("#save-settings");
  button.disabled = true;
  button.textContent = "저장 중…";
  clearError();
  try {
    const response = await api(`api/items/${state.selectedItem.itemId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentSettings()),
    });
    const result = await response.json();
    state.items.forEach((item) => {
      if (item.contentHash === result.contentHash) item.savedSettings = clone(result.savedSettings);
    });
    state.drafts.set(state.selectedItem.itemId, clone(result.savedSettings));
    renderFileList();
    button.textContent = "저장 완료 ✓";
    setTimeout(() => { button.textContent = "현재 파일 설정 저장"; }, 1200);
  } catch (error) {
    showError(error.message);
    button.textContent = "현재 파일 설정 저장";
  } finally {
    button.disabled = false;
  }
}

function filenameFromResponse(response, fallback) {
  const disposition = response.headers.get("Content-Disposition") || "";
  const encoded = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encoded) return decodeURIComponent(encoded[1]);
  const plain = disposition.match(/filename="?([^";]+)"?/i);
  return plain ? plain[1] : fallback;
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadItem(item, format) {
  if (!item.itemId || item.error) return;
  const settings = {
    ...effectiveItemSettings(item),
    format,
    jpegQuality: Number($("#jpeg-quality").value),
  };
  setBusy(true, `${format} 컬러 결과를 변환하고 있습니다`);
  clearError();
  try {
    const response = await api(`api/items/${item.itemId}/download`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const extension = settings.format.toLowerCase();
    saveBlob(await response.blob(), filenameFromResponse(response, `dicom-result.${extension}`));
  } catch (error) {
    showError(error.message);
  } finally {
    setBusy(false);
  }
}

function createRegionId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `roi-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function roiColor(label) {
  if (ROI_LABEL_COLORS[label]) return ROI_LABEL_COLORS[label];
  const hash = [...String(label)].reduce(
    (value, character) => ((value * 31) + character.codePointAt(0)) >>> 0,
    0,
  );
  return ROI_CUSTOM_COLORS[hash % ROI_CUSTOM_COLORS.length];
}

function populateRoiLabels(labels, preferred = null) {
  state.roi.labels = [...labels];
  const select = $("#roi-label");
  const selected = preferred || select.value || labels[0];
  select.innerHTML = "";
  labels.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    select.appendChild(option);
  });
  select.value = labels.includes(selected) ? selected : labels[0];
  $("#rename-roi-label").disabled = !select.value;
}

async function addRoiLabel() {
  if (!state.roi.open) return;
  const name = window.prompt("추가할 ROI 라벨 이름을 입력해 주세요.");
  if (name === null) return;
  try {
    const response = await api("api/roi-labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const result = await response.json();
    populateRoiLabels(result.labels, result.added);
    updateRoiStatus(`‘${result.added}’ 라벨을 추가했습니다.`);
    drawRoiCanvas();
  } catch (error) {
    updateRoiStatus(error.message);
  }
}

async function renameRoiLabel() {
  if (!state.roi.open) return;
  const oldName = $("#roi-label").value;
  if (!oldName) return;
  const newName = window.prompt("새 ROI 라벨 이름을 입력해 주세요.", oldName);
  if (newName === null) return;
  try {
    const response = await api("api/roi-labels", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oldName, newName }),
    });
    const result = await response.json();
    state.roi.regions.forEach((region) => {
      if (region.label === result.oldName) region.label = result.newName;
    });
    state.roi.savedRegions.forEach((region) => {
      if (region.label === result.oldName) region.label = result.newName;
    });
    populateRoiLabels(result.labels, result.newName);
    renderRoiRegionList();
    drawRoiCanvas();
    updateRoiStatus(
      result.renamedRegionCount
        ? `라벨 이름 변경 완료 · 저장된 ROI ${result.renamedRegionCount}개 갱신`
        : "라벨 이름을 변경했습니다.",
    );
  } catch (error) {
    updateRoiStatus(error.message);
  }
}

function selectedRoiRegion() {
  return state.roi.regions.find((region) => region.id === state.roi.selectedRegionId) || null;
}

function updateRoiStatus(message = null) {
  const status = $("#roi-save-status");
  if (message) {
    status.textContent = message;
  } else if (state.roi.dirty) {
    status.textContent = "저장되지 않은 ROI 변경 사항이 있습니다.";
  } else if (state.roi.regions.length) {
    status.textContent = `ROI ${state.roi.regions.length}개가 저장되어 있습니다.`;
  } else {
    status.textContent = "저장된 ROI가 없습니다.";
  }
  $("#save-roi").disabled = !state.roi.open || !state.roi.dirty;
  $("#download-roi-via").disabled = state.roi.dirty || state.roi.savedRegions.length === 0;
}

function setRoiDirty(dirty = true) {
  state.roi.dirty = dirty;
  updateRoiStatus();
}

function renderRoiRegionList() {
  const list = $("#roi-region-list");
  list.innerHTML = "";
  state.roi.regions.forEach((region, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `roi-region-row${region.id === state.roi.selectedRegionId ? " selected" : ""}`;
    button.style.setProperty("--roi-color", roiColor(region.label));
    const dot = document.createElement("i");
    const label = document.createElement("span");
    label.textContent = `${index + 1}. ${region.label}`;
    const shape = document.createElement("small");
    shape.textContent = region.shape === "polygon" ? `다각형 · ${region.points.length}점` : "타원";
    button.append(dot, label, shape);
    button.addEventListener("click", () => {
      state.roi.selectedRegionId = region.id;
      state.roi.tool = "select";
      $("#roi-label").value = region.label;
      updateRoiToolButtons();
      renderRoiRegionList();
      drawRoiCanvas();
    });
    list.appendChild(button);
  });
  $("#roi-region-count").textContent = state.roi.regions.length;
  $("#roi-region-empty").classList.toggle("hidden", state.roi.regions.length > 0);
  list.classList.toggle("hidden", state.roi.regions.length === 0);
  $("#roi-empty-hint").classList.toggle(
    "hidden", state.roi.regions.length > 0 || state.roi.polygonDraft.length > 0 || Boolean(state.roi.ellipseDraft),
  );
  $("#roi-delete-region").disabled = !selectedRoiRegion();
}

function updateRoiToolButtons() {
  $$(".roi-tool-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.roiTool === state.roi.tool);
  });
  const stage = $("#roi-canvas-stage");
  stage.classList.remove("tool-select", "tool-polygon", "tool-ellipse", "tool-pan");
  stage.classList.add(`tool-${state.roi.tool}`);
  $("#roi-undo-point").disabled = state.roi.polygonDraft.length === 0;
}

function setRoiTool(tool) {
  if (!["select", "polygon", "ellipse", "pan"].includes(tool)) return;
  if (state.roi.tool !== tool) {
    state.roi.polygonDraft = [];
    state.roi.ellipseDraft = null;
    state.roi.drag = null;
  }
  state.roi.tool = tool;
  $("#roi-canvas-stage").classList.remove("roi-hover-adjust");
  updateRoiToolButtons();
  renderRoiRegionList();
  drawRoiCanvas();
}

function roiCanvasSize() {
  const canvas = $("#roi-canvas");
  const rect = canvas.getBoundingClientRect();
  return { width: rect.width, height: rect.height };
}

function roiTransform() {
  const size = roiCanvasSize();
  return RoiGeometry.computeViewTransform(
    size.width,
    size.height,
    state.roi.columns,
    state.roi.rows,
    state.roi.zoom,
    state.roi.panX,
    state.roi.panY,
  );
}

function eventCanvasPoint(event) {
  const rect = $("#roi-canvas").getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function canvasPointToImage(point, allowOutside = false) {
  const transform = roiTransform();
  const raw = {
    x: (point.x - transform.offsetX) / transform.scale,
    y: (point.y - transform.offsetY) / transform.scale,
  };
  if (!allowOutside && (
    raw.x < 0 || raw.y < 0 || raw.x > state.roi.columns - 1 || raw.y > state.roi.rows - 1
  )) return null;
  return RoiGeometry.canvasToImage(
    point, transform, state.roi.columns, state.roi.rows, true,
  );
}

function resizeRoiCanvas() {
  if (!state.roi.open) return;
  const canvas = $("#roi-canvas");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  drawRoiCanvas();
}

function rgbaColor(hex, alpha) {
  const value = hex.replace("#", "");
  const number = Number.parseInt(value, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${number & 255}, ${alpha})`;
}

function drawRegion(ctx, region, transform, selected = false) {
  const color = roiColor(region.label);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = rgbaColor(color, selected ? 0.2 : 0.12);
  ctx.lineWidth = selected ? 2.5 : 1.5;
  ctx.beginPath();
  if (region.shape === "polygon") {
    region.points.forEach(([x, y], index) => {
      const point = RoiGeometry.imageToCanvas({ x, y }, transform);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
  } else {
    const center = RoiGeometry.imageToCanvas({ x: region.cx, y: region.cy }, transform);
    ctx.ellipse(center.x, center.y, region.rx * transform.scale, region.ry * transform.scale, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  if (selected) {
    const handles = region.shape === "polygon"
      ? region.points.map(([x, y]) => ({ x, y }))
      : [
        { x: region.cx, y: region.cy },
        { x: region.cx + region.rx, y: region.cy },
        { x: region.cx, y: region.cy - region.ry },
      ];
    handles.forEach((handle, index) => {
      const point = RoiGeometry.imageToCanvas(handle, transform);
      ctx.beginPath();
      ctx.fillStyle = index === 0 && region.shape === "ellipse" ? "#ffffff" : color;
      ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
      ctx.lineWidth = 1;
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });
  }
  ctx.restore();
}

function drawRoiCanvas() {
  if (!state.roi.open) return;
  const canvas = $("#roi-canvas");
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050607";
  ctx.fillRect(0, 0, width, height);
  if (!state.roi.image) return;

  const transform = roiTransform();
  ctx.imageSmoothingEnabled = state.roi.smoothing;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    state.roi.image,
    transform.offsetX,
    transform.offsetY,
    state.roi.columns * transform.scale,
    state.roi.rows * transform.scale,
  );

  state.roi.regions.forEach((region) => {
    drawRegion(ctx, region, transform, region.id === state.roi.selectedRegionId);
  });

  if (state.roi.polygonDraft.length) {
    const color = roiColor($("#roi-label").value);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.roi.polygonDraft.forEach(([x, y], index) => {
      const point = RoiGeometry.imageToCanvas({ x, y }, transform);
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();
    state.roi.polygonDraft.forEach(([x, y], index) => {
      const point = RoiGeometry.imageToCanvas({ x, y }, transform);
      ctx.beginPath();
      ctx.arc(point.x, point.y, index === 0 ? 6 : 4, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  if (state.roi.ellipseDraft) {
    drawRegion(ctx, state.roi.ellipseDraft, transform, true);
  }
  $("#roi-zoom-value").textContent = `${Math.round(state.roi.zoom * 100)}%`;
}

function finishPolygonDraft() {
  const uniquePoints = new Set(state.roi.polygonDraft.map((point) => point.join(",")));
  if (state.roi.polygonDraft.length < 3 || uniquePoints.size < 3) {
    updateRoiStatus("다각형에는 서로 다른 꼭짓점이 3개 이상 필요합니다.");
    return;
  }
  const region = {
    id: createRegionId(),
    shape: "polygon",
    label: $("#roi-label").value,
    points: clone(state.roi.polygonDraft),
  };
  state.roi.regions.push(region);
  state.roi.selectedRegionId = region.id;
  state.roi.polygonDraft = [];
  setRoiDirty(true);
  updateRoiToolButtons();
  renderRoiRegionList();
  drawRoiCanvas();
}

function deleteSelectedRoi() {
  if (!state.roi.selectedRegionId) return;
  state.roi.regions = state.roi.regions.filter(
    (region) => region.id !== state.roi.selectedRegionId,
  );
  state.roi.selectedRegionId = null;
  setRoiDirty(true);
  renderRoiRegionList();
  drawRoiCanvas();
}

function selectedHandleAt(canvasPoint) {
  const region = selectedRoiRegion();
  if (!region) return null;
  const transform = roiTransform();
  if (region.shape === "polygon") {
    for (let index = 0; index < region.points.length; index += 1) {
      const [x, y] = region.points[index];
      const point = RoiGeometry.imageToCanvas({ x, y }, transform);
      if (RoiGeometry.distance(point, canvasPoint) <= 9) return { type: "vertex", index };
    }
    return null;
  }
  const handles = [
    { type: "ellipse-center", point: { x: region.cx, y: region.cy } },
    { type: "ellipse-rx", point: { x: region.cx + region.rx, y: region.cy } },
    { type: "ellipse-ry", point: { x: region.cx, y: region.cy - region.ry } },
  ];
  return handles.find((handle) => (
    RoiGeometry.distance(RoiGeometry.imageToCanvas(handle.point, transform), canvasPoint) <= 9
  )) || null;
}

function canAdjustExistingRoi() {
  return state.roi.tool === "select"
    || state.roi.tool === "ellipse"
    || (state.roi.tool === "polygon" && state.roi.polygonDraft.length === 0);
}

function hitTestRegion(imagePoint, canvasPoint = null) {
  const transform = canvasPoint ? roiTransform() : null;
  for (let index = state.roi.regions.length - 1; index >= 0; index -= 1) {
    const region = state.roi.regions[index];
    if (region.shape === "polygon") {
      const points = region.points.map(([x, y]) => ({ x, y }));
      if (RoiGeometry.pointInPolygon(imagePoint, points)) return region;
      if (canvasPoint) {
        const canvasPoints = points.map((point) => RoiGeometry.imageToCanvas(point, transform));
        const onBoundary = canvasPoints.some((point, pointIndex) => (
          RoiGeometry.distanceToSegment(
            canvasPoint,
            point,
            canvasPoints[(pointIndex + 1) % canvasPoints.length],
          ) <= 8
        ));
        if (onBoundary) return region;
      }
    } else {
      const dx = (imagePoint.x - region.cx) / region.rx;
      const dy = (imagePoint.y - region.cy) / region.ry;
      if (dx * dx + dy * dy <= 1) return region;
      if (canvasPoint) {
        const tolerance = 8 / Math.max(transform.scale, Number.EPSILON);
        const expandedDx = (imagePoint.x - region.cx) / (region.rx + tolerance);
        const expandedDy = (imagePoint.y - region.cy) / (region.ry + tolerance);
        if (expandedDx * expandedDx + expandedDy * expandedDy <= 1) return region;
      }
    }
  }
  return null;
}

function updateRoiHoverState(canvasPoint, imagePoint) {
  const stage = $("#roi-canvas-stage");
  const canAdjust = !state.roi.drag && imagePoint && canAdjustExistingRoi();
  const overExisting = canAdjust && (
    Boolean(selectedHandleAt(canvasPoint))
    || Boolean(hitTestRegion(imagePoint, canvasPoint))
  );
  stage.classList.toggle("roi-hover-adjust", Boolean(overExisting));
}

function handleRoiPointerDown(event) {
  if (!state.roi.open || !state.roi.image) return;
  event.preventDefault();
  const canvas = $("#roi-canvas");
  const canvasPoint = eventCanvasPoint(event);
  const imagePoint = canvasPointToImage(canvasPoint);
  $("#roi-canvas-stage").focus({ preventScroll: true });
  canvas.setPointerCapture(event.pointerId);

  if (state.roi.tool === "pan") {
    state.roi.drag = {
      type: "pan",
      start: canvasPoint,
      panX: state.roi.panX,
      panY: state.roi.panY,
    };
    $("#roi-canvas-stage").classList.add("is-panning");
    return;
  }
  if (!imagePoint) return;

  const canAdjust = canAdjustExistingRoi();
  if (canAdjust) {
    const handle = selectedHandleAt(canvasPoint);
    if (handle) {
      state.roi.drag = { ...handle, regionId: state.roi.selectedRegionId };
      $("#roi-canvas-stage").classList.add("is-moving");
      return;
    }
  }
  const hit = canAdjust ? hitTestRegion(imagePoint, canvasPoint) : null;
  if (hit) {
    state.roi.selectedRegionId = hit.id;
    $("#roi-label").value = hit.label;
    state.roi.drag = {
      type: "region-move",
      regionId: hit.id,
      start: imagePoint,
      original: clone(hit),
      moved: false,
    };
    $("#roi-canvas-stage").classList.add("is-moving");
    updateRoiToolButtons();
    renderRoiRegionList();
    drawRoiCanvas();
    return;
  }

  if (state.roi.tool === "polygon") {
    if (state.roi.polygonDraft.length >= 3) {
      const first = RoiGeometry.imageToCanvas(
        { x: state.roi.polygonDraft[0][0], y: state.roi.polygonDraft[0][1] }, roiTransform(),
      );
      if (RoiGeometry.distance(first, canvasPoint) <= 10) {
        finishPolygonDraft();
        return;
      }
    }
    const previous = state.roi.polygonDraft.at(-1);
    if (!previous || previous[0] !== imagePoint.x || previous[1] !== imagePoint.y) {
      state.roi.polygonDraft.push([imagePoint.x, imagePoint.y]);
    }
    updateRoiToolButtons();
    renderRoiRegionList();
    drawRoiCanvas();
    return;
  }

  if (state.roi.tool === "ellipse") {
    const center = {
      x: RoiGeometry.clamp(imagePoint.x, 1, Math.max(1, state.roi.columns - 2)),
      y: RoiGeometry.clamp(imagePoint.y, 1, Math.max(1, state.roi.rows - 2)),
    };
    state.roi.ellipseDraft = {
      id: "ellipse-draft",
      shape: "ellipse",
      label: $("#roi-label").value,
      cx: center.x,
      cy: center.y,
      rx: 1,
      ry: 1,
    };
    state.roi.drag = { type: "ellipse-create", center };
    drawRoiCanvas();
    return;
  }

  state.roi.selectedRegionId = null;
  renderRoiRegionList();
  drawRoiCanvas();
}

function handleRoiPointerMove(event) {
  if (!state.roi.open || !state.roi.image) return;
  const canvasPoint = eventCanvasPoint(event);
  const hoverPoint = canvasPointToImage(canvasPoint);
  $("#roi-coordinate").textContent = hoverPoint
    ? `X ${hoverPoint.x} · Y ${hoverPoint.y}`
    : "X — · Y —";
  updateRoiHoverState(canvasPoint, hoverPoint);
  if (!state.roi.drag) return;
  event.preventDefault();

  if (state.roi.drag.type === "pan") {
    state.roi.panX = state.roi.drag.panX + canvasPoint.x - state.roi.drag.start.x;
    state.roi.panY = state.roi.drag.panY + canvasPoint.y - state.roi.drag.start.y;
    drawRoiCanvas();
    return;
  }
  const imagePoint = canvasPointToImage(canvasPoint, true);
  const region = state.roi.regions.find((candidate) => candidate.id === state.roi.drag.regionId);
  if (state.roi.drag.type === "ellipse-create") {
    const center = state.roi.drag.center;
    state.roi.ellipseDraft.rx = Math.max(
      1,
      Math.min(Math.abs(imagePoint.x - center.x), center.x, state.roi.columns - 1 - center.x),
    );
    state.roi.ellipseDraft.ry = Math.max(
      1,
      Math.min(Math.abs(imagePoint.y - center.y), center.y, state.roi.rows - 1 - center.y),
    );
    drawRoiCanvas();
    return;
  }
  if (!region) return;
  if (state.roi.drag.type === "region-move") {
    const translated = RoiGeometry.translateRegionWithinBounds(
      state.roi.drag.original,
      imagePoint.x - state.roi.drag.start.x,
      imagePoint.y - state.roi.drag.start.y,
      state.roi.columns,
      state.roi.rows,
    );
    Object.assign(region, translated.region);
    if (translated.dx !== 0 || translated.dy !== 0) {
      state.roi.drag.moved = true;
      setRoiDirty(true);
    }
    drawRoiCanvas();
    return;
  }
  if (state.roi.drag.type === "vertex") {
    region.points[state.roi.drag.index] = [imagePoint.x, imagePoint.y];
  } else if (state.roi.drag.type === "ellipse-center") {
    region.cx = RoiGeometry.clamp(imagePoint.x, region.rx, state.roi.columns - 1 - region.rx);
    region.cy = RoiGeometry.clamp(imagePoint.y, region.ry, state.roi.rows - 1 - region.ry);
  } else if (state.roi.drag.type === "ellipse-rx") {
    region.rx = Math.max(
      1,
      Math.min(Math.abs(imagePoint.x - region.cx), region.cx, state.roi.columns - 1 - region.cx),
    );
  } else if (state.roi.drag.type === "ellipse-ry") {
    region.ry = Math.max(
      1,
      Math.min(Math.abs(imagePoint.y - region.cy), region.cy, state.roi.rows - 1 - region.cy),
    );
  }
  setRoiDirty(true);
  drawRoiCanvas();
}

function handleRoiPointerUp(event) {
  const canvas = $("#roi-canvas");
  if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  $("#roi-canvas-stage").classList.remove("is-panning", "is-moving");
  if (state.roi.drag?.type === "ellipse-create" && state.roi.ellipseDraft) {
    const region = { ...state.roi.ellipseDraft, id: createRegionId() };
    if (region.rx > 0 && region.ry > 0) {
      state.roi.regions.push(region);
      state.roi.selectedRegionId = region.id;
      setRoiDirty(true);
    }
    state.roi.ellipseDraft = null;
    updateRoiToolButtons();
    renderRoiRegionList();
  }
  state.roi.drag = null;
  drawRoiCanvas();
}

function changeRoiZoom(multiplier, anchor = null) {
  if (!state.roi.open || !state.roi.image) return;
  const size = roiCanvasSize();
  const point = anchor || { x: size.width / 2, y: size.height / 2 };
  const before = roiTransform();
  const imagePoint = {
    x: (point.x - before.offsetX) / before.scale,
    y: (point.y - before.offsetY) / before.scale,
  };
  state.roi.zoom = RoiGeometry.clamp(state.roi.zoom * multiplier, 0.5, 20);
  const base = RoiGeometry.computeViewTransform(
    size.width, size.height, state.roi.columns, state.roi.rows, state.roi.zoom, 0, 0,
  );
  state.roi.panX = point.x - base.offsetX - imagePoint.x * base.scale;
  state.roi.panY = point.y - base.offsetY - imagePoint.y * base.scale;
  drawRoiCanvas();
}

function fitRoiCanvas() {
  state.roi.zoom = 1;
  state.roi.panX = 0;
  state.roi.panY = 0;
  drawRoiCanvas();
}

function closeRoiEditor(force = false) {
  if (!state.roi.open) return;
  if (!force && state.roi.dirty && !window.confirm("저장하지 않은 ROI 변경 사항을 버리고 닫을까요?")) return;
  state.roi.open = false;
  state.roi.loadSequence += 1;
  state.roi.image = null;
  state.roi.drag = null;
  state.roi.polygonDraft = [];
  state.roi.ellipseDraft = null;
  $("#roi-canvas-stage").classList.remove("is-panning", "is-moving", "roi-hover-adjust");
  $("#roi-modal").classList.add("hidden");
  document.body.classList.remove("modal-open");
  $(".app-shell").removeAttribute("aria-hidden");
  $("#open-roi-editor").focus({ preventScroll: true });
}

async function openRoiEditor() {
  if (!state.selectedItem || !state.source || !$("#color-image").classList.contains("ready")) return;
  const itemId = state.selectedItem.itemId;
  const imageSource = $("#color-image").src;
  const sequence = ++state.roi.loadSequence;
  setBusy(true, "저장된 ROI를 불러오고 있습니다");
  clearError();
  try {
    const response = await api(`api/items/${itemId}/annotations`);
    const result = await response.json();
    const image = new Image();
    image.src = imageSource;
    if (image.decode) await image.decode();
    else await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });
    if (sequence !== state.roi.loadSequence || itemId !== state.selectedItem?.itemId) return;

    Object.assign(state.roi, {
      open: true,
      itemId,
      image,
      rows: result.rows,
      columns: result.columns,
      labels: result.labels,
      regions: clone(result.regions),
      savedRegions: clone(result.regions),
      selectedRegionId: null,
      tool: "select",
      polygonDraft: [],
      ellipseDraft: null,
      drag: null,
      zoom: 1,
      panX: 0,
      panY: 0,
      smoothing: true,
      dirty: false,
      colorSettingsSnapshot: clone(currentSettings()),
    });
    populateRoiLabels(result.labels);
    $("#roi-smoothing").checked = true;
    $("#roi-modal-filename").textContent = state.selectedItem.relativePath;
    $("#roi-modal").classList.remove("hidden");
    document.body.classList.add("modal-open");
    $(".app-shell").setAttribute("aria-hidden", "true");
    updateRoiToolButtons();
    renderRoiRegionList();
    updateRoiStatus();
    requestAnimationFrame(() => {
      resizeRoiCanvas();
      $("#roi-canvas-stage").focus({ preventScroll: true });
    });
  } catch (error) {
    showError(error.message || "ROI 편집기를 열지 못했습니다.");
  } finally {
    setBusy(false);
  }
}

async function saveRoiAnnotations() {
  if (!state.roi.open || !state.roi.itemId || !state.roi.dirty) return;
  if (state.roi.polygonDraft.length || state.roi.ellipseDraft) {
    updateRoiStatus("그리는 중인 ROI를 완료하거나 취소한 뒤 저장해 주세요.");
    return;
  }
  const button = $("#save-roi");
  button.disabled = true;
  button.textContent = "저장 중…";
  try {
    const response = await api(`api/items/${state.roi.itemId}/annotations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        regions: state.roi.regions,
        colorSettingsSnapshot: state.roi.colorSettingsSnapshot,
      }),
    });
    const result = await response.json();
    state.roi.regions = clone(result.regions);
    state.roi.savedRegions = clone(result.regions);
    state.roi.dirty = false;
    state.items.forEach((item) => {
      if (item.contentHash === result.contentHash) item.roiCount = result.roiCount;
    });
    if (state.source?.contentHash === result.contentHash) state.source.roiCount = result.roiCount;
    if (state.selectedItem?.contentHash === result.contentHash) {
      state.selectedItem.roiCount = result.roiCount;
      $("#open-roi-editor").textContent = result.roiCount
        ? `ROI 편집 · ${result.roiCount}개`
        : "ROI 라벨링";
    }
    renderFileList();
    renderRoiRegionList();
    updateRoiStatus(`ROI ${result.roiCount}개 저장 완료 ✓`);
    setTimeout(() => {
      if (state.roi.open && !state.roi.dirty) updateRoiStatus();
    }, 1200);
  } catch (error) {
    updateRoiStatus(error.message);
  } finally {
    button.textContent = "ROI 저장";
    button.disabled = !state.roi.dirty;
  }
}

async function downloadCurrentRoiVia() {
  if (!state.roi.itemId || state.roi.dirty || !state.roi.savedRegions.length) return;
  setBusy(true, "VIA JSON을 준비하고 있습니다");
  try {
    const response = await api(`api/items/${state.roi.itemId}/annotations/via`);
    saveBlob(await response.blob(), filenameFromResponse(response, "roi_via.json"));
  } catch (error) {
    updateRoiStatus(error.message);
  } finally {
    setBusy(false);
  }
}

function updateBatchJob(job) {
  const fraction = job.totalFiles ? job.processedFiles / job.totalFiles : 0;
  const percent = job.status === "completed" ? 100 : Math.min(99, Math.round(fraction * 100));
  $("#batch-job").classList.remove("hidden");
  $("#batch-progress-bar").value = percent;
  $("#batch-percent").textContent = `${percent}%`;
  $("#batch-message").textContent = job.message;
  $("#batch-current").textContent = job.currentFile || "";
  const active = ["queued", "running"].includes(job.status);
  state.batchJobActive = active;
  $("#cancel-batch").classList.toggle("hidden", !active);
  $("#download-batch-result").classList.toggle("hidden", !job.downloadReady);
  const format = job.format || state.batchFormat || "PNG";
  state.batchFormat = format;
  $("#download-batch-result").textContent = `${format} ZIP 다운로드`;
  $$(".batch-start-button").forEach((button) => { button.disabled = active; });
  $("#start-batch-via").disabled = active || !state.items.some(
    (item) => item.itemId && !item.error && Number(item.roiCount) > 0,
  );
  ["#upload-files", "#upload-folder"].forEach((selector) => {
    $(selector).disabled = active;
  });
  $$('input[name="sourceType"]').forEach((input) => { input.disabled = active; });
}

async function pollBatchJob() {
  if (!state.batchJobId) return;
  try {
    const response = await api(`api/export-jobs/${state.batchJobId}`);
    const job = await response.json();
    updateBatchJob(job);
    if (["queued", "running"].includes(job.status)) {
      state.batchPollTimer = setTimeout(pollBatchJob, 600);
    } else if (job.status === "failed") {
      showError(job.error || job.message);
    }
  } catch (error) {
    showError(error.message);
  }
}

async function startBatchExport(format) {
  if (!state.batch) return;
  storeCurrentDraft();
  clearError();
  state.batchJobActive = true;
  $$(".batch-start-button").forEach((button) => { button.disabled = true; });
  try {
    const fallback = state.selectedItem && state.source ? currentSettings() : clone(DEFAULT_SETTINGS);
    const jpegQuality = Number($("#jpeg-quality").value);
    fallback.format = format;
    fallback.jpegQuality = jpegQuality;
    const response = await api("api/export-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        batchId: state.batch.batchId,
        jobType: "images",
        scope: selectedRadio("batchScope"),
        format,
        jpegQuality,
        fallbackSettings: fallback,
      }),
    });
    const job = await response.json();
    state.batchJobId = job.jobId;
    state.batchFormat = format;
    updateBatchJob(job);
    pollBatchJob();
  } catch (error) {
    state.batchJobActive = false;
    showError(error.message);
    renderFileList();
  }
}

async function startViaExport() {
  if (!state.batch || state.batchJobActive) return;
  clearError();
  state.batchJobActive = true;
  $$(".batch-start-button").forEach((button) => { button.disabled = true; });
  $("#start-batch-via").disabled = true;
  try {
    const response = await api("api/export-jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: state.batch.batchId, jobType: "via" }),
    });
    const job = await response.json();
    state.batchJobId = job.jobId;
    state.batchFormat = "VIA";
    updateBatchJob(job);
    pollBatchJob();
  } catch (error) {
    state.batchJobActive = false;
    showError(error.message);
    renderFileList();
  }
}

async function cancelBatchExport() {
  if (!state.batchJobId) return;
  try {
    const response = await api(`api/export-jobs/${state.batchJobId}`, { method: "DELETE" });
    updateBatchJob(await response.json());
  } catch (error) {
    showError(error.message);
  }
}

function bindEvents() {
  $("#auth-form").addEventListener("submit", handleAuthSubmit);
  $("#auth-toggle").addEventListener("click", () => {
    updateAuthMode(state.authMode === "login" ? "register" : "login");
  });
  $("#logout").addEventListener("click", logout);
  $("#saved-batches").addEventListener("change", updateSavedBatchButtons);
  $("#open-saved-batch").addEventListener("click", () => openSavedBatch($("#saved-batches").value));
  $("#delete-saved-batch").addEventListener("click", deleteSavedBatch);
  $$('input[name="sourceType"]').forEach((input) => input.addEventListener("change", updateSourceControls));
  $$('input[name="batchScope"]').forEach((input) => input.addEventListener("change", updateBatchScopeHelp));
  $("#upload-files").addEventListener("change", (event) => {
    const entries = [...event.target.files]
      .filter((file) => /\.(dcm|dicom)$/i.test(file.name))
      .map((file) => ({ file, relativePath: file.name }));
    uploadEntries(entries, "upload", `선택 파일 ${entries.length}개`);
    event.target.value = "";
  });
  $("#upload-folder").addEventListener("change", (event) => {
    const allFiles = [...event.target.files];
    const entries = allFiles
      .filter((file) => /\.(dcm|dicom)$/i.test(file.name))
      .map((file) => ({ file, relativePath: file.webkitRelativePath || file.name }));
    const root = entries[0]?.relativePath.split("/")[0] || "선택 폴더";
    uploadEntries(entries, "folder", root);
    event.target.value = "";
  });
  $("#cancel-import").addEventListener("click", cancelImport);
  $("#file-search").addEventListener("input", renderFileList);
  $("#status-filter").addEventListener("change", renderFileList);

  $("#normalization").addEventListener("change", () => {
    updateNormalizationControls();
    storeCurrentDraft();
    renderFileList();
    scheduleRender(0);
  });
  $("#manual-bounds").addEventListener("change", () => {
    updateNormalizationControls();
    storeCurrentDraft();
    renderFileList();
    scheduleRender(0);
  });
  const renderInputs = [
    "#colormap", "#invert-grayscale", "#gamma", "#background-threshold",
    "#lower-bound", "#upper-bound", "#lower-percentile", "#upper-percentile",
    "#log-strength", "#window-center", "#window-width",
  ];
  renderInputs.forEach((selector) => {
    $(selector).addEventListener("input", () => {
      updateRangeOutputs();
      storeCurrentDraft();
      scheduleFileListRender();
      scheduleRender();
    });
    $(selector).addEventListener("change", () => scheduleRender(0));
  });
  $("#jpeg-quality").addEventListener("input", () => {
    updateRangeOutputs();
  });
  $("#save-settings").addEventListener("click", saveCurrentSettings);
  $("#open-roi-editor").addEventListener("click", openRoiEditor);
  $("#start-batch-png").addEventListener("click", () => startBatchExport("PNG"));
  $("#start-batch-jpg").addEventListener("click", () => startBatchExport("JPG"));
  $("#start-batch-via").addEventListener("click", startViaExport);
  $("#cancel-batch").addEventListener("click", cancelBatchExport);
  $("#download-batch-result").addEventListener("click", () => {
    if (state.batchJobId) {
      $("#download-batch-result").classList.add("hidden");
      $("#batch-message").textContent = `${state.batchFormat || "변환"} ZIP 다운로드를 시작했습니다.`;
      window.location.href = `api/export-jobs/${state.batchJobId}/download`;
    }
  });

  $$(".roi-tool-button").forEach((button) => {
    button.addEventListener("click", () => setRoiTool(button.dataset.roiTool));
  });
  $("#roi-label").addEventListener("change", () => {
    const region = selectedRoiRegion();
    if (state.roi.tool === "select" && region && region.label !== $("#roi-label").value) {
      region.label = $("#roi-label").value;
      setRoiDirty(true);
      renderRoiRegionList();
    }
    if (state.roi.ellipseDraft) state.roi.ellipseDraft.label = $("#roi-label").value;
    drawRoiCanvas();
  });
  $("#add-roi-label").addEventListener("click", addRoiLabel);
  $("#rename-roi-label").addEventListener("click", renameRoiLabel);
  $("#roi-undo-point").addEventListener("click", () => {
    state.roi.polygonDraft.pop();
    updateRoiToolButtons();
    renderRoiRegionList();
    drawRoiCanvas();
  });
  $("#roi-delete-region").addEventListener("click", deleteSelectedRoi);
  $("#roi-zoom-out").addEventListener("click", () => changeRoiZoom(1 / 1.2));
  $("#roi-zoom-in").addEventListener("click", () => changeRoiZoom(1.2));
  $("#roi-fit").addEventListener("click", fitRoiCanvas);
  $("#roi-smoothing").addEventListener("change", (event) => {
    state.roi.smoothing = event.target.checked;
    drawRoiCanvas();
  });
  $("#roi-canvas").addEventListener("pointerdown", handleRoiPointerDown);
  $("#roi-canvas").addEventListener("pointermove", handleRoiPointerMove);
  $("#roi-canvas").addEventListener("pointerup", handleRoiPointerUp);
  $("#roi-canvas").addEventListener("pointercancel", handleRoiPointerUp);
  $("#roi-canvas").addEventListener("pointerleave", () => {
    if (!state.roi.drag) $("#roi-canvas-stage").classList.remove("roi-hover-adjust");
  });
  $("#roi-canvas").addEventListener("dblclick", (event) => {
    if (state.roi.tool === "polygon") {
      event.preventDefault();
      finishPolygonDraft();
    }
  });
  $("#roi-canvas").addEventListener("wheel", (event) => {
    if (!state.roi.open) return;
    event.preventDefault();
    changeRoiZoom(event.deltaY < 0 ? 1.15 : 1 / 1.15, eventCanvasPoint(event));
  }, { passive: false });
  $("#roi-canvas-stage").addEventListener("keydown", (event) => {
    if (event.key === "Enter" && state.roi.polygonDraft.length) {
      event.preventDefault();
      finishPolygonDraft();
    } else if (event.key === "Escape") {
      event.preventDefault();
      state.roi.polygonDraft = [];
      state.roi.ellipseDraft = null;
      state.roi.drag = null;
      updateRoiToolButtons();
      renderRoiRegionList();
      drawRoiCanvas();
    } else if (event.key === "Backspace" && state.roi.polygonDraft.length) {
      event.preventDefault();
      state.roi.polygonDraft.pop();
      updateRoiToolButtons();
      renderRoiRegionList();
      drawRoiCanvas();
    } else if (event.key === "Delete" && selectedRoiRegion()) {
      event.preventDefault();
      deleteSelectedRoi();
    }
  });
  $("#close-roi-editor").addEventListener("click", () => closeRoiEditor());
  $("#cancel-roi-editor").addEventListener("click", () => closeRoiEditor());
  $("#save-roi").addEventListener("click", saveRoiAnnotations);
  $("#download-roi-via").addEventListener("click", downloadCurrentRoiVia);
  $("#roi-modal").addEventListener("pointerdown", (event) => {
    if (event.target === $("#roi-modal")) closeRoiEditor();
  });
  window.addEventListener("keydown", (event) => {
    if (state.roi.open && event.key === "Escape" && document.activeElement !== $("#roi-canvas-stage")) {
      closeRoiEditor();
    }
  });
  window.addEventListener("beforeunload", (event) => {
    const hasUnsavedSettings = state.items.some((item) => itemStatus(item) === "modified");
    if (!state.roi.dirty && !hasUnsavedSettings) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

async function initialize() {
  bindEvents();
  state.roi.resizeObserver = new ResizeObserver(resizeRoiCanvas);
  state.roi.resizeObserver.observe($("#roi-canvas-stage"));
  updateSourceControls();
  updateBatchScopeHelp();
  updateNormalizationControls();
  updateRangeOutputs();
  renderFileList();
  updateAuthMode("login");
  try {
    const response = await api("api/auth/me");
    await enterWorkspace((await response.json()).user);
  } catch (_) {
    showAuthScreen();
  }
}

initialize();
