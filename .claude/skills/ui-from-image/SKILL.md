---
name: ui-from-image
description: 画像からフロントエンドUIを正確に実装する。デザイン画像、モックアップ、スクリーンショットからUIを作成する際に使用。画像を忠実に再現し、完全に動作するコンポーネントを生成する。ブラウザ自動化と組み合わせて反復的に検証する。
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

# 画像からUIを実装するスキル

## ブラウザ連携ワークフロー

このスキルはMCPブラウザ自動化（claude-in-chrome）と連携して動作する。

### 反復開発フロー

```
┌─────────────────────────────────────────────────────┐
│  CAPTURE → ANALYZE → IMPLEMENT → VERIFY → COMPARE  │
│      ↑                                      │       │
│      └──────────── 差分があれば ←───────────┘       │
└─────────────────────────────────────────────────────┘
```

### Phase 1: キャプチャ（参照画像の取得）

1. **デザイン画像がある場合**: ユーザーから提供された画像を分析
2. **URLがある場合**: ブラウザでナビゲートしスクリーンショット取得
   - `mcp__claude-in-chrome__navigate` でURL移動
   - `mcp__claude-in-chrome__computer` (action: screenshot) で画面キャプチャ
   - 必要に応じて複数ビューポートで取得（モバイル: 375px、タブレット: 768px、デスクトップ: 1280px）

### Phase 2: 分析（デザイン解析）

画像から以下を抽出：
- レイアウト構造、カラーパレット、タイポグラフィ
- コンポーネント階層、インタラクションパターン
- レスポンシブブレイクポイント

### Phase 3: 実装（コード生成）

- 分析結果に基づきコンポーネントを生成
- 下記の「基本原則」と「コード品質基準」に従う

### Phase 4: 検証（ブラウザ確認）

1. 開発サーバーを起動（`npm run dev` など）
2. ブラウザで実装結果に移動
3. スクリーンショットを取得
4. 元のデザインと視覚的に比較

### Phase 5: 比較・修正

差分がある場合：
- 色、サイズ、余白、フォントを調整
- Phase 4 に戻り再検証
- 完全一致するまで反復

---

## 基本原則

1. **画像を正確に踏襲する** - 新しいUI要素を導入したり、勝手に再設計したりしない
2. **完全に動作するコードを生成する** - 適切なナビゲーション、状態管理、インタラクションを実装
3. **不足アセットは自動生成する** - デザインスタイルに完璧に一致させる
4. **クリーンアーキテクチャを優先する** - 保守性とパフォーマンスを重視

---

## 実装プロセス

### Step 1: 画像の詳細分析

画像を受け取ったら、以下を詳細に分析する：

- **レイアウト構造**: グリッド、フレックス、余白、配置
- **カラーパレット**: 正確なカラーコード（HEX/RGB）を抽出
- **タイポグラフィ**: フォントファミリー、サイズ、ウェイト、行間
- **コンポーネント**: ボタン、カード、フォーム、ナビゲーション等
- **インタラクション**: ホバー、クリック、アニメーションの推測
- **レスポンシブ**: ブレイクポイントの推測

### Step 2: コンポーネント設計

```
src/
├── components/
│   ├── ui/           # 基本UIコンポーネント
│   ├── features/     # 機能別コンポーネント
│   └── layouts/      # レイアウトコンポーネント
├── hooks/            # カスタムフック
├── utils/            # ユーティリティ関数
└── assets/           # 生成されたアセット
```

### Step 3: 状態管理の実装

- ローカル状態: `useState`, `useReducer`
- フォーム状態: 適切なバリデーション
- UIの状態: モーダル、ドロップダウン、タブ等
- 非同期状態: ローディング、エラー、成功

### Step 4: インタラクションの実装

- ホバーエフェクト
- クリックフィードバック
- トランジション・アニメーション
- キーボードナビゲーション
- アクセシビリティ（ARIA属性）

---

## 不足アセットの自動生成

### アイコン

デザインのスタイルに合わせて以下から選択・生成：
- Lucide Icons / Heroicons / Phosphor Icons（SVG）
- カスタムSVGの生成

```tsx
// 例: アイコンコンポーネント
import { LucideIcon } from 'lucide-react';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
}
```

### プレースホルダー画像

```tsx
// アバター
<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />

// イラスト・背景
<div className="bg-gradient-to-r from-gray-100 to-gray-200" />
```

### SVGイラスト

デザインに合わせたシンプルなSVGを生成：
- 幾何学的パターン
- 抽象的な装飾
- アイコン風イラスト

---

## コード品質基準

### クリーンアーキテクチャ

```tsx
// 良い例: 関心の分離
// components/features/UserCard/UserCard.tsx
export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  return (
    <Card>
      <UserAvatar src={user.avatar} />
      <UserInfo name={user.name} email={user.email} />
      <UserActions onEdit={handleEdit} onDelete={handleDelete} />
    </Card>
  );
};

// hooks/useUser.ts
export const useUser = (userId: string) => {
  // データフェッチロジック
};
```

### パフォーマンス最適化

- `React.memo` で不要な再レンダリング防止
- `useMemo`, `useCallback` の適切な使用
- 画像の遅延読み込み
- コード分割（動的インポート）

### 型安全性

```tsx
interface ComponentProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
}
```

---

## 出力フォーマット

### 1. コンポーネントファイル

```tsx
// ComponentName.tsx
import React from 'react';

interface ComponentNameProps {
  // 型定義
}

export const ComponentName: React.FC<ComponentNameProps> = (props) => {
  // 実装
};
```

### 2. スタイル（Tailwind CSS推奨）

```tsx
// Tailwindクラスを使用
<div className="flex items-center gap-4 p-6 bg-white rounded-xl shadow-sm">
```

### 3. カスタムフック

```tsx
// useComponentName.ts
export const useComponentName = () => {
  // ロジック
};
```

---

## チェックリスト

実装完了前に確認：

- [ ] 画像のデザインを正確に再現している
- [ ] すべてのインタラクションが動作する
- [ ] 状態管理が適切に実装されている
- [ ] 不足アセットがデザインに一致している
- [ ] レスポンシブ対応している
- [ ] アクセシビリティが考慮されている
- [ ] TypeScriptの型が適切に定義されている
- [ ] パフォーマンスが最適化されている
- [ ] コードがクリーンで保守しやすい

---

## ブラウザ検証チェックリスト

スクリーンショット比較時に確認：

- [ ] レイアウト構造が一致（グリッド、余白、配置）
- [ ] 色が正確（背景、テキスト、ボーダー）
- [ ] フォントが一致（ファミリー、サイズ、ウェイト）
- [ ] 画像・アイコンが適切に表示
- [ ] ホバー状態が正しく動作
- [ ] クリック/タップ時の挙動が正しい
- [ ] アニメーション・トランジションが滑らか
- [ ] 各ブレイクポイントで正しく表示

---

## 使用例

### 例1: デザイン画像から実装

```
ユーザー: この画像のUIを実装して [画像添付]

Claude:
1. 画像を分析
2. コンポーネントを生成
3. 開発サーバーで確認
4. スクリーンショットで比較
5. 必要に応じて調整
```

### 例2: 既存サイトを参考に実装

```
ユーザー: https://example.com のヘッダーを参考に実装して

Claude:
1. ブラウザでサイトにアクセス
2. スクリーンショット取得
3. デザインを分析
4. コンポーネント実装
5. 実装結果をスクリーンショットで検証
6. 元サイトと比較して調整
```

### 例3: 反復的な改善

```
ユーザー: ボタンの色が少し違う

Claude:
1. 現在の実装をスクリーンショット
2. 元のデザインと比較
3. 色を調整
4. 再度スクリーンショットで確認
5. 一致するまで反復
```
