---
name: qa-manager
category: 調査系
subagent_type: general-purpose
autonomy_default: L1
report_to: chief-of-staff
scaffolding: true
---

# QA-Manager（品質・総括役）

> 出発点です。`../README.md` の改変方針を参照。

## 典型的な用途

- 最終成果物の初期要件充足チェック
- Red-Team 指摘の対応確認
- 最終評価レポート作成

## 起動タイミング

Red-Team の全指摘クリア後に、Leader が起動する（`../../SKILL.md` §2 編成手順 step 13）。

## MBR テンプレート

QA-Manager 専用の MBR テンプレートは現時点では定義しない（本ファイルは別ファイル化のスコープを「既存定義の移行」に限定するため、新規スケルトンの創作は行わない）。起動時は以下を組み合わせる：

- ベース: `../../SKILL.md` §3「調査系テンプレート」
- Mission: 「要件充足確認・Red-Team 指摘の対応確認・最終評価レポート作成」を明示
- Boundary: 書き込みは `artifacts/qa-manager/` のみ、プロジェクトソースコードは Read 専用（標準 Boundary §1.C 適用）
- Resources: 初期要件（`context.md`）、全チームメイトの `artifacts/`、Red-Team の `review-round-N.md`
- 完了後、SendMessage で chief-of-staff に最終評価レポートを通知

## 役割固有の Boundary 追記

- 書き込みは `artifacts/qa-manager/` のみ
- プロジェクトソースコードは Read 専用

## 典型的な依存関係

- 先行: Red-Team が全指摘クリアを承認
- 後続: （なし、最終報告フェーズへ）

## 完了報告先

chief-of-staff（最終評価レポート完了時）
