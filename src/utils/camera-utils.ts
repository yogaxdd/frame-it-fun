
/**
 * Camera utility functions to handle camera operations
 */

/**
 * Checks if the device has camera capabilities
 */
export const checkCameraAvailability = async (): Promise<boolean> => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return false;
  }
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (err) {
    console.error('Error checking camera availability:', err);
    return false;
  }
};

/**
 * Gets the ideal camera constraints based on device type
 */
export const getCameraConstraints = (isMobile: boolean) => {
  return {
    video: {
      width: { ideal: isMobile ? 720 : 1280 },
      height: { ideal: isMobile ? 1280 : 720 },
      facingMode: "user"
    },
    audio: false
  };
};

/**
 * Parse camera error to provide user-friendly message
 */
export const getCameraErrorMessage = (error: unknown): string => {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'Camera access denied. Please allow camera access in your browser settings.';
      case 'NotFoundError':
        return 'No camera found. Please ensure your device has a working camera.';
      case 'NotReadableError':
        return 'Camera is already in use by another application or tab.';
      case 'OverconstrainedError':
        return 'Camera cannot satisfy the required constraints.';
      case 'AbortError':
        return 'Camera access was aborted. Please try again.';
      case 'SecurityError':
        return 'Camera access is blocked due to security restrictions.';
      default:
        return `Camera error: ${error.name}`;
    }
  }
  
  return 'Unable to access camera. Please ensure your device has camera permissions enabled.';
};
