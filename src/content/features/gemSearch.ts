/**
 * Gem検索バー機能
 * サイドバーのGemセクションに検索バーを追加し、Gem一覧ページでソートを実行する
 */

const SEARCH_BAR_ID = 'gemini-enhancer-gem-search';
const SEARCH_CONTAINER_CLASS = 'gem-search-container';
const STORAGE_KEY = 'gemini-enhancer-gem-search-query';

// セレクタ
const GEM_HEADER_SELECTOR = 'div[aria-label="Gem"]';
const GEM_LIST_PAGE_PATH = '/gems/view';

// Gem一覧ページのセレクタ
// ユーザー作成Gemのコンテナ
const BOT_ROW_CONTAINER_SELECTOR = '.bot-list-row-container';
// Google作成Gemのカード
const GALLERY_CARD_SELECTOR = 'a.template-gallery-card';

/**
 * CSSを注入
 */
const injectGemSearchStyles = (): void => {
  if (document.getElementById('gemini-enhancer-gem-search-styles')) return;

  const style = document.createElement('style');
  style.id = 'gemini-enhancer-gem-search-styles';
  style.textContent = `
    .${SEARCH_CONTAINER_CLASS} {
      padding: 8px 16px;
      margin: 4px 0;
      /* 重要: 検索バー自体が非表示にならないようにする */
      display: block !important;
    }

    .${SEARCH_CONTAINER_CLASS} input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 20px;
      font-size: 13px;
      background: rgba(0, 0, 0, 0.03);
      color: inherit;
      outline: none;
      transition: all 0.2s;
    }

    .${SEARCH_CONTAINER_CLASS} input:focus {
      border-color: #4285f4;
      background: white;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    @media (prefers-color-scheme: dark) {
      .${SEARCH_CONTAINER_CLASS} input {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
      }
      .${SEARCH_CONTAINER_CLASS} input:focus {
        background: rgba(255, 255, 255, 0.1);
        border-color: #8ab4f8;
      }
    }
    
    /* 検索結果セクション */
    .gem-search-results-section {
      /* 下のコンテンツに合わせる */
      max-width: 896px; /* Google Geminiの標準的なコンテンツ幅 */
      margin: 24px auto;
      padding: 0 16px; 
      box-sizing: border-box;
    }

    .gem-search-header {
      display: flex;
      justify-content: flex-start;
      align-items: center;
      margin-bottom: 16px;
      gap: 12px;
    }

    .gem-search-header h2 {
      font-size: 20px;
      font-weight: 400;
      color: #1f1f1f;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    /* アイコン */
    .gem-search-icon {
      color: #5f6368;
      width: 24px;
      height: 24px;
    }

    /* 検索結果グリッド */
    .gem-search-grid {
      display: flex;
      flex-direction: column;
      gap: 8px; /* アイテム間の隙間 */
    }

    /* 検索結果アイテムのラッパー */
    .gem-search-result-overlay {
      background: var(--gem-surface, #fff);
      border-radius: 12px;
      transition: background 0.2s;
    }

    @media (prefers-color-scheme: dark) {
      .gem-search-header h2 {
        color: #e3e3e3;
      }
      .gem-search-icon {
        color: #c4c7c5;
      }
      .gem-search-result-overlay {
        background: var(--gem-surface-dark, #1e1f20);
      }
    }
    
    /* 既存のバナーなどを隠す */
    .gem-search-active-banner {
      display: none; 
    }

    /* マッチしたアイテムのハイライト（オプション） */
    .gem-search-match {
      position: relative;
    }
    .gem-search-match::after {
      content: '✨ HIT';
      position: absolute;
      top: 4px;
      right: 4px;
      background: #1967d2;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
};

/**
 * Gemセクションヘッダーを取得
 * 以前の `side-nav-entry-button` が見つからない場合も考慮し、
 * テキスト "Gem" を含む要素の親などを探索するフォールバックを追加
 */
const getGemSectionHeader = (): HTMLElement | null => {
  // 1. 最も信頼できるセレクタ
  const gemLabel = document.querySelector<HTMLElement>(GEM_HEADER_SELECTOR);
  if (gemLabel) {
    return gemLabel.closest('side-nav-entry-button') as HTMLElement | null || gemLabel.parentElement;
  }

  // 2. テキストベースのフォールバック
  const allDivs = document.querySelectorAll('div');
  for (const div of allDivs) {
    // 直下の子要素がテキストのみで "Gem" である場合
    if (div.textContent?.trim() === 'Gem' && div.children.length === 0) {
      return div.closest('side-nav-entry-button') as HTMLElement | null || div.parentElement;
    }
  }

  return null;
};

/**
 * 検索バーを作成
 */
const createSearchBar = (): HTMLDivElement => {
  const container = document.createElement('div');
  container.className = SEARCH_CONTAINER_CLASS;
  container.id = SEARCH_BAR_ID;

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Gemを検索... (Enterで一覧へ)';
  input.autocomplete = 'off';

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        sessionStorage.setItem(STORAGE_KEY, query);
        // 既に一覧ページにいる場合はリロードせずにソート実行
        if (window.location.pathname === GEM_LIST_PAGE_PATH) {
          showSearchResultsOnListPage();
        } else {
          window.location.href = `https://gemini.google.com${GEM_LIST_PAGE_PATH}`;
        }
      }
    } else if (e.key === 'Escape') {
      input.value = '';
      input.blur();
    }
  });

  container.appendChild(input);
  return container;
};

/**
 * 検索バーを挿入
 */
const insertSearchBar = (): void => {
  if (document.getElementById(SEARCH_BAR_ID)) return;

  const gemHeader = getGemSectionHeader();
  if (!gemHeader) return;

  const searchBar = createSearchBar();
  // ヘッダーの後ろに挿入
  gemHeader.insertAdjacentElement('afterend', searchBar);
  // console.log('[Gemini Enhancer Pro] Gem search bar inserted');
};

/**
 * Gem一覧ページで検索結果を表示（専用セクション作成）
 */
const showSearchResultsOnListPage = (): void => {
  const query = sessionStorage.getItem(STORAGE_KEY);
  if (!query) return;

  // 既に検索結果セクションがある場合は、一旦そのままにするか、更新するか。
  // ここではDOMの変更を検知して再実行されるので、中身を再構築する方針。

  const lowerQuery = query.toLowerCase();

  // 1. ユーザー作成Gemの検索
  // 重要: 自分が作成した検索結果セクション内の要素（.gem-search-result-item）は除外する
  const allBotRows = Array.from(document.querySelectorAll<HTMLElement>(BOT_ROW_CONTAINER_SELECTOR));
  const sourceBotRows = allBotRows.filter(el => !el.closest('#gemini-enhancer-search-results'));

  const matchedBotRows: HTMLElement[] = [];
  sourceBotRows.forEach(row => {
    const text = row.textContent?.toLowerCase() || '';
    if (text.includes(lowerQuery)) {
      matchedBotRows.push(row);
    }
  });

  // 2. Google作成Gemの検索
  const allCards = Array.from(document.querySelectorAll<HTMLElement>(GALLERY_CARD_SELECTOR));
  const sourceCards = allCards.filter(el => !el.closest('#gemini-enhancer-search-results'));

  const matchedCards: HTMLElement[] = [];
  sourceCards.forEach(card => {
    const text = card.textContent?.toLowerCase() || '';
    if (text.includes(lowerQuery)) {
      matchedCards.push(card);
    }
  });

  const totalMatches = matchedBotRows.length + matchedCards.length;

  // 検索結果セクションの構築
  createSearchResultsSection(query, totalMatches, matchedBotRows, matchedCards);
};

// 要素が見つかるまで待機するユーティリティ
const waitForElement = (selector: string, timeout: number = 5000): Promise<Element | null> => {
  return new Promise((resolve) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }

    const observer = new MutationObserver((_, obs) => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    setTimeout(() => {
      observer.disconnect();
      resolve(null);
    }, timeout);
  });
};

// 検索結果セクションを作成・更新
const createSearchResultsSection = async (
  query: string,
  matchCount: number,
  botRows: HTMLElement[],
  cards: HTMLElement[]
) => {
  // 正しい挿入先が見つかるまで待機
  const banner = await waitForElement('all-opals, .premade-gems', 3000);
  const innerContainer = document.querySelector('.inner-container');

  // 挿入先が見つからない場合はスキップ（レイアウト崩れ防止）
  if (!banner && !innerContainer) {
    console.warn('[Gemini Enhancer Pro] Search results insertion point not found, retrying...');
    return;
  }

  let section = document.getElementById('gemini-enhancer-search-results');

  // セクションがなければ作成
  if (!section) {
    section = document.createElement('div');
    section.id = 'gemini-enhancer-search-results';
    section.className = 'gem-search-results-section';

    if (banner && banner.parentElement) {
      banner.insertAdjacentElement('afterend', section);
    } else if (innerContainer) {
      const h1 = innerContainer.querySelector('h1');
      if (h1) {
        h1.insertAdjacentElement('afterend', section);
        section.style.marginTop = '16px';
      } else {
        innerContainer.insertBefore(section, innerContainer.firstChild);
      }
    }
  }

  // 中身を一度クリア（これで重複を防ぐ）
  section.innerHTML = '';

  if (matchCount === 0) {
    section.innerHTML = `
      <div class="gem-search-header">
        <svg class="gem-search-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
        <h2>「${query}」の検索結果: ヒットなし</h2>
      </div>`;
    return;
  }

  // ヘッダー（バナー）
  section.innerHTML = `
    <div class="gem-search-header">
      <svg class="gem-search-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
      <h2>「${query}」の検索結果 (${matchCount}件)</h2>
    </div>
    <div class="gem-search-grid" id="gemSearchGrid"></div>
  `;

  // リストコンテナ
  const grid = section.querySelector('#gemSearchGrid');
  if (!grid) return;

  // アイテムを追加（クローンを作成）
  const appendClone = (original: HTMLElement) => {
    const clone = original.cloneNode(true) as HTMLElement;
    clone.classList.add('gem-search-result-item');
    // クローンのスタイルをリセット/調整
    clone.style.width = '100%';
    clone.style.margin = '0';
    // もし元が特定の幅を持っていた場合、解除する
    clone.style.maxWidth = 'none';

    grid.appendChild(clone);
  };

  // ユーザーGem
  botRows.forEach(appendClone);
  // Google Gem
  cards.forEach(appendClone);
};

// バナー表示（ヒットなし用などのフォールバック）は削除するか、残すとしても既存のものは消す
const removeLegacyBanner = () => {
  document.querySelector('.gem-search-active-banner')?.remove();
};

/**
 * 初期化
 */
/**
 * 初期化
 */
export const initGemSearch = (): void => {
  injectGemSearchStyles();

  // 1. 検索実行ロジック (Gem一覧ページ用)
  const handleGemListPage = () => {
    if (window.location.pathname === GEM_LIST_PAGE_PATH) {
      removeLegacyBanner();

      // DOM構築を待って複数回実行
      let isUpdating = false;
      const runSearch = () => {
        if (isUpdating) return;
        isUpdating = true;

        requestAnimationFrame(() => {
          showSearchResultsOnListPage();
          isUpdating = false;
        });
      };

      setTimeout(runSearch, 500);
      setTimeout(runSearch, 1500);
      setTimeout(runSearch, 3000);

      // MutationObserverでも監視（検索結果表示用）
      let debounceTimer: ReturnType<typeof setTimeout>;
      const listObserver = new MutationObserver((mutations) => {
        const shouldUpdate = mutations.some(mutation => {
          const target = mutation.target as HTMLElement;
          return !target.closest('#gemini-enhancer-search-results');
        });

        if (shouldUpdate) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(runSearch, 300);
        }
      });

      listObserver.observe(document.body, {
        childList: true,
        subtree: true
      });

      // ページ離脱時のクリーンアップ用にObserverを返すことも可能だが、
      // SPA遷移全体を監視する方が確実
    }
  };

  // 初回実行
  handleGemListPage();

  // 2. サイドバー検索窓の監視 (全ページ共通)
  // 常に監視して、なければ挿入する
  insertSearchBar();

  const sidebarObserver = new MutationObserver(() => {
    if (!document.getElementById(SEARCH_BAR_ID)) {
      insertSearchBar();
    }
  });

  sidebarObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // 3. 画面遷移監視 (クエリクリア & ページごとのLogic実行用)
  let lastPath = window.location.pathname;

  const handleUrlChange = () => {
    const currentPath = window.location.pathname;

    // Gem一覧ページから別のページに移動した場合、検索クエリをクリア
    if (lastPath === GEM_LIST_PAGE_PATH && currentPath !== GEM_LIST_PAGE_PATH) {
      sessionStorage.removeItem(STORAGE_KEY);
    }

    lastPath = currentPath;

    // 新しいページがGem一覧なら検索表示ロジックを実行
    if (currentPath === GEM_LIST_PAGE_PATH) {
      handleGemListPage();
    }
  };

  // URL変更を検知するためのポーリングまたはObserver
  // History APIのフックは複雑になるので、setIntervalまたはMutationObserverで代用
  setInterval(handleUrlChange, 500);
};
