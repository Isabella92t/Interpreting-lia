// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Ordlistan laddas fran en csv-fil.
config.resolver.assetExts.push("csv");

// expo-sqlite laddar wa-sqlite.wasm som en asset pa webben.
// Utan den har raden gar det inte att bygga for web.
config.resolver.assetExts.push("wasm");

// wa-sqlite behover SharedArrayBuffer, som bara finns
// i en cross-origin isolated sida.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    return middleware(req, res, next);
  };
};

module.exports = config;
