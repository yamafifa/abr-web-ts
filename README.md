# abr-web-ts

ABR（アドレス・ベース・レジストリ）の住居表示-住居マスター（`mt_rsdtdsp_rsdt`、東京都 1,752,573 件）を検索して、一覧表示・編集・削除する Web アプリです。
勉強用に、同じものを TypeScript・Ruby on Rails・PHP Laravel で作るうちの TypeScript 版です。

- Next.js 16（App Router）＋ Prisma 7 ＋ Tailwind CSS 4 ＋ Vitest 5
- クリーンアーキテクチャで、画面・ユースケース・ドメイン・DB の層に分けています
- DB は [abr-batch](https://github.com/yamafifa/abr-batch) の MySQL を共用します（テーブルも abr-batch で作ったもの）

## できること

- **検索**：市区町村（`city`・`ward`）、町字（`oaza_cho`・`koaza`）、丁目（`chome`）の部分一致と、`blk_num`・`rsdt_num` の完全一致。条件は URL に残ります
- **一覧**：主キー順。1 ページ 15 件（30・50・100 件も選べます）。ページャー付き
- **編集**：主キー以外の 17 列。「更新」を押すと、変わった項目をモーダルで見せてから保存します
- **削除**：一覧と編集画面から。モーダルで確認してから削除します
- **Elasticsearch 検索**：`/es`。条件の意味と画面は DB 検索と同じで、abr-batch の `npm run es:index` で作った Elasticsearch のインデックスから探します。下の「Elasticsearch 検索」を参照

## 動かし方

1. abr-batch で DB を起動して、データを入れておく（abr-batch の README「動かし方」を参照）
2. このリポジトリで：

```bash
cp .env.example .env
npm install          # prisma generate も実行されます
npm run dev          # http://127.0.0.1:3000
```

- 手元の PC からだけ開けるように、`127.0.0.1` で待ち受けます
- 起動と停止の詳しいやり方は [docs/start-stop.md](docs/start-stop.md) にあります
- 編集・削除したデータは、abr-batch で `npm run import:v3`（約 15 秒）を実行すると元に戻せます

## Elasticsearch 検索

ほかの 4 つの版と同じものです。DB 検索（`/`）はそのまま残して、Elasticsearch で探す一覧（`/es`）を別に作りました。上のメニューで切り替えられ、それぞれの画面に「同じ条件で〜検索」のリンクがあります。

- **速さ**（`next dev` で画面全体を返すまで、3 回測った値）

| 条件 | DB 検索 | Elasticsearch 検索 |
|---|---|---|
| 市区町村「町田」＋町字「木曽」 | 1.82〜1.83 秒 | 0.074〜0.080 秒 |
| 町字「西」 | 0.77〜0.80 秒 | 0.082〜0.091 秒 |
| 条件なし | 0.28〜0.29 秒 | 0.072〜0.074 秒 |

- **中身は `npm run es:index` を実行した時点の DB のコピー**です。画面に作成日時を出しています。この画面から編集・削除すると DB は変わりますが、Elasticsearch は次に `es:index` を実行するまで古いままです。食い違ったときは、DB 検索の画面と見比べてください
- **ページ送りは「最初へ・前へ・次へ・最後へ」**で、ページ番号はありません。Elasticsearch は、先頭から 10,000 件より先へページ番号で進めないため、主キーの続きから取る方法（search_after）にしました
- **文字の扱いは MySQL に合わせています**：MySQL（utf8mb4_unicode_ci）は全角と半角、ひらがなとカタカナ、濁点の有無などを同じ文字として扱います。Elasticsearch でも同じ結果になるよう、入れる側（abr-batch の `src/lib/fold.ts`）と探す側（[src/infrastructure/elasticsearch/fold.ts](src/infrastructure/elasticsearch/fold.ts)）で同じように文字をそろえています。処理の中身は abr-batch と同じです。直すときは abr-batch と 5 つの版のすべてを直します
- **層の分け方**：検索用インデックスのインターフェース（`RsdtSearchIndex`）を domain に、ページ送りの考え方（`SearchRsdtEs`）を application に、Elasticsearch への接続（`ElasticsearchRsdtSearchIndex`）を infrastructure に置きました。そのため、ページ送りはメモリ上のインデックスでテストできます
- 公式のクライアントは入れず、fetch で REST API を呼びます。接続先は `.env` の `ES_URL`（無ければ `http://127.0.0.1:9200`）。接続できないときは、画面にエラーの文を出します

## 構成（クリーンアーキテクチャ）

依存の向きは「外 → 内」だけです。domain と application は、Next.js も Prisma も知りません。

```
presentation（Next.js の画面・Server Actions）
      ↓
application（ユースケース：検索・取得・更新・削除）
      ↓
domain（エンティティ・入力の決まり・リポジトリのインターフェース）
      ↑ 実装する
infrastructure（Prisma で DB を読み書きする・Elasticsearch で探す）
```

| 場所 | 内容 |
|---|---|
| `src/domain/rsdt/` | 住居の型（`rsdt.ts`）、主キー（`rsdt-key.ts`）、17 列の入力チェック（`rsdt-attributes.ts`）、リポジトリのインターフェース（`rsdt-repository.ts`）、検索用インデックスのインターフェース（`rsdt-search-index.ts`）、エラー（`errors.ts`） |
| `src/application/rsdt/` | ユースケース：`SearchRsdt`（ページ番号の補正もここ）・`SearchRsdtEs`（Elasticsearch で検索。search_after のページ送りもここ）・`GetRsdt`・`UpdateRsdt`・`DeleteRsdt` |
| `src/infrastructure/` | Prisma の接続と、リポジトリの実装（`PrismaRsdtRepository`）。Prisma の型 ⇔ エンティティの変換、LIKE のエスケープ、Prisma のエラー → `RsdtNotFoundError`。Elasticsearch で探す実装（`ElasticsearchRsdtSearchIndex`）と、文字をそろえる処理（`elasticsearch/fold.ts`） |
| `src/presentation/` | 画面のための変換：URL ⇔ 検索条件（DB 検索・Elasticsearch 検索）、住所の表示形式、フォーム ⇔ 入力、戻り先のチェック |
| `src/composition-root.ts` | リポジトリとユースケースを組み立てる場所。どのリポジトリを使うかは、ここだけで決める |
| `src/app/` | Next.js の画面と Server Actions。URL やフォームを読んで、ユースケースを呼んで、表示・redirect するだけ |
| `src/components/` | 確認モーダル・削除ボタン・お知らせ・DB 検索と Elasticsearch 検索の切り替え |
| `src/test/` | テスト用の部品（メモリ上で動くリポジトリと検索用インデックス、テストデータ） |
| `prisma/schema.prisma` | テーブル定義（abr-batch と同じ）。このリポジトリではマイグレーションしない |

## テスト

```bash
npm test          # DB を使わないテスト（domain・application・presentation・検索条件の組み立て）
npm run test:db   # 本物の DB と Elasticsearch を使うテスト（abr-batch の DB を起動して全件入れ、npm run es:index も実行しておく）
```

- ユースケースのテストは、DB の代わりにメモリ上のリポジトリ（`src/test/in-memory-rsdt-repository.ts`）を渡して動かします
- `test:db` で書き換えるテストは、トランザクションの中で実行して最後に取り消すので、DB の中身は変わりません

## 作ってみて分かったこと

- **部分一致は遅め**：`LIKE '%…%'` はインデックスが効かないので、件数を数えるために全件を読みます。「世田谷」で検索して約 1 秒でした
- **Prisma の `contains` は `%` と `_` をそのまま `LIKE` に渡す**：「%」で検索すると全件が出ました。`\%`・`\_` に置き換えています
- **Cache Components（Next.js 16 の既定）では、DB を読む前に `await connection()` が要る**：無いと、先読みのときに mariadb ドライバーの中の `Date.now()` で「prerender 中に変わる値を使った」というエラーになりました
- **主キーの URL**：5 列を `_` でつないで 1 つにしています（例：`/rsdt/131016_0001001_006_001_`）。`rsdt2_id` は空のことが多いので、末尾が `_` で終わります
- **項目名**：画面の項目名は CSV の列名のままです（日本語名の公式資料を確かめられていないため）
- **`blk_num`・`rsdt_num` は完全一致**：値はすべて半角数字なので、部分一致だと「1」で 10・21 なども出てしまうため
- **丁目の書き方が 2 通りある**：`chome` は「一丁目」（漢数字、478,708 件）と「３丁目」（全角数字、1,217,002 件）が混ざっています。全角と半角は DB の照合順序（`utf8mb4_0900_ai_ci`）で同じ文字として扱われるので「3」でも「３丁目」が見つかりますが、「三丁目」は見つかりません
