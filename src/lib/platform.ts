/**
 * Hardcoded to return Linux OS exclusively
 */
export const getPlatform = (): "linux" => {
  return "linux";
};

export const isMacOS = (): boolean => false;

export const isWindows = (): boolean => false;

export const isLinux = (): boolean => true;