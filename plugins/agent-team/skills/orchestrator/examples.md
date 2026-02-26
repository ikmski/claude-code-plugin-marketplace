# Team Orchestrator 会話例

---

## 例 1: 小規模タスク（4 名チーム、逐次実行）

**シナリオ**: バグ修正依頼

---

**ユーザー:**
> ログイン時に稀にセッションが無効になるバグがある。チームで調査・修正してほしい。

**Leader（あなた）:**

承知しました。チームを編成してバグ修正にあたります。課題を分析し、編成案を提示します。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="session-bug-fix", description="セッション無効化バグ修正チーム")

// ワークスペース作成
Bash: mkdir -p .agent-team/artifacts
Write: .agent-team/context.md
// context.md 内容:
// # 課題コンテキスト
// ## 課題定義
// ログイン時に稀にセッションが無効になるバグを調査し修正する

Write: .agent-team/issues.md（空ファイル）
Write: .agent-team/decisions.md（空ファイル）
```

**Leader（課題分析・編成案作成）:**

課題を分析します。セッション管理バグの調査・修正は以下の流れが最適です：
- アナリストが根本原因を特定し、バグフィクサーが修正する逐次フロー
- 修正後は Red-Team が妥当性検証、QA-Manager が最終確認

**Leader（ユーザーへ提示）:**

以下のチーム編成を提案します。

**チーム編成案（4 名）**

| 役割 | ミッション | 実行順 | 自律性レベル |
|---|---|---|---|
| アナリスト | セッション無効化の根本原因を特定する | 1番目 | L1 |
| バグフィクサー | 特定された根本原因を修正する | 2番目（アナリスト完了後） | L1 |
| Red-Team | 修正の妥当性・副作用・セキュリティリスクを批判的に検証する | 3番目 | L1 |
| QA-Manager | 初期要件の達成を確認し最終レポートを作成する | 4番目 | L1 |

承認いただけますか？

**ユーザー:**
> 進めてください。

**Leader（初期チームメイトを起動）:**

```
// Step 1: アナリストを起動
Task(
  subagent_type="Explore",
  team_name="session-bug-fix",
  name="analyst",
  prompt="""
  # Mission
  セッション管理に関連するコードを調査し、ログイン時にセッションが稀に無効になる
  根本原因を特定してください。調査方法・範囲はあなたが判断してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/analyst/ のみ
  - コードの変更禁止
  （標準 Boundary を適用）

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/（他チームメイトの成果物、参照可）
  - src/auth/（認証・セッション関連コード）
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)

// タスク登録・team-roster.md 作成
TaskCreate: "アナリスト: セッション管理調査"
TaskCreate: "バグフィクサー: 修正実装"（addBlockedBy: [アナリストID]）
Write: .agent-team/team-roster.md
```

**（アナリスト完了後）Leader がバグフィクサーを起動:**

```
Task(
  subagent_type="general-purpose",
  team_name="session-bug-fix",
  name="bugfixer",
  prompt="""
  # Mission
  アナリストが特定したセッション無効化の根本原因を修正してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/bugfixer/ のみ（修正コードは isolation: "worktree" で隔離された環境で変更すること）
  - worktree を使用しない場合は担当ソースディレクトリ（src/auth/）のみへの書き込みとし、他のソースファイルへの書き込みは禁止
  （標準 Boundary を適用）

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/analyst/investigation-report.md（調査結果）
  - .agent-team/issues.md / decisions.md
  - src/auth/（修正対象コード）
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)
```

**（バグフィクサー完了後）Leader が Red-Team を起動:**

```
Task(
  subagent_type="general-purpose",
  team_name="session-bug-fix",
  name="red-team",
  prompt="""
  # Mission
  修正の妥当性・副作用・セキュリティリスクを批判的に検証してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/red-team/ のみ
  （標準 Boundary を適用）

  # Resources
  - .agent-team/artifacts/bugfixer/fix-description.md
  - src/auth/
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)
```

**（Red-Team・QA-Manager 完了後）Leader（クリーンアップ・最終報告）:**

```
// artifacts/ と QA-Manager レポートを直接確認して集約
Read: .agent-team/artifacts/qa-manager/final-report.md

SendMessage(type="shutdown_request", recipient="analyst", content="作業完了。シャットダウンしてください。")
SendMessage(type="shutdown_request", recipient="bugfixer", content="作業完了。シャットダウンしてください。")
SendMessage(type="shutdown_request", recipient="red-team", content="作業完了。シャットダウンしてください。")
SendMessage(type="shutdown_request", recipient="qa-manager", content="作業完了。シャットダウンしてください。")
TeamDelete()
```

**Leader（ユーザーへの最終報告）:**

チーム作業が完了しました。

**成果:** セッション無効化の原因は並行リクエスト時のレースコンディションと特定。ロック機構を追加して修正済み。

Red-Team の指摘（タイムアウト値の見直し）も対応済みです。詳細は `.agent-team/artifacts/qa-manager/final-report.md` をご覧ください。

---

## 例 2: 自律的課題発見（チームメイトが issues.md と SendMessage を活用）

**シナリオ**: データ移行スクリプトの作成中に想定外の問題を発見

---

**ユーザー:**
> v1 から v2 へのデータ移行スクリプトをチームで作成してほしい。

**Leader（あなた）:**

データ移行タスクですね。課題を分析してチーム構成を提案します。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="data-migration", description="v1→v2 データ移行チーム")

// ワークスペース作成
Write: .agent-team/context.md
// ## 課題定義
// v1 から v2 へのデータ移行スクリプトを作成する

Write: .agent-team/issues.md（空ファイル）
Write: .agent-team/decisions.md（空ファイル）
```

**Leader（課題分析・編成案作成）:**

データ移行はスキーマ分析→スクリプト実装→検証の逐次フローが必要です。本番 DB 保護のため L2 を適用します。

**Leader（ユーザーへ提示・承認取得）:**

以下の 4 名チームを提案します。

| 役割 | ミッション | 実行順 | 自律性レベル |
|---|---|---|---|
| アナリスト | v1/v2 のスキーマ差異と移行要件を分析する | 1番目 | L1 |
| 移行エンジニア | データ移行スクリプトを実装する | 2番目（アナリスト完了後） | L2（本番 DB 保護） |
| Red-Team | 移行スクリプトのリスクと欠陥を徹底検証する | 3番目 | L1 |
| QA-Manager | 最終確認とレポート作成 | 4番目 | L1 |

承認いただけますか？

**ユーザー:**
> 進めて。

**Leader（アナリストを起動）:**

```
Task(
  subagent_type="Explore",
  team_name="data-migration",
  name="analyst",
  prompt="""
  # Mission
  v1 から v2 へのデータ移行に必要な情報を全て収集・分析してください。
  スキーマ差異、移行対象データ量、依存関係を明らかにしてください。

  # Boundary
  - 書き込みは .agent-team/artifacts/analyst/ のみ
  - データベースへの書き込み禁止
  （標準 Boundary を適用）

  # Resources
  - .agent-team/context.md
  - db/schema/v1/, db/schema/v2/: スキーマ定義
  - 移行リスクは .agent-team/issues.md に記録すること
  - 重大なブロッカーや想定外の問題は SendMessage で Leader に即時報告すること
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)

// タスク登録・team-roster.md 作成
TaskCreate: "アナリスト: スキーマ差異分析"
TaskCreate: "移行エンジニア: 移行スクリプト実装"（addBlockedBy: [アナリストID]）
Write: .agent-team/team-roster.md
```

**（アナリストが issues.md に記録し、Leader に SendMessage で報告）:**

```markdown
# 発見された課題

## 循環参照によるデータ整合性リスク
- **発見者**: アナリスト
- **状況**: open
- **詳細**: v1 の orders テーブルと customers テーブルに循環参照がある。
  単純な移行順序では外部キー制約違反が発生する可能性がある。
- **提案**: 移行中に外部キー制約を一時無効化するか、移行順序を慎重に設計する必要がある。

## 孤立データの存在
- **発見者**: アナリスト
- **状況**: open
- **詳細**: v1 の約 3% のレコードが参照先の存在しない孤立データ。
  v2 の NOT NULL 制約に違反する可能性がある。
- **提案**: 移行前にクレンジングスクリプトが必要かもしれない。
```

アナリスト → Leader（SendMessage）:
> 「循環参照と孤立データという重大なブロッカーを発見しました。データクレンジング担当の追加をご検討ください。issues.md を参照してください。」

**Leader（提案を評価し、data-cleaner を追加起動すると判断）:**

```
// 追加タスク登録
TaskCreate: "データクレンジング担当: 孤立データ処理"（addBlockedBy: [アナリストID]）

// data-cleaner を起動（Leader が直接 MBR プロンプトを作成して起動）
Task(
  subagent_type="general-purpose",
  team_name="data-migration",
  name="data-cleaner",
  prompt="""
  # Mission
  v1 データベースの孤立データと循環参照問題を解決し、v2 への移行を安全に行える
  クレンジングスクリプトを作成してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/data-cleaner/ のみ
  - 本番 DB への直接書き込み禁止（スクリプトの作成のみ）
  （標準 Boundary を適用）

  # Resources
  - .agent-team/context.md
  - .agent-team/artifacts/analyst/migration-analysis.md
  - .agent-team/issues.md（発見された問題の詳細）
  - db/schema/v1/: 現行スキーマ
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)

// 提案したアナリストに起動完了を通知
SendMessage(
  type="message",
  recipient="analyst",
  content="data-cleaner を起動しました。クレンジング完了後に移行エンジニアを起動します。",
  summary="data-cleaner 起動完了通知"
)
```

**（data-cleaner 完了後）Leader が移行エンジニアを起動:**

```
Task(
  subagent_type="general-purpose",
  team_name="data-migration",
  name="migration-engineer",
  prompt="""
  # Mission
  v1 から v2 へのデータ移行スクリプトを実装してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/migration-engineer/ のみ
  - 本番 DB への直接書き込み禁止（スクリプトの作成のみ）
  （標準 Boundary を適用）

  # Approach Hints（L2: リスク考慮）
  - ロールバック可能な設計にすること
  - バッチ処理でメモリ使用量を制御すること
  - 進捗ログを出力すること

  # Resources
  - .agent-team/context.md
  - .agent-team/artifacts/analyst/migration-analysis.md
  - .agent-team/artifacts/data-cleaner/（クレンジングスクリプト）
  - .agent-team/decisions.md
  - Mission 完了後は必ず SendMessage で Leader に完了報告し、成果物の場所を明示すること
  """)

// Red-Team → QA-Manager も Leader が起動（実装完了後）
```

**Leader（クリーンアップ・最終報告）:**

```
// artifacts/ と QA-Manager レポートを直接確認して集約
Read: .agent-team/artifacts/qa-manager/final-report.md

SendMessage(type="shutdown_request", recipient="analyst", ...)
SendMessage(type="shutdown_request", recipient="data-cleaner", ...)
SendMessage(type="shutdown_request", recipient="migration-engineer", ...)
SendMessage(type="shutdown_request", recipient="red-team", ...)
SendMessage(type="shutdown_request", recipient="qa-manager", ...)
TeamDelete()
```

**Leader（ユーザーへ最終報告）:**

チーム作業が完了しました。

当初 4 名の計画でしたが、アナリストが循環参照・孤立データ問題を発見し SendMessage で報告してくれたため、データクレンジング担当を追加して計 5 名で対応しました。

**成果:**
- データクレンジングスクリプト: 孤立レコード 3% の安全な処理
- 移行スクリプト: 循環参照を考慮したバッチ移行、ロールバック対応

Red-Team・QA-Manager の確認済みです。詳細は `.agent-team/artifacts/qa-manager/final-report.md` をご覧ください。
