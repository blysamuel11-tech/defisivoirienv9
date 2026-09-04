import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { App } from '@capacitor/app';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { pauseAudioForBackground, resumeAudioFromBackground } from './audio';

/**
 * Initializes native mobile lifecycle, status bar, and hardware back button
 * for Android (Java Bridge) and iOS.
 */
export async function initNativeMobileFeatures(options?: {
  onBackButton?: () => boolean; // return true if handled, false to exit/minimize
}) {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    // 1. Configure Native Status Bar (Dark mode matching theme #05130D)
    await StatusBar.setStyle({ style: Style.Dark });
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({ color: '#05130D' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.debug('StatusBar native config error', e);
  }

  try {
    // 2. Hide Native Splash Screen after web app initialization
    await SplashScreen.hide({ fadeOutDuration: 350 });
  } catch (e) {
    console.debug('SplashScreen native config error', e);
  }

  try {
    // 3. Android Hardware Back Button navigation
    App.addListener('backButton', ({ canGoBack }) => {
      if (options?.onBackButton && options.onBackButton()) {
        return;
      }
      if (canGoBack) {
        window.history.back();
      } else {
        App.minimizeApp();
      }
    });

    // 4. App state listener (background / foreground)
    App.addListener('appStateChange', (state) => {
      if (!state.isActive) {
        pauseAudioForBackground();
      } else {
        resumeAudioFromBackground();
      }
    });
  } catch (e) {
    console.debug('App native listeners error', e);
  }
}

/**
 * Native device vibration & tactile haptic feedback
 */
export async function triggerNativeHaptic(style: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    if (style === 'light') {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (style === 'medium') {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (style === 'heavy') {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } else if (style === 'success') {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (style === 'warning') {
      await Haptics.notification({ type: NotificationType.Warning });
    } else if (style === 'error') {
      await Haptics.notification({ type: NotificationType.Error });
    }
  } catch {
    // Fallback to web vibration
  }
}
