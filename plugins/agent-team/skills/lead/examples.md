# Team Lead 会話例

> MBR テンプレートのフル内容は SKILL.md Section 3 を参照。本ファイルはチーム編成・通信フローのインスタンス例です。

---

## 例 1: 小規模タスク（5 名、逐次実行）

**シナリオ**: セッション無効化バグの調査・修正

---

**ユーザー:**
> ログイン時に稀にセッションが無効になるバグがある。チームで調査・修正してほしい。

**Leader:**

課題を分析し、5 名チームで対応します（6 名以下のため承認待ちなしで即実行）。

```
TeamCreate(team_name="session-bug-fix", description="セッション無効化バグ修正")
mkdir -p .agent-team/session-bug-fix/artifacts
Write: context.md / issues.md / decisions.md
```

**チーム編成（5 名）**

| 役割 | ミッション | 実行順 |
|---|---|---|
| Chief of Staff | チーム運営の仲介・統合管理 | 最初（全体通じて稼働） |
| アナリスト | セッション無効化の根本原因を特定 | 1番目 |
| バグフィクサー | 根本原因を修正 | 2番目 |
| Red-Team | 修正の妥当性・副作用・セキュリティを批判的検証 | 3番目 |
| QA-Manager | 要件達成確認・最終レポート | 4番目 |

**Step 0: CoS 起動**

Chief of Staff テンプレート（SKILL.md Section 3）を適用し、`team_name="session-bug-fix"` で起動。`mode: "bypassPermissions"`。

**Step 1: アナリスト起動（Explore、調査系）**

```
Task(subagent_type="Explore", team_name="session-bug-fix", name="analyst",
     mode="bypassPermissions", prompt="""
  # Mission
  セッション管理関連コードを調査し、ログイン時にセッションが稀に無効になる
  根本原因を特定してください。

  # Boundary
  - 書き込みは .agent-team/session-bug-fix/artifacts/analyst/ のみ
  - 標準 Boundary（SKILL.md Section 1.C）を適用

  # Resources
  - .agent-team/session-bug-fix/context.md（最初に読む）
  - src/auth/: 認証・セッション関連コード
  - Mission 完了後、SendMessage で Chief of Staff に完了報告
  """)

TaskCreate: "アナリスト: セッション管理調査"
TaskCreate: "バグフィクサー: 修正実装"（addBlockedBy: [アナリストID]）
Write: team-roster.md
```

**（アナリスト完了）** → CoS にレースコンディション特定を報告 → CoS が Leader に要約報告し bugfixer 起動を依頼。

**Step 2: バグフィクサー起動（実装系、worktree 必須）**

実装系テンプレート（SKILL.md Section 3）を適用。`isolation: "worktree"` を指定し、Mission は「アナリストが特定した根本原因を修正」。Resources に `.../artifacts/analyst/investigation-report.md` を含める。

**Step 3: Red-Team 起動（1 回のみ、自律ループ）**

Red-Team テンプレート（reference.md）を適用。`team_name="session-bug-fix"` で起動。

**Red-Team 自律ループの進行**:

```
Red-Team → review-round-1.md 出力 → CoS に SendMessage で指摘報告
  ↓
CoS → bugfixer に SendMessage で修正依頼（Leader 承認不要）
  "Red-Team から指摘が届きました。review-round-1.md を確認し修正してください。
   完了後は red-team に直接 SendMessage で報告してください。"
  ↓
bugfixer が修正 → red-team に直接 SendMessage → red-team が再検証
  ↓
全クリア → red-team → CoS「全指摘クリア・QA-Manager 起動承認」
  ↓
CoS → Leader に要約報告「Red-Team 全クリア。QA-Manager 起動を」
```

**Step 4: QA-Manager 起動**（Red-Team 全クリア後）

調査系テンプレート（SKILL.md Section 3）を適用。

**Step 5: CoS が統合・最終報告ドラフト作成**

```
CoS:
  - 全 artifacts/ 読み込み → summary.md 作成
  - git worktree list → git merge --no-ff bugfixer-branch-abc123（コンフリクトなしのため自律実行）
  - final-report-draft.md 作成
  - SendMessage to lead: "統合完了。マージハッシュ a1b2c3d。ドラフトレビューをお願いします"
```

**Step 6: Leader がレビュー・クリーンアップ・最終報告**

```
# ドラフトレビュー後
for each member (analyst, bugfixer, red-team, qa-manager, chief-of-staff):
    SendMessage(type="shutdown_request", recipient=<member>, ...)
TeamDelete()
```

ユーザーへ最終報告: セッション無効化の原因はレースコンディションと特定、ロック機構追加で修正。Red-Team 指摘（タイムアウト値）も対応済み。worktree ブランチ `bugfixer-branch-abc123` を `main` にマージ（ハッシュ `a1b2c3d`）。

---

## 例 2: 自律的課題発見（スコープ変更→動的チーム拡張）

**シナリオ**: データ移行スクリプト作成中にアナリストが想定外の問題を発見し、data-cleaner を動的に追加。

---

**ユーザー:**
> v1 から v2 へのデータ移行スクリプトをチームで作成してほしい。

**Leader:**

5 名チームで対応します（6 名以下のため即実行）。本番 DB 保護のため移行エンジニアは L2 適用。

```
TeamCreate(team_name="data-migration", description="v1→v2 データ移行")
mkdir -p .agent-team/data-migration/artifacts
Write: context.md / issues.md / decisions.md
```

**チーム編成（5 名）**

| 役割 | ミッション | 実行順 | 自律性 |
|---|---|---|---|
| Chief of Staff | チーム運営の仲介・統合管理 | 最初 | L1 |
| アナリスト | v1/v2 スキーマ差異と移行要件を分析 | 1番目 | L1 |
| 移行エンジニア | 移行スクリプト実装 | 2番目 | **L2**（本番 DB 保護） |
| Red-Team | 移行スクリプトのリスク検証 | 3番目 | L1 |
| QA-Manager | 最終確認・レポート | 4番目 | L1 |

**CoS・アナリスト起動**（標準テンプレ適用、Explore でアナリスト）

---

**（アナリストが循環参照・孤立データを発見し、issues.md に記録 + CoS に報告）:**

`.agent-team/data-migration/issues.md`:
```markdown
# 発見された課題

## 循環参照によるデータ整合性リスク
- **発見者**: アナリスト
- **状況**: open
- **詳細**: v1 の orders / customers テーブルに循環参照あり。単純な移行順序では外部キー制約違反の可能性。

## 孤立データの存在
- **発見者**: アナリスト
- **状況**: open
- **詳細**: v1 の約 3% が参照先存在しない孤立データ。v2 の NOT NULL 制約に違反の可能性。
```

アナリスト → CoS（SendMessage）:
> 「循環参照と孤立データのブロッカーを発見。データクレンジング担当の追加をご検討ください」

---

**（CoS がスコープ変更と判断 → Leader にエスカレーション）:**

CoS → Leader（lead）:
> 「アナリストから循環参照・孤立データ問題を報告受領。スコープ変更（data-cleaner 追加）が必要と判断。起動の可否を判断してください」

---

**Leader が data-cleaner 起動を判断、追加起動（Leader 専権）:**

```
TaskCreate: "データクレンジング担当: 孤立データ処理"（addBlockedBy: [アナリストID]）

Task(subagent_type="general-purpose", team_name="data-migration", name="data-cleaner",
     mode="bypassPermissions", isolation="worktree", prompt="""
  # Mission
  v1 データベースの孤立データと循環参照問題を解決し、v2 への移行を安全に行える
  クレンジングスクリプトを作成してください。

  # Boundary
  - 書き込みは .agent-team/data-migration/artifacts/data-cleaner/ のみ
  - 本番 DB への直接書き込み禁止（スクリプトの作成のみ）
  - 標準 Boundary（SKILL.md Section 1.C）を適用

  # Resources
  - .agent-team/data-migration/context.md
  - .agent-team/data-migration/artifacts/analyst/migration-analysis.md
  - .agent-team/data-migration/issues.md（発見された問題の詳細）
  - db/schema/v1/
  - Mission 完了後、SendMessage で Chief of Staff に完了報告
  """)

SendMessage(recipient="chief-of-staff",
  content="data-cleaner を起動しました。完了後に移行エンジニアを起動します。アナリストにも通知してください",
  summary="data-cleaner 起動通知")
```

---

**（data-cleaner 完了 → Leader が移行エンジニア起動、L2 適用）:**

実装系テンプレート（SKILL.md Section 3）＋ Approach Hints（L2: ロールバック可能設計・バッチ処理・進捗ログ）。`isolation: "worktree"` 必須。

**Red-Team 自律ループ → QA-Manager 起動**: 例 1 と同様。

---

**CoS が統合（複数 worktree マージ）・最終報告ドラフト作成:**

```
CoS:
  - git merge --no-ff data-cleaner-branch-xxx
  - git merge --no-ff migration-engineer-branch-yyy
  - final-report-draft.md 作成
  - SendMessage to lead: "統合完了。ドラフトレビューをお願いします"
```

---

**Leader 最終報告**（ドラフトレビュー後）:

当初 5 名の計画でしたが、アナリストが循環参照・孤立データ問題を発見し、CoS 経由でエスカレーションされたため、データクレンジング担当を追加して計 6 名で対応しました。

- **データクレンジングスクリプト**: 孤立レコード 3% の安全な処理
- **移行スクリプト**: 循環参照を考慮したバッチ移行、ロールバック対応

Red-Team・QA-Manager の確認済みです。詳細は `.agent-team/data-migration/artifacts/qa-manager/final-report.md` をご覧ください。
