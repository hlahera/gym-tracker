import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

const serviceWorkerScript = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function (err) {
        console.warn('Service worker no registrado:', err);
      });
    });
  }
`;

export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#050505" />
        <meta name="description" content="Registra entrenamientos y sube peso cada semana. Funciona sin conexión." />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gym Tracker" />
        <link rel="manifest" href="manifest.json" />
        <link rel="icon" href="favicon.png" />
        <link rel="apple-touch-icon" href="pwa-192.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: globalStyles }} />
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: serviceWorkerScript }} />
      </body>
    </html>
  );
}

const globalStyles = `
  * { box-sizing: border-box; }
  html, body, #root {
    background-color: #050505;
    color: #fafafa;
    min-height: 100%;
  }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }
  ::selection {
    background: rgba(0, 230, 118, 0.25);
    color: #ffffff;
  }
  input, textarea, button { font-family: inherit; }
  input:focus, textarea:focus {
    outline: none;
    border-color: #00E676 !important;
    box-shadow: 0 0 0 3px rgba(0, 230, 118, 0.15);
  }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #222; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #00E676; }
`;
