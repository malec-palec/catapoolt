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
  const isAndroid = userAgent.includes("android");
  const isMobile = isIOS || isAndroid || userAgent.includes("mobile");

  return {
    isIOS,
    isAndroid,
    isMobile,
    isDesktop: !isMobile,
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
  return device.isIOS
    ? {
        alpha: false,
        desynchronized: true,
      }
    : device.isAndroid
      ? {
          alpha: true, // Keep alpha for Android compatibility
          desynchronized: false, // Disable desynchronized to prevent flickering
        }
      : {
          willReadFrequently: true,
          alpha: true,
        };
};
