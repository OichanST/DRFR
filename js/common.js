/**
 * セル追加用のサブ関数
 */
function add(r, text, style){
	// セル生成
	const c = document.createElement("td");
	// セルの中にテキスト追加
	c.innerHTML = text;
	// セルにスタイル適用
	for(var css in style){
		c.style[css] = style[css];
	}
	// 行にセル追加
	r.appendChild(c);
}

/**
 * getElementByIdの簡易
 */
function elem(id){
	return document.getElementById(id);
}
/**
 * createElementの簡易
 */
function createElem(tagName){
	return document.createElement(tagName);
}
/**
 * getElementsByTagName("tr")の簡易
 */
function getRows(elem){
	return elem.getElementsByTagName("tr");
}
/**
 * getElementsByTagName("td")の簡易
 */
function getCells(elem){
	return elem.getElementsByTagName("td");
}
/**
 * getElementsByTagName("div")の簡易
 */
function getDivs(elem){
	return elem.getElementsByTagName("div");
}
/**
 * getElementsByTagName("input")の簡易
 */
function getInputs(elem){
	return elem.getElementsByTagName("input");
}
/**
 * テーブル内の全セルループ
 */
function eachCell(id, func){
	// 領域の取得
	const t = elem(id);
	// 行取得
	const r = t.children[0].children;
	// 行ループ
	for(let i = 0; i < r.length; i++){
		// セル取得
		const c = r[i].children;
		// セルループ
		for(let j = 0; j < c.length; j++){
			// 引数の関数にセルを渡す
			func(c[j], i, j);
		}
	}
}
/**
 * spanタグ生成
 */
function span(text){
	return "<span>" + text + "</span>";
}
/**
 * spanタグ件数取得
 */
function countSpan(obj){
	return obj.getElementsByTagName("span").length;
}
/**
 * spanタグの所持有無判定
 */
function hasSpan(obj){
	return countSpan(obj) > 0;
}
/**
 * 全spanタグの取得
 */
function getSpans(obj){
	return obj.getElementsByTagName("span");
}
/**
 * spanタグを1つ取得
 */
function getSpan(obj){
	return getSpans(obj)[0];
}
/**
 * pixcelサイズ返却
 */
function px(val){
	return val + "px";
}
/**
 * rem返却
 */
function rem(val){
	return val + "rem";
}
/**
 * em返却
 */
function em(val){
	return val + "em";
}
/**
 * 符号を設定して返却
 */
function addSign(val){
	return (val > 0 ? "+" : "") + val;
}
/**
 * ストレージマネージャー
 */
const Storage = {
	/**
	 * ストレージ取得
	 */
	get:function(){
		// ローカルストレージからデータ抽出
		let tmp = localStorage.getItem("drfr");
		// データがある場合
		if(tmp != null){
			// JSON変換
			return JSON.parse(tmp);
		}
		return null;
	},
	/**
	 * ストレージ設定
	 */
	set:function(data){
		localStorage.setItem("drfr", JSON.stringify(data));
	},
	/**
	 * ストレージリセット
	 */
	reset:function(){
		localStorage.removeItem("drfr");
	}
}
