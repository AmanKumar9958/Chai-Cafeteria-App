// Metro configuration for NativeWind + CSS Interop (CommonJS)
// Keeping a CJS version because Expo CLI loads metro.config.js via require().
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  // Path to the Tailwind entry CSS
  input: './global.css',
});
