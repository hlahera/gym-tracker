/** Configuración de Workbox para precachear el build web de producción. */
module.exports = {
  globDirectory: 'dist',
  globPatterns: ['**/*.{js,css,html,ico,png,json,ttf,woff,woff2,svg,wasm}'],
  swDest: 'dist/sw.js',
  clientsClaim: true,
  skipWaiting: true,
  navigateFallback: '/gym-tracker/index.html',
  navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
};
