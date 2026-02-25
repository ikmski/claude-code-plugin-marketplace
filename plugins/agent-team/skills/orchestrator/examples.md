# Team Orchestrator 会話例

---

## 例 1: 小規模タスク（5 名チーム、逐次実行）

**シナリオ**: バグ修正依頼

---

**ユーザー:**
> ログイン時に稀にセッションが無効になるバグがある。チームで調査・修正してほしい。

**Leader（あなた）:**

承知しました。チームを編成してバグ修正にあたります。Sub-Leader が課題を分析し、編成案を提示します。少々お待ちください。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="session-bug-fix", description="セッション無効化バグ修正チーム")

// ワークスペース作成
Bash: mkdir -p .agent-team/artifacts/{sub-leader}
Write: .agent-team/context.md
// context.md 内容:
// # 課題コンテキスト
// ## 課題定義
// ログイン時に稀にセッションが無効になるバグを調査し修正する

Write: .agent-team/issues.md（空ファイル）
Write: .agent-team/decisions.md（空ファイル）

// Sub-Leader を Agent Teams チームメイトとして起動
Task(
  subagent_type="general-purpose",
  team_name="session-bug-fix",
  name="sub-leader",
  prompt="""
  あなたはこのチームの Sub-Leader です。
  Leader（ファシリテーター）からの委任を受け、課題分析・チーム編成設計・チームメイト運営を全て担います。

  ⚠️ 厳守事項（削除・緩和禁止）：
  - Task ツールでのチームメイト起動は禁止（メンバー起動は全て Leader が行う）
  - SendMessage(type: "shutdown_request") の送信は禁止
  - TeamDelete の呼び出しは禁止

  # Phase 1: 課題分析と編成案作成

  1. .agent-team/context.md を読み込み、課題を分析する
  2. 必要な役割を定義する（Red-Team + QA-Manager 必須）
  3. 依存関係と自律性レベルを決定する
  4. 各メンバーの MBR プロンプトを作成する（Boundary に禁止事項 3 点を含めること）
  5. SendMessage で Leader に編成案（テーブル + 各メンバーの MBR プロンプト）を報告する

  # Phase 2: チーム運営（Leader からの「全メンバー起動完了」通知を受けた後）

  6. TaskCreate でタスク登録（addBlockedBy で依存関係設定）
  7. .agent-team/team-roster.md を作成する
  8. SendMessage でチームメイトと連携し、進捗確認・ブロッカー解消を行う
  9. 実装完了後に Red-Team → QA-Manager の [SPAWN_REQUEST] を Leader に送信する
  10. 全成果物を集約し、Leader に最終報告を SendMessage で送る

  # Boundary
  - 自身の成果物は .agent-team/artifacts/sub-leader/ に出力する
  - Task ツールでのチームメイト起動は禁止
  - SendMessage(type: "shutdown_request") の送信は禁止
  - TeamDelete の呼び出しは禁止

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/: 全ワークスペースファイル
  - ~/.claude/teams/session-bug-fix/config.json: チームメンバー一覧
  """)
```

**Sub-Leader → Leader（SendMessage）:**

> チーム名: session-bug-fix
> 提案するチーム編成:
>
> | 役割 | ミッション | 実行順 | 自律性レベル |
> |---|---|---|---|
> | アナリスト | セッション無効化の根本原因を特定する | 1番目 | L1 |
> | バグフィクサー | 特定された根本原因を修正する | 2番目（アナリスト完了後） | L1 |
> | Red-Team | 修正の妥当性・副作用・セキュリティリスクを批判的に検証する | 3番目（[SPAWN_REQUEST]） | L1 |
> | QA-Manager | 初期要件の達成を確認し最終レポートを作成する | 4番目（[SPAWN_REQUEST]） | L1 |
>
> 依存関係: アナリスト → バグフィクサー → Red-Team → QA-Manager（逐次）
>
> ## 各メンバーの MBR プロンプト
>
> ### アナリスト
> subagent_type: Explore / name: analyst
> prompt: |
>   # Mission
>   セッション管理に関連するコードを調査し、ログイン時にセッションが稀に無効になる根本原因を特定してください。
>   # Boundary
>   - 書き込みは .agent-team/artifacts/analyst/ のみ
>   - コードの変更禁止
>   - Task ツールでのエージェント起動禁止
>   - SendMessage(type: "shutdown_request") 送信禁止
>   - TeamDelete 呼び出し禁止
>   # Resources
>   - .agent-team/context.md（必ず最初に読む）
>   - src/auth/（認証・セッション関連コード）
>
> ### バグフィクサー
> subagent_type: general-purpose / name: bugfixer
> prompt: |
>   # Mission
>   アナリストが特定したセッション無効化の根本原因を修正してください。
>   # Boundary
>   - 書き込みは .agent-team/artifacts/bugfixer/ のみ（コード変更は src/auth/ のみ）
>   - Task ツールでのエージェント起動禁止
>   - SendMessage(type: "shutdown_request") 送信禁止
>   - TeamDelete 呼び出し禁止
>   # Resources
>   - .agent-team/artifacts/analyst/investigation-report.md（調査結果）

**Leader（ユーザーへ提示）:**

以下のチーム編成を提案します。

**チーム編成案（4 名 + Sub-Leader）**

| 役割 | ミッション | 実行順 | 自律性レベル |
|---|---|---|---|
| アナリスト | セッション無効化の根本原因を特定する | 1番目 | L1 |
| バグフィクサー | 特定された根本原因を修正する | 2番目（アナリスト完了後） | L1 |
| Red-Team | 修正の妥当性・副作用・セキュリティリスクを批判的に検証する | 3番目 | L1 |
| QA-Manager | 初期要件の達成を確認し最終レポートを作成する | 4番目 | L1 |

承認いただけますか？

**ユーザー:**
> 進めてください。

**Leader（Sub-Leader に承認を SendMessage で伝達し、初期メンバーを起動）:**

```
// 承認を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="編成案が承認されました。初期メンバーを起動します。",
  summary="編成案承認・初期メンバー起動開始"
)

// Step 1: アナリストを起動（Sub-Leader 提供の MBR プロンプトを使用）
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
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/（他チームメイトの成果物、参照可）
  - src/auth/（認証・セッション関連コード）

  # Autonomy Protocol
  1. 探索: context.md とセッション管理コードを把握する
  2. 計画: 調査すべき観点を自分で決定する
  3. 実行: 調査を実施する
  4. 自己検証: 根本原因の仮説を立て、証拠を確認する
  5. 記録: 調査中に気づいた関連課題は .agent-team/issues.md に追記する
  6. 報告: 重大なブロッカーや発見は SendMessage で Sub-Leader に直接報告する
  7. 完了: .agent-team/artifacts/analyst/investigation-report.md を出力する
  """)

// アナリスト起動完了を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="analyst を起動しました。アナリスト完了後にバグフィクサーを起動します。",
  summary="analyst 起動完了通知"
)
```

**（アナリスト完了後）Leader がバグフィクサーを起動:**

```
// Sub-Leader から指示を受け、バグフィクサーを起動
Task(
  subagent_type="general-purpose",
  team_name="session-bug-fix",
  name="bugfixer",
  prompt="""
  # Mission
  アナリストが特定したセッション無効化の根本原因を修正してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/bugfixer/ のみ（修正コードは isolation: "worktree" で隔離された環境で変更すること）
  - 他チームメイトの artifacts への書き込み禁止
  - worktree を使用しない場合は担当ソースディレクトリ（src/auth/）のみへの書き込みとし、他のソースファイルへの書き込みは禁止
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/analyst/investigation-report.md（調査結果）
  - .agent-team/issues.md / decisions.md
  - src/auth/（修正対象コード）

  # Autonomy Protocol
  1-7. （標準プロトコル）
  6. 報告: SendMessage で Sub-Leader に直接報告する
  7. 完了: .agent-team/artifacts/bugfixer/fix-description.md を出力する
  """)

SendMessage(
  type="message",
  recipient="sub-leader",
  content="bugfixer を起動しました。",
  summary="bugfixer 起動完了通知"
)
```

**Sub-Leader（チーム運営・タスク管理・チームメイト連携）:**

```
// タスク登録
TaskCreate: "アナリスト: セッション管理調査"
TaskCreate: "バグフィクサー: 修正実装"（addBlockedBy: [アナリストID]）

// team-roster.md 作成
Write: .agent-team/team-roster.md

// Leader からの起動完了通知後、SendMessage でチームメイトと連携

// 実装完了後、Red-Team の [SPAWN_REQUEST] を Leader に送信
SendMessage(
  type="message",
  recipient="team-lead",
  content="""
  [SPAWN_REQUEST]
  subagent_type: general-purpose
  name: red-team
  prompt: |
    # Mission
    修正の妥当性・副作用・セキュリティリスクを批判的に検証してください。
    # Boundary
    - 書き込みは .agent-team/artifacts/red-team/ のみ
    - Task ツールでのエージェント起動禁止
    - SendMessage(type: "shutdown_request") 送信禁止
    - TeamDelete 呼び出し禁止
    # Resources
    - .agent-team/artifacts/bugfixer/fix-description.md
    - src/auth/
  reason: バグフィクサーの修正が完了しました。批判的検証を依頼します。
  [/SPAWN_REQUEST]
  """,
  summary="Red-Team 起動リクエスト"
)

// QA-Manager も同様に [SPAWN_REQUEST] で依頼
// 全成果物集約後、Leader に最終報告を SendMessage で送る
```

**Sub-Leader → Leader（最終報告を SendMessage）:**

> 作業完了のご報告
>
> ## 達成したこと
> セッション無効化の根本原因（並行リクエスト時のレースコンディション）を特定し、ロック機構を追加して修正しました。
>
> ## Red-Team の指摘と対応
> - タイムアウト値の見直し → 対応済み
>
> ## QA-Manager の最終評価
> 要件達成を確認。詳細は .agent-team/artifacts/qa-manager/final-report.md を参照。

**Leader（クリーンアップ・最終報告）:**

```
SendMessage(type="shutdown_request", recipient="sub-leader", content="作業完了。シャットダウンしてください。")
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

## 例 2: 大規模タスク（9 名チーム、並列実行）

**シナリオ**: 新機能開発（認証システムの刷新）

---

**ユーザー:**
> JWT 認証を導入したい。フロントとバックを同時並行で開発してチームで進めてほしい。

**Leader（あなた）:**

大規模な開発タスクですね。Sub-Leader がチーム構成を分析・提案します。少々お待ちください。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="jwt-auth", description="JWT 認証システム刷新チーム")

// ワークスペース作成
Bash: mkdir -p .agent-team/artifacts/sub-leader
Write: .agent-team/context.md
// ## 課題定義
// JWT 認証を導入し、フロントエンドとバックエンドを並列開発する

Write: .agent-team/issues.md（空ファイル）
Write: .agent-team/decisions.md（空ファイル）

// Sub-Leader を Agent Teams チームメイトとして起動
Task(
  subagent_type="general-purpose",
  team_name="jwt-auth",
  name="sub-leader",
  prompt="""
  （Sub-Leader MBR テンプレートに従い、チーム名 "jwt-auth" で起動）
  """)
```

**Sub-Leader → Leader（SendMessage で編成案）:**

> チーム名: jwt-auth
> 提案するチーム編成（8 名）:
>
> | 役割 | ミッション | 実行順 | 自律性レベル |
> |---|---|---|---|
> | リサーチャー | 現状コードと JWT ライブラリ選定情報を収集する | 1番目 | L1 |
> | アーキテクト | JWT 認証の全体アーキテクチャを設計する | 2番目 | L1 |
> | フロントエンジニア | JWT 認証のフロントエンド実装を完成させる | 3番目（並列） | L1 |
> | バックエンジニア | JWT 発行・検証エンドポイントを実装する | 3番目（並列） | L1 |
> | DBエンジニア | リフレッシュトークン管理のスキーマとマイグレーションを作成する | 3番目（並列） | L2 |
> | インテグレーター | 各実装を統合し結合テストを行う | 4番目 | L1 |
> | Red-Team | セキュリティ・論理・実装品質を批判的に検証する | 5番目 | L1 |
> | QA-Manager | 最終品質確認・報告書を作成する | 6番目 | L1 |
>
> フロント/バック/DB は担当ディレクトリ分割で並列実行します。

**Leader（ユーザーへ提示）:**

以下の 8 名チームを提案します。

**チーム編成案（8 名 + Sub-Leader）**

| 役割 | ミッション | 実行順 | 自律性レベル |
|---|---|---|---|
| リサーチャー | 現状コードと JWT ライブラリ選定情報を収集する | 1番目 | L1 |
| アーキテクト | JWT 認証の全体アーキテクチャを設計する | 2番目 | L1 |
| フロントエンジニア | JWT 認証のフロントエンド実装を完成させる | 3番目（並列） | L1 |
| バックエンジニア | JWT 発行・検証エンドポイントを実装する | 3番目（並列） | L1 |
| DBエンジニア | リフレッシュトークン管理のスキーマとマイグレーションを作成する | 3番目（並列） | L2（既存スキーマとの整合性を保つ） |
| インテグレーター | 各実装を統合し結合テストを行う | 4番目 | L1 |
| Red-Team | セキュリティ・論理・実装品質を批判的に検証する | 5番目 | L1 |
| QA-Manager | 最終品質確認・報告書を作成する | 6番目 | L1 |

フロント/バック/DB は並列実行（担当ディレクトリ分割）します。承認いただけますか？

**ユーザー:**
> OK、進めて。

**Leader（Sub-Leader に承認を SendMessage で伝達）:**

```
SendMessage(
  type="message",
  recipient="sub-leader",
  content="編成案が承認されました。チーム運営を開始してください。",
  summary="編成案承認・運営開始指示"
)
```

**Sub-Leader（編成案を Leader に報告）:**

Sub-Leader は Phase 1 でチーム編成案と各メンバーの MBR プロンプトを作成し、Leader に SendMessage で報告します（researcher、architect、frontend-engineer、backend-engineer、db-engineer、integrator の MBR プロンプトを含む）。

**Leader（初期メンバーを起動・Sub-Leader に通知）:**

```
// Step 1: リサーチャー起動（Sub-Leader 提供の MBR プロンプトを使用）
Task(subagent_type="Explore", team_name="jwt-auth", name="researcher", prompt="...")

SendMessage(type="message", recipient="sub-leader", content="researcher を起動しました。", summary="researcher 起動完了通知")

// Step 2: アーキテクト起動（リサーチャー完了後）
Task(subagent_type="general-purpose", team_name="jwt-auth", name="architect", prompt="...")

SendMessage(type="message", recipient="sub-leader", content="architect を起動しました。", summary="architect 起動完了通知")

// Step 3: フロント・バック・DB を並列起動（同一メッセージで3つの Task を呼び出す）
Task(
  subagent_type="general-purpose",
  team_name="jwt-auth",
  name="frontend-engineer",
  prompt="""
  # Mission
  JWT 認証のログイン UI とトークン管理フロントエンド実装を完成させてください。

  # Boundary
  - 担当ディレクトリ: src/frontend/auth/ のみ
  - 他ディレクトリへの書き込み禁止
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/architect/（アーキテクト設計書を参照）
  - .agent-team/artifacts/researcher/（技術選定結果を参照）
  - 報告: 重大な問題は SendMessage で Sub-Leader に報告する
  """),

Task(
  subagent_type="general-purpose",
  team_name="jwt-auth",
  name="backend-engineer",
  prompt="""
  # Mission
  JWT 発行・検証エンドポイントを実装し、安全な認証基盤を構築してください。

  # Boundary
  - 担当ディレクトリ: src/backend/auth/ のみ
  - 他ディレクトリへの書き込み禁止
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/architect/（アーキテクト設計書を参照）
  - 報告: 重大な問題は SendMessage で Sub-Leader に報告する
  """),

Task(
  subagent_type="general-purpose",
  team_name="jwt-auth",
  name="db-engineer",
  prompt="""
  # Mission
  リフレッシュトークン管理のデータベーススキーマを設計し、マイグレーションファイルを作成してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/db-engineer/ のみ（マイグレーションは db/migrations/ にも可）
  - 既存テーブルへの破壊的変更禁止
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Approach Hints（L2: 方針ヒント）
  - 既存の users テーブルとの外部キー整合性を維持すること
  - トークン無効化のためのインデックスを設計すること

  # Resources
  - .agent-team/context.md（必ず最初に読む）
  - .agent-team/artifacts/architect/（アーキテクト設計を参照）
  - db/schema/: 既存スキーマ定義
  - 報告: 重大な問題は SendMessage で Sub-Leader に報告する
  """)

// 並列3名起動完了を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="frontend-engineer、backend-engineer、db-engineer を並列起動しました。",
  summary="並列3名 起動完了通知"
)

// インテグレーター起動（並列3名完了後・Sub-Leader の指示を受けて）
Task(subagent_type="general-purpose", team_name="jwt-auth", name="integrator", prompt="...")
```

**Sub-Leader（チーム運営・[SPAWN_REQUEST] で Red-Team/QA-Manager を依頼）:**

```
// タスク登録・team-roster.md 作成後、Leader からの起動完了通知を受けて SendMessage でチームメイトと連携

// 実装完了後、[SPAWN_REQUEST] で Red-Team を依頼
SendMessage(
  type="message",
  recipient="team-lead",
  content="""
  [SPAWN_REQUEST]
  subagent_type: general-purpose
  name: red-team
  prompt: |
    # Mission
    セキュリティ・論理・実装品質を批判的に検証してください。
    # Boundary
    - 書き込みは .agent-team/artifacts/red-team/ のみ
    - Task ツールでのエージェント起動禁止
    - SendMessage(type: "shutdown_request") 送信禁止
    - TeamDelete 呼び出し禁止
    # Resources
    - .agent-team/artifacts/（全成果物）
  reason: 実装フェーズが完了しました。批判的検証を依頼します。
  [/SPAWN_REQUEST]
  """,
  summary="Red-Team 起動リクエスト"
)

// QA-Manager も同様に [SPAWN_REQUEST] で依頼
// Sub-Leader が最終報告を Leader に SendMessage
```

**Leader（クリーンアップ・最終報告）:**

```
// 全チームメイトへの shutdown_request 後に TeamDelete
SendMessage(type="shutdown_request", recipient="sub-leader", ...)
// ... 全チームメイトへのシャットダウン要求
TeamDelete()
```

---

## 例 3: 調査タスク（実装なし、リサーチ中心）

**シナリオ**: 技術選定の調査

---

**ユーザー:**
> Next.js と Remix のどちらを採用すべきか調査してチームで意見をまとめてほしい。

**Leader（あなた）:**

技術選定の調査ですね。Sub-Leader に分析と編成案の作成を依頼します。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="fw-selection", description="フレームワーク技術選定チーム")

// ワークスペース作成
Write: .agent-team/context.md
// ## 課題定義
// Next.js と Remix のどちらを採用すべきか調査し、推奨案をまとめる

// Sub-Leader を Agent Teams チームメイトとして起動
Task(
  subagent_type="general-purpose",
  team_name="fw-selection",
  name="sub-leader",
  prompt="（Sub-Leader MBR テンプレートに従い起動）")
```

**Sub-Leader → Leader（SendMessage で編成案）:**

> チーム名: fw-selection
> 提案するチーム編成（4 名）:
>
> | 役割 | ミッション | 実行順 | 自律性レベル |
> |---|---|---|---|
> | Next.js 調査担当 | Next.js をプロジェクト採用観点で客観的に評価する | 1番目（並列） | L1 |
> | Remix 調査担当 | Remix をプロジェクト採用観点で客観的に評価する | 1番目（並列） | L1 |
> | Red-Team | 両調査の偏り・見落とし・リスクを批判的に指摘する | 2番目 | L1 |
> | QA-Manager | 全情報を統合し、プロジェクトへの推奨案をまとめる | 3番目 | L1 |
>
> 調査担当 2 名は並列実行します。

**Leader（ユーザーへ提示・承認取得）:**

以下の 4 名チームを提案します（+ Sub-Leader）。

調査担当 2 名は並列実行します。承認いただけますか？

**ユーザー:**
> 進めてください。

**Leader（承認を Sub-Leader に SendMessage で伝達）:**

```
SendMessage(
  type="message",
  recipient="sub-leader",
  content="編成案が承認されました。チーム運営を開始してください。",
  summary="編成案承認・運営開始指示"
)
```

**Sub-Leader（編成案を Leader に報告・チーム運営）:**

Sub-Leader は Phase 1 で nextjs-researcher と remix-researcher の MBR プロンプトを作成し、Leader に SendMessage で報告します。

**Leader（調査担当 2 名を並列起動・Sub-Leader に通知）:**

```
// 調査担当2名を並列起動（同一メッセージで2つの Task を呼び出す）
Task(
  subagent_type="general-purpose",
  team_name="fw-selection",
  name="nextjs-researcher",
  prompt="""
  # Mission
  Next.js をこのプロジェクトへの採用観点で客観的に評価してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/nextjs-researcher/ のみ
  - Remix との比較は行わない（それは QA-Manager の役割）
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（プロジェクトの技術スタック・要件を把握）
  - Web 検索・公式ドキュメントの参照可
  - 報告: 完了を SendMessage で Sub-Leader に報告する
  """),

Task(
  subagent_type="general-purpose",
  team_name="fw-selection",
  name="remix-researcher",
  prompt="""
  # Mission
  Remix をこのプロジェクトへの採用観点で客観的に評価してください。

  # Boundary
  - 書き込みは .agent-team/artifacts/remix-researcher/ のみ
  - Next.js との比較は行わない（それは QA-Manager の役割）
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md（プロジェクトの技術スタック・要件を把握）
  - Web 検索・公式ドキュメントの参照可
  - 報告: 完了を SendMessage で Sub-Leader に報告する
  """)

// 並列2名起動完了を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="nextjs-researcher、remix-researcher を並列起動しました。",
  summary="並列2名 起動完了通知"
)
```

**Sub-Leader（チーム運営・[SPAWN_REQUEST] で Red-Team/QA-Manager を依頼）:**

```
// タスク登録・team-roster.md 作成後、Leader からの起動完了通知を受けて SendMessage でチームメイトと連携

// 調査完了後、[SPAWN_REQUEST] で Red-Team を依頼
SendMessage(
  type="message",
  recipient="team-lead",
  content="""
  [SPAWN_REQUEST]
  subagent_type: general-purpose
  name: red-team
  prompt: |
    # Mission
    両フレームワークの調査レポートを批判的に検証し、偏り・見落とし・情報の不正確性を
    洗い出してください。推奨案を出すのではなく、批判・指摘に徹してください。
    # Boundary
    - 書き込みは .agent-team/artifacts/red-team/ のみ
    - Task ツールでのエージェント起動禁止
    - SendMessage(type: "shutdown_request") 送信禁止
    - TeamDelete 呼び出し禁止
    # Resources
    - .agent-team/artifacts/nextjs-researcher/report.md
    - .agent-team/artifacts/remix-researcher/report.md
    - .agent-team/issues.md
  reason: 両調査が完了しました。批判的検証を依頼します。
  [/SPAWN_REQUEST]
  """,
  summary="Red-Team 起動リクエスト"
)

// QA-Manager も同様に [SPAWN_REQUEST] で依頼
// Sub-Leader → Leader に最終報告を SendMessage
```

**Leader（クリーンアップ・最終報告）:**

```
SendMessage(type="shutdown_request", recipient="sub-leader", ...)
SendMessage(type="shutdown_request", recipient="nextjs-researcher", ...)
// ...全チームメイトをシャットダウン
TeamDelete()
```

**Leader（ユーザーへ最終報告）:**

調査完了です。QA-Manager の推奨案：

> **Remix を推奨**（理由: サーバーサイド処理の優位性、既存の Express 資産との相性）

ただし Red-Team 指摘通り、Vercel との親和性は Next.js が上回ります。インフラ選定との兼ね合いをご確認ください。

詳細は `.agent-team/artifacts/qa-manager/recommendation.md` をご覧ください。

---

## 例 4: 自律的課題発見（チームメイトが issues.md と SendMessage を活用）

**シナリオ**: データ移行スクリプトの作成中に想定外の問題を発見

---

**ユーザー:**
> v1 から v2 へのデータ移行スクリプトをチームで作成してほしい。

**Leader（あなた）:**

データ移行タスクですね。Sub-Leader に分析と編成案の作成を依頼します。

**Leader（内部処理）:**

```
// チーム作成
TeamCreate(team_name="data-migration", description="v1→v2 データ移行チーム")

// ワークスペース作成
Write: .agent-team/context.md
// ## 課題定義
// v1 から v2 へのデータ移行スクリプトを作成する

// Sub-Leader を Agent Teams チームメイトとして起動
Task(
  subagent_type="general-purpose",
  team_name="data-migration",
  name="sub-leader",
  prompt="（Sub-Leader MBR テンプレートに従い起動）")
```

**Sub-Leader → Leader（SendMessage で編成案）:**

> チーム名: data-migration
> 提案するチーム編成（4 名）:
>
> | 役割 | ミッション | 実行順 | 自律性レベル |
> |---|---|---|---|
> | アナリスト | v1/v2 のスキーマ差異と移行要件を分析する | 1番目 | L1 |
> | 移行エンジニア | データ移行スクリプトを実装する | 2番目（アナリスト完了後） | L2（本番 DB 保護） |
> | Red-Team | 移行スクリプトのリスクと欠陥を徹底検証する | 3番目 | L1 |
> | QA-Manager | 最終確認とレポート作成 | 4番目 | L1 |

**Leader（ユーザーへ提示・承認取得）:**

以下の 4 名チームを提案します（+ Sub-Leader）。承認いただけますか？

**ユーザー:**
> 進めて。

**Leader（承認を Sub-Leader に伝達し、アナリストと移行エンジニアを起動）:**

```
// 承認を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="編成案が承認されました。初期メンバーを起動します。",
  summary="編成案承認・初期メンバー起動開始"
)

// アナリストを起動（Sub-Leader 提供の MBR プロンプトを使用）
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
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Resources
  - .agent-team/context.md
  - db/schema/v1/, db/schema/v2/: スキーマ定義

  # Autonomy Protocol
  5. 記録: 移行リスクを .agent-team/issues.md に記録する
  6. 報告: 重大なブロッカーや想定外の問題は SendMessage で Sub-Leader に即時報告する
  7. 完了: .agent-team/artifacts/analyst/migration-analysis.md を出力する
  """)

// アナリスト起動完了を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="analyst を起動しました。",
  summary="analyst 起動完了通知"
)
```

**Sub-Leader（チーム運営・タスク登録・team-roster.md 作成）:**

```
// タスク登録
TaskCreate: "アナリスト: スキーマ差異分析"
// team-roster.md 作成
Write: .agent-team/team-roster.md
```

**（アナリストが issues.md に記録し、Sub-Leader に SendMessage で報告）:**

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

アナリスト → Sub-Leader（SendMessage）:
> 「循環参照と孤立データという重大なブロッカーを発見しました。データクレンジング担当の追加が必要です。issues.md を参照してください。」

**Sub-Leader（SendMessage を受信後に計画変更・[SPAWN_REQUEST] で data-cleaner を依頼）:**

```
// 追加タスク登録
TaskCreate: "データクレンジング担当: 孤立データ処理"（addBlockedBy: [アナリストID]）

// データクレンジング担当の起動を Leader に [SPAWN_REQUEST] で依頼
SendMessage(
  type="message",
  recipient="team-lead",
  content="""
  [SPAWN_REQUEST]
  subagent_type: general-purpose
  name: data-cleaner
  prompt: |
    # Mission
    v1 データベースの孤立データと循環参照問題を解決し、v2 への移行を安全に行える
    クレンジングスクリプトを作成してください。
    # Boundary
    - 書き込みは .agent-team/artifacts/data-cleaner/ のみ
    - 本番 DB への直接書き込み禁止（スクリプトの作成のみ）
    - Task ツールでのエージェント起動禁止
    - SendMessage(type: "shutdown_request") 送信禁止
    - TeamDelete 呼び出し禁止
    # Resources
    - .agent-team/context.md
    - .agent-team/artifacts/analyst/migration-analysis.md
    - .agent-team/issues.md（発見された問題の詳細）
    - db/schema/v1/: 現行スキーマ
    - 報告: 完了を SendMessage で Sub-Leader に報告する
  reason: アナリストが循環参照と孤立データを発見しました。移行前にクレンジング担当が必要です。
  [/SPAWN_REQUEST]
  """,
  summary="data-cleaner 起動リクエスト"
)
```

**Leader（[SPAWN_REQUEST] を受信し data-cleaner を起動）:**

```
// [SPAWN_REQUEST] を受信 → Boundary に禁止事項 3 点が含まれていることを確認 → 起動
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
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止
  # Resources
  - .agent-team/context.md
  - .agent-team/artifacts/analyst/migration-analysis.md
  - .agent-team/issues.md（発見された問題の詳細）
  - db/schema/v1/: 現行スキーマ
  - 報告: 完了を SendMessage で Sub-Leader に報告する
  """)

// 起動完了を Sub-Leader に通知
SendMessage(
  type="message",
  recipient="sub-leader",
  content="data-cleaner を起動しました。",
  summary="data-cleaner 起動完了通知"
)
```

**（data-cleaner 完了後）Leader が移行エンジニアを起動（Sub-Leader の [SPAWN_REQUEST] を受けて）:**

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
  - Task ツールでのエージェント起動禁止
  - SendMessage(type: "shutdown_request") 送信禁止
  - TeamDelete 呼び出し禁止

  # Approach Hints（L2: リスク考慮）
  - ロールバック可能な設計にすること
  - バッチ処理でメモリ使用量を制御すること
  - 進捗ログを出力すること

  # Resources
  - .agent-team/context.md
  - .agent-team/artifacts/analyst/migration-analysis.md
  - .agent-team/artifacts/data-cleaner/（クレンジングスクリプト）
  - .agent-team/decisions.md
  - 報告: 完了を SendMessage で Sub-Leader に報告する
  """)

SendMessage(
  type="message",
  recipient="sub-leader",
  content="migration-engineer を起動しました。",
  summary="migration-engineer 起動完了通知"
)

// Red-Team → QA-Manager も Sub-Leader の [SPAWN_REQUEST] を受けて Leader が起動
```

**Sub-Leader → Leader（SendMessage で最終報告）:**

> 当初 4 名の計画でしたが、アナリストが SendMessage で報告した循環参照・孤立データ問題を受け、
> [SPAWN_REQUEST] で data-cleaner の起動を依頼し、Leader に追加していただきました（計 5 名）。
>
> ## 達成したこと
> - データクレンジングスクリプト: 孤立レコード 3% の安全な処理
> - 移行スクリプト: 循環参照を考慮したバッチ移行、ロールバック対応
>
> Red-Team・QA-Manager の確認済みです。

**Leader（クリーンアップ・最終報告）:**

```
SendMessage(type="shutdown_request", recipient="sub-leader", ...)
SendMessage(type="shutdown_request", recipient="analyst", ...)
SendMessage(type="shutdown_request", recipient="data-cleaner", ...)
SendMessage(type="shutdown_request", recipient="migration-engineer", ...)
SendMessage(type="shutdown_request", recipient="red-team", ...)
SendMessage(type="shutdown_request", recipient="qa-manager", ...)
TeamDelete()
```

**Leader（ユーザーへ最終報告）:**

チーム作業が完了しました。

当初 4 名の計画でしたが、アナリストが発見した循環参照・孤立データ問題を受け、Sub-Leader からの [SPAWN_REQUEST] でデータクレンジング担当を追加（計 5 名）しました。

**成果:**
- データクレンジングスクリプト: 孤立レコード 3% の安全な処理
- 移行スクリプト: 循環参照を考慮したバッチ移行、ロールバック対応

Red-Team・QA-Manager の確認済みです。詳細は `.agent-team/artifacts/qa-manager/final-report.md` をご覧ください。
