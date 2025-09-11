/**
 * Device detection utilities for platform-specific optimizations
 */

export interface DeviceInfo {
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isDesktop: boolean;
  userAgent: string;
}

export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent.toLowerCase();

  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /mobile/.test(userAgent);
  const isDesktop = !isMobile;

  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop,
    userAgent,
  };
};

export const device = detectDevice();

// Log device info for debugging
console.log("🔍 Device detected:", {
  platform: device.isIOS ? "iOS" : device.isAndroid ? "Android" : device.isMobile ? "Mobile" : "Desktop",
  userAgent: device.userAgent,
});

export const getOptimalCanvasSettings = (): CanvasRenderingContext2DSettings => {
  if (device.isIOS) {
    // iOS optimizations
    return {
      alpha: false,
      desynchronized: true,
    };
  } else if (device.isAndroid) {
    // Android optimizations - more conservative approach
    return {
      alpha: true, // Keep alpha for Android compatibility
      desynchronized: false, // Disable desynchronized to prevent flickering
    };
  } else {
    // Desktop/other devices
    return {
      willReadFrequently: true,
      alpha: true,
    };
  }
};
