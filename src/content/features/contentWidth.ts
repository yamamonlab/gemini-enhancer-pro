/**
 * コンテンツ幅調整機能
 */

const STYLE_ID = 'gemini-enhancer-width-style';
const CSS_VAR_NAME = '--gemini-enhancer-max-width';

// ターゲット要素のセレクタ
const TARGET_SELECTORS = [
    '.center-section',
    '.input-area-container',
    '.zero-state-block-container',
    '.human-review-disclosure-container',
    '.hallucination-disclaimer'
    // 必要に応じて追加
];

/**
 * CSSを注入
 */
const injectWidthStyles = (maxWidth: string): void => {
    // ルート変数を設定
    document.documentElement.style.setProperty(CSS_VAR_NAME, maxWidth);

    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
    ${TARGET_SELECTORS.join(',\n')} {
      max-width: var(${CSS_VAR_NAME}) !important;
    }
  `;
    document.head.appendChild(style);
    console.log('[Gemini Enhancer Pro] Width styles injected');
};

/**
 * 設定を読み込んで適用
 */
const applySettings = async (): Promise<void> => {
    // コンテキストチェック
    if (!chrome.runtime?.id) return;

    try {
        const data = await chrome.storage.local.get(['maxWidth']);
        // デフォルトは "100%" (または巨大な値)
        const maxWidth = data.maxWidth ? `${data.maxWidth}px` : '100%';

        // スライダーの最小値が "100%" を意味する場合の処理などが必要ならここで
        // 今回は単純に数値があればpx、なければ100%とする

        injectWidthStyles(maxWidth);
        console.log(`[Gemini Enhancer Pro] Applied max-width: ${maxWidth}`);
    } catch (e) {
        // エラーが出ても致命的ではないのでログだけ
        // console.warn('[Gemini Enhancer Pro] Failed to load settings:', e);
        // フォールバック: デフォルト適用
        injectWidthStyles('100%');
    }
};

/**
 * 初期化と監視
 */
export const initContentWidth = (): void => {
    if (!chrome.runtime?.id) return;

    applySettings();

    // ストレージ変更を監視（Popupからの操作反映）
    try {
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (!chrome.runtime?.id) return;

            if (areaName === 'local' && changes.maxWidth) {
                const newValue = changes.maxWidth.newValue;
                const width = newValue ? `${newValue}px` : '100%';
                document.documentElement.style.setProperty(CSS_VAR_NAME, width);
                console.log(`[Gemini Enhancer Pro] Updated max-width: ${width}`);
            }
        });
    } catch (e) {
        console.warn('[Gemini Enhancer Pro] Failed to add width listener:', e);
    }
};
