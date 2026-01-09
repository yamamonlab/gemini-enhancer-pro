/**
 * Popup Script
 */

// 要素の取得
const widthSlider = document.getElementById('widthSlider') as HTMLInputElement;
const widthValue = document.getElementById('widthValue') as HTMLElement;
const resetWidthBtn = document.getElementById('resetWidth') as HTMLButtonElement;
const toolList = document.getElementById('toolList') as HTMLElement;

// 定数
const MAX_SLIDER_VALUE = 2000;
const DEFAULT_TEXT = '100%';

// ツール定義（Content Scriptと同期させる必要がある）
// ラベルはPopup用の表示名
const TOOLS = [
    // Gemini Native Tools
    { id: 'deep-research', label: '🔍 Deep Research', category: 'native' },
    { id: 'canvas', label: '🎨 Canvas', category: 'native' },
    { id: 'image-generation', label: '🍌 画像', category: 'native' },
    { id: 'video-generation', label: '🎥 動画', category: 'native' },
    { id: 'guided-learning', label: '📖 ガイド付き学習', category: 'native' },
    { id: 'visual-layout', label: '田 ビジュアル レイアウト', category: 'native' },
    // Integration (Google Workspace)
    { id: 'google-drive', label: 'Google ドライブ', category: 'integration' },
    { id: 'google-docs', label: 'Google ドキュメント', category: 'integration' },
    { id: 'gmail', label: 'Gmail', category: 'integration' },
    { id: 'google-keep', label: 'Google Keep', category: 'integration' },
    { id: 'google-calendar', label: 'Google Calendar', category: 'integration' },
    { id: 'google-maps', label: 'Google Maps', category: 'integration' },
    { id: 'youtube', label: 'YouTube', category: 'integration' },
];

/**
 * 幅設定の表示更新
 */
const updateWidthDisplay = (value: number) => {
    if (value >= MAX_SLIDER_VALUE) {
        widthValue.textContent = DEFAULT_TEXT;
    } else {
        widthValue.textContent = `${value}px`;
    }
};

/**
 * 幅設定の保存
 */
const saveWidthSettings = (value: number) => {
    let saveValue: number | null = value;
    if (value >= MAX_SLIDER_VALUE) {
        saveValue = null; // デフォルト(100%)
    }
    chrome.storage.local.set({ maxWidth: saveValue });
};

/**
 * ツール設定の保存
 */
const saveToolSettings = async () => {
    // 現在のストレージ設定を取得（非表示タブの状態を保持するため）
    const data = await chrome.storage.local.get(['visibleTools']);
    let currentVisibleTools: string[] = data.visibleTools || TOOLS.map(t => t.id);

    const checkboxes = toolList.querySelectorAll('input[type="checkbox"]');

    checkboxes.forEach((cb) => {
        const input = cb as HTMLInputElement;
        const toolId = input.value;

        if (input.checked) {
            // チェックON: リストになければ追加
            if (!currentVisibleTools.includes(toolId)) {
                currentVisibleTools.push(toolId);
            }
        } else {
            // チェックOFF: リストにあれば削除
            currentVisibleTools = currentVisibleTools.filter(id => id !== toolId);
        }
    });

    chrome.storage.local.set({ visibleTools: currentVisibleTools }, () => {
        // console.log('Visible tools saved:', currentVisibleTools);
    });
};

/**
 * ツールリストの生成
 */
const renderToolList = (visibleTools: string[], activeCategory: string) => {
    toolList.innerHTML = '';

    TOOLS.forEach(tool => {
        // カテゴリでフィルタリング
        if (tool.category !== activeCategory) return;

        const label = document.createElement('label');
        label.className = 'tool-item';

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = tool.id;

        // 現在の表示状態を反映
        const isChecked = visibleTools.includes(tool.id);
        input.checked = isChecked;

        input.addEventListener('change', saveToolSettings);

        const span = document.createElement('span');
        span.textContent = tool.label;

        label.appendChild(input);
        label.appendChild(span);
        toolList.appendChild(label);
    });
};

/**
 * 初期化
 */
const init = async () => {
    // 設定読み込み
    const data = await chrome.storage.local.get(['maxWidth', 'visibleTools']);

    // 幅設定
    const currentWidth = data.maxWidth || MAX_SLIDER_VALUE;
    widthSlider.value = String(currentWidth);
    updateWidthDisplay(currentWidth);

    // ツール設定
    const defaultToolIds = TOOLS.map(t => t.id);
    const currentVisibleTools = data.visibleTools || defaultToolIds;

    // 初期タブ: native
    let currentCategory = 'native';
    renderToolList(currentVisibleTools, currentCategory);

    // タブ切り替えイベント
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // スタイル更新
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // カテゴリ更新
            const category = (btn as HTMLElement).dataset.tab;
            if (category) {
                currentCategory = category;
                // 最新のcheckbox状態を取得する必要があるが、
                // render時に `visibleTools`（オンメモリまたはストレージ）を参照するので
                // saveToolSettingsが機能していれば、再描画前にストレージから再取得するか
                // あるいは `currentVisibleTools` 変数を更新していく必要がある。

                // シンプルにするため、ストレージから再取得して描画する
                chrome.storage.local.get(['visibleTools'], (newData) => {
                    const latestVisibleTools = newData.visibleTools || defaultToolIds;
                    renderToolList(latestVisibleTools, currentCategory);
                });
            }
        });
    });

    // 幅設定イベントリスナー
    widthSlider.addEventListener('input', (e) => {
        const value = Number((e.target as HTMLInputElement).value);
        updateWidthDisplay(value);
        saveWidthSettings(value);
    });

    resetWidthBtn.addEventListener('click', () => {
        widthSlider.value = String(MAX_SLIDER_VALUE);
        updateWidthDisplay(MAX_SLIDER_VALUE);
        saveWidthSettings(MAX_SLIDER_VALUE);
    });
};

document.addEventListener('DOMContentLoaded', init);
