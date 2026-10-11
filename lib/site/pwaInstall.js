/**
 * H5「添加到桌面」判定：纯函数，方便 Node 测例覆盖。
 * Chrome 走 beforeinstallprompt；iOS / 微信没有该事件，需要分端说明。
 */

export const A2HS_STORAGE_KEY = 'tuaran-a2hs-dismissed-until'
export const A2HS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000
export const A2HS_MOBILE_MAX_WIDTH = 767

export const INSTALL_SURFACES = {
  wechat: 'wechat',
  iosSafari: 'ios-safari',
  iosBrowser: 'ios-browser',
  android: 'android',
  desktop: 'desktop',
}

export function getInstallSurface(userAgent = '') {
  const ua = String(userAgent || '').toLowerCase()
  if (/micromessenger/.test(ua)) return INSTALL_SURFACES.wechat
  const ios = /iphone|ipad|ipod/.test(ua)
  if (ios) {
    if (/crios|fxios|edgios|opios|opt\//.test(ua)) return INSTALL_SURFACES.iosBrowser
    return INSTALL_SURFACES.iosSafari
  }
  if (/android/.test(ua)) return INSTALL_SURFACES.android
  return INSTALL_SURFACES.desktop
}

export function isStandaloneDisplay({ standalone = false, displayMode = '' } = {}) {
  return standalone === true
    || displayMode === 'standalone'
    || displayMode === 'fullscreen'
    || displayMode === 'minimal-ui'
}

export function shouldOfferInstall({
  standalone = false,
  displayMode = '',
  userAgent = '',
  viewportWidth = 0,
  dismissedUntil = 0,
  now = Date.now(),
} = {}) {
  if (isStandaloneDisplay({ standalone, displayMode })) return false
  if (Number(viewportWidth) > A2HS_MOBILE_MAX_WIDTH) return false
  if (Number(dismissedUntil) > Number(now)) return false
  return getInstallSurface(userAgent) !== INSTALL_SURFACES.desktop
}

export function getInstallCopy(surface, locale = 'zh') {
  const en = locale === 'en'
  switch (surface) {
    case INSTALL_SURFACES.wechat:
      return {
        title: en ? 'Open in the browser' : '用浏览器打开后添加到桌面',
        body: en
          ? 'Tap the top-right menu, choose Open in Browser, then add this site to your Home Screen.'
          : '点击右上角 ···，选择「在浏览器打开」，再用系统浏览器添加到桌面。',
        action: en ? 'Got it' : '知道了',
      }
    case INSTALL_SURFACES.iosSafari:
      return {
        title: en ? 'Add to Home Screen' : '添加到主屏幕',
        body: en
          ? 'Tap the Share button, then choose Add to Home Screen. Open it from the Home Screen next time.'
          : '点底部分享按钮，再选「添加到主屏幕」。下次从桌面图标打开即可。',
        action: en ? 'Show steps' : '查看步骤',
      }
    case INSTALL_SURFACES.iosBrowser:
      return {
        title: en ? 'Use Safari to add' : '请用 Safari 添加到桌面',
        body: en
          ? 'Chrome and other iOS browsers cannot add a Home Screen icon. Open 2aran.com in Safari, then tap Share → Add to Home Screen.'
          : 'iOS 上的 Chrome 等浏览器无法添加主屏幕图标。请用 Safari 打开 2aran.com，再点分享 → 添加到主屏幕。',
        action: en ? 'Got it' : '知道了',
      }
    case INSTALL_SURFACES.android:
      return {
        title: en ? 'Add to Home Screen' : '添加到桌面',
        body: en
          ? 'Install this site like an app. It opens full-screen from your Home Screen.'
          : '把本站安装到桌面，下次从图标全屏打开，少一次找地址。',
        action: en ? 'Add' : '添加',
      }
    default:
      return {
        title: en ? 'Add to Home Screen' : '添加到桌面',
        body: en
          ? 'Install this site from your browser menu to open it from the Home Screen.'
          : '在浏览器菜单里选择「安装应用」或「添加到主屏幕」。',
        action: en ? 'Got it' : '知道了',
      }
  }
}

export function nextDismissUntil(now = Date.now()) {
  return Number(now) + A2HS_COOLDOWN_MS
}
