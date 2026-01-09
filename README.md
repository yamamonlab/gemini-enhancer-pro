# Gemini Enhancer Pro

Google Geminiのウェブインターフェース (`gemini.google.com`) を拡張し、より使いやすくするためのChrome拡張機能です。

## 機能 (Features)

1.  **ツールショートカットボタン**: よく使うGem（Deep Research, Canvas等）へのショートカットをチャット入力欄に追加。
2.  **コンテンツ幅調整**: スライダーでチャット画面の幅を自由に調整可能。
3.  **Gem検索バー**: サイドバーに検索機能を追加し、カスタムGemを素早く呼び出し可能。
    *   Google Labsバナー下に見やすい検索結果セクションを表示。
    *   画面遷移で自動的に検索クエリをクリア。

詳細な仕様は [docs/features.md](./docs/features.md) をご覧ください。

## 開発 (Development)

```bash
# 依存関係のインストール
pnpm install

# 開発ビルド (Watchモード)
pnpm dev

# 本番ビルド
pnpm build
```

## インストール (Installation)

1. `pnpm build` を実行して `dist` ディレクトリを生成します。
2. Chromeで `chrome://extensions` を開きます。
3. 「デベロッパーモード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックし、`dist` ディレクトリを選択します。
