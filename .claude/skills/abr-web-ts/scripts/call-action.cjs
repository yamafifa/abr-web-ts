/**
 * Server Action を、ブラウザを使わずに呼ぶ（動作確認用）
 * - アクション ID は、ビルド結果（.next/server/server-reference-manifest.json）から名前で探す
 * - 引数は React と同じ形（encodeReply）で送る。curl で手書きすると FormData の形が合わず、空のフォームとして届く
 *
 * 使い方（abr-web-ts のフォルダで、npm run build && npm run start のあと）:
 *   node .claude/skills/abr-web-ts/scripts/call-action.cjs update <主キーID> <戻り先> '<列名と値のJSON>'
 *   node .claude/skills/abr-web-ts/scripts/call-action.cjs delete <主キーID> <戻り先>
 * 例:
 *   node .claude/skills/abr-web-ts/scripts/call-action.cjs update 131016_0001001_006_002_ '/?page=2' '{"city":"千代田区","remarks":"テスト"}'
 */
process.env.NODE_ENV = "production";
const path = require("node:path");
const fs = require("node:fs");

const root = process.cwd();
const { encodeReply } = require(path.join(root, "node_modules/next/dist/compiled/react-server-dom-turbopack/client.edge.js"));
const manifest = JSON.parse(fs.readFileSync(path.join(root, ".next/server/server-reference-manifest.json"), "utf8"));

const [kind, id, back = "/", json = "{}"] = process.argv.slice(2);
const names = { update: "updateRsdtAction", delete: "deleteRsdtAction" };
if (!names[kind] || !id) {
  console.error("使い方: call-action.cjs update|delete <主キーID> [戻り先] [JSON]");
  process.exit(1);
}
const actionId = Object.entries(manifest.node).find(([, v]) => v.exportedName === names[kind])?.[0];
if (!actionId) {
  console.error(`${names[kind]} がビルド結果に見つかりません。npm run build を先に実行してください`);
  process.exit(1);
}

let args;
if (kind === "update") {
  const fd = new FormData();
  for (const [k, v] of Object.entries(JSON.parse(json))) fd.set(k, v);
  args = [id, back, {}, fd];
} else {
  args = [id, back];
}

encodeReply(args).then(async (body) => {
  const res = await fetch(`http://127.0.0.1:3000/rsdt/${id}`, {
    method: "POST",
    headers: { "Next-Action": actionId },
    body,
  });
  console.log(`HTTP ${res.status}  redirect=${res.headers.get("x-action-redirect") ?? "（なし）"}`);
  // 1: で始まる行が、アクションの戻り値（入力エラーなど）
  const text = await res.text();
  for (const line of text.split("\n")) if (line.startsWith("1:{")) console.log(`戻り値: ${line.slice(2)}`);
});
