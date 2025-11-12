
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9b52e30f59b9496085ca74c59e504753',
  appName: 'tiryak-pharmacy-system-pro',
  webDir: 'dist',
  // server: {
  //   url: 'https://9b52e30f-59b9-4960-85ca-74c59e504753.lovableproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    LocalNotifications: {
      smallIcon: "ic_stat_notification",
      iconColor: "#1EAEDB",
      sound: "default"
    }
  }
};

export default config;
