const video = document.getElementById('video');
const frame = document.getElementById('frame');
const captureBtn = document.getElementById('capture');
const resultImg = document.getElementById('result');
const canvas = document.getElementById('canvas');
const downloadLink = document.getElementById('download-link');
const modeButtons = document.querySelectorAll('.mode-btn');

const DPI = 300;

// Sizes in cm (width x height), per your request:
const sizeCm = {
  front: { width: 1.6, height: 2.1 },
  spine: { width: 0.3, height: 2.1 },
  back: { width: 1.6, height: 2.1 },
};

// Current mode
let currentMode = 'front';

// Convert cm to px based on DPI
function cmToPx(cm) {
  return Math.round((cm / 2.54) * DPI);
}

// Update frame size/position based on current mode and video container
function updateFrame() {
  const container = video.getBoundingClientRect();

  // Frame size in px for output image:
  const fw = cmToPx(sizeCm[currentMode].width);
  const fh = cmToPx(sizeCm[currentMode].height);

  // We want to display the frame centered inside #camera-container (which is 320x426 CSS px),
  // but the video’s actual resolution can be different from displayed size,
  // so frame CSS size should match the displayed video size proportionally.

  // Calculate scale ratio from video native size to displayed size
  const videoRatioX = video.videoWidth / video.clientWidth || 1;
  const videoRatioY = video.videoHeight / video.clientHeight || 1;

  // Frame CSS size in displayed px (scaled down)
  // We scale output px by inverse of videoRatio, to map output image px to screen px
  const displayFrameWidth = fw / videoRatioX;
  const displayFrameHeight = fh / videoRatioY;

  frame.style.width = `${displayFrameWidth}px`;
  frame.style.height = `${displayFrameHeight}px`;
  // Center the frame (already done by CSS transform translate(-50%, -50%))
}

// Start camera
async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
    video.srcObject = stream;

    video.onloadedmetadata = () => {
      updateFrame();
    };
  } catch (err) {
    alert('Error accessing camera: ' + err.message);
  }
}

// Capture the area inside the frame from the video, resize it to target px size
function captureAndResize() {
  // Get video and frame DOM rects
  const videoRect = video.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();

  // Calculate scale from displayed video size to video native resolution
  const scaleX = video.videoWidth / videoRect.width;
  const scaleY = video.videoHeight / videoRect.height;

  // Calculate cropping coords relative to video native pixels
  const sx = (frameRect.left - videoRect.left) * scaleX;
  const sy = (frameRect.top - videoRect.top) * scaleY;
  const sw = frameRect.width * scaleX;
  const sh = frameRect.height * scaleY;

  // Set canvas to output size (final desired pixel dimensions)
  const outputWidth = cmToPx(sizeCm[currentMode].width);
  const outputHeight = cmToPx(sizeCm[currentMode].height);
  canvas.width = outputWidth;
  canvas.height = outputHeight;

  const ctx = canvas.getContext('2d');

  // Draw cropped part from video, scaled to final size
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, outputWidth, outputHeight);

  // Show result as image
  const dataURL = canvas.toDataURL('image/png');
  resultImg.src = dataURL;

  // Show download link
  downloadLink.href = dataURL;
  downloadLink.style.display = 'inline-block';
}

// Handle mode button clicks
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    currentMode = btn.getAttribute('data-mode');
    modeButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    updateFrame();
    downloadLink.style.display = 'none';
    resultImg.src = '';
  });
});

captureBtn.addEventListener('click', captureAndResize);

// Initialize
startCamera();
