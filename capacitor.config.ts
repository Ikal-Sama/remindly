import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikalsama.remindly',
  appName: 'Remindly',
  webDir: 'public',
  // Appended to the WebView user agent so proxy.ts can tell the native shell
  // apart from a browser and boot it into onboarding instead of the
  // marketing homepage. Keep in sync with NATIVE_APP_UA in proxy.ts.
  appendUserAgent: 'RemindlyApp',
  server: {
    cleartext: true,
    // Development: use localhost; Production: use deployed Vercel URL
    url: (process.env.NODE_ENV === 'development'
      ? 'http://10.0.2.2:3000'
      : 'https://remindly-pi.vercel.app') as string,
  },
};

export default config;