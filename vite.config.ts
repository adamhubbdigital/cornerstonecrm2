import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Cornerstone CRM',
        short_name: 'CRM',
        description: 'Manage your contacts and organizations efficiently',
        theme_color: '#fbd5e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        categories: ['business', 'productivity'],
        icons: [
          {
            src: 'https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Add Contact',
            url: '/contacts?action=add',
            icons: [
              {
                src: 'https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000',
                sizes: '96x96'
              }
            ]
          },
          {
            name: 'Add Task',
            url: '/tasks?action=add',
            icons: [
              {
                src: 'https://pregnancyadvice.org.uk/Images/Content/2315/743240.png?modify_dt=635787726343730000',
                sizes: '96x96'
              }
            ]
          }
        ],
        display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
        handle_links: 'preferred',
        launch_handler: {
          client_mode: ['navigate-existing', 'auto']
        },
        edge_side_panel: {
          preferred_width: 480
        },
        categories: ['business', 'productivity'],
        dir: 'ltr',
        lang: 'en',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        prefer_related_applications: false
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/vakrmvudagrmguhlkkqe\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    })
  ],
  optimizeDeps: {
    include: ['react-big-calendar']
  }
});