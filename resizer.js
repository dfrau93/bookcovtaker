const video = document.getElementById("video");
const frame = document.getElementById("frame");
const captureBtn = document.getElementById("capture-btn");
const downloadLink = document.getElementById("download-link");
//const resultImg = document.getElementById("result");
const hiresImg = document.getElementById("hires-img");
const outputImg = document.getElementById("output-img");
const modeButtons = document.querySelectorAll(".mode-btn");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let currentMode = "1front"; // default mode

// Sizes in cm (width x height for display and final output)
const sizeCm = {
  "1front": { width: 1.6, height: 2.1 },
  "2spine": { width: 0.3, height: 2.1 },
  "3back": { width: 1.6, height: 2.1 }
};

const DPI_OUTPUT = 96; // final output DPI
const FRAME_SCALE = 13.5;  // visual frame is 2x larger for user alignment

function cmToPx(cm) {
  var n = 3; // use 3 digits after decimal point (1mm resolution)
  var cpi = 2.54; // centimeters per inch
  var dpi = DPI_OUTPUT; // dots per inch
  var ppd = window.devicePixelRatio; // pixels per dot
  return Math.round((dpi * cm) / 2.54);
  //return Math.round((cm / 2.54) * (dpi*window.devicePixelRatio));
}

// Set frame size visually scaled for easier alignment
function updateFrame() {
  if (!video.videoWidth || !video.videoHeight) return;

  const videoCSSWidth = video.clientWidth;
  const videoCSSHeight = video.clientHeight;

  const { width, height } = sizeCm[currentMode];
  const frameWidthPx = cmToPx(width) * FRAME_SCALE;
  const frameHeightPx = cmToPx(height) * FRAME_SCALE;

  const widthRatio = frameWidthPx / video.videoWidth;
  const heightRatio = frameHeightPx / video.videoHeight;

  const frameCSSWidth = widthRatio * videoCSSWidth;
  const frameCSSHeight = heightRatio * videoCSSHeight;

  frame.style.width = `${frameCSSWidth}px`;
  frame.style.height = `${frameCSSHeight}px`;
}

// Capture exactly what is inside the frame, then scale it to output size

function captureImage() {
  if (!video.videoWidth || !video.videoHeight) {
    alert("Camera not ready.");
    return;
  }

  const captureW = cmToPx(sizeCm[currentMode].width) * FRAME_SCALE;
  const captureH = cmToPx(sizeCm[currentMode].height) * FRAME_SCALE;

  const cropX = 0;
  const cropY = 0;

  // High-res cropped image
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = captureW;
  cropCanvas.height = captureH;
  const cropCtx = cropCanvas.getContext("2d");

  cropCtx.drawImage(
    video,
    cropX, cropY, captureW, captureH,
    0, 0, captureW, captureH
  );

  const hiresDataURL = cropCanvas.toDataURL("image/png");
  hiresImg.src = hiresDataURL;

  // Resize to final output size
  const outputW = cmToPx(sizeCm[currentMode].width);
  const outputH = cmToPx(sizeCm[currentMode].height);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputW;
  outputCanvas.height = outputH;

  const outputCtx = outputCanvas.getContext("2d");
  outputCtx.drawImage(cropCanvas, 0, 0, captureW, captureH, 0, 0, outputW, outputH);

  outputImg.src = outputCanvas.toDataURL("image/png");
  downloadLink.href = outputImg.src;
  downloadLink.download = `${currentMode}_cover.png`;
  downloadLink.style.display = "inline-block";
}

// Switch modes (front/spine/back)
function updateModeUI() {
  modeButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === currentMode);
  });
  captureBtn.disabled = !video.srcObject;
  updateFrame();
}

modeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentMode = btn.dataset.mode;
    updateModeUI();
  });
});

captureBtn.addEventListener("click", captureImage);

// Start camera and update frame when ready
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment",
        width: { ideal: 1920 }, // improve quality
        height: { ideal: 1080 }
      }
    });
    video.srcObject = stream;

    video.addEventListener("loadedmetadata", () => {
      updateFrame();
      captureBtn.disabled = false;
    });
  } catch (e) {
    alert("Could not start camera: " + e.message);
  }
}

startCamera();
updateModeUI();
