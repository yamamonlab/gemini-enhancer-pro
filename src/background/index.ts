/**
 * Gemini Enhancer Pro - Background Service Worker
 * 最小構成
 */

console.log('[Gemini Enhancer Pro] Background service worker started');

// インストール時
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Gemini Enhancer Pro] Installed:', details.reason);
});
