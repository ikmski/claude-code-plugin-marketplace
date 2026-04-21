# 役割テンプレート（roles/）

このディレクトリは Team Lead がチーム編成時に参照する**役割テンプレートの出発点**です。

> **重要**: 役割ファイルは雛形（starting line）に過ぎません。そのまま起動せず、課題ごとに
> Mission・Boundary 追記・Resources を必ず改変してください。改変しないままの起動は
> 動的編成原則（`../../../CLAUDE.md:16`）に反します。メニューから選ぶのではなく、テンプレートを
> たたき台にして課題固有の役割を組み立てる発想で使ってください。

## ディレクトリ構成

- `scaffolding/`: 必須役割（Chief of Staff / Red-Team / QA-Manager）— 原則として削除・緩和禁止（`../SKILL.md` §1.A、役割省略の例外は §2）
- `common/`: よく使う動的選択候補（ドメイン別実装系 + 汎用調査系）— 課題に応じて取捨選択

## frontmatter 必須フィールド

全役割ファイルは以下 6 フィールドを持ちます：

| フィールド | 値 | 用途 |
|---|---|---|
| `name` | 役割名（kebab-case） | ファイル名の基準 |
| `category` | `実装系` / `調査系` / `統合系` | `../SKILL.md` §1.B の表から `isolation` / `mode` / 書き込み範囲を導出 |
| `subagent_type` | `general-purpose` / `Explore` / `Plan` / `Bash` | Task ツール起動時の種別 |
| `autonomy_default` | `L1` / `L2` / `L3` | デフォルト自律性レベル（`../SKILL.md` §5） |
| `report_to` | `chief-of-staff` または `team-lead` | 完了報告先（小規模チームで CoS 省略時は team-lead） |
| `scaffolding` | `true` / `false` | 必須役割フラグ（`scaffolding/` 配下は true） |

## category から導出される標準値

| category | isolation | mode | 書き込み範囲 |
|---|---|---|---|
| 実装系 | `"worktree"` | `"bypassPermissions"` | worktree 内 + `artifacts/{role-name}/` |
| 調査系 | （指定不要） | `"bypassPermissions"` | `artifacts/{role-name}/` のみ（Read 専用） |
| 統合系 | （指定不要） | `"bypassPermissions"` | `artifacts/{role-name}/` + git merge |

詳細は `../SKILL.md` §1.B / §1.C を参照。役割ファイル側では Boundary の標準部分を
再記述せず「標準 Boundary（§1.C）適用」と参照するのみに留めます。

## 役割一覧

### scaffolding/（必須役割）

- [chief-of-staff.md](scaffolding/chief-of-staff.md) — 参謀・運用管理役
- [red-team.md](scaffolding/red-team.md) — 攻撃・批判役
- [qa-manager.md](scaffolding/qa-manager.md) — 品質・総括役

### common/（よく使う動的選択候補）

- [researcher.md](common/researcher.md) — 広域調査
- [analyst.md](common/analyst.md) — 根本原因・影響範囲分析
- [architect.md](common/architect.md) — 設計立案
- [backend-engineer.md](common/backend-engineer.md) — サーバーサイド実装（新規・バグ修正・リファクタリング）
- [frontend-engineer.md](common/frontend-engineer.md) — クライアント UI 実装（新規・バグ修正・リファクタリング）
- [database-engineer.md](common/database-engineer.md) — DB スキーマ・マイグレーション・クエリ
- [infrastructure-engineer.md](common/infrastructure-engineer.md) — CI/CD・コンテナ・クラウド・監視
- [tech-writer.md](common/tech-writer.md) — ドキュメント作成

**実装系役割はドメイン別**: `bug-fixer` / `refactorer` のようなアクション別の役割は用意しない。各ドメイン担当（backend / frontend / database / infrastructure）が自領域の新規実装・バグ修正・リファクタリングをすべて担う。

## 改変の指針

- Mission は必ず課題固有に書き換える（「このプロジェクトの {具体領域} において {達成したいこと}」を明示）
- Boundary 追記で役割固有の禁止事項を追加する（例: 大規模リファクタリングなら「パブリック I/F 破壊禁止」）
- Resources で具体的なファイル・ディレクトリパスを指定する（`context.md` だけでは不十分なことが多い）
- `autonomy_default` は出発点の値。失敗コストの高いタスクでは L2 / L3 に引き上げる
