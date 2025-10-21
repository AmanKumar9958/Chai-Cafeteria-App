const cssInteropPluginModule = require("react-native-css-interop/dist/babel-plugin");
const cssInteropPlugin = cssInteropPluginModule.default ?? cssInteropPluginModule;

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      cssInteropPlugin,
      [
        "@babel/plugin-transform-react-jsx",
        {
          runtime: "automatic",
          importSource: "react-native-css-interop",
        },
      ],
      "react-native-worklets/plugin",
      // "expo-router/babel",
    ],
  };
};