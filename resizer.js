const video = document.getElementById("video");
const frame = document.getElementById("frame");
const captureBtn = document.getElementById("capture-btn");
const downloadLink = document.getElementById("download-link");
const resultImg = document.getElementById("result");
const modeButtons = document.querySelectorAll(".mode-btn");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

let currentMode = "front"; // default mode

// Sizes in cm (width x height for display and final output)
const sizeCm = {
  front: { width: 1.6, height: 2.1 },
  back: { width: 1.6, height: 2.1 },
  spine: { width: 0.3, height: 2.1 }
};

const DPI_OUTPUT = 300; // final output DPI
const FRAME_SCALE = 4.2;  // visual frame is 2x larger for user alignment

function cmToPx(cm, dpi) {
  return Math.round((cm / 2.54) * dpi);
}

// Set frame size visually scaled for easier alignment
function updateFrame() {
  if (!video.videoWidth || !video.videoHeight) return;

  const videoCSSWidth = video.clientWidth;
  const videoCSSHeight = video.clientHeight;

  const { width, height } = sizeCm[currentMode];
  const frameWidthPx = cmToPx(width, DPI_OUTPUT) * FRAME_SCALE;
  const frameHeightPx = cmToPx(height, DPI_OUTPUT) * FRAME_SCALE;

  const widthRatio = frameWidthPx / video.videoWidth;
  const heightRatio = frameHeightPx / video.videoHeight;

  const frameCSSWidth = widthRatio * videoCSSWidth;
  const frameCSSHeight = heightRatio * videoCSSHeight;

  frame.style.width = `${frameCSSWidth}px`;
  frame.style.height = `${frameCSSHeight}px`;
}

// Capture exactly what is inside the frame, then scale it to output size
function captureImage() {
  const videoRect = video.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();

  const relX = (frameRect.left - videoRect.left) / videoRect.width;
  const relY = (frameRect.top - videoRect.top) / videoRect.height;
  const relW = frameRect.width / videoRect.width;
  const relH = frameRect.height / videoRect.height;

  const cropX = relX * video.videoWidth;
  const cropY = relY * video.videoHeight;
  const cropW = relW * video.videoWidth;
  const cropH = relH * video.videoHeight;

  // Final output size (strict dimension)
  const outputW = cmToPx(sizeCm[currentMode].width, DPI_OUTPUT);
  const outputH = cmToPx(sizeCm[currentMode].height, DPI_OUTPUT);

  canvas.width = outputW;
  canvas.height = outputH;

  ctx.drawImage(
    video,
    cropX, cropY, cropW, cropH,
    0, 0, outputW, outputH
  );

  const dataURL = canvas.toDataURL("image/png");
  resultImg.src = dataURL;
  downloadLink.href = dataURL;
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
