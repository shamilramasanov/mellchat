// Хук для кэширования device detection
import { useRef } from 'react';
import deviceDetection from '../utils/deviceDetection';

export const useDeviceDetection = () => {
  const deviceInfoRef = useRef(null);
  const adaptiveSettingsRef = useRef(null);

  // Кэшируем device info
  if (!deviceInfoRef.current) {
    deviceInfoRef.current = deviceDetection.getDeviceInfo();
  }

  // Кэшируем adaptive settings
  if (!adaptiveSettingsRef.current) {
    adaptiveSettingsRef.current = deviceDetection.getAdaptiveSettings();
  }

  return {
    deviceInfo: deviceInfoRef.current,
    adaptiveSettings: adaptiveSettingsRef.current,
    toggleVirtualization: deviceDetection.toggleVirtualization.bind(deviceDetection)
  };
};

export default useDeviceDetection;
