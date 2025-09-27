# おしAI - 相談先推薦AI

あなたの質問に最適な相談先を見つけるAIアプリケーションです。

## 🌟 特徴

- 🤖 **AI搭載**: あなたの質問内容を分析し、最適な相談先を提案
- 🎨 **美しいUI**: 直感的で使いやすいインターフェース
- ⚡ **高速レスポンス**: n8n Webhookとの連携で素早い回答
- 📱 **レスポンシブ対応**: PC・スマホ・タブレットで利用可能

## 🚀 技術スタック

- **フロントエンド**: React 19 + TypeScript + Vite
- **スタイリング**: Tailwind CSS v4 + Shadcn UI
- **バックエンド**: n8n Webhook
- **デプロイ**: Vercel

## 💻 開発環境

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# プレビュー
npm run preview
```

## 🎯 使い方

1. トップページで相談内容を入力
2. 「相談先を探す ✨」ボタンをクリック
3. AIが分析した最適な相談先を確認
4. 表示された人物に連絡を取ってみましょう！

## 🔧 設定

Webhookエンドポイントは `src/App.tsx` の `WEBHOOK_URL` で変更できます。

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

Made with ❤️ by Affective Design Lab
