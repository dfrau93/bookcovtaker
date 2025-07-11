const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const resultImg = document.getElementById("result");
const downloadLink = document.getElementById("download-link");
const modeButtons = document.querySelectorAll(".mode-btn");
const cutout = document.getElementById("cutout");

let currentMode = "front";

const sizeCm = {
  front: { width: 1.6, height: 2.1 },
  spine: { width: 0.3, height: 2.1 },
  back: { width: 1.6, height: 2.1 }
};

function cmToPx(cm) {
  return Math.round((cm / 2.54) * 300); // 300 DPI for image crop
}

function cmToScreenPx(cm) {
  return Math.round((cm / 2.54) * 96); // 96 DPI for screen display
}

function updateCutout() {
  const container = document.getElementById("camera-container");
  const { width, height } = sizeCm[currentMode];
  const pxW = cmToScreenPx(width);
  const pxH = cmToScreenPx(height);

  // Center cutout in the video container
  cutout.style.width = `${pxW}px`;
  cutout.style.height = `${pxH}px`;
  cutout.style.left = `calc(50% - ${pxW / 2}px)`;
  cutout.style.top = `calc(50% - ${pxH / 2}px)`;
}

function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
    .then(stream => {
      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        updateCutout();
      };
    })
    .catch(err => {
      alert("Error accessing camera: " + err.message);
    });
}

function captureAndResize() {
  const { width, height } = sizeCm[currentMode];
  const cropW = cmToPx(width);
  const cropH = cmToPx(height);

  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext("2d");

  const videoW = video.videoWidth;
  const videoH = video.videoHeight;

  // Find source crop: center of the video feed
  const srcX = videoW / 2 - cropW / 2;
  const srcY = videoH / 2 - cropH / 2;

  ctx.drawImage(video, srcX, srcY, cropW, cropH, 0, 0, cropW, cropH);

  const dataURL = canvas.toDataURL("image/png");
  resultImg.src = dataURL;
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
}

document.getElementById("capture-btn").addEventListener("click", captureAndResize);

modeButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    modeButtons.forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
    currentMode = btn.getAttribute("data-mode");
    updateCutout();
  });
});

startCamera();
