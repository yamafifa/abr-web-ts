---
name: abr-web-ts
description: abr-web-ts（住居表示-住居マスターを検索・一覧・編集・削除する Next.js + Prisma のアプリ）で、機能の追加・修正・テスト・動作確認・ドキュメント更新をするときの手順と、これまでに分かった落とし穴。検索条件や画面の追加、層（クリーンアーキテクチャ）のどこに書くかの判断、Server Action の確認、パッケージの追加をするときに使う。
---

# abr-web-ts の作業手順と知見

## 前提

- Next.js 16.4.6（App Router、**Cache Components と Partial Prefetching が有効**）＋ Prisma 7.10.1（mariadb アダプター）＋ Tailwind CSS 4 ＋ Vitest 5.1.1
- DB は **abr-batch の MySQL を共用**（ポート 3307、テーブル `mt_rsdtdsp_rsdt`、1,752,573 件）。このリポジトリではマイグレーションしない。`prisma/schema.prisma` は abr-batch と同じ定義
- サーバーは `127.0.0.1:3000` だけで待ち受ける（`npm run dev` / `npm run start` に `-H 127.0.0.1` を付けてある）
- 勉強用に、同じものを Rails・Laravel でも作る予定。ユースケース（検索・取得・更新・削除）とリポジトリの形をそろえると比べやすい
- Next.js 16 は学習データと違う所が多い。書く前に `node_modules/next/dist/docs/` の該当ページを読む（`AGENTS.md` の指示）

## 層の決まり（クリーンアーキテクチャ）

依存の向きは「外 → 内」だけ。

| 層 | 場所 | 書くもの | 読み込んではいけないもの |
|---|---|---|---|
| domain | `src/domain/rsdt/` | 型、主キー、入力チェック、リポジトリのインターフェース、エラー | Next.js・Prisma・ほかの層 |
| application | `src/application/rsdt/` | ユースケース（クラス、コンストラクターでリポジトリを受け取る） | Next.js・Prisma・infrastructure・presentation |
| infrastructure | `src/infrastructure/` | Prisma での実装、Prisma の型 ⇔ エンティティの変換、Prisma のエラーの変換 | Next.js |
| presentation | `src/presentation/` | URL・フォーム・表示形式の変換（Next.js に依存しない純粋な関数） | Prisma |
| 画面 | `src/app/`・`src/components/` | 受け取る → ユースケースを呼ぶ → 表示・redirect | Prisma・infrastructure（`@/composition-root` から受け取る） |

- 部品の組み立ては `src/composition-root.ts` だけ
- 日付は domain では `YYYY-MM-DD` の文字列。`Date` との変換は infrastructure だけ（UTC の 0 時として読み書き）
- 空文字は null にする（abr-batch の取り込みと同じ）。文字数はコードポイントで数える（`[...s].length`。MySQL の VARCHAR と同じ）

依存の向きが守られているかの確認：

```bash
grep -rh "^import" src/domain src/application --include=*.ts | grep -v vitest | grep -E "next|prisma|infrastructure|presentation" || echo OK
grep -rln "prisma\|@/infrastructure" src/app src/components || echo OK
```

### 検索条件を足すとき（例：blk_num・rsdt_num を足したとき）

1. `domain/rsdt/rsdt-repository.ts` の `RsdtSearchCriteria` と `EMPTY_CRITERIA`
2. `infrastructure/rsdt/prisma-rsdt-repository.ts` の `buildWhere`
3. `presentation/search-params.ts` の `PARAM_NAMES`（URL の名前）と `MAX_LENGTH`
4. `app/search-form.tsx` の入力欄
5. `test/in-memory-rsdt-repository.ts` の `match`
6. テスト（`search-params.test.ts`・`prisma-rsdt-repository.test.ts`・`.db.test.ts`）と README

部分一致か完全一致かは、**値を見てから決める**。`blk_num`・`rsdt_num` は全件が半角数字なので完全一致にした（部分一致だと「1」で 10・21 も出る）。

## テストと確認

```bash
npm test          # DB を使わない（約 0.3 秒）
npm run test:db   # 本物の DB を使う（約 3 秒）。書き換えはトランザクションで取り消す
npx tsc --noEmit && npm run lint
npm run build
```

- ユースケースのテストは `src/test/in-memory-rsdt-repository.ts`（メモリ上のリポジトリ）を渡して書く
- `*.db.test.ts` は `prisma.$transaction` の中で実行して、最後に例外を投げて取り消す（`inRollback`）
- 確認のあとは、DB が元のままか必ず確かめる。変わっていたら abr-batch で `npm run import:v3`（約 15 秒）で戻す

```bash
docker compose -f ../abr-batch/compose.yaml exec -T db mysql -uabr -pabr abr -e 'select count(*) from mt_rsdtdsp_rsdt; checksum table mt_rsdtdsp_rsdt'
# 元のデータ：1752573 件、チェックサム 967527444
```

### 画面の確認（ブラウザが無い環境）

- 一覧・編集画面は `curl` で HTML を取って、件数や値を `grep` する
- 更新・削除（Server Action）は [scripts/call-action.cjs](scripts/call-action.cjs) で呼ぶ。`npm run build && npm run start` のあとに実行する

```bash
node .claude/skills/abr-web-ts/scripts/call-action.cjs update 131016_0001001_006_002_ '/?page=2' '{"city":"千代田区","remarks":"テスト"}'
node .claude/skills/abr-web-ts/scripts/call-action.cjs delete 131016_0001001_006_003_ '//evil.example'
```

- 見た目・モーダルの動きは確かめられないので、「確かめていない」とユーザーに伝える

### サーバーの止め方・起動のし直し

- ビルドし直したら、動いているサーバーも起動し直す
- 止めるときは、ポートからプロセス ID を探して止める。`pkill -f "next start"` は、そのコマンドを実行しているシェル自身にも当たって、シェルごと止まった

```bash
P=$(ss -ltnp | grep :3000 | grep -o 'pid=[0-9]*' | cut -d= -f2); [ -n "$P" ] && kill $P
```

- `npm run start` をバックグラウンドで動かしていても、止めると親の npm が「exit code 143」で終わったと通知される。止めたことによるもので、異常ではない

## 分かっている落とし穴

| 症状 | 原因と対処 |
|---|---|
| 実行時に「Next.js encountered the unstable value `Date.now()` while prerendering」 | Cache Components では、DB を読むコンポーネントが先読みでも実行される。mariadb ドライバーの中の `Date.now()` で止まる。DB を読む前に `await connection()`（`next/server`）を呼び、`<Suspense>` で囲む |
| 「%」で検索すると全件が出る | Prisma の `contains` は `%`・`_` をそのまま LIKE に渡す。`escapeLike` で `\%`・`\_`・`\\` にする |
| `npm install` が `Cannot read properties of null (reading 'edgesOut')` で止まる | npm 本体のバグ。peer dependency の版が食い違うと起きる。① create-next-app が入れた `@types/node` 20 系を、Vitest が求める 22 以上に上げる、② Vitest は peer と同じ版（5.1.1）にする、で入った |
| `curl` で Server Action にフォームを送ると、空のフォームとして届く | React は FormData を `_1_city` のように **`_` で始まる名前**で送る（`1_city` ではない）。手書きせず、`scripts/call-action.cjs`（`encodeReply` を使う）で送る |
| lint の `react-hooks/set-state-in-effect` エラー | `useEffect` の中で同期的に `setState` しない。お知らせ（Flash）は、親で `key` を変えて作り直す形にした |
| 続けて同じ操作をすると、お知らせが出ない | redirect 先の URL に `n=<時刻>` を付けて、Flash の `key` にする |
| `PageProps<"/rsdt/[id]">` が型エラー | ルートの型は自動で作られる。新しいルートを足したら `npx next typegen` を実行する |
| `.env.example` が Git に入らない | create-next-app の `.gitignore` は `.env*`。`!.env.example` を足してある |

## データの性質（検索・表示で気をつけること）

- `chome` は「一丁目」（漢数字、478,708 件）と「３丁目」（全角数字、1,217,002 件）が混ざっている
- 照合順序 `utf8mb4_0900_ai_ci` で全角と半角は同じ文字になる。「3」で「３丁目」は見つかるが、「三丁目」は見つからない
- `ward` は全件 NULL（東京都のデータでは値が入っていない）
- `rsdt2_id` は空文字が多い。主キーを URL にすると末尾が `_` で終わる（例：`/rsdt/131016_0001001_006_001_`）
- 部分一致はインデックスが効かず、件数を数えるのに全件を読む（「世田谷」で約 1 秒）。ページャーのリンクは `prefetch={false}` にしてある（先読みのたびに件数を数え直さないように）

## 書いてはいけないこと

- **列の日本語名を書かない。** 公式の仕様書で確かめられていないので、画面の項目名は CSV の列名（`city`・`blk_num` など）のままにしている。ユーザーが言った呼び方（「市区町村」「町字」「丁目」）は使ってよい
- 実際に測っていない数字を書かない

## パッケージの追加

- 何を入れるか伝えて、了解を取ってから入れる。版は `-E` で固定する
- できれば出てから 2 週間以上たった版にする。入らなくて新しい版にしたときは、そのことをユーザーに伝える

## ドキュメントとコミット

- README は入口（できること・動かし方・構成・テスト・作ってみて分かったこと）。起動と停止は `docs/start-stop.md`
- 仕様を変えたら、README の「できること」「作ってみて分かったこと」も直す
- コミットと push は、ユーザーの了解を取ってから。メッセージは日本語で、最後に `Co-Authored-By` の行を付ける
- リポジトリは GitHub の**非公開**リポジトリ（abr-batch は公開）。abr-batch 側から abr-web-ts に触れない
- `.env`・`node_modules`・`src/generated/`・`.next/` は Git に入れない。コミットの前に、個人情報（本名・メールアドレスなど）が入っていないか確かめる
