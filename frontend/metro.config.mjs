// Metro configuration for NativeWind + CSS Interop (ESM)
// See: https://www.nativewind.dev/quick-starts/expo
import { getDefaultConfig } from 'expo/metro-config';
import { withNativeWind } from 'nativewind/metro';

/** @type {import('metro-config').MetroConfig} */
const config = getDefaultConfig(process.cwd());

export default withNativeWind(config, {
  // Path to your Tailwind entry CSS file
  input: './global.css',
});
