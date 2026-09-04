import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.cjl.accounts',
  appName: '记账本',
  webDir: 'dist-web',
  backgroundColor: '#f3f6f4',
  android: {
    allowMixedContent: false,
    adjustMarginsForEdgeToEdge: 'auto',
  },
}

export default config
