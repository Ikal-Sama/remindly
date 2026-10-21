import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ikalsama.remindly',
  appName: 'Remindly',
  webDir: 'public',
  server: {
    cleartext: true,
    // Development: use localhost; Production: use deployed Vercel URL
    url: (process.env.NODE_ENV === 'development'
      ? 'http://10.0.2.2:3000'
      : 'https://remindly-pi.vercel.app') as string,
  },
};

export default config;