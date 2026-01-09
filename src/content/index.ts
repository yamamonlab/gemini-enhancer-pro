/**
 * Gemini Enhancer Pro - Content Script
 * 機能: ツールショートカットボタン（Deep Research / Canvas / Nanobanana / Google Apps）
 */

console.log('[Gemini Enhancer Pro] Content script loaded');

// ========================================
// インポート
// ========================================
import { initContentWidth } from './features/contentWidth';
import { initGemSearch } from './features/gemSearch';

// ========================================
// 定数
// ========================================
const TOOLBAR_CONTAINER_CLASS = 'toolbox-drawer-button-container';
const DESELECT_BUTTON_CLASS = 'toolbox-drawer-item-deselect-button';
const DEBOUNCE_MS = 300;

// ボタン定義
// targetText: ツールメニューから実行する場合
// mention: テキストとして入力する場合
const TOOL_BUTTONS = [
  // Gemini Native Tools (左側に表示)
  { id: 'deep-research', label: 'Deep Research', icon: '🔍', targetText: 'Deep Research' },
  { id: 'canvas', label: 'Canvas', icon: '🎨', targetText: 'Canvas' },
  { id: 'image-generation', label: '画像', targetText: '画像', icon: '🍌' },
  { id: 'video-generation', label: '動画', targetText: '動画', icon: '🎥' },
  { id: 'guided-learning', label: 'ガイド付き学習', icon: '📖', targetText: 'ガイド付き学習' },
  { id: 'visual-layout', label: 'ビジュアル レイアウト', icon: '田', targetText: 'ビジュアル レイアウト' },

  // Workspace Integration (右側に表示) - Official Google Icons (icon only)
  { id: 'google-drive', label: 'Google ドライブ', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Google ドライブ ', iconOnly: true },
  { id: 'google-docs', label: 'Google ドキュメント', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/docs_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Google ドキュメント ', iconOnly: true },
  { id: 'gmail', label: 'Gmail', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/gmail_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Gmail ', iconOnly: true },
  { id: 'google-keep', label: 'Google Keep', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/keep_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Google Keep ', iconOnly: true },
  { id: 'google-calendar', label: 'Google Calendar', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/calendar_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Google Calendar ', iconOnly: true },
  { id: 'google-maps', label: 'Google Maps', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/maps_2020q4_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@Google Maps ', iconOnly: true },
  { id: 'youtube', label: 'YouTube', icon: '<img src="https://www.gstatic.com/images/branding/product/1x/youtube_2017_48dp.png" width="18" height="18" style="vertical-align:middle">', mention: '@YouTube ', iconOnly: true },
];

// ========================================
// ユーティリティ
// ========================================

/**
 * Debounce関数
 */
const debounce = <T extends (...args: unknown[]) => void>(fn: T, ms: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
};

/**
 * 入力エリア（ql-editor）を取得
 */
const getInputArea = (): HTMLElement | null => {
  return (
    document.querySelector<HTMLElement>('.ql-editor') ||
    document.querySelector<HTMLElement>('[role="textbox"]') ||
    document.querySelector<HTMLElement>('[contenteditable="true"]')
  );
};

// ========================================
// 実行ロジック
// ========================================

/**
 * ツールを実行（メニューを開いてクリック）
 */
const executeTool = async (targetText: string): Promise<void> => {
  console.log(`[Gemini Enhancer Pro] Executing tool: ${targetText}`);

  const menuButton = document.querySelector<HTMLElement>('.toolbox-drawer-button') ||
    document.querySelector<HTMLElement>('.toolbox-drawer-button-with-label');

  if (!menuButton) {
    console.error('[Gemini Enhancer Pro] Tool menu button not found');
    return;
  }

  // メニューが既に開いているかチェック
  let isMenuOpen = menuButton.classList.contains('menu-open') ||
    document.querySelector('.toolbox-drawer-item-list-button');

  if (!isMenuOpen) {
    menuButton.click();
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  let targetButton: HTMLElement | null = null;
  // 最大10回、30msごとにチェック
  for (let i = 0; i < 10; i++) {
    const items = document.querySelectorAll<HTMLElement>('.toolbox-drawer-item-list-button');
    for (const item of items) {
      if (item.textContent && item.textContent.includes(targetText)) {
        targetButton = item;
        break;
      }
    }
    if (targetButton) break;
    await new Promise(resolve => setTimeout(resolve, 30));
  }

  if (targetButton) {
    targetButton.click();
  } else {
    // 見つからなかった場合はメニューを閉じる
    if (!isMenuOpen) menuButton.click();
  }
};

/**
 * メンションを入力エリアに挿入
 */
const insertMention = (mentionText: string): void => {
  const inputArea = getInputArea();
  if (!inputArea) {
    console.warn('[Gemini Enhancer Pro] Input area not found');
    return;
  }

  // フォーカス
  inputArea.focus();

  // 現在のカーソル位置に関わらず、まずは末尾に追加する実装にする
  // (より高度な実装ではカーソル位置挿入だが、シンプルさを優先)

  // 既存のコンテンツを取得
  // HTMLとして取得する場合、<p><br></p> などが含まれる場合がある
  // ここではシンプルに textContent ベースではなく、
  // execCommand ('insertText') を使うのが最も安全（Reactのイベントも発火しやすい）

  document.execCommand('insertText', false, mentionText);

  // 入力イベントを念のため発火
  inputArea.dispatchEvent(new Event('input', { bubbles: true }));

  console.log(`[Gemini Enhancer Pro] Inserted: ${mentionText}`);
};

// ========================================
// ツールボタン管理
// ========================================

/**
 * CSSを注入
 */
const injectStyles = (): void => {
  if (document.getElementById('gemini-enhancer-styles')) return;

  const style = document.createElement('style');
  style.id = 'gemini-enhancer-styles';
  style.textContent = `
    .gemini-enhancer-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 32px;
      padding: 0 12px;
      margin-left: 8px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.03);
      color: #aaa;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .gemini-enhancer-chip:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e3e3e3;
      border-color: rgba(255, 255, 255, 0.3);
    }
    
    .gemini-enhancer-chip:active {
      transform: scale(0.98);
    }

    .gemini-enhancer-chip .icon {
      font-size: 16px;
    }

    .gemini-enhancer-chip.icon-only {
      padding: 0 8px;
      gap: 0;
      min-width: 32px;
      justify-content: center;
    }

    .gemini-enhancer-chip.icon-only .icon {
      font-size: 18px;
    }

    /* ネイティブツールを左側、Googleアプリを右側に固定 */
    .gemini-enhancer-chip.native-tool {
      order: 1;
    }

    .gemini-enhancer-chip.google-app {
      order: 2;
    }
  `;
  document.head.appendChild(style);
};

/**
 * コンテナにボタンを挿入/更新
 */
const updateButtons = async (): Promise<void> => {
  // コンテキストが無効化されている場合は何もしない
  if (!chrome.runtime?.id) {
    return;
  }

  const container = document.querySelector<HTMLElement>(`.${TOOLBAR_CONTAINER_CLASS}`);
  if (!container) return;

  try {
    // 設定読み込み
    const data = await chrome.storage.local.get(['visibleTools']);
    // visibleToolsが無い場合は全ツールIDを表示
    const visibleToolIds: string[] = data.visibleTools || TOOL_BUTTONS.map(t => t.id);

    // 既存のチップ（選択されたツール）を確認
    // 正しいセレクタ: .toolbox-drawer-item-deselect-button-label
    const chips = document.querySelectorAll('.toolbox-drawer-item-deselect-button-label');
    const activeToolNames = Array.from(chips).map(chip => {
      // テキストのみ取得（絵文字はDOM上は別要素なので通常含まれない）
      return chip.textContent?.trim() || '';
    });

    console.log('[Gemini Enhancer Pro] Active tool chips:', activeToolNames);

    // 不要なボタンを削除し、既存ボタンの表示/非表示を更新
    const existingButtons = container.querySelectorAll('.gemini-enhancer-chip');
    existingButtons.forEach(btn => {
      const toolId = (btn as HTMLElement).dataset.toolId;
      if (toolId && !visibleToolIds.includes(toolId)) {
        btn.remove();
      } else if (toolId) {
        // ボタンのラベルテキストのみ取得（アイコンを除く）
        const labelSpan = btn.querySelector('span:last-child');
        const label = labelSpan?.textContent?.trim() || '';

        // ボタンのラベルがアクティブなチップに含まれているかチェック
        const isDuplicate = activeToolNames.some(chipName => {
          // ネイティブチップ「画像」とボタン「画像」の一致をチェック
          return chipName === label || (chipName && label && chipName.includes(label));
        });

        if (isDuplicate) {
          (btn as HTMLElement).style.display = 'none';
          console.log(`[Gemini Enhancer Pro] Hiding duplicate button: ${label}`);
        } else {
          (btn as HTMLElement).style.display = 'inline-flex';
        }
      }
    });

    // 各ボタンの追加
    TOOL_BUTTONS.forEach((tool) => {
      const { id, label, icon, targetText, mention } = tool;

      // 表示設定チェック
      if (!visibleToolIds.includes(id)) return;

      if (targetText) {
        const isActive = activeToolNames.some(name => name.includes(targetText));
        if (isActive) {
          const existingBtn = container.querySelector(`[data-tool-id="${id}"]`);
          if (existingBtn) existingBtn.remove();
          return;
        }
      }

      // 重複チェック
      if (container.querySelector(`[data-tool-id="${id}"]`)) return;

      // ボタン作成
      const button = document.createElement('button');
      const typeClass = tool.iconOnly ? 'google-app' : 'native-tool';
      button.className = 'gemini-enhancer-chip ' + typeClass + (tool.iconOnly ? ' icon-only' : '');
      button.dataset.toolId = id;
      button.title = label; // ホバーでラベル表示
      button.innerHTML = tool.iconOnly
        ? `<span class="icon">${icon}</span>`
        : `<span class="icon">${icon}</span><span>${label}</span>`;

      button.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (targetText) {
          // モード切替
          await executeTool(targetText);
        } else if (mention) {
          // メンション挿入
          insertMention(mention);
        }
      });

      container.appendChild(button);
    });
  } catch (e) {
    // コンテキスト無効化エラーをキャッチ
    console.warn('[Gemini Enhancer Pro] Extension context invalidated or storage error:', e);
  }
};

// ========================================
// メイン
// ========================================

const init = (): void => {
  // コンテキストチェック
  if (!chrome.runtime?.id) return;

  injectStyles();
  updateButtons();
  initContentWidth();
  initGemSearch();

  try {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      // コールバック内で再度チェック
      if (!chrome.runtime?.id) return;

      if (areaName === 'local' && changes.visibleTools) {
        updateButtons();
      }
    });
  } catch (e) {
    console.warn('[Gemini Enhancer Pro] Failed to add listener:', e);
  }
};

const observeChanges = (): void => {
  const debouncedUpdate = debounce(updateButtons, DEBOUNCE_MS);
  const observer = new MutationObserver(() => debouncedUpdate());
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

const start = (): void => {
  init();
  observeChanges();
  setTimeout(init, 1000);
  setTimeout(init, 3000);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
