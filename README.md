# abr-web-ts

ABR（アドレス・ベース・レジストリ）の住居表示-住居マスター（`mt_rsdtdsp_rsdt`、東京都 1,752,573 件）を検索して、一覧表示・編集・削除する Web アプリの TypeScript（Next.js）版です。
[abr-batch](https://github.com/yamafifa/abr-batch) で確かめた「大量のデータを部分一致で探すなら、元の DB ではなく、検索用のデータを作る」という考え方の効果を、DB 検索と Elasticsearch 検索の画面で比べられるようにしています。

- Next.js 16（App Router）＋ Prisma 7 ＋ Tailwind CSS 4 ＋ Vitest 5
- クリーンアーキテクチャで、画面・ユースケース・ドメイン・DB の層に分けています
- DB は [abr-batch](https://github.com/yamafifa/abr-batch) の MySQL を共用します（テーブルも abr-batch で作ったもの）
- ほかの版：[Ruby on Rails](https://github.com/yamafifa/abr-web-rails)・[Laravel](https://github.com/yamafifa/abr-web-laravel)・[Symfony](https://github.com/yamafifa/abr-web-symfony)・[Spring Boot](https://github.com/yamafifa/abr-web-spring)

## 検索の速さ：DB 検索と Elasticsearch 検索

本番モード（`npm run build` のあと `next start`）で画面全体を返すまでの時間（2026-11-23 に、3 回測った値）：

| 条件 | DB 検索（`/`） | Elasticsearch 検索（`/es`） |
|---|---|---|
| 市区町村「町田」＋町字「木曽」 | 2.03〜2.09 秒 | 0.017〜0.019 秒 |
| 町字「西」 | 0.84〜0.85 秒 | 0.022〜0.024 秒 |
| 条件なし | 0.26 秒 | 0.014〜0.018 秒 |

- 開発モード（`npm run dev`）では、Elasticsearch 検索が 0.077〜0.10 秒でした。開発モードは 1 回の表示ごとに 0.06〜0.08 秒ほど余計にかかるためで、本番モードではこの分がかかりません

- DB 検索は `city LIKE '%町田%'` のような部分一致です。前に `%` が付く LIKE は MySQL のインデックスが効かないので、毎回約 175 万行をすべて読みます
- Elasticsearch 検索は、abr-batch の `npm run es:index` で作った検索用のインデックスから探します。条件の意味と画面は DB 検索と同じです
- 詳しくは下の「[Elasticsearch 検索](#elasticsearch-検索)」を参照

## できること

- **検索**：市区町村・町字・丁目などで探して、一覧を出します。DB 検索（`/`）と Elasticsearch 検索（`/es`）の 2 つがあり、条件と画面は同じです
- **編集・削除**：abr-batch の差分更新バッチ（v4）のテストデータを作りやすくするために付けました

## 動かし方

1. abr-batch で DB を起動して、データを入れておく（abr-batch の README「動かし方」を参照）
2. Elasticsearch 検索を使うときは、abr-batch で `npm run es:index` を実行しておく（約 1 分）
3. このリポジトリで：

```bash
cp .env.example .env
npm install          # prisma generate も実行されます
npm run dev          # http://127.0.0.1:3000
```

- 手元の PC からだけ開けるように、`127.0.0.1` で待ち受けます
- 起動と停止の詳しいやり方は [docs/start-stop.md](docs/start-stop.md) にあります
- 編集・削除したデータは、abr-batch で `npm run import:v3`（約 15 秒）を実行すると元に戻せます

## Elasticsearch 検索

DB 検索（`/`）はそのまま残して、Elasticsearch で探す一覧（`/es`）を別に作りました。上のメニューで切り替えられます。それぞれの画面には、もう一方で同じ条件を検索するリンク（「同じ条件で DB 検索」「同じ条件で Elasticsearch 検索」）があります。

- **中身は `npm run es:index` を実行した時点の DB のコピー**です。画面に作成日時を出しています。アプリで編集・削除すると DB は変わりますが、Elasticsearch の中身は次に `es:index` を実行するまで古いままです。結果が食い違ったときは、DB 検索の画面と見比べてください
- **ページ送りは「最初へ・前へ・次へ・最後へ」**で、ページ番号はありません。Elasticsearch は、先頭から 10,000 件より先へページ番号で進めないため、前のページの最後の行の主キーを渡して、その続きから取る方法（search_after）にしました
- **文字の扱いは MySQL に合わせています**：MySQL（utf8mb4_unicode_ci）は全角と半角、ひらがなとカタカナ、濁点の有無などを同じ文字として扱います。Elasticsearch でも同じ結果になるよう、入れる側（abr-batch の `src/lib/fold.ts`）と探す側（[src/infrastructure/elasticsearch/fold.ts](src/infrastructure/elasticsearch/fold.ts)）で同じように文字をそろえています。処理の中身は abr-batch と同じにしています。直すときは、abr-batch とほかの版の同じ処理も、あわせて直します
- **検索条件の半角カナは、受け取るときに全角カナにします**（「ﾊﾟ」→「パ」）。DB 検索と Elasticsearch 検索の両方にかかります。MySQL は半角の「ﾊﾟ」を「ﾊ」と「ﾟ」の 2 文字として探すので、そのままでは Elasticsearch 検索と件数が合わないためです。変えるのは半角カナだけで、互換漢字や丸数字は変えません（[src/presentation/search-params.ts](src/presentation/search-params.ts)）
- **層の分け方**：検索用インデックスのインターフェース（`RsdtSearchIndex`）を domain に、ページ送りの考え方（`SearchRsdtEs`）を application に、Elasticsearch への接続（`ElasticsearchRsdtSearchIndex`）を infrastructure に置きました。そのため、ページ送りはメモリ上のインデックスでテストできます
- 公式のクライアントは入れず、fetch で REST API を呼びます。接続先は `.env` の `ES_URL` です（書かなければ `http://127.0.0.1:9200`）。接続できないときは、画面にエラーメッセージを出します

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
- **Prisma の `contains` は `%` と `_` をそのまま `LIKE` に渡す**：そのままでは「%」で検索すると全件が出たので、`\%`・`\_` に置き換えています
- **Cache Components（`next.config.ts` の `cacheComponents: true` で有効にしている）では、DB を読む前に `await connection()` が要る**：無いと、先読みのときに mariadb ドライバーの中の `Date.now()` で「prerender 中に変わる値を使った」というエラーになりました
- **`usePathname` を使う部品は、`Suspense` で囲まないと `next build` が失敗する**：Cache Components では、ページを前もって作るときに URL が決まらないためです。`next dev` ではエラーにならないので、気づくのが遅れました。上のメニュー（`src/components/nav.tsx`）は、URL が決まるまでは、どれも目立たせない形で出しています
- **主キーの URL**：主キーの 5 列を `_` でつないで 1 つの文字列にしています（例：`/rsdt/131016_0001001_006_001_`）。`rsdt2_id` は空のことが多いので、末尾が `_` で終わります
- **項目名**：画面の項目名は CSV の列名のままです（日本語名の公式資料を確かめられていないため）
- **`blk_num`・`rsdt_num` は完全一致**：値は番号なので、部分一致だと「1」で 10・21 なども出てしまいます
- **丁目の書き方が 2 通りある**：`chome` は「一丁目」（漢数字、478,708 件）と「３丁目」（全角数字、1,217,002 件）が混ざっています。全角と半角はテーブルの照合順序（`utf8mb4_unicode_ci`）で同じ文字として扱われるので「3」でも「３丁目」が見つかりますが、「三丁目」は見つかりません
- **時刻は日本時間**：`package.json` の `dev`・`build`・`start`・`test` に `TZ=Asia/Tokyo` を付けています。書かなくても今の PC（WSL）の設定では日本時間になりますが、PC の設定が変わっても同じに動くように、書いています。DATE 列は、日付がずれないように「UTC の 0 時」として読み書きしています（`src/infrastructure/rsdt/prisma-rsdt-repository.ts`）。DB（MySQL）の時刻は UTC のままです
