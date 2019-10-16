const HG = "HG";
const RF = "RF";
const AR = "AR";
const SMG = "SMG";
const MG = "MG";
const SG = "SG";
const ALL = "ALL";

const R = "right";
const L = "left";
const C = "center";

// レアリティ別の配色設定
const rareClr = [null, null, "white", "#00FFFF", "#C0FF99", "#FFCC00"];
const rareDarkClr = [null, null, "#D0D0D0", "#00D0D0", "#90D060", "#D09000"];
// 銃種名称変換
const typeName = {
	HG:"ハンドガン",
	AR:"アサルトライフル",
	SMG:"サブマシンガン",
	RF:"ライフル",
	MG:"マシンガン",
	SG:"ショットガン",
	ALL:"全銃種"
}
// ステータス名称変換
const converter = {
	FF:"火力",
	SS:"射速",
	CR:"会心",
	AR:"命中",
	DR:"回避",
	CT:"ｽｷﾙ冷却",
	DF:"防御"
};
// パラメータ名称変換
const paramConverter = {
	at:"火力",
	ac:"命中",
	ev:"回避",
	ns:"暗視能力",
	slot:"弾薬数",
	ct:"会心率",
	cm:"会心ダメージ",
	sp:"射速",
	gb:"破甲",
	df:"防御"
};
// 初期会心率
const defaultCrit = {
	"ウェルロッドMkII":40,
	"K5":40,
	"コンテンダー":40,
	"Am RFB":30,
	"AUG":30,
	HG:20,
	SMG:5,
	AR:20,
	RF:40,
	MG:5,
	SG:40
};