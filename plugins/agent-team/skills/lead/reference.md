# Team Lead リファレンス

> プロトコル本体は `SKILL.md` を参照。本ファイルは API・テンプレート・チーム構成パターンのリファレンスです。

---

## Task ツールの agent_type 一覧

| 値 | 用途 | 典型的なユースケース |
|---|---|---|
| `general-purpose` | 汎用チームメイト | 実装、分析、文書作成など大半のタスク |
| `Bash` | シェルコマンド実行専門 | git 操作、ビルド、テスト実行 |
| `Explore` | コードベース探索専門 | ファイル検索、コード調査、構造把握 |
| `Plan` | 実装計画の設計 | アーキテクチャ設計、実装戦略の立案 |

### チームメイト起動時のパラメータ

```json
{
  "subagent_type": "general-purpose",
  "team_name": "my-team",
  "name": "researcher",
  "mode": "bypassPermissions",
  "isolation": "worktree",
  "prompt": "..."
}
```

- `team_name`: `TeamCreate` で作成したチーム名
- `name`: チームメイトの識別名（`SendMessage` の `recipient` として使用）
- `mode`: ツール使用権限モード。分類別の設定は SKILL.md Section 1.B を参照
- `isolation`: `"worktree"` を指定すると一時 git worktree 内で実行。コード変更を伴う実装系チームメイトには必須

---

## Agent Teams API リファレンス

### TeamCreate

チームを作成します。チームメイト起動前に呼び出してください。

```json
{
  "team_name": "my-project",
  "description": "JWT 認証実装チーム"
}
```

### SendMessage

チームメイトとのメッセージ送受信に使用します。

**type: "message"** - 特定チームメイトへの直接通信

```json
{
  "type": "message",
  "recipient": "researcher",
  "content": "調査結果を受け取りました。ブロッカーの件は解消します。",
  "summary": "ブロッカー解消の通知"
}
```

**type: "broadcast"** - 全チームメイトへの通知（慎重に使用）

```json
{
  "type": "broadcast",
  "content": "方針変更: 認証ライブラリを jose に変更します。",
  "summary": "方針変更の通知"
}
```

**type: "shutdown_request"** - チームメイトのシャットダウン要求（Leader のみ）

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

全チームメイトのシャットダウン後にチームをクリーンアップします（Leader のみ）。

```
TeamDelete（パラメータ不要）
```

### チームメイト発見

`~/.claude/teams/{team-name}/config.json` を読み取ることで、チームメイトの名前・agentId を確認できます。

```json
{
  "members": [
    { "name": "researcher", "agentId": "...", "agentType": "general-purpose" },
    { "name": "architect", "agentId": "...", "agentType": "general-purpose" }
  ]
}
```

`SendMessage` での通信は `name` を使用します（agentId ではなく）。Leader への通信時の `recipient` は `lead` です。

---

## コミュニケーション使い分けガイド

| 手段 | 用途 | 例 |
|------|------|-----|
| SendMessage(message) | 特定チームメイトへの通知・質問 | ブロッカー報告、依頼 |
| SendMessage(broadcast) | 全チームメイトへの重要通知（慎重に使用） | 方針変更、緊急停止 |
| artifacts/ | 永続的な成果物 | レポート、設計書、コード |
| issues.md | 発見した課題の非同期共有 | バグ発見、リスク記録 |
| decisions.md | 判断根拠の記録 | 設計判断、技術選択 |

### ハイブリッド協調モデル詳細

**通信経路（階層型）**:
- `メンバー → CoS`: 作業報告・ブロッカー報告
- `CoS → Leader`: 要約報告・エスカレーション
- `Leader → CoS`: 戦略指示・スコープ判断
- `CoS → メンバー`: 戦略指示の中継・運用指示
- チームメイト同士の直接連携（修正者→Red-Team 直接報告を含む）

**1. SendMessage（直接通信）**:
- チームメイトはブロッカー・重要な発見を CoS に報告（Leader への直接報告は原則不要）
- CoS は SendMessage を受けて即座に介入・調整。運用事項を自律判断し、Leader には要約報告のみ
- チームメイト同士の直接連携が推奨される場面:
  - 並列実行中のチームメイトが共通インターフェース仕様を確認（例: フロントエンドがバックエンド API スキーマを確認）
  - 先行チームメイトの成果物を参照しても不明点がある場合
  - 後続チームメイトが前工程の判断意図を確認
  - 修正担当者から Red-Team への修正完了報告

**2. artifacts/（成果物ベース協調）**:
- 各チームメイトは他チームメイトの `artifacts/` を自由に読み取れる
- CoS が全 artifacts を集約して統合サマリーを Leader に報告

**3. 非同期記録（issues.md / decisions.md）**:
- `issues.md`: 発見した課題・ブロッカーを非同期記録
- `decisions.md`: 判断根拠・採用方針を記録（CoS も自らの判断根拠を追記）

---

## 統合フェーズ git コマンドリファレンス

> 手順は SKILL.md Section 4b を参照。実行主体は Chief of Staff。

### マージコマンド

```bash
# worktree 確認
git worktree list

# マージ実行（マージコミットを残す）
git merge --no-ff {worktree-branch-name}

# コミットハッシュ確認
git log --oneline -5
```

### コンフリクト解消フロー

```
コンフリクト発生
  ↓
git merge --abort（CoS 実行）
  ↓
軽微: CoS がチームメイトに解消依頼（SendMessage）
大規模 / 設計判断が必要: CoS が Leader にエスカレーション
  ↓
チームメイトがコンフリクト解消済みブランチを作成し CoS に報告
  ↓
CoS が再マージ → 完了後 Leader に報告
```

CoS はコンフリクト箇所のコードを直接書き換えません（実装作業禁止）。

### worktree 確認コマンド

```bash
git worktree list                       # 全 worktree とブランチ一覧
git diff main...{branch-name}           # 特定ブランチの変更内容
```

---

## `.agent-team/` ワークスペース仕様

> ディレクトリ構造は SKILL.md Section 1.F を参照。以下は各ファイルのフォーマット詳細です。

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
- [x] {役割名}: 完了（成果物: {team-name}/artifacts/{role-name}/）
```

Leader が作成・管理します。

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

### 共有ファイルへの書き込みルール

`issues.md` および `decisions.md` は複数のチームメイトが書き込む共有ファイルです。

- **追記専用（append-only）**: 既存エントリの編集・削除は不可。末尾に追記
- **発見者の明示**: 各エントリ先頭に `**発見者**: {役割名}` をフォーマット通り記述

### team-roster.md フォーマット

```markdown
# チーム編成

## Team Lead
あなた（lead）: 課題分析・チーム編成・チームメイト起動・戦略判断・最終報告レビュー・提出

## チームメイト一覧

### {役割名}
- **ミッション**: {達成すべき目標（手順ではなく目標）}
- **自律性レベル**: L1 / L2 / L3
- **成果物出力先**: `.agent-team/{team-name}/artifacts/{role-name}/`
- **依存関係**: {先行タスクがあれば記載}
- **ステータス**: pending / in_progress / completed

## 必須チームメイト（4 名以上のチーム）

### Chief of Staff
- **ミッション**: チーム運営の仲介・運用判断・成果物集約・worktree マージ・最終報告ドラフト
- **自律性レベル**: L1
- **起動タイミング**: 最初（全チームメイトより先）

### Red-Team
- **ミッション**: 全成果物への批判的検証・全指摘クリアまでの自律ループ
- **自律性レベル**: L1
- **起動タイミング**: 実装フェーズ完了後（Leader が 1 回起動）

### QA-Manager
- **ミッション**: 要件充足確認・Red-Team 指摘の対応確認・最終レポート作成
- **自律性レベル**: L1
- **起動タイミング**: Red-Team 指摘対応完了後
```

---

## MBR プロンプトリファレンス

> MBR（Mission-Boundary-Resources）の本体テンプレートは SKILL.md Section 3 を参照。役割ごとの具体テンプレートは `skills/lead/roles/` を参照（必須役割は `roles/scaffolding/`、よく使う役割は `roles/common/` 配下）。

### 良い例・悪い例

**悪い例（手順指示型）**:
```
1. まず src/auth/ ディレクトリを読んでください
2. 次に認証フローを図に起こしてください
3. 問題点を 3 つ以上列挙してください
4. 改善案を markdown で出力してください
```
→ チームメイトの判断の余地がない。手順が変わると対応不能。

**良い例（MBR 型）**:
```
# Mission
現在の認証フローにおけるセキュリティリスクと改善機会を特定し、
優先度付きの改善提案レポートを作成してください。

# Boundary
- 書き込みは .agent-team/{team-name}/artifacts/analyst/ のみ
- 標準 Boundary（SKILL.md Section 1.C）を適用

# Resources
- .agent-team/{team-name}/context.md
- src/auth/: 認証関連コード
- .agent-team/{team-name}/artifacts/（他チームメイトの成果物、参照可）
- 重大なリスク発見時は SendMessage で Chief of Staff に報告
- Mission 完了後、SendMessage で Chief of Staff に完了報告し成果物の場所を明示
```
→ 目標が明確。調査方法・レポート構成はチームメイトが判断する。

---

## 推奨 Autonomy Protocol（任意参照フレームワーク）

チームメイトが自律的に作業を進める際の参考フレームワークです。手順を強制するものではなく、MBR の「どのように達成するかはあなたが判断してください」の精神に基づき、チームメイト自身が最適な順序を決定します。

1. **探索**: リソースを読み込み、現状を把握
2. **計画**: Mission 達成のための方針を自分で決定
3. **実行**: 計画を実行
4. **自己検証**: 成果物が Mission を満たしているか確認
5. **記録**: 発見した課題は `issues.md`、判断根拠は `decisions.md` に追記
6. **報告**: 重要な発見やブロッカーは SendMessage で Chief of Staff に報告（CoS がいないチームでは Leader に直接）
7. **完了**: 成果物を `artifacts/{role-name}/` に出力、SendMessage で Chief of Staff に完了報告

---

## 自律性レベル詳細リファレンス

### 判断フローチャート

Leader が各チームメイトの自律性レベルを決定する際の判断フロー：

```
タスクに失敗した場合の影響は？
│
├─ 軽微（成果物を作り直せる、コードを差し戻せる）
│   └─ → L1（目標委任）✅
│
└─ 重大（本番データ破損、セキュリティ侵害、大規模リグレッション）
    │
    ├─ 技術的制約または標準への準拠が必要？
    │   ├─ YES（コーディング規約、既存 API との互換性、チーム慣習など）
    │   │   └─ → L2（目標＋方針委任）✅
    │   │
    │   └─ NO
    │       └─ ↓
    │
    └─ 実行順序が重要（順序誤りで回復不能な損失）？
        ├─ YES（本番 DB 操作、外部 API 連携、マイグレーション等）
        │   └─ → L3（ガイド付き実行）✅
        │
        └─ NO
            └─ → L2 を検討、または L1 に戻る ✅
```

### L1: 目標委任（デフォルト）

Mission・Boundary・Resources のみ提示。方法・順序・詳細はチームメイトが決定します。

```
# Mission
{役割名} として、{達成すべき目標} を実現してください。

# Boundary
- 書き込みは .agent-team/{team-name}/artifacts/{role-name}/ のみ
- 標準 Boundary（SKILL.md Section 1.C）を適用

# Resources
- .agent-team/{team-name}/context.md
- .agent-team/{team-name}/artifacts/（他チームメイトの成果物、参照可）
- .agent-team/{team-name}/issues.md / decisions.md（参照可）
- Mission 完了後、SendMessage で Chief of Staff に完了報告し成果物の場所を明示（CoS がいないチームでは Leader に報告）
```

**適用場面**: 大半のタスク。チームメイトの専門性を最大限活かす。

### L2: 目標＋方針委任

L1 に加え、推奨アプローチや優先順位をヒントとして提示。決定権はチームメイトに委ねます。

```
# Mission
（L1 と同様）

# Approach Hints（方針ヒント）
- パフォーマンスよりも可読性を優先
- 既存の命名規則（camelCase）に従う
- テストカバレッジ 80% 以上を目標

# Boundary / Resources
（L1 と同様）
```

**適用場面**: 技術的制約が強い場合、チーム標準に合わせる必要がある場合。

### L3: ガイド付き実行

L2 に加え、主要ステップの順序を示す。各ステップの実装方法はチームメイトが決定します。

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

**適用場面**: リスク高・失敗コスト大（本番 DB 操作、外部 API 連携等）。乱用を避ける。

---

## チーム規模ガイドライン

ここでの「人数」は **Team Lead を含まないチームメイト数** を指す（Team Lead 1 名＋チームメイト最大 9 名＝総勢最大 10 名）。

| 規模 | チームメイト数 | 適用場面 |
|---|---|---|
| 小規模 | 2〜3 名 | 単一機能の追加、バグ修正、小規模リファクタリング |
| 中規模 | 4〜6 名 | 複数機能にまたがる開発、中規模のリアーキテクチャ |
| 大規模 | 7〜9 名 | システム全体の刷新、複数サービスの連携開発 |

- 4 名以上のチーム: Chief of Staff + Red-Team + QA-Manager の 3 名が必須（チームメイト人数カウントに含む）
- 3 名以下の小規模チーム: Chief of Staff 省略可（Red-Team + QA-Manager の 2 名のみ必須）

---

## 典型的なチーム構成パターン

### 新機能開発（中規模: 7 名）

| 役割 | 実行順 | 自律性 | 分類 |
|---|---|---|---|
| chief-of-staff | 最初（全体通じて稼働） | L1 | 統合系 |
| researcher | 1番目 | L1 | 調査系 |
| architect | 2番目（researcher 後） | L1 | 調査系 |
| frontend-engineer | 3番目（並列） | L1 | 実装系 |
| backend-engineer | 3番目（並列） | L1 | 実装系 |
| red-team | 4番目 | L1 | 調査系 |
| qa-manager | 5番目 | L1 | 調査系 |

```
chief-of-staff（最初に起動・全体仲介）
researcher        → 既存コードと要件の調査
architect         → 設計決定（researcher 完了後）
frontend-engineer ─┐ 並列（担当ディレクトリ分割）
backend-engineer  ─┘（architect 完了後）
red-team          → 実装への批判的検証（報告先: CoS）
qa-manager        → 最終確認
chief-of-staff    → 統合サマリー・マージ実行・最終報告ドラフト
```

### バグ調査・修正（中規模: 5 名）

| 役割 | 実行順 | 自律性 | 分類 |
|---|---|---|---|
| chief-of-staff | 最初（全体通じて稼働） | L1 | 統合系 |
| analyst | 1番目 | L1 | 調査系 |
| 担当ドメインエンジニア（バグ発生領域による。例: backend-engineer） | 2番目（analyst 後） | L1 | 実装系 |
| red-team | 3番目 | L1 | 調査系 |
| qa-manager | 4番目 | L1 | 調査系 |

### リファクタリング（中規模: 6 名）

| 役割 | 実行順 | 自律性 | 分類 |
|---|---|---|---|
| chief-of-staff | 最初（全体通じて稼働） | L1 | 統合系 |
| analyst | 1番目 | L1 | 調査系 |
| architect | 2番目 | L1 | 調査系 |
| 担当ドメインエンジニア（リファクタリング対象領域による。例: backend-engineer） | 3番目 | L2（既存 I/F 非破壊） | 実装系 |
| red-team | 4番目 | L1 | 調査系 |
| qa-manager | 5番目 | L1 | 調査系 |

### ドキュメント作成（小規模: 3 名）※ CoS 不要

| 役割 | 実行順 | 自律性 | 分類 |
|---|---|---|---|
| researcher | 1番目 | L1 | 調査系 |
| tech-writer | 2番目 | L1 | 調査系 |
| qa-manager | 3番目 | L1 | 調査系 |

ドキュメントのみのタスクでは Red-Team の批判的検証機能を QA-Manager に統合可（例外）。3 名以下の小規模チームでは CoS 不要（Leader が直接集約・報告）。

---

## 並列実行パターンと依存関係

### パターン A: 完全並列

```
[タスク1] ─┐
[タスク2] ─┤→ CoS が集約・要約 → Leader → [次のタスク]
[タスク3] ─┘
```

Leader が同一メッセージで複数 Task を並列起動:
```
Task(team_name="my-team", name="agent-a", ...),
Task(team_name="my-team", name="agent-b", ...),
Task(team_name="my-team", name="agent-c", ...)   // 同時起動
```

### パターン B: 逐次（依存関係あり）

```
[タスク1] → 完了 → [タスク2] → 完了 → [タスク3]
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
// architect タスクが researcher タスクの完了を待つ場合
TaskCreate: { subject: "architect: 設計", addBlockedBy: ["researcher タスクID"] }
```

### ステータス遷移

```
pending → in_progress → completed
```

Leader は各チームメイトの完了を TaskUpdate で記録し、TaskList で全体進捗を把握します。

---

## 追加チームメイト提案リファレンス

### チームメイトからの提案形式

チームメイトが追加人員の必要性を感じた場合、SendMessage で Chief of Staff に提案を送信します（CoS がいないチームでは Leader に直接）。

```
SendMessage(
  type="message",
  recipient="chief-of-staff",
  content="""
  追加チームメイトの提案:
  役割: {識別名}
  理由: {なぜ追加人員が必要か}
  担当範囲: {何をしてほしいか}
  """,
  summary="追加チームメイト提案"
)
```

### CoS の判断・エスカレーションフロー

1. CoS が提案を受け取り、スコープ変更を伴うと判断した場合は Leader にエスカレーション
2. Leader が必要性を評価（スコープ・コスト・チームサイズ上限を考慮）
3. 必要と判断した場合は MBR プロンプトを作成し、Task でチームメイトを起動
4. 起動完了後、提案したチームメイトに SendMessage で通知

```json
{
  "type": "message",
  "recipient": "{提案したチームメイト名}",
  "content": "{識別名} を起動しました。",
  "summary": "{識別名} 起動完了通知"
}
```
