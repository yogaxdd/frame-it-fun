
document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const homePageEl = document.getElementById('home-page');
  const cameraPageEl = document.getElementById('camera-page');
  const editPageEl = document.getElementById('edit-page');
  const cameraOption = document.getElementById('camera-option');
  const uploadOption = document.getElementById('upload-option');
  const fileInput = document.getElementById('file-input');
  const fileInputCamera = document.getElementById('file-input-camera');
  const videoEl = document.getElementById('video');
  const canvasEl = document.getElementById('canvas');
  const mirrorBtn = document.getElementById('mirror-btn');
  const takePhotoBtn = document.getElementById('take-photo-btn');
  const countdownEl = document.getElementById('countdown');
  const photosPreviewEl = document.getElementById('photos-preview');
  const continueBtn = document.getElementById('continue-btn');
  const countButtons = document.querySelectorAll('.count-options button');
  const photoCountDisplay = document.getElementById('photo-count-display');
  const photoStripEl = document.getElementById('photo-strip');
  const dateToggle = document.getElementById('date-toggle');
  const dateInputContainer = document.getElementById('date-input-container');
  const dateInput = document.getElementById('date-input');
  const dateOverlay = document.getElementById('date-overlay');
  const colorOptions = document.querySelectorAll('.color-option');
  const filterButtons = document.querySelectorAll('.filter-button');
  const stickers = document.querySelectorAll('.sticker');
  const previewBtn = document.getElementById('preview-btn');
  const downloadBtn = document.getElementById('download-btn');
  const retakeBtn = document.getElementById('retake-btn');
  const previewModal = document.getElementById('preview-modal');
  const modalPhotoStrip = document.getElementById('modal-photo-strip');
  const closeModal = document.querySelector('.close-modal');
  const loadingIndicator = document.getElementById('camera-loading');
  const cameraErrorMessage = document.getElementById('camera-error');
  const retryButton = document.getElementById('retry-camera');

  // State
  let currentPage = 'home';
  let stream = null;
  let isMirrored = true;
  let isTakingPhotos = false;
  let countDown = 0;
  let photoCount = 3;
  let photosTaken = [];
  let currentFilter = 'no-filter';
  let bgColor = '#FFFFFF';
  let dateEnabled = false;
  let dateText = new Date().toLocaleDateString();
  let appliedStickers = [];
  let isCameraReady = false;

  // Initialize
  function init() {
    // Set the date input value
    dateInput.value = dateText;
    
    // Show home page initially
    showPage('home');
    
    // Attach event listeners
    attachEventListeners();

    // Add retry button functionality
    if (retryButton) {
      retryButton.addEventListener('click', initCamera);
    }
  }

  // Navigate between pages
  function showPage(pageName) {
    // Hide all pages
    homePageEl.classList.remove('active');
    cameraPageEl.classList.remove('active');
    editPageEl.classList.remove('active');
    
    // Show the requested page
    currentPage = pageName;
    
    switch(pageName) {
      case 'home':
        homePageEl.classList.add('active');
        if (stream) {
          stopCamera();
        }
        break;
      case 'camera':
        cameraPageEl.classList.add('active');
        initCamera();
        break;
      case 'edit':
        editPageEl.classList.add('active');
        if (stream) {
          stopCamera();
        }
        renderPhotoStrip();
        break;
    }
  }

  // Initialize camera
  async function initCamera() {
    try {
      if (cameraErrorMessage) {
        cameraErrorMessage.style.display = 'none';
      }
      
      if (loadingIndicator) {
        loadingIndicator.style.display = 'flex';
      }
      
      isCameraReady = false;
      
      // Always stop any existing stream first to prevent flickering
      if (stream) {
        stopCamera();
      }
      
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        }
      };
      
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Only set the stream once we're ready
      videoEl.srcObject = stream;
      
      // Make sure video is properly loaded before displaying
      videoEl.onloadedmetadata = () => {
        videoEl.play().catch(err => {
          console.error("Error starting video playback:", err);
          showCameraError("Error starting camera. Please try again.");
        });
        
        // Apply mirroring based on state
        videoEl.classList.toggle('mirrored', isMirrored);
        
        isCameraReady = true;
        
        if (loadingIndicator) {
          loadingIndicator.style.display = 'none';
        }
        
        // Show video
        videoEl.style.display = 'block';
      };
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      showCameraError('Unable to access camera. Please ensure you have given permission.');
    }
  }

  function showCameraError(message) {
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }
    
    if (cameraErrorMessage) {
      const errorTextEl = cameraErrorMessage.querySelector('p');
      if (errorTextEl) {
        errorTextEl.textContent = message;
      }
      cameraErrorMessage.style.display = 'flex';
    } else {
      alert(message);
    }
  }

  // Stop camera stream
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      videoEl.srcObject = null;
    }
  }

  // Take a photo
  function takePhoto() {
    if (!stream || !isCameraReady) return null;
    
    const context = canvasEl.getContext('2d');
    
    // Set canvas dimensions to match video
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    
    // Apply mirroring if enabled
    if (isMirrored) {
      context.translate(canvasEl.width, 0);
      context.scale(-1, 1);
    }
    
    // Draw video frame to canvas
    context.drawImage(videoEl, 0, 0);
    
    // Convert to data URL
    return canvasEl.toDataURL('image/jpeg');
  }

  // Start the photo session
  function startPhotoSession() {
    if (isTakingPhotos || !stream || !isCameraReady) return;
    
    // Reset photos
    photosTaken = [];
    updatePhotosPreview();
    
    isTakingPhotos = true;
    countDown = 3;
    
    // Show countdown
    countdownEl.textContent = countDown;
    countdownEl.classList.remove('hidden');
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      countDown--;
      
      if (countDown <= 0) {
        clearInterval(countdownInterval);
        countdownEl.classList.add('hidden');
        
        // Take photo
        const photoDataUrl = takePhoto();
        if (photoDataUrl) {
          photosTaken.push(photoDataUrl);
          updatePhotosPreview();
          
          // Check if we need to take more photos
          if (photosTaken.length < photoCount) {
            // Wait a moment before starting the next countdown
            setTimeout(() => {
              startNextPhoto();
            }, 1000);
          } else {
            // All photos taken
            isTakingPhotos = false;
            continueBtn.classList.remove('hidden');
          }
        }
      } else {
        countdownEl.textContent = countDown;
      }
    }, 1000);
  }

  // Start taking the next photo
  function startNextPhoto() {
    countDown = 3;
    countdownEl.textContent = countDown;
    countdownEl.classList.remove('hidden');
    
    const countdownInterval = setInterval(() => {
      countDown--;
      
      if (countDown <= 0) {
        clearInterval(countdownInterval);
        countdownEl.classList.add('hidden');
        
        // Take photo
        const photoDataUrl = takePhoto();
        if (photoDataUrl) {
          photosTaken.push(photoDataUrl);
          updatePhotosPreview();
          
          // Check if we need to take more photos
          if (photosTaken.length < photoCount) {
            // Wait a moment before starting the next countdown
            setTimeout(() => {
              startNextPhoto();
            }, 1000);
          } else {
            // All photos taken
            isTakingPhotos = false;
            continueBtn.classList.remove('hidden');
          }
        }
      } else {
        countdownEl.textContent = countDown;
      }
    }, 1000);
  }

  // Update the photos preview
  function updatePhotosPreview() {
    // Clear preview
    photosPreviewEl.innerHTML = '';
    
    if (photosTaken.length === 0) {
      // Show empty state
      photosPreviewEl.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-camera"></i>
          <p>Photos you take will appear here</p>
          <p class="small">Take <span>${photoCount}</span> photos for your strip</p>
        </div>
      `;
      return;
    }
    
    // Add photos
    photosTaken.forEach((photo, index) => {
      const photoEl = document.createElement('div');
      photoEl.className = 'preview-photo';
      photoEl.innerHTML = `<img src="${photo}" alt="Photo ${index + 1}">`;
      photosPreviewEl.appendChild(photoEl);
    });
  }

  // Handle file upload
  function handleFileUpload(e, fromCamera = false) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Accept only up to photoCount images
    const photosArray = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .slice(0, photoCount);
    
    if (photosArray.length === 0) {
      alert('Please select valid image files');
      return;
    }
    
    Promise.all(photosArray.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            resolve(e.target.result);
          }
        };
        reader.readAsDataURL(file);
      });
    })).then(uploadedPhotos => {
      photosTaken = uploadedPhotos;
      
      if (fromCamera) {
        updatePhotosPreview();
        continueBtn.classList.remove('hidden');
      } else {
        showPage('edit');
      }
    });
  }

  // Render the photo strip in the edit page
  function renderPhotoStrip() {
    photoStripEl.innerHTML = '';
    photoStripEl.style.backgroundColor = bgColor;
    
    // Add photos to strip
    photosTaken.forEach((photo, index) => {
      const photoDiv = document.createElement('div');
      photoDiv.className = 'photo-item';
      photoDiv.innerHTML = `<img src="${photo}" class="${currentFilter}" alt="Photo ${index + 1}">`;
      photoStripEl.appendChild(photoDiv);
    });
    
    // Add date if enabled - now at the bottom of the strip
    if (dateEnabled) {
      const dateDiv = document.createElement('div');
      dateDiv.className = 'date-text';
      dateDiv.textContent = dateText;
      photoStripEl.appendChild(dateDiv);
      
      if (dateOverlay) {
        dateOverlay.classList.add('hidden');
      }
    } else if (dateOverlay) {
      dateOverlay.classList.add('hidden');
    }
    
    // Re-add any stickers
    appliedStickers.forEach(sticker => {
      addStickerToPhotoStrip(sticker.image, sticker.x, sticker.y, sticker.scale);
    });
  }

  // Add a sticker to the photo strip
  function addStickerToPhotoStrip(stickerSrc, x = null, y = null, scale = 1) {
    const stickerEl = document.createElement('div');
    stickerEl.className = 'draggable-sticker';
    
    // If no position is provided, center the sticker
    if (x === null || y === null) {
      const stripRect = photoStripEl.getBoundingClientRect();
      x = stripRect.width / 2 - 30;
      y = stripRect.height / 2 - 30;
    }
    
    stickerEl.style.left = `${x}px`;
    stickerEl.style.top = `${y}px`;
    stickerEl.style.transform = `scale(${scale})`;
    
    // Create sticker element
    stickerEl.innerHTML = `
      <img src="${stickerSrc}" style="width: 60px; height: 60px;">
      <div class="sticker-controls">
        <button class="sticker-control-btn zoom-in" title="Increase size">
          <i class="fa-solid fa-magnifying-glass-plus"></i>
        </button>
        <button class="sticker-control-btn zoom-out" title="Decrease size">
          <i class="fa-solid fa-magnifying-glass-minus"></i>
        </button>
        <button class="sticker-control-btn delete" title="Remove">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    
    photoStripEl.appendChild(stickerEl);
    
    // Keep track of this sticker
    const stickerId = 'sticker-' + Date.now();
    stickerEl.id = stickerId;
    
    const stickerData = {
      id: stickerId,
      image: stickerSrc,
      x: x,
      y: y,
      scale: scale
    };
    
    appliedStickers.push(stickerData);
    
    // Make the sticker draggable
    makeElementDraggable(stickerEl, stickerData);
    
    // Add event listeners for controls
    const zoomInBtn = stickerEl.querySelector('.zoom-in');
    const zoomOutBtn = stickerEl.querySelector('.zoom-out');
    const deleteBtn = stickerEl.querySelector('.delete');
    
    zoomInBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stickerData.scale += 0.1;
      stickerEl.style.transform = `scale(${stickerData.scale})`;
      
      // Update in our stickers array
      const index = appliedStickers.findIndex(s => s.id === stickerId);
      if (index !== -1) {
        appliedStickers[index].scale = stickerData.scale;
      }
    });
    
    zoomOutBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stickerData.scale = Math.max(0.2, stickerData.scale - 0.1);
      stickerEl.style.transform = `scale(${stickerData.scale})`;
      
      // Update in our stickers array
      const index = appliedStickers.findIndex(s => s.id === stickerId);
      if (index !== -1) {
        appliedStickers[index].scale = stickerData.scale;
      }
    });
    
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stickerEl.remove();
      
      // Remove from our stickers array
      const index = appliedStickers.findIndex(s => s.id === stickerId);
      if (index !== -1) {
        appliedStickers.splice(index, 1);
      }
    });
  }

  // Make an element draggable
  function makeElementDraggable(element, stickerData) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
      e.preventDefault();
      isDragging = true;
      
      if (e.type === 'mousedown') {
        startX = e.clientX;
        startY = e.clientY;
      } else if (e.type === 'touchstart') {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
      
      startLeft = parseInt(element.style.left) || 0;
      startTop = parseInt(element.style.top) || 0;
      
      document.addEventListener('mousemove', drag);
      document.addEventListener('touchmove', drag, { passive: false });
      document.addEventListener('mouseup', stopDrag);
      document.addEventListener('touchend', stopDrag);
    }
    
    function drag(e) {
      if (!isDragging) return;
      
      let clientX, clientY;
      
      if (e.type === 'mousemove') {
        clientX = e.clientX;
        clientY = e.clientY;
      } else if (e.type === 'touchmove') {
        e.preventDefault(); // Prevent scrolling when dragging
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      
      const dx = clientX - startX;
      const dy = clientY - startY;
      
      const newLeft = startLeft + dx;
      const newTop = startTop + dy;
      
      element.style.left = `${newLeft}px`;
      element.style.top = `${newTop}px`;
      
      // Update in our stickers array
      stickerData.x = newLeft;
      stickerData.y = newTop;
      
      const index = appliedStickers.findIndex(s => s.id === stickerData.id);
      if (index !== -1) {
        appliedStickers[index].x = newLeft;
        appliedStickers[index].y = newTop;
      }
    }
    
    function stopDrag() {
      isDragging = false;
      document.removeEventListener('mousemove', drag);
      document.removeEventListener('touchmove', drag);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchend', stopDrag);
    }
  }

  // Show preview modal
  function showPreview() {
    // Clone the photo strip for the modal
    modalPhotoStrip.innerHTML = photoStripEl.innerHTML;
    modalPhotoStrip.style.backgroundColor = bgColor;
    
    // Show modal
    previewModal.style.display = 'block';
  }

  // Download the photo strip
  function downloadPhotoStrip() {
    html2canvas(photoStripEl, {
      backgroundColor: bgColor,
      allowTaint: true,
      useCORS: true,
      scale: 2 // Higher quality
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'photostrip.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }).catch(err => {
      console.error("Error downloading photo strip:", err);
      alert("Failed to download. Please try again.");
    });
  }

  // Attach all event listeners
  function attachEventListeners() {
    // Navigation
    if (cameraOption) cameraOption.addEventListener('click', () => showPage('camera'));
    if (uploadOption) uploadOption.addEventListener('click', () => fileInput.click());
    if (fileInput) fileInput.addEventListener('change', (e) => handleFileUpload(e));
    if (fileInputCamera) fileInputCamera.addEventListener('change', (e) => handleFileUpload(e, true));
    if (continueBtn) continueBtn.addEventListener('click', () => showPage('edit'));
    if (retakeBtn) retakeBtn.addEventListener('click', () => {
      photosTaken = [];
      appliedStickers = [];
      showPage('camera');
    });
    
    // Camera controls
    if (mirrorBtn) mirrorBtn.addEventListener('click', () => {
      isMirrored = !isMirrored;
      if (videoEl) videoEl.classList.toggle('mirrored', isMirrored);
    });
    
    if (takePhotoBtn) takePhotoBtn.addEventListener('click', startPhotoSession);
    
    // Photo count buttons
    countButtons.forEach(button => {
      button.addEventListener('click', () => {
        photoCount = parseInt(button.dataset.count);
        
        // Update active state
        countButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update display
        if (photoCountDisplay) photoCountDisplay.textContent = photoCount;
      });
    });
    
    // Edit tools
    colorOptions.forEach(option => {
      option.addEventListener('click', () => {
        bgColor = option.dataset.color;
        
        // Update active state
        colorOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Update photo strip
        renderPhotoStrip();
      });
    });
    
    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        currentFilter = button.dataset.filter;
        
        // Update active state
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update photo strip
        renderPhotoStrip();
      });
    });
    
    if (dateToggle) {
      dateToggle.addEventListener('change', () => {
        dateEnabled = dateToggle.checked;
        
        if (dateEnabled && dateInputContainer) {
          dateInputContainer.classList.remove('hidden');
        } else if (dateInputContainer) {
          dateInputContainer.classList.add('hidden');
        }
        
        renderPhotoStrip();
      });
    }
    
    if (dateInput) {
      dateInput.addEventListener('input', () => {
        dateText = dateInput.value;
        if (dateEnabled) {
          renderPhotoStrip();
        }
      });
    }
    
    stickers.forEach(sticker => {
      sticker.addEventListener('click', () => {
        addStickerToPhotoStrip(sticker.src);
      });
    });
    
    // Preview and download
    if (previewBtn) previewBtn.addEventListener('click', showPreview);
    if (downloadBtn) downloadBtn.addEventListener('click', downloadPhotoStrip);
    
    // Modal
    if (closeModal) {
      closeModal.addEventListener('click', () => {
        if (previewModal) previewModal.style.display = 'none';
      });
    }
    
    window.addEventListener('click', (e) => {
      if (previewModal && e.target === previewModal) {
        previewModal.style.display = 'none';
      }
    });
  }

  // Initialize the app
  init();
});
