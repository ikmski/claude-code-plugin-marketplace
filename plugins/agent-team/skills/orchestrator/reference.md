# Team Orchestrator リファレンス

## Task ツールの agent_type 一覧

| 値 | 用途 | 典型的なユースケース |
|---|---|---|
| `general-purpose` | 汎用チームメイト | 実装、分析、文書作成など大半のタスク |
| `Bash` | シェルコマンド実行専門 | git 操作、ビルド、テスト実行 |
| `Explore` | コードベース探索専門 | ファイル検索、コード調査、構造把握 |
| `Plan` | 実装計画の設計 | アーキテクチャ設計、実装戦略の立案 |

### チームメイト起動時のパラメータ

チームメイトを起動する際は、以下のパラメータを指定してください：

```json
{
  "subagent_type": "general-purpose",
  "team_name": "my-team",
  "name": "researcher",
  "prompt": "..."
}
```

- `team_name`: `TeamCreate` で作成したチーム名
- `name`: チームメイトの識別名（`SendMessage` の `recipient` として使用される）

---

## Agent Teams API リファレンス

### TeamCreate

チームを作成します。チームメイト起動前に必ず呼び出してください。

```json
{
  "team_name": "my-project",
  "description": "JWT 認証実装チーム"
}
```

### SendMessage

チームメイトとのメッセージ送受信に使用します。

**type: "message"** - 特定メンバーへの直接通信

```json
{
  "type": "message",
  "recipient": "researcher",
  "content": "調査結果を受け取りました。ブロッカーの件は解消します。",
  "summary": "ブロッカー解消の通知"
}
```

**type: "broadcast"** - 全メンバーへの通知（慎重に使用）

```json
{
  "type": "broadcast",
  "content": "方針変更: 認証ライブラリを jose に変更します。",
  "summary": "方針変更の通知"
}
```

**type: "shutdown_request"** - チームメイトのシャットダウン要求

```json
{
  "type": "shutdown_request",
  "recipient": "researcher",
  "content": "作業完了。シャットダウンしてください。"
}
```

**type: "shutdown_response"** - シャットダウン要求への応答（チームメイト側）

```json
{
  "type": "shutdown_response",
  "request_id": "abc-123",
  "approve": true
}
```

### TeamDelete

全チームメイトのシャットダウン後にチームをクリーンアップします。

```
TeamDelete（パラメータ不要）
```

### チームメイト発見

`~/.claude/teams/{team-name}/config.json` を読み取ることで、チームメイトの名前・agentId を確認できます。

```json
{
  "members": [
    { "name": "sub-leader", "agentId": "...", "agentType": "general-purpose" },
    { "name": "researcher", "agentId": "...", "agentType": "general-purpose" },
    { "name": "architect", "agentId": "...", "agentType": "general-purpose" }
  ]
}
```

**IMPORTANT**: `SendMessage` での通信は常に `name` を使用してください（agentId ではなく）。

---

## コミュニケーション使い分けガイド

| 手段 | 用途 | 例 |
|------|------|-----|
| SendMessage(message) | 特定メンバーへの通知・質問 | ブロッカー報告、依頼 |
| SendMessage(broadcast) | 全メンバーへの重要通知（慎重に使用） | 方針変更、緊急停止 |
| artifacts/ | 永続的な成果物 | レポート、設計書、コード |
| issues.md | 発見した課題の非同期共有 | バグ発見、リスク記録 |
| decisions.md | 判断根拠の記録 | 設計判断、技術選択 |

---

## Leader / Sub-Leader 責務分担表

| 責務 | Leader | Sub-Leader |
|------|--------|------------|
| TeamCreate | ✅ | |
| ワークスペース作成 | ✅（context.md 課題定義のみ） | ✅（team-roster.md、追記管理） |
| Sub-Leader 起動 | ✅ | |
| 課題分析 | | ✅ |
| チーム編成設計 | | ✅ |
| チームメイト起動 | | ✅ |
| タスク管理（TaskCreate/Update） | | ✅ |
| チームメイト連携（SendMessage） | | ✅ |
| 編成案のユーザー提示 | ✅ | |
| 承認の Sub-Leader への伝達 | ✅ | |
| 進捗監視・介入判断 | | ✅ |
| Red-Team 起動 | | ✅ |
| QA-Manager 起動 | | ✅ |
| 最終報告の集約 | | ✅ |
| 最終報告のユーザー提示 | ✅ | |
| シャットダウン（shutdown_request） | ✅ | |
| TeamDelete | ✅ | |

---

## `.agent-team/` ワークスペース仕様

### ディレクトリ構造

```
.agent-team/
  context.md          # 課題コンテキスト（Leader が初期作成、Sub-Leader が追記・管理）
  team-roster.md      # チーム編成と担当範囲（Sub-Leader が作成・管理）
  issues.md           # チームメイトが発見した課題・ブロッカーの非同期記録
  decisions.md        # 判断の根拠・採用した方針の知識共有
  artifacts/
    sub-leader/       # Sub-Leader の管理成果物
    {role-name}/      # 各チームメイトの成果物（チームメイト自身が書き込む）
```

### context.md フォーマット

```markdown
# 課題コンテキスト

## 課題定義
（ユーザーから受け取った課題の要約）← Leader が初期作成

## 制約・要件
- 技術スタック: （使用言語・フレームワーク等）
- 禁止事項: （やってはいけないこと）
- 品質基準: （期待する品質レベル）

## 方針決定ログ
- [フェーズ名] （重要な方針決定の記録）

## 進捗サマリー
- [ ] {役割名}: （担当範囲）
- [x] {役割名}: 完了（成果物: artifacts/{role-name}/）
```

↑「課題定義」は Leader が作成。それ以降は Sub-Leader が追記・管理。

### issues.md フォーマット

```markdown
# 発見された課題

## [課題名]
- **発見者**: {役割名}
- **状況**: open / resolved
- **詳細**: （課題の説明）
- **提案**: （可能であれば解決案）
```

### decisions.md フォーマット

```markdown
# 判断ログ

## [判断名]
- **決定者**: {役割名}
- **判断内容**: （採用した方針・設計・技術選択）
- **根拠**: （なぜその判断をしたか）
- **却下した選択肢**: （あれば記載）
```

### team-roster.md フォーマット

```markdown
# チーム編成

## Leader（橋渡し役）
あなた（Team Lead）: ユーザーとチームの橋渡し・最終報告・クリーンアップ

## Sub-Leader（チーム運営役）
- **ミッション**: 課題分析・チーム編成・チームメイト起動・進捗管理・結果集約
- **自律性レベル**: L1
- **成果物出力先**: `.agent-team/artifacts/sub-leader/`
- **ステータス**: pending / in_progress / completed

## チームメンバー

### {役割名}
- **ミッション**: {達成すべき目標（手順ではなく目標）}
- **自律性レベル**: L1 / L2 / L3
- **成果物出力先**: `.agent-team/artifacts/{role-name}/`
- **依存関係**: {先行タスクがあれば記載}
- **ステータス**: pending / in_progress / completed

（以下、メンバー分繰り返し）

## 必須メンバー
### Red-Team
- **ミッション**: 全成果物への批判的検証・脆弱性・矛盾・改善点の洗い出し
- **自律性レベル**: L1
- **起動タイミング**: 実装フェーズ完了後

### QA-Manager
- **ミッション**: 要件充足確認・Red-Team 指摘の対応確認・最終レポート作成
- **自律性レベル**: L1
- **起動タイミング**: Red-Team 指摘対応完了後
```

`~/.claude/teams/{team-name}/config.json` にチームメイトの name と agentId が記録されます。`SendMessage` での通信には `name` を使用してください。

---

## Sub-Leader MBR テンプレート

> **参照**: Sub-Leader 起動プロンプトの完全テンプレートは `SKILL.md` の「Sub-Leader の起動プロンプト」セクションを参照してください。以下は各フィールドの解説です。

### テンプレートフィールド解説

**Phase 1（課題分析と編成案作成）で Sub-Leader が行うこと**:
- `.agent-team/context.md` を読み込み、課題の性質・規模・技術領域を分析する
- 必要な役割を定義する（最大 8 名、Red-Team + QA-Manager 必須）
- 各役割の依存関係と自律性レベルを決定する
- `SendMessage` で Leader に編成案を報告する（テーブル形式）

**Phase 2（チーム運営）で Sub-Leader が行うこと**:
- `TaskCreate` でタスク登録し、`addBlockedBy` で依存関係を設定する
- `.agent-team/team-roster.md` を作成する
- チームメイトを `Task(subagent_type, team_name, name, prompt)` で起動する（SubAgent 禁止）
- `SendMessage` でチームメイトと連携し、進捗確認・ブロッカー解消を行う
- `issues.md` を監視し、必要に応じて計画変更・追加メンバー起動を行う
- 実装完了後に Red-Team → QA-Manager を順次起動する
- 全成果物を集約し、Leader に最終報告を `SendMessage` で送る

**Boundary（境界）**:
- 自身の成果物は `.agent-team/artifacts/sub-leader/` に出力する
- チームメイト起動は必ず `team_name` と `name` を指定すること
- ユーザーへの直接報告は行わない（全て Leader 経由）

**Resources（参照可能なリソース）**:
- `.agent-team/context.md`: 課題全体の文脈（必ず最初に読む）
- `.agent-team/`: 全ワークスペースファイル
- `~/.claude/teams/{チーム名}/config.json`: チームメンバー一覧

---

## MBR プロンプトリファレンス

### MBR とは

**Mission-Boundary-Resources** の略。チームメイトに「何をするか（Mission）」「何をしてはいけないか（Boundary）」「何を参照できるか（Resources）」を示し、方法はチームメイトに委ねる委任型プロンプト構造です。

### 各セクションの書き方

**Mission（ミッション）**
- 「何を達成するか」を目標として記述する
- 手順・ステップを列挙しない
- 完了状態（Done とは何か）を明示する

**Boundary（境界）**
- 書き込み禁止ディレクトリを明示する
- 役割固有の禁止事項があれば追記する
- リスクが高い操作（本番 DB 変更など）を明示的に禁止する

**Resources（参照可能なリソース）**
- 参照すべきファイル・ディレクトリを列挙する
- 他チームメイトの artifacts への参照許可を明示する
- SendMessage で Sub-Leader に報告できることを明示する

### 良い例・悪い例

**悪い例（手順指示型）**:
```
1. まず src/auth/ ディレクトリを読んでください。
2. 次に認証フローを図に起こしてください。
3. 問題点を 3 つ以上列挙してください。
4. 改善案を markdown で出力してください。
```
→ チームメイトの判断の余地がない。手順が変わると対応不能。

**良い例（MBR 型）**:
```
# Mission
現在の認証フローにおけるセキュリティリスクと改善機会を特定し、
優先度付きの改善提案レポートを作成してください。

# Boundary
- 書き込みは .agent-team/artifacts/analyst/ のみ
- コードの変更禁止

# Resources
- .agent-team/context.md
- src/auth/: 認証関連コード
- .agent-team/artifacts/: 他チームメイトの成果物（参照可）
- 重大なリスクを発見した場合は SendMessage で Sub-Leader に報告すること
```
→ 目標が明確。調査方法・レポート構成はチームメイトが判断する。

---

## 自律性レベル詳細リファレンス

### 判断フローチャート（Decision Tree）

Sub-Leader が各チームメイトの自律性レベルを決定する際の判断フロー：

```
タスクに失敗した場合の影響は？
│
├─ 軽微（成果物を作り直せる、コードを差し戻せる）
│   └─ → L1（目標委任）を適用 ✅
│
└─ 重大（本番データ破損、セキュリティ侵害、大規模なリグレッション）
    │
    ├─ 技術的制約または標準への準拠が必要か？
    │   ├─ YES（コーディング規約、既存 API との互換性、チームの慣習など）
    │   │   └─ → L2（目標＋方針委任）を適用 ✅
    │   │
    │   └─ NO
    │       └─ ↓
    │
    └─ 実行順序が重要か（順序を誤ると回復不能な損失が生じるか）？
        ├─ YES（本番 DB 操作、外部 API 連携、マイグレーションなど）
        │   └─ → L3（ガイド付き実行）を適用 ✅
        │
        └─ NO
            └─ → L2 を検討、または L1 に戻る ✅
```

**基本原則**: デフォルトは L1。L3 は真に必要な場合のみ使用し、乱用するとチームメイトの自律性が損なわれる。

### L1: 目標委任（デフォルト）

Mission・Boundary・Resources のみ提示。方法・順序・詳細はチームメイトが全て決定します。

```
# Mission
{役割名} として、{達成すべき目標} を実現してください。

# Boundary
- 書き込みは .agent-team/artifacts/{role-name}/ のみ

# Resources
- .agent-team/context.md
- .agent-team/artifacts/: 他チームメイトの成果物（参照可）
- .agent-team/issues.md / decisions.md（参照可）
- 重要な発見は SendMessage で Sub-Leader に報告すること
```

**適用場面**: 大半のタスク。チームメイトの専門性を最大限に活かす。

### L2: 目標＋方針委任

L1 に加え、推奨アプローチや優先順位をヒントとして提示。決定権はチームメイトに委ねます。

```
# Mission
（L1 と同様）

# Approach Hints（方針ヒント）
- パフォーマンスよりも可読性を優先してください
- 既存の命名規則（camelCase）に従ってください
- テストカバレッジ 80% 以上を目標にしてください

# Boundary / Resources
（L1 と同様）
```

**適用場面**: 技術的制約が強い場合、チームの標準に合わせる必要がある場合。

### L3: ガイド付き実行

L2 に加え、主要なステップの順序を示す。チームメイトは各ステップの実装方法は自分で決定します。

```
# Mission
（L1 と同様）

# Execution Order（実行順序）
1. 既存コードのバックアップを取る
2. スキーマ変更を適用する
3. データ移行を実行する
4. 整合性チェックを行う

# Boundary / Resources
（L1 と同様）
```

**適用場面**: リスクが高い・失敗コストが大きい場合（本番 DB 操作、外部 API 連携など）。乱用禁止。

---

## チーム規模ガイドライン

| 規模 | 人数 | 適用場面 |
|---|---|---|
| 小規模 | 3〜4 名 | 単一機能の追加、バグ修正、小規模リファクタリング |
| 中規模 | 5〜7 名 | 複数機能にまたがる開発、中規模のリアーキテクチャ |
| 大規模 | 8〜10 名 | システム全体の刷新、複数サービスの連携開発 |

※ Sub-Leader + Red-Team + QA-Manager の 3 名は全規模で必須（人数カウントに含む）

---

## 典型的なチーム構成パターン

### 新機能開発（中規模: 7 名）

| 役割 | 実行順 | 自律性レベル |
|---|---|---|
| Sub-Leader | 0番目（最初に起動） | L1 |
| リサーチャー | 1番目 | L1 |
| アーキテクト | 2番目（リサーチャー完了後） | L1 |
| フロントエンジニア | 3番目（並列） | L1 |
| バックエンジニア | 3番目（並列） | L1 |
| Red-Team | 4番目 | L1 |
| QA-Manager | 5番目 | L1 |

```
Sub-Leader       → 課題分析・編成案提示・チーム運営全体
リサーチャー     → 既存コードと要件の調査
アーキテクト     → 設計決定（リサーチャーの完了後）
フロントエンジニア ─┐ 並列実行（担当ディレクトリ分割）
バックエンジニア  ─┘（アーキテクトの完了後）
Red-Team        → 実装への批判的検証
QA-Manager      → 最終確認
```

### バグ調査・修正（小規模: 5 名）

| 役割 | 実行順 | 自律性レベル |
|---|---|---|
| Sub-Leader | 0番目（最初に起動） | L1 |
| アナリスト | 1番目 | L1 |
| バグフィクサー | 2番目（アナリスト完了後） | L1 |
| Red-Team | 3番目 | L1 |
| QA-Manager | 4番目 | L1 |

```
Sub-Leader      → 課題分析・編成案提示・チーム運営全体
アナリスト      → 根本原因の特定
バグフィクサー   → 修正実装（アナリスト完了後）
Red-Team       → 修正の妥当性検証
QA-Manager     → 最終確認・リグレッション確認
```

### リファクタリング（中規模: 6 名）

| 役割 | 実行順 | 自律性レベル |
|---|---|---|
| Sub-Leader | 0番目（最初に起動） | L1 |
| アナリスト | 1番目 | L1 |
| アーキテクト | 2番目 | L1 |
| リファクタラー | 3番目 | L2（既存インターフェースを破壊しない制約） |
| Red-Team | 4番目 | L1 |
| QA-Manager | 5番目 | L1 |

```
Sub-Leader      → 課題分析・編成案提示・チーム運営全体
アナリスト      → 現状コードの問題点把握
アーキテクト    → リファクタリング方針の設計
リファクタラー   → 実装（アーキテクト完了後）
Red-Team       → 動作等価性の検証
QA-Manager     → 最終確認
```

### ドキュメント作成（小規模: 4 名）

| 役割 | 実行順 | 自律性レベル |
|---|---|---|
| Sub-Leader | 0番目（最初に起動） | L1 |
| リサーチャー | 1番目 | L1 |
| テクニカルライター | 2番目 | L1 |
| QA-Manager | 3番目 | L1 |

```
Sub-Leader            → 課題分析・編成案提示・チーム運営全体
リサーチャー          → コード・仕様の調査
テクニカルライター     → 文書作成（リサーチャー完了後）
QA-Manager           → 正確性確認・最終仕上げ
```

※ ドキュメントのみのタスクでは Red-Team を QA-Manager に統合可（例外）

---

## 並列実行パターンと依存関係

### パターン A: 完全並列

```
[タスク1] ─┐
[タスク2] ─┤→ Sub-Leader が集約 → [次のタスク]
[タスク3] ─┘
```

チームメイト並列起動（同一メッセージで複数 Task を呼び出す）:
```
// Sub-Leader がメッセージ内で並列に Task ツールを呼び出す
Task(team_name="my-team", name="agent-a", ...),
Task(team_name="my-team", name="agent-b", ...),
Task(team_name="my-team", name="agent-c", ...)  // 同時起動
↓ 全完了を待つ（SendMessage で報告を受信）
Task(team_name="my-team", name="integrator", ...)
```

### パターン B: 逐次（依存関係あり）

```
[タスク1] → 完了（SendMessage で Sub-Leader に報告）→ [タスク2] → 完了 → [タスク3]
```

### パターン C: ファンアウト→ファンイン

```
[調査] → [実装A] ─┐
                   ├→ [統合] → [Red-Team] → [QA]
        [実装B] ─┘
```

---

## TaskCreate / TaskUpdate の活用

### 依存関係の設定

```json
// アーキテクトタスクがリサーチャータスクの完了を待つ場合
TaskCreate: { subject: "アーキテクト: 設計", addBlockedBy: ["リサーチャータスクID"] }
```

### ステータス遷移

```
pending → in_progress → completed
```

Sub-Leader は各チームメイトの完了を TaskUpdate で記録し、TaskList で全体進捗を把握すること。
