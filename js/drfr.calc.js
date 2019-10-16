var disableCalc = false;
/**
 * 計算処理
 */
function calclate(context){
	// 重複計算抑制
	if(disableCalc){
		return;
	}
	// 期待値計算かどうかの取得
	const calcExpected = elem("calcExpected").className == "active";
	// ダメージ軸最大値取得
	const dmgMesure = parseInt(elem("dmgMesure").value, 10);
	// 時間軸最大値取得
	const timeMesure = parseInt(elem("timeMesure").value, 10);
	// 陣形データ
	const formationData = [
		[new Array(),new Array(),new Array()],
		[new Array(),new Array(),new Array()],
		[new Array(),new Array(),new Array()]
	];
	// ユニットごとの陣形効果適用範囲退避用
	const unitFormationRange = {};
	// 陣形ループ
	eachCell("sim", function(cell, i, j){
		// 戦術人形が配置されている場合
		if(hasSpan(cell)){
			// 戦術人形名取得
			let name = getSpan(cell).innerText;
			// 表示を一旦クリア
			cell.innerHTML = "";
			// 416だけは名称に@をつけているので@付与
			if(name == "416"){
				name = "@" + name;
			}
			// 人形データ取得
			const unit = unitData[name];
			// 配色
			let clr;
			let darkClr;
			// Extraだけはここで設定するのでExtra判定
			if(unit.rare != "Extra"){
				// Extra以外は配色テーブルから取得
				clr = rareClr[unit.rare];
				darkClr = rareDarkClr[unit.rare];
			// Extra
			}else{
				// 紫っぽい色
				clr = "#E0C0FF";
				darkClr = "#C090D0";
			}
			// 戦術人形名の帯を生成
			let html = "<div style='display:flex;justify-content:space-between;'>";
			html +="<div draggable='true' ondragstart='Formation.dragStart(" + i + "," + j + ");' style='width:87%;position:relative;box-shadow:1px 1px 2px;'>";
			html += "<div style='position:absolute;display:inline-block;z-index:3;padding-left:6px;'><span style='font-weight:bold;font-size:0.9rem;'>" + name.replace("@", "") + "</span></div>";
			html += "<div style='position:absolute:display:inline-block;z-index:2;width:100%;height:100%;background-color:" + clr + "'>&nbsp;</div>";
			html += "<div style='position:absolute;display:inline-block;z-index:1;top:0px;right:0px;margin:0px;width:18px;height:100%;background:linear-gradient(-55deg, " + darkClr + " 49%, " + darkClr + " 49%, " + clr + " 49%, " + clr + " 51%, " + clr + ");'>&nbsp;</div>";
			html += "</div>";
			// ×ボタン追加
			html += "<div class='closeBtn' onclick='Formation.del(" + (i * 3 + j + 1) + ");'>×</div>";
			html += "</div>"
			// HTMLを反映
			cell.innerHTML = html;
			// 人形の陣形情報を取得
			const formation = unit.formation;
			// 陣形効果範囲の取得
			const range = formation.range;
			// ユニットごとの陣形効果適用範囲データの初期化
			unitFormationRange[name] = [
				[false,false,false],
				[false,false,false],
				[false,false,false]
			];
			// 陣形効果範囲ループ
			for(let k = 0; k < range.length; k++){
				// 相対位置を割り出す
				let addR = 0;
				let addC = 0;
				// 配置による相対位置の特定
				if(unit.formation.pos){
					switch(unit.formation.pos){
						case 1:
							addR++;
							addC++;
							break;
						case 2:
							addR++;
							break;
						case 3:
							addR++;
							addC--;
							break;
						case 4:
							addC++;
							break;
						case 6:
							addC--;
							break;
						case 7:
							addR--;
							addC++;
							break;
						case 8:
							addR--;
							break;
						case 9:
							addR--;
							addC--;
							break;
					}
				}
				// 効果範囲による相対位置の割り出し
				switch(range[k]){
					case 1:
						addR--;
						addC--;
						break;
					case 2:
						addR--;
						break;
					case 3:
						addR--;
						addC++;
						break;
					case 4:
						addC--;
						break;
					case 5:
						break;
					case 6:
						addC++;
						break;
					case 7:
						addR++;
						addC--;
						break;
					case 8:
						addR++;
						break;
					case 9:
						addR++;
						addC++;
						break;
					default:
						break;
				}
				// 相対位置が陣形の枠を超えていない場合
				if(i + addR >= 0 && i + addR < 3 && j + addC >= 0 && j + addC < 3){
					// 陣形データをコピー
					const tmpFormation = JSON.parse(JSON.stringify(formation));
					// 効果範囲はここで相対位置に変換済のため除去
					delete tmpFormation.range;
					// 陣形データに設定
					formationData[i + addR][j + addC].push(tmpFormation);
					// ユニットごとの陣形効果適用範囲データの更新
					unitFormationRange[name][i + addR][j + addC] = true;
				}
			}
		}
	});
	// 陣形効果サマリ
	const summary = [
		[{},{},{}],
		[{},{},{}],
		[{},{},{}]
	];
	// 陣形ループ
	eachCell("sim", function(cell, i, j){
		// 人形が設定されている場合
		if(hasSpan(cell)){
			// 戦術人形名取得
			let name = getSpan(cell).innerText;
			// 416だけは@付与
			if(name == "416"){
				name = "@" + name;
			}
			// 人形データから銃種取得
			const type = unitData[name].type;
			// 陣形効果取得
			const formationEffect = formationData[i][j];
			// 陣形効果ループ
			for(let k = 0; k < formationEffect.length; k++){
				// 銃種が合致している、もしくは陣形効果が全銃種の場合
				if(type == formationEffect[k].target || formationEffect[k].target == ALL){
					// 陣形効果ループ
					for(let key in formationEffect[k].effect){
						// 陣形効果を合算する
						if(summary[i][j][key]){
							summary[i][j][key] += formationEffect[k].effect[key];
						}else{
							summary[i][j][key] = formationEffect[k].effect[key];
						}
					}
				}
			}
		}
	});
	// ダメージ計算結果退避用の配列
	const dmgCalc = new Array();
	// 全体付与スキル格納用
	const allRangeSkill = new Array();
	// 陣形範囲付与スキル格納用
	const formationSkill = new Array();
	// 敵に影響するスキル格納用
	const enemyEffectSkill = new Array();
	// 陣形ループ
	eachCell("sim", function(cell, i, j){
		// セルに人形が設定されている場合
		if(hasSpan(cell)){
			// 戦術人形名取得
			let name = getSpan(cell).innerText;
			// 416だけは@を付与
			if(name == "416"){
				name = "@" + name;
			}
			// 戦術人形データのステータスをコピー
			const status = JSON.parse(JSON.stringify(unitData[name].status));
			// 好感度補正
			if(unitStorage[name].favor){
				status.atk = Math.ceil(multiply(status.atk, 1 + per(parseInt(unitStorage[name].favor, 10))));
				status.acc = Math.ceil(multiply(status.acc, 1 + per(parseInt(unitStorage[name].favor, 10))));
				status.eva = Math.ceil(multiply(status.eva, 1 + per(parseInt(unitStorage[name].favor, 10))));
			}
			// 会心率を設定する
			// 戦術人形で固有の会心率を持つ場合
			if(defaultCrit[name]){
				// 固有の会心率を設定
				status["crt"] = defaultCrit[name];
			// 上記以外
			}else{
				// 銃種ごとの規定の会心率の設定
				status["crt"] = defaultCrit[unitData[name].type];
			}
			// 会心ダメージ倍率の初期設定（一律1.5倍）
			status["cm"] = 150;
			// 破甲値の初期設定（一律15）
			status["gb"] = 15;
			// 暗視能力の初期設定（0）
			status["ns"] = 0;
			// 装備品によるパラメータ追加値
			const eqSum = {
				atk:0,
				eva:0,
				acc:0,
				spe:0,
				ns:0,
				gb:0,
				crt:0,
				cm:0,
				def:0,
				slot:0
			};
			// 装備品がある場合
			if(unitStorage[name].equip){
				// 装備品取得
				const eq = unitStorage[name].equip;
				// ループ
				for(let k = 0; k < eq.length; k++){
					// パラメータ値ループ
					for(let param in eq[k]){
						// パラメータによる分岐
						switch(param){
							// 火力
							case "at":
								// 火力に加算
								status.atk += parseInt(eq[k][param], 10);
								eqSum.atk += parseInt(eq[k][param], 10);
								break;
							// 回避
							case "ev":
								// 回避に加算
								status.eva += parseInt(eq[k][param], 10);
								eqSum.eva += parseInt(eq[k][param], 10);
								break;
							// 命中
							case "ac":
								// 命中に加算
								status.acc += parseInt(eq[k][param], 10);
								eqSum.acc += parseInt(eq[k][param], 10);
								break;
							// 射速
							case "sp":
								// 射速に加算
								status.spe += parseInt(eq[k][param], 10);
								eqSum.spe += parseInt(eq[k][param], 10);
								break;
							// 暗視能力
							case "ns":
								status.ns += parseInt(eq[k][param], 10);
								eqSum.ns += parseInt(eq[k][param], 10);
								break;
							// 破甲
							case "gb":
								status.gb += parseInt(eq[k][param], 10);
								eqSum.gb += parseInt(eq[k][param], 10);
								break;
							// 会心率
							case "ct":
								status.crt += parseInt(eq[k][param], 10);
								eqSum.crt += parseInt(eq[k][param], 10);
								break;
							// 会心ダメージ
							case "cm":
								status.cm += parseInt(eq[k][param], 10);
								eqSum.cm += parseInt(eq[k][param], 10);
								break;
							// 弾薬数
							case "slot":
								status.slot += parseInt(eq[k][param], 10);
								eqSum.slot += parseInt(eq[k][param], 10);
								break;
							// 防御
							case "df":
								if(!status.def){
									status.def = 0;
								}
								status.def += parseInt(eq[k][param], 10);
								eqSum.def += parseInt(eq[k][param], 10);
								break;
						}
					}
				}
			}
			let fairy = {};
			// 妖精が設定されている場合
			if(elem("fairy").value != ""){
				// ステータスバフ取得
				fairy = Fairy.calc();
				// ステータスバフ適用
				for(let p in fairy){
					status[p] = multiply(status[p], 1 + per(fairy[p]));
				}
			}
			// 小数点の切り上げをする
			for(let param in status){
				status[param] = Math.ceil(status[param]);
			}
			// ステータス表記用データを作る
			let tmp1 = {};
			tmp1["hp"] = status.hp;
			tmp1["ns"] = "<font " + (status.ns != 0 ? " style=\"color:#00AA00\"" : "") + ">" + (status.ns != 0 ? addSign(status.ns) + "%":"-") + "</font>";
			tmp1["crt"] = (status.crt - eqSum.crt) + "%<font";
			if(eqSum.crt < 0){
				tmp1["crt"] += " style=\"color:#FF0000\"";
			}else if(eqSum.crt > 0 || fairy.crt > 0){
				tmp1["crt"] += " style=\"color:#00AA00\"";
			}
			tmp1["crt"] += ">" + czb(addSign(eqSum.crt)) + (eqSum.crt == 0 ? "" : "%") + "</font><font style=\"color:#0000FF\">@crt</font>";
			
			tmp1["cm"] = "<font ";
			if(eqSum.crt < 0){
				tmp1["cm"] += " style=\"color:#FF0000\"";
			}else if(eqSum.cm > 0 || fairy.cm > 0){
				tmp1["cm"] += " style=\"color:#00AA00\"";
			}
			tmp1["cm"] += ">" + (status.cm - eqSum.cm) + "%" + czb(addSign(eqSum.cm)) + (eqSum.cm == 0 ? "" : "%") + "</font>";
			tmp1["gb"] = "<font";
			if(eqSum.gb < 0){
				tmp1["gb"] += " style=\"color:#FF0000\"";
			}else if(eqSum.gb > 0){
				tmp1["gb"] += " style=\"color:#00AA00\"";
			}
			tmp1["gb"] += ">" + (status.gb - eqSum.gb) + czb(addSign(eqSum.gb)) + "</font>";
			tmp1["atk"] = "<font";
			if(eqSum.atk < 0){
				tmp1["atk"] += " style=\"color:#FF0000\"";
			}else if(eqSum.atk > 0 || fairy.atk > 0){
				tmp1["atk"] += " style=\"color:#00AA00\"";
			}
			tmp1["atk"] += ">" + (status.atk - eqSum.atk) + czb(addSign(eqSum.atk));
			tmp1["atk"] += "</font><font style=\"color:#0000FF\">@atk</font>";
			tmp1["acc"] = "<font";
			if(eqSum.acc < 0){
				tmp1["acc"] += " style=\"color:#FF0000\"";
			}else if(eqSum.acc > 0 || fairy.acc){
				tmp1["acc"] += " style=\"color:#00AA00\"";
			}
			tmp1["acc"] += ">" + (status.acc - eqSum.acc) + czb(addSign(eqSum.acc)) + "</font><font style=\"color:#0000FF\">@acc</font>";
			tmp1["eva"] = "<font";
			if(eqSum.eva < 0){
				tmp1["eva"] += " style=\"color:#FF0000\"";
			}else if(eqSum.eva > 0 || fairy.eva){
				tmp1["eva"] += " style=\"color:#00AA00\"";
			}
			tmp1["eva"] += ">" + (status.eva - eqSum.eva) + czb(addSign(eqSum.eva)) + "</font><font style=\"color:#0000FF\">@eva</font>";
			tmp1["spe"] = "<font";
			if(eqSum.spe < 0){
				tmp1["spe"] += " style=\"color:#FF0000\"";
			}else if(eqSum.spe > 0 || fairy.spe){
				tmp1["spe"] += " style=\"color:#00AA00\"";
			}
			tmp1["spe"] += ">" + (status.spe - eqSum.spe) + czb(addSign(eqSum.spe)) + "</font><font style=\"color:#0000FF\">@spe</font>";
			function czb(val){
				if(val == 0){
					return "";
				}
				return val;
			}
			// 防御ステータス持ち、もしくは弾薬数ステータス持ち（厳密にはSGおよびMG）
			if(status.def || status.slot){
				// SG,MGの場合弾薬数のパラメータが存在するため追加
				if(status.slot){
					tmp1["slot"] = "<font";
					if(eqSum.slot < 0){
						tmp1["slot"] += " style=\"color:#FF0000\"";
					}else if(eqSum.slot > 0){
						tmp1["slot"] += " style=\"color:#00AA00\"";
					}
					tmp1["slot"] += ">" + (status.slot - eqSum.slot) + czb(addSign(eqSum.slot)) + "</font>";
				}
				// SGの場合防御のパラメータが存在するため防御を追加
				if(status.def){
					tmp1["def"] = "<font";
					if(eqSum.def < 0){
						tmp1["def"] += " style=\"color:#FF0000\"";
					}else if(eqSum.def > 0 || fairy.def > 0){
						tmp1["def"] += " style=\"color:#00AA00\"";
					}
					tmp1["def"] += ">" + (status.def - eqSum.def) + czb(addSign(eqSum.def)) + "</font><font style=\"color:#0000FF\">@def</font>";
				}
			}
			// テンポラリ文字列
			let tmp2 = "";
			let ctdown = 1;
			// 陣形効果サマリにデータが登録されている場合
			if(Object.keys(summary[i][j]).length > 0){
				tmp2 += "<div style='font-weight:bold;'>[陣形効果]</div>";
				let idx = 0;
				// サマリループ
				for(let key in summary[i][j]){
					if(idx % 2 == 0){
						tmp2 += "<div style='display:flex;justify-content:space-between;'>"
					}
					// 効果を文章化
					tmp2 += "<div style='width:50%;'>"
					tmp2 += converter[key] + "+" + summary[i][j][key] + "%</div>";
					let tmpVal;
					// 陣形効果によるステータス操作
					switch(key){
						// 火力
						case "FF":
							tmpVal = Math.floor(multiply(status.atk, 1 + per(summary[i][j][key])));
							tmp1["atk"] = tmp1["atk"].replace("@atk", addSign(tmpVal - status.atk));
							status.atk = tmpVal;
							break;
						// 射速
						case "SS":
							tmpVal = Math.floor(multiply(status.spe, 1 + per(summary[i][j][key])));
							// 射速は120上限　※MGなし、SGは60
							let limitover = false;
							switch(unitData[name].type){
								case MG:
									break;
								case SG:
									if(tmpVal > 60){
										tmpVal = 60;
										limitover = true;
									}
									break;
								default:
									if(tmpVal > 120){
										tmpVal = 120;
										limitover = true;
									}
							}
							tmp1["spe"] = tmp1["spe"].replace("@spe", addSign(tmpVal - status.spe)) + (limitover ? "&nbsp;<spe style=\"color:red;\">limit!</spe>" : "");
							status.spe = tmpVal;
							break;
						// 命中
						case "AR":
							tmpVal = Math.floor(multiply(status.acc, 1 + per(summary[i][j][key])));
							tmp1["acc"] = tmp1["acc"].replace("@acc", addSign(tmpVal - status.acc));
							status.acc = tmpVal;
							break;
						// 回避
						case "DR":
							tmpVal = Math.floor(multiply(status.eva, 1 + per(summary[i][j][key])));
							tmp1["eva"] = tmp1["eva"].replace("@eva", addSign(tmpVal - status.eva));
							status.eva = tmpVal;
							break;
						// 会心率
						case "CR":
							tmpVal = Math.floor(multiply(status.crt, 1 + per(summary[i][j][key])));
							tmp1["crt"] = tmp1["crt"].replace("@crt", addSign(tmpVal - status.crt) + "%");
							status.crt = tmpVal;
							break;
						// 防御
						case "DF":
							tmpVal = Math.floor(multiply(status.def, 1 + per(summary[i][j][key])));
							tmp1["def"] = tmp1["def"].replace("@def", addSign(tmpVal - status.def));
							status.def = tmpVal;
							break;
						// スキル冷却速度
						case "CT":
							ctdown = ctdown - per(summary[i][j][key]);
							break;
					}
					if(idx % 2 == 1){
						tmp2 += "</div>";
					}
					idx++;
				}
				if(idx % 3 == 2){
					tmp2 += "<td colspan='2'></td></tr>";
				}else if(idx % 3 == 1){
					tmp2 += "<td colspan='2'></td><td colspan='2'></td></tr>";
				}
			}
			// CT減少が30%以上の場合
			if(ctdown < 0.7){
				// 最大30%に調整する
				ctdown = 0.7;
			}
			// 陣形効果による上昇が無かった項目のクリア
			tmp1["atk"] = tmp1["atk"].replace("@atk", "");
			tmp1["acc"] = tmp1["acc"].replace("@acc", "");
			tmp1["eva"] = tmp1["eva"].replace("@eva", "");
			tmp1["spe"] = tmp1["spe"].replace("@spe", "");
			tmp1["crt"] = tmp1["crt"].replace("@crt", "");
			if(tmp1["def"]){
				tmp1["def"] = tmp1["def"].replace("@def", "");
			}
			if(elem("addFairySkill").className == "active"){
				// 天賦効果の適用
				const fsData = fairySkill[elem("fairySkill").value];
				if(fsData.t == ALL || fsData.t == unitData[name].type){
					for(let param in fsData){
						if(param == "t"){
							continue;
						}
						status[param] = multiply(status[param], 1 + per(fsData[param]));
					}
				}
			}
			// 攻撃フレーム算出
			status["frame"] = calcFrame(unitData[name].type, name, status.spe);
			// 攻撃フレームをFPS変換（１秒＝29.999994F）
			status["fps"] = 29.999994 / status.frame;
			// DPS計算
			status.dps = multiply(status.atk, status.fps);
			// FPSを小数点以下3桁で斬る
			status.fps = String(status.fps).substring(0, String(status.fps).indexOf(".") + 4);
			// DPSを小数点以下切り上げ（？）
			status.dps = Math.ceil(status.dps);
			tmp1["fps"] = status.fps;
			tmp1["dps"] = status.dps;
			let tmp3 = "";
			// 装備データ取得
			const eq = unitStorage[name].equip;
			// 装備データあり
			if(eq){
				// 装備ループ
				for(let k = 0; k < eq.length; k++){
					if(eq[k] != null){
						let eqRare = null;
						for(let cat in equipment){
							const catData = equipment[cat];
							for(let sub in catData){
								const subData = catData[sub];
								for(let name in subData){
									if(name == eq[k].name){
										eqRare = subData[name].rare;
										break;
									}
								}
								if(eqRare != null){
									break;
								}
							}
							if(eqRare != null){
								break;
							}
						}
						
						tmp3 += "<div style='box-shadow:1px 1px 3px;padding-left:4px;margin-bottom:4px;background-color:" + rareClr[eqRare] + "'>" + eq[k].name.split("@")[0] + "</div>";
					}
				}
				if(tmp3 != ""){
					tmp3 = "<div style='font-weight:bold;margin-bottom:2px;'>[装備]</div>" + tmp3;
				}
			}
			let tmp0 = "";
			// 好感度を文章変換
			switch(unitStorage[name].favor){
				case -5:
					tmp0 += "好感度:10未満";
					break;
				case 5:
					tmp0 += "好感度:90～139";
					break;
				case 10:
					tmp0 += "好感度:140以上";
					break;
				default:
					tmp0 += "好感度:10～89";
					break;
			}
			// スキルレべルが設定されている場合、スキルレベル表記を追加
			if(unitStorage[name].slv){
				tmp0 += "&nbsp;SLV:" + unitStorage[name].slv;
			}
			// セルにステータス追加
			let html = "<div style='margin-top:1px;text-align:right;'>" + tmp0 + "</div>";
			html += "<div style='height:75%;display:flex;flex-direction:column;justify-content:space-between;'>";
			html += "<div>" + tmp3 + "</div>";
			html += "<div>" + tmp2 + "</div>";
			html += "<input type='hidden' value='" + JSON.stringify(tmp1) + "'>";
			cell.innerHTML += html;
			// スキル情報
			let skill = null;
			// スキル情報が設定されている場合（データ登録が未済のケース／例外ブロック）
			if(unitData[name].skill){
				// スキルレベル
				let slv = 0;
				// スキルレベルが設定されている場合取得
				if(unitStorage[name].slv != null){
					slv = unitStorage[name].slv - 1;
				}
				// スキルデータ取得
				const mySkill = unitData[name].skill;
				// 味方全体スキル
				if(mySkill.t == "friend" && mySkill.range == ALL){
					const ars = {
						wt:0,
						wait:0,
						ct:0,
						rest:0,
						fire:0,
						eff:{},
						dur:0
					};
					// 開幕CT初期化
					if(unitStorage[name].manual){
						ars.wt = multiply(unitStorage[name].manual, 30);
					}else{
						ars.wt = Math.ceil(multiply(multiply(mySkill.wt, 30), ctdown));
					}
					// CT待ち初期化
					ars.rest = ars.wt + 1;
					// CT初期化
					ars.ct = Math.ceil(multiply(multiply(mySkill.ct[slv], 30), ctdown));
					// 効果時間初期化 ※ボムスキルは未設定のため、0固定
					if(mySkill.dur){
						ars.dur = multiply(mySkill.dur[slv], 30);
					}
					// スキル判定用にスキル名を連携
					ars[mySkill.name] = true;
					// スキル効果のコピー
					for(let key in mySkill.eff){
						// DoT以外
						if(key != "dot"){
							if(key.indexOf("n_") == 0 && calcExpected && elem("fieldType").value == "night"){
								ars.eff[key.replace("n_","")] = mySkill.eff[key][slv];
							}else{
								if(calcExpected && elem("fieldType").value == "night"){
									if(mySkill.eff["n_" + key]){
										continue;
									}
								}
								ars.eff[key] = mySkill.eff[key][slv];
							}
						// DoT
						}else{
							ars.eff[key] = JSON.parse(JSON.stringify(mySkill.eff[key]));
							ars.eff[key].dmg = ars.eff[key].dmg[slv];
						}
					}
					allRangeSkill.push(ars);
				// 味方陣形範囲適応（リベロールなど）
				}else if(mySkill.t == "friend" && mySkill.range == "formation"){
					const ars = {
						name:name,
						wt:0,
						wait:0,
						ct:0,
						rest:0,
						fire:0,
						eff:{},
						dur:0
					};
					// 開幕CT初期化
					if(unitStorage[name].manual){
						ars.wt = multiply(unitStorage[name].manual, 30);
					}else{
						ars.wt = Math.ceil(multiply(multiply(mySkill.wt, 30), ctdown));
					}
					// CT待ち初期化
					ars.rest = ars.wt + 1;
					// CT初期化
					ars.ct = Math.ceil(multiply(multiply(mySkill.ct[slv], 30), ctdown));
					// 効果時間初期化 ※ボムスキルは未設定のため、0固定
					if(mySkill.dur){
						ars.dur = multiply(mySkill.dur[slv], 30);
					}
					// スキル効果のコピー
					for(let key in mySkill.eff){
						// DoTダメージ以外
						if(key != "dot"){
							// 夜戦スキル且つ期待値計算且つ夜戦指定の場合
							if(key.indexOf("n_") == 0 && calcExpected && elem("fieldType").value == "night"){
								// 夜戦スキルを通常スキルに読み替えて格納
								ars.eff[key.replace("n_","")] = mySkill.eff[key][slv];
							// 上記以外
							}else{
								// 期待値計算、且つ夜戦指定の場合
								if(calcExpected && elem("fieldType").value == "night"){
									// 夜戦スキルが指定されている場合
									if(mySkill.eff["n_" + key]){
										// 登録しない（上書きされてしまうため）
										continue;
									}
								}
								ars.eff[key] = mySkill.eff[key][slv];
							}
						// DoTダメージ
						}else{
							// 階層構造になっているため、階層ごともってくる
							ars.eff[key] = JSON.parse(JSON.stringify(mySkill.eff[key]));
							ars.eff[key].dmg = ars.eff[key].dmg[slv];
						}
					}
					// スキル判定用にスキル名を連携
					ars[mySkill.name] = true;
					// 味方陣形範囲適応スキルに退避
					formationSkill.push(ars);
				// その他
				}else{
					// スキル効果データの初期化
					skill = {
						t:mySkill.t,
						wt:0,
						wait:0,
						ct:0,
						cf:1,
						rest:0,
						fire:0,
						bomb:false,
						eff:{},
						dur:0
					};
					// 開幕CT初期化
					if(unitStorage[name].manual){
						skill.wt = multiply(unitStorage[name].manual, 30);
					}else{
						skill.wt = Math.ceil(multiply(multiply(mySkill.wt, 30), ctdown));
					}
					// スキル準備初期化
					if(mySkill.wait){
						skill.wait = multiply(mySkill.wait, 30);
					}
					// CT待ち初期化
					skill.rest = skill.wt + 1;
					// CT初期化
					skill.ct = Math.ceil(multiply(multiply(mySkill.ct[slv], 30), ctdown));
					// 連射回数設定 ※基本的には単射だが一部スキル用
					if(mySkill.cf){
						skill.cf = mySkill.cf;
					}
					// 効果時間初期化 ※ボムスキルは未設定のため、0固定
					if(mySkill.dur){
						skill.dur = multiply(mySkill.dur[slv], 30);
					}
					// スキル判定用にスキル名を連携
					skill[mySkill.name] = true;
					// スキル効果のコピー
					for(let key in mySkill.eff){
						if(key != "dot"){
							if(key.indexOf("n_") == 0 && calcExpected && elem("fieldType").value == "night"){
								skill.eff[key.replace("n_","")] = mySkill.eff[key][slv];
							}else{
								if(calcExpected && elem("fieldType").value == "night"){
									if(mySkill.eff["n_" + key]){
										continue;
									}
								}
								skill.eff[key] = mySkill.eff[key][slv];
							}
						}else{
							skill.eff[key] = JSON.parse(JSON.stringify(mySkill.eff[key]));
							skill.eff[key].dmg = skill.eff[key].dmg[slv];
						}
					}
					// 特殊スキル分岐
					switch(mySkill.name){
						case "デンジャースカウター":
							// 最前列に配置している、もしくは前方に戦術人形が配置されている場合
							if(j == 2 || countSpan(elem("sim").children[0].children[i].children[j + 1]) > 0){
								// スキル効果から火力上昇と射速上昇を削る
								delete skill.eff.atk;
								delete skill.eff.spe;
							}
							break;
						case "マインドチェイン":
							// 永続
							skill.dur = 99999;
							// スキル条件により適用されるスキルを切り替える
							if(!unitStorage[name].cond || unitStorage[name].cond == 0){
								delete skill.eff.atk;
								delete skill.eff.acc;
							}else if(unitStorage[name].cond == 1){
								delete skill.eff.eva;
								delete skill.eff.acc;
								skill.wt = skill.wt + 30;
								skill.rest = skill.rest + 30;
							}else if(unitStorage[name].cond == 2){
								delete skill.eff.eva;
								delete skill.eff.atk;
								skill.wt = skill.wt + 60;
								skill.rest = skill.rest + 60;
							}
							break;
						case "ピアースショット":
							if(unitStorage[name].cond == 1){
								// ダメージを倍（＝ターゲットの分）にする
								skill.eff.dmg = multiply(skill.eff.dmg, 2);
							}
							break;
						case "夜梟咆哮":
							// 敵3体以上にHit
							if(!unitStorage[name].cond || unitStorage[name].cond == 0){
								skill.dur = multiply(mySkill.dur_1[slv], 30);
								delete skill.eff.atk;
							// 敵3体未満にHit
							}else if(unitStorage[name].cond == 1){
								skill.dur = multiply(mySkill.dur_2[slv], 30);
								delete skill.eff.dmup;
							}
							break;
						case "未来予知":
							// 6組以上→3組以上
							if(!unitStorage[name].cond || unitStorage[name].cond == 0){
								skill.dur = 90;
								delete skill.eff.atk_bf;
							// 6組以上→3組未満
							}else if(unitStorage[name].cond == 1){
								skill.dur = 240;
								delete skill.eff.atk_bf;
								
								const tmpSkill = JSON.parse(JSON.stringify(skill));
								tmpSkill["name"] = name;
								tmpSkill.dur = 150;
								delete tmpSkill.eff.spe;
								delete tmpSkill.eff.acc;
								tmpSkill.eff.atk = tmpSkill.eff.atk_af;
								delete tmpSkill.eff.atk_af;
								tmpSkill.wt = tmpSkill.wt + 90;
								tmpSkill.rest = tmpSkill.wt + 1;
								formationSkill.push(tmpSkill);
							// 6組未満→3組以上
							}else if(unitStorage[name].cond == 2){
								skill.dur = 90;
								delete skill.eff.spe;
								delete skill.eff.acc;
								skill.eff["atk"] = skill.eff.atk_bf;
								delete skill.eff.atk_bf;
							// 6組未満→3組未満
							}else if(unitStorage[name].cond == 3){
								skill.dur = 240;
								delete skill.eff.spe;
								delete skill.eff.acc;
								skill.eff["atk"] = skill.eff.atk_bf;
								delete skill.eff.atk_bf;
								
								const tmpSkill = JSON.parse(JSON.stringify(skill));
								tmpSkill["name"] = name;
								tmpSkill.dur = 150;
								tmpSkill.eff.atk = tmpSkill.eff.atk_af;
								delete tmpSkill.eff.atk_af;
								tmpSkill.wt = tmpSkill.wt + 90;
								tmpSkill.rest = tmpSkill.wt + 1;
								formationSkill.push(tmpSkill);
							}
							break;
						case "桜逆像":
							// シールド未破壊
							if(unitStorage[name].cond == 1){
								skill.rest = skill.rest + 150;
							// シールド破壊
							}else{
								delete skill.eff.atk;
							}
					}
				}
				// 敵に影響するスキル→別枠で格納する
				if(mySkill.t == "enemy"){
					const ars = {
						user:name,
						wt:0,
						wait:0,
						ct:0,
						rest:0,
						fire:0,
						eff:{},
						dur:0
					};
					// 開幕CT初期化
					if(unitStorage[name].manual){
						ars.wt = multiply(unitStorage[name].manual, 30);
					}else{
						ars.wt = Math.ceil(multiply(multiply(mySkill.wt, 30), ctdown));
					}
					// CT待ち初期化
					ars.rest = ars.wt + 1;
					// CT初期化
					ars.ct = Math.ceil(multiply(multiply(mySkill.ct[slv], 30), ctdown));
					// スキル準備初期化
					if(mySkill.wait){
						ars.wait = multiply(mySkill.wait, 30);
					}
					// 効果時間初期化 ※ボムスキルは未設定のため、0固定
					if(mySkill.dur){
						ars.dur = multiply(mySkill.dur[slv], 30);
					}
					// スキル判定用にスキル名を連携
					ars[mySkill.name] = true;
					// スキル効果のコピー
					for(let key in mySkill.eff){
						if(key != "dot"){
							if(key.indexOf("n_") == 0 && calcExpected && elem("fieldType").value == "night"){
								ars.eff[key.replace("n_","")] = mySkill.eff[key][slv];
							}else{
								if(calcExpected && elem("fieldType").value == "night"){
									if(mySkill.eff["n_" + key]){
										continue;
									}
								}
								ars.eff[key] = mySkill.eff[key][slv];
							}
						}else{
							ars.eff[key] = JSON.parse(JSON.stringify(mySkill.eff[key]));
							ars.eff[key].dmg = ars.eff[key].dmg[slv];
						}
					}
					enemyEffectSkill.push(ars);
				}
			}
			// ダメージ計算用データに追加
			dmgCalc.push({
				name:name,
				type:unitData[name].type,
				frame:status.frame,
				effFrame:status.frame,
				effCf:1,
				rest:status.frame,
				atk:status.atk,
				acc:status.acc,
				crt:status.crt,
				cm:status.cm,
				cnt:0,
				slot:status.slot,
				effAtk:status.atk,
				effAcc:status.acc,
				effCrt:status.crt,
				effSlot:status.slot,
				restSlot:0,
				spe:status.spe,
				effSpe:status.spe,
				skill:skill,
				gb:status.gb,
				ns:status.ns,
				reload:0,
				r:i,
				c:j,
				skillWait:0,
				skillWaiting:false
			});
		}
	});
	let rows = new Array();
	const ttlAll = new Array();
	const fod = {};
	const wot = {};
	const ee = {};
	const unitDmg = {};
	// 30F×20秒で計算
	for(let i = 0; i < (30 * timeMesure); i++){
		// 味方全体スキル持ちがいる場合
		if(allRangeSkill.length > 0){
			// 味方全体に適用されるスキルのフレームを進行する
			for(let k = 0; k < allRangeSkill.length; k++){
				allRangeSkill[k].rest--;
				if(allRangeSkill[k].rest == 0){
					allRangeSkill[k].fire = allRangeSkill[k].dur;
					allRangeSkill[k].rest = allRangeSkill[k].ct;
				}else if(allRangeSkill[k].fire > 0){
					allRangeSkill[k].fire--;
				}
			}
		}
		// 陣形範囲適応スキル持ちがいる場合
		if(formationSkill.length > 0){
			// 陣形範囲に適用されるスキルのフレームを進行する
			for(let k = 0; k < formationSkill.length; k++){
				formationSkill[k].rest--;
				if(formationSkill[k].rest == 0){
					formationSkill[k].fire = formationSkill[k].dur;
					formationSkill[k].rest = formationSkill[k].ct;
				}else if(formationSkill[k].fire){
					formationSkill[k].fire--;
				}
			}
		}
		// 敵に影響するスキル持ちがいる場合
		if(enemyEffectSkill.length > 0){
			// 味方全体に適用されるスキルのフレームを進行する
			for(let k = 0; k < enemyEffectSkill.length; k++){
				let hasFired = false;
				enemyEffectSkill[k].rest--;
				if(enemyEffectSkill[k].skillWait){
					enemyEffectSkill[k].skillWait--;
				}
				if(enemyEffectSkill[k].rest == 0){
					enemyEffectSkill[k].rest = enemyEffectSkill[k].ct;
					if(!enemyEffectSkill[k].skillWait && enemyEffectSkill[k].wait > 0){
						enemyEffectSkill[k]["skillWait"] = enemyEffectSkill[k].wait;
					}else{
						enemyEffectSkill[k].fire = enemyEffectSkill[k].dur;
					}
				}
				if(enemyEffectSkill[k].wait > 0 && enemyEffectSkill[k].skillWait == 0){
					enemyEffectSkill[k].fire = enemyEffectSkill[k].dur;
					delete enemyEffectSkill[k].skillWait;
				}
				if(enemyEffectSkill[k].fire > 0){
					enemyEffectSkill[k].fire--;
					if(!enemyEffectSkill[k].eff.dot){
						hasFired = true;
					}
				}
				if(!ee[enemyEffectSkill[k].user]){
					ee[enemyEffectSkill[k].user] = new Array();
				}
				ee[enemyEffectSkill[k].user].push(hasFired);
			}
		}
		// ダメージデータループ
		for(let j = 0; j < dmgCalc.length; j++){
			// 戦術人形名を取得
			const name = dmgCalc[j].name;
			// ループ初回
			if(i == 0){
				// 戦術人形名をダメージ一覧に追加
				rows.push(createElem("tr"));
				add(rows[j], name.replace("@", ""), {paddingLeft:px(4)});
				// ダメージデータリセット
				unitDmg[name] = 0;
			}
			// スキルが設定されている場合
			if(dmgCalc[j].skill != null){
				// CT待ち消化
				dmgCalc[j].skill.rest--;
				// マニックブラッドのスタックコントロール
				if(dmgCalc[j].skill["マニックブラッド"] && dmgCalc[j].skill.stack){
					for(let k = 0; k < dmgCalc[j].skill.stack.length; k++){
						if(dmgCalc[j].skill.stack[k] > 0){
							dmgCalc[j].skill.stack[k]--;
						}
					}
				}
				// スキル効果時間中の場合
				if(dmgCalc[j].skill.fire > 0){
					// スキル効果時間の消化
					dmgCalc[j].skill.fire--;
				}
				// スキル発動待ち（狙撃系など）の場合
				if(dmgCalc[j].skillWait > 0){
					// 発動待ち時間の進行
					dmgCalc[j].skillWait--;
					// 1秒=30Fタイミングの場合
					if(i % 30 == 29){
						// スキル待ち中の表記をする
						const style = {textAlign:R, paddingRight:px(4), color:"#B0B0B0"};
						add(rows[j], unitDmg[name], style);
					}
					fod[name].push(unitDmg[name]);
					wot[name].push(true);
					// 後は何もしない
					continue;
				}
				// 投擲モーション中の場合
				if(dmgCalc[j].throwing){
					// モーション待ち時間を進行
					dmgCalc[j].throwTime--;
				}
			}
			// リロード中の場合
			if(dmgCalc[j].reload > 0){
				// リロードフレームを進行
				dmgCalc[j].reload--;
				// 1秒=30Fタイミングの場合
				if(i % 30 == 29){
					// リロード中の表記をする
					const style = {textAlign:R, paddingRight:px(4), backgroundColor:null};
					const cells = getCells(rows[j]);
					if(parseInt(cells[cells.length - 1].innerText, 10) == unitDmg[name]){
						style.color = "#B0B0B0";
					}else{
						// スキル持ちの場合
						if(dmgCalc[j].skill != null){
							// ボムスキル発動のタイミングの場合
							if(dmgCalc[j].skill.bomb){
								// 赤っぽくする
								style.color = "#FFB000";
								style.fontWeight = "bold";
								// ボムスキル発動フラグのOFF
								dmgCalc[j].skill.bomb = false;
							// スキル発動中の場合
							}else if(dmgCalc[j].skill.fire > 0){
								if(dmgCalc[j].skill.t == "self"){
									// 赤
									style.color = "#FF0000";
									style.fontWeight = "bold";
								}else{
									if(dmgCalc[j].skill.eff.dot && dmgCalc[j].skill.eff.dot.rest != null){
										style.color = "#D06000";
										style.fontWeight = "bold";
									}
								}
							}
						}
					}
					// 味方全体スキル持ちがいる場合
					if(allRangeSkill.length > 0){
						// ループ
						for(let k = 0; k < allRangeSkill.length; k++){
							// 発動中のスキルがある場合
							if(allRangeSkill[k].fire > 0){
								// 黄色っぽくする
								style.backgroundColor = "#FFFFCC";
								break;
							}
						}
					}
					// 陣形効果スキル持ちがいる場合
					if(formationSkill.length > 0){
						// ループ
						for(let k = 0; k < formationSkill.length; k++){
							// 該当スキル使用者の陣形範囲取得
							const ufr = unitFormationRange[formationSkill[k].name];
							// 陣形範囲外の場合
							if(!ufr || !ufr[dmgCalc[j].r][dmgCalc[j].c]){
								// 次へ
								continue;
							}
							// 発動中のスキルの場合
							if(formationSkill[k].fire > 0){
								// 黄色っぽくする
								style.backgroundColor = "#FFFFCC";
								break;
							}
						}
					}
					add(rows[j], unitDmg[name], style);
				}
				fod[name].push(unitDmg[name]);
				wot[name].push(true);
				// 後は何もしない
				continue;
			}
			// 攻撃待ち時間の消化
			dmgCalc[j].rest--;
			// ダメージ
			let dmg = 0;
			// 各スキル反映後の値をクリアする
			dmgCalc[j].effFrame = dmgCalc[j].frame;
			dmgCalc[j].effSpe = dmgCalc[j].spe;
			dmgCalc[j].effAtk = dmgCalc[j].atk;
			dmgCalc[j].effAcc = dmgCalc[j].acc;
			dmgCalc[j].effCrt = dmgCalc[j].crt;
			dmgCalc[j].effSlot = dmgCalc[j].slot;
			dmgCalc[j].effCf = 1;
			// 味方全体スキル持ちがいる場合
			if(allRangeSkill.length > 0){
				// 味方全体スキルループ
				for(let k = 0; k < allRangeSkill.length; k++){
					// 効果発動中の場合
					if(allRangeSkill[k].fire > 0){
						// 火力上昇スキルの場合
						if(allRangeSkill[k].eff.atk){
							// 火力を上昇させる
							dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, 1 + per(allRangeSkill[k].eff.atk));
						}
						// 命中上昇スキルの場合
						if(allRangeSkill[k].eff.acc){
							// 命中を上昇させる
							dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, 1 + per(allRangeSkill[k].eff.acc));
						}
						// 会心率上昇スキルの場合
						if(allRangeSkill[k].eff.crt){
							// 会心率を上昇させる
							dmgCalc[j].effCrt = multiply(dmgCalc[j].effCrt, 1 + per(allRangeSkill[k].eff.crt));
						}
						// 射速上昇スキルの場合
						if(allRangeSkill[k].eff.spe){
							dmgCalc[j].effSpe = multiply(dmgCalc[j].effSpe, 1 + per(allRangeSkill[k].eff.spe));
							// 射速は120上限　※MGなし、SGは60
							switch(dmgCalc[j].type){
								case MG:
									break;
								case SG:
									if(dmgCalc[j].effSpe > 60){
										dmgCalc[j].effSpe = 60;
									}
									break;
								default:
									if(dmgCalc[j].effSpe > 120){
										dmgCalc[j].effSpe = 120;
									}
							}
							// 攻撃フレームを再計算
							dmgCalc[j].effFrame = Math.ceil(1500 / dmgCalc[j].effSpe) - 1;
							// 再計算で攻撃待ちが攻撃フレームを超えた場合
							if(dmgCalc[j].rest > dmgCalc[j].effFrame){
								// 攻撃フレームを調整する
								dmgCalc[j].rest = dmgCalc[j].effFrame
							}
						}
					}
				}
			}
			// 陣形適用スキル持ちがいる場合
			if(formationSkill.length > 0){
				// 陣形適用スキルループ
				for(let k = 0; k < formationSkill.length; k++){
					// スキル使用者の陣形が適用される範囲を取得
					const ufr = unitFormationRange[formationSkill[k].name];
					// 適用範囲外の場合
					if(!ufr || !ufr[dmgCalc[j].r][dmgCalc[j].c]){
						// 何もしない
						continue;
					}
					// スキル発動中の場合
					if(formationSkill[k].fire > 0){
						// 戦場の哲学館については特殊なので別ロジック
						if(formationSkill[k]["戦場の哲学館"]){
							switch(dmgCalc[j].type){
								// HG,SMG
								case HG:
								case SMG:
									// 回避上昇
									break;
								// RF,AR
								case RF:
								case AR:
									// 火力上昇スキルの場合
									if(formationSkill[k].eff.atk){
										// 火力を上昇させる
										dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, 1 + per(formationSkill[k].eff.atk));
									}
									break;
								// MG,SG
								case MG:
								case SG:
									// 命中上昇スキルの場合
									if(formationSkill[k].eff.acc){
										// 命中を上昇させる
										dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, 1 + per(formationSkill[k].eff.acc));
									}
									break;
							}
						}else{
							// 火力上昇スキルの場合
							if(formationSkill[k].eff.atk){
								// 火力を上昇させる
								dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, 1 + per(formationSkill[k].eff.atk));
							}
							// 命中上昇スキルの場合
							if(formationSkill[k].eff.acc){
								// 火力を上昇させる
								dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, 1 + per(formationSkill[k].eff.acc));
							}
							// 射速上昇スキルの場合
							if(formationSkill[k].eff.spe){
								dmgCalc[j].effSpe = multiply(dmgCalc[j].effSpe, 1 + per(formationSkill[k].eff.spe));
								// 射速は120上限　※MGなし、SGは60
								switch(dmgCalc[j].type){
									case MG:
										break;
									case SG:
										if(dmgCalc[j].effSpe > 60){
											dmgCalc[j].effSpe = 60;
										}
										break;
									default:
										if(dmgCalc[j].effSpe > 120){
											dmgCalc[j].effSpe = 120;
										}
								}
								// 攻撃フレームを再計算
								dmgCalc[j].effFrame = Math.ceil(1500 / dmgCalc[j].effSpe) - 1;
								// 再計算で攻撃待ちが攻撃フレームを超えた場合
								if(dmgCalc[j].rest > dmgCalc[j].effFrame){
									// 攻撃フレームを調整する
									dmgCalc[j].rest = dmgCalc[j].effFrame
								}
							}
						}
					}
				}
			}
			// スキルが設定されている場合
			if(dmgCalc[j].skill != null){
				// CT待ちが消化済の場合
				if(dmgCalc[j].skill.rest == 0){
					// 効果時間が設定されている場合
					if(dmgCalc[j].skill.dur){
						// スキルの効果中の時間を効果時間で初期化する
						// ※現時点では焼夷手榴弾のみであるため、投擲モーション分の30Fをプラス
						dmgCalc[j].skill.fire = dmgCalc[j].skill.dur + 30;
						// 焼夷弾系統スキル（DoTダメージ）の場合
						if(dmgCalc[j].skill.eff.dot){
							// DoTダメージのリセット
							dmgCalc[j].skill.eff.dot["rest"] = null;
						}
					}
					// 発動時間が設定されている場合
					if(dmgCalc[j].skill.wait > 0){
						// 発動待ちにする
						dmgCalc[j].skillWait = dmgCalc[j].skill.wait;
						dmgCalc[j].skillWaiting = true;
					// 設定されていない場合
					}else{
						dmgCalc[j]["throwing"] = true;
						dmgCalc[j]["throwTime"] = 30;
						// スキル回数の設定　※現時点ではバトルストンプだけが3回連続攻撃なのでロジック側でコントロールしちゃう。
						if(dmgCalc[j].skill["バトルストンプ"]){
							dmgCalc[j]["throwCount"] = 3;
						}else{
							dmgCalc[j]["throwCount"] = 1;
						}
					}
					// ヒートブラストのスイッチング
					if(dmgCalc[j].skill.mode){
						// Feverモード
						if(dmgCalc[j].skill.mode == "fever"){
							// Noteモードに切り替え
							dmgCalc[j].skill.mode = "note";
							// Noteモードでの攻撃回数をリセット（ここリセットして良いのかちょい不明）
							dmgCalc[j].skill.noteCnt = 0;
						// Noteモード
						}else{
							// Feverモードに切り替え
							dmgCalc[j].skill.mode = "fever";
						}
					}
					// CT待ちをリセット
					dmgCalc[j].skill.rest = dmgCalc[j].skill.ct;
				// スキル発動待機が明けた場合
				}else if(dmgCalc[j].skillWaiting){
					// ボムスキルキック用フラグON
					dmgCalc[j].skill.bomb = true;
					// バンカーショット用
					// 敵として装甲値が設定されている敵を相手として想定した場合のみ装甲型で計算
					if(dmgCalc[j].skill.eff.dmggb && calcExpected && elem("eneDef").value > 0){
						// ダメージ値を加算
						dmg += multiply(multiply(dmgCalc[j].effAtk, per(dmgCalc[j].skill.eff.dmggb)), dmgCalc[j].skill.cf);
					// ダメージ値が設定されている場合
					}else if(dmgCalc[j].skill.eff.dmg){
						// ダメージ値を加算
						dmg += multiply(multiply(dmgCalc[j].effAtk, per(dmgCalc[j].skill.eff.dmg)), dmgCalc[j].skill.cf);
					}
					// 発動待ちをリセットする
					dmgCalc[j].skillWaiting = false;
				// 投擲モーション中で投擲モーションが明けた場合
				}else if(dmgCalc[j].throwing && dmgCalc[j].throwTime == 0){
					// ダメージ値が設定されている（榴弾系スキル）の場合
					if(dmgCalc[j].skill.eff.dmg){
						// ボムスキルキック用フラグON
						dmgCalc[j].skill.bomb = true;
						// チェーンブラスト対応
						if(typeof dmgCalc[j].skill.eff.dmg == "object"){
							// とりあえず爆心地でのダメージとする
							for(let x = 0; x < dmgCalc[j].skill.eff.dmg.length; x++){
								dmg += multiply(multiply(dmgCalc[j].effAtk, per(dmgCalc[j].skill.eff.dmg[x])), dmgCalc[j].skill.cf);
							}
						}else{
							// ダメージ値を加算
							dmg += multiply(multiply(dmgCalc[j].effAtk, per(dmgCalc[j].skill.eff.dmg)), dmgCalc[j].skill.cf);
						}
					// ダメージ値が設定されている（榴弾系スキル/ダメージ固定）の場合
					}else if(dmgCalc[j].skill.eff.fix){
						// ボムスキルキック用フラグON
						dmgCalc[j].skill.bomb = true;
						// ダメージ値を加算
						dmg += dmgCalc[j].skill.eff.fix;
					}
					// 焼夷手榴弾弾（DoTダメージ）の場合
					if(dmgCalc[j].skill.eff.dot){
						// DoTダメージの開始
						dmgCalc[j].skill.eff.dot["rest"] = dmgCalc[j].skill.eff.dot.f;
					}
					// 攻撃回数カウンタのデクリメント
					dmgCalc[j].throwCount--;
					// 回数が0になった
					if(dmgCalc[j].throwCount == 0){
						// 投擲モーションフラグのOFF
						dmgCalc[j].throwing = false;
					// まだ回数が残っている
					}else{
						// 時間を再設定する
						dmgCalc[j].throwTime = 30;
					}
				}
				// スキル効果時間中の場合
				if(dmgCalc[j].skill.fire > 0){
					// 未来予知が3秒経過した後で3組未満のケース
					if(dmgCalc[j].skill["未来予知"] && dmgCalc[j].skill.fire == 150 && (unitStorage[name].cond == 1 || unitStorage[name].cond == 3)){
						// スキル効果を書き換える
						delete dmgCalc[j].skill.eff.acc;
						delete dmgCalc[j].skill.eff.spe;
						dmgCalc[j].skill.eff.atk = dmgCalc[j].skill.eff.atk_af;
					}
					// 自己バフの場合
					if(dmgCalc[j].skill.t == "self"){
						// 火力上昇スキルの場合
						if(dmgCalc[j].skill.eff.atk){
							// マニックブラッド反映
							if(dmgCalc[j].skill["マニックブラッド"]){
								let stack = 0;
								if(dmgCalc[j].skill.stack){
									for(let k = 0; k < dmgCalc[j].skill.stack.length; k++){
										if(dmgCalc[j].skill.stack[k] > 0){
											stack++;
										}
									}
									if(stack > 0){
										dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, Math.pow(1 + per(dmgCalc[j].skill.eff.atk), stack));
									}
								}
							}else{
								// 火力を上昇させる
								dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, 1 + per(dmgCalc[j].skill.eff.atk));
							}
						}
						// 命中上昇スキルの場合
						if(dmgCalc[j].skill.eff.acc){
							// 命中を上昇させる
							dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, 1 + per(dmgCalc[j].skill.eff.acc));
						}
						// 会心率上昇スキルの場合
						if(dmgCalc[j].skill.eff.crt){
							// 会心率を上昇させる
							dmgCalc[j].effCrt = multiply(dmgCalc[j].effCrt, 1 + per(dmgCalc[j].skill.eff.crt));
						}
						// 射速上昇スキルの場合
						if(dmgCalc[j].skill.eff.spe){
							dmgCalc[j].effSpe = multiply(dmgCalc[j].effSpe, 1 + per(dmgCalc[j].skill.eff.spe));
							// 射速は120上限　※MGなし、SGは60
							switch(dmgCalc[j].type){
								case MG:
									break;
								case SG:
									if(dmgCalc[j].effSpe > 60){
										dmgCalc[j].effSpe = 60;
									}
									break;
								default:
									if(dmgCalc[j].effSpe > 120){
										dmgCalc[j].effSpe = 120;
									}
							}
							// 攻撃フレームを再計算
							dmgCalc[j].effFrame = Math.ceil(1500 / dmgCalc[j].effSpe) - 1;
							// 再計算で攻撃待ちが攻撃フレームを超えた場合
							if(dmgCalc[j].rest > dmgCalc[j].effFrame){
								// 攻撃フレームを調整する
								dmgCalc[j].rest = dmgCalc[j].effFrame
							}
						}
						// 弾薬数増加
						if(dmgCalc[j].skill.eff.slot){
							// リロード後に撃った弾数を退避
							dmgCalc[j].restSlot = dmgCalc[j].cnt % dmgCalc[j].slot;
							dmgCalc[j].effSlot = dmgCalc[j].effSlot + dmgCalc[j].skill.eff.slot;
						}
						// 連射スキルの場合
						if(dmgCalc[j].skill.eff.cf){
							// 攻撃回数を上昇
							dmgCalc[j].effCf = dmgCalc[j].skill.eff.cf;
						}
						// 弔いの雨
						if(dmgCalc[j].skill["弔いの雨"]){
							// 10フレーム固定
							dmgCalc[j].effFrame = 10;
							// 再計算で攻撃待ちが攻撃フレームを超えた場合
							if(dmgCalc[j].rest > dmgCalc[j].effFrame){
								// 攻撃フレームを調整する
								dmgCalc[j].rest = dmgCalc[j].effFrame
							}
						}
					}
					// 焼夷弾系統スキル（DoTダメージ）の場合
					if(dmgCalc[j].skill.eff.dot){
						// DoTダメージが開始されている
						if(dmgCalc[j].skill.eff.dot.rest != null){
							if(dmgCalc[j].skill.eff.dot.rest == 0){
								// DoTダメージを発生させる
								dmg += Math.floor(multiply(dmgCalc[j].effAtk, per(dmgCalc[j].skill.eff.dot.dmg)));
								// フレームリセット
								dmgCalc[j].skill.eff.dot.rest = dmgCalc[j].skill.eff.dot.f;
							// 上記以外
							}else{
								// フレーム消化
								dmgCalc[j].skill.eff.dot.rest--;
							}
						}
					}
				}
				// 特殊スキル操作
				// オーバーロード(UMP40)
				if(dmgCalc[j].skill["オーバーロード"]){
					if(!dmgCalc[j].skill.rest != 0){
						const sec = Math.floor(i / 30);
						let pow = Math.floor(sec / 2);
						if(pow > 5){
							pow = 5;
						}
						if(pow > 0){
							dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, Math.pow(0.95, pow));
						}
					}else{
						const sec = Math.floor((i - dmgCalc[j].skill.wt) / 30);
						let pow = Math.floor(sec / 2);
						if(pow > 5){
							pow = 5;
						}
						if(pow > 0){
							dmgCalc[j].effAtk = multiply(dmgCalc[j].effAtk, Math.pow((1 + per(dmgCalc[j].skill.eff.atk)), pow));
						}
					}
				// ヒートブラスト(K2)
				}else if(dmgCalc[j].skill["ヒートブラスト"]){
					// スキル状態の初期設定
					if(!dmgCalc[j].skill["mode"]){
						// Feverモードに初期設定をします
						dmgCalc[j].skill["mode"] = "fever";
						dmgCalc[j].skill["temp"] = 0;
						dmgCalc[j].skill["noteCnt"] = 0;
					}
				}
			}
			// 攻撃待ちが消化済の場合
			if(dmgCalc[j].rest == 0 && !dmgCalc[j].skillWaiting){
				// 通常攻撃分のダメージ加算
				let dmgTmp = multiply(dmgCalc[j].effAtk, dmgCalc[j].effCf);
				if(dmgCalc[j].skill){
					// ヒートブラストのダメージ反映
					if(dmgCalc[j].skill["ヒートブラスト"]){
						// Feverモード
						if(dmgCalc[j].skill.mode == "fever"){
							// 3点バースト
							dmgTmp = multiply(multiply(dmgTmp, per(dmgCalc[j].skill.eff.fever_dmg)), 3);
							// 銃身温度が15以上
							if(dmgCalc[j].skill.temp >= 15){
								let pow = dmgCalc[j].skill.temp;
								if(pow > 20){
									pow = 20;
								}
								const fAcc = per(100 + dmgCalc[j].skill.eff.fever_acc);
								dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, Math.pow(fAcc, pow));
								const fDmgdwn = per(100 + dmgCalc[j].skill.eff.fever_dmgdwn);
								dmgTmp = multiply(dmgTmp, Math.pow(fDmgdwn, pow));
							}
						// Noteモード
						}else{
							// 移動速度、回避はDPSに影響がないので無視
							let pow = dmgCalc[j].skill.noteCnt + 1;
							if(pow > 10){
								pow = 10;
							}
							const nDmgup = per(dmgCalc[j].skill.eff.note_dmgup);
							dmgTmp += multiply(multiply(dmgTmp, nDmgup), pow);
						}
					}
					// スタッカート分反映
					if(dmgCalc[j].skill["スタッカート"] && dmgCalc[j].cnt % 4 == 3){
						dmgTmp = multiply(dmgTmp, dmgCalc[j].skill.eff.atk);
					}
					// インフレイム反映
					if(dmgCalc[j].skill["インフレイム"]){
						// 非常に謎のスキル
						// えぇっと、実際の説明文とは異なり、10%でダメージ1.5倍の追加攻撃をするらしい
						// で、確率部分はSLV依存なので、想定として発生確率をスキルレベル依存値の半分（スキルレベルMAXでの説明文が20%なので）
						// 更にクリティカルが乗るらしいのでここで計算してみる
						// ただ、追加攻撃の判定が「Link毎に乗る」って書いてある意味がちょっとわからんので一先ずこんな感じで
						dmgTmp += multiply(multiply(dmgCalc[j].effAtk, 1.5), dmgCalc[j].skill.eff.per / 200);
					}
				}
				// 期待値計算をする場合
				if(calcExpected){
					// 破甲による補正
					let guardBrake = dmgCalc[j].gb - parseInt(elem("eneDef").value, 10);
					if(guardBrake > 2){
						guardBrake = 2;
					}
					// 破甲を考慮したダメージの計算
					dmgTmp = multiply(dmgCalc[j].effAtk + guardBrake, dmgCalc[j].effCf);
					// スキル設定がされている場合
					if(dmgCalc[j].skill){
						// ヒートブラストのダメージ反映
						if(dmgCalc[j].skill["ヒートブラスト"]){
							// Feverモード
							if(dmgCalc[j].skill.mode == "fever"){
								// 3点バースト
								dmgTmp = multiply(multiply(dmgTmp, per(dmgCalc[j].skill.eff.fever_dmg)), 3);
								// 銃身温度が15以上
								if(dmgCalc[j].skill.temp >= 15){
									let pow = dmgCalc[j].skill.temp;
									if(pow > 20){
										pow = 20;
									}
									const fAcc = per(100 + dmgCalc[j].skill.eff.fever_acc);
									dmgCalc[j].effAcc = multiply(dmgCalc[j].effAcc, Math.pow(fAcc, pow));
									const fDmgdwn = per(100 + dmgCalc[j].skill.eff.fever_dmgdwn);
									dmgTmp = multiply(dmgTmp, Math.pow(fDmgdwn, pow));
								}
							// Noteモード
							}else{
								// 移動速度、回避はDPSに影響がないので無視
								let pow = dmgCalc[j].skill.noteCnt + 1;
								if(pow > 10){
									pow = 10;
								}
								const nDmgup = per(dmgCalc[j].skill.eff.note_dmgup);
								dmgTmp += multiply(multiply(dmgTmp, nDmgup), pow);
							}
						}
						// スタッカート分反映
						if(dmgCalc[j].skill["スタッカート"] && dmgCalc[j].cnt % 4 == 3){
							dmgTmp = multiply(dmgTmp, dmgCalc[j].skill.eff.atk);
						}
						// インフレイム反映
						if(dmgCalc[j].skill["インフレイム"]){
							// 非常に謎のスキル
							// えぇっと、実際の説明文とは異なり、10%でダメージ1.5倍の追加攻撃をするらしい
							// で、確率部分はSLV依存なので、想定として発生確率をスキルレベル依存値の半分（スキルレベルMAXでの説明文が20%なので）
							// 更にクリティカルが乗るらしいのでここで計算してみる
							// ただ、追加攻撃の判定が「Link毎に乗る」って書いてある意味がちょっとわからんので一先ずこんな感じで
							dmgTmp += multiply(multiply(dmgCalc[j].effAtk, 1.5), dmgCalc[j].skill.eff.per / 200);
						}
					}
					// 命中率による補正
					// ※期待値であるため、この計算とする。実際は各攻撃の度に判定が行われ、命中→ダメージ発生、命中しない→missとなるため
					// 　実際の数値との乖離が大きいかも
					// 敵の回避率取得
					let eneEva = parseInt(elem("eneEva").value, 10);
					for(let k = 0; k < enemyEffectSkill.length; k++){
						if(enemyEffectSkill[k].fire > 0 && enemyEffectSkill[k].eff.eva > 0){
							eneEva = multiply(eneEva, 1 - per(enemyEffectSkill[k].eff.eva));
						}
					}
					
					// 命中率＝命中／（命中＋敵回避）
					// 昼戦
					if(elem("fieldType").value == "day"){
						dmgTmp = multiply(dmgTmp, dmgCalc[j].effAcc) / (dmgCalc[j].effAcc + eneEva);
					// 夜戦
					}else{
						// 夜戦ペナルティ
						const nAcc = multiply(dmgCalc[j].effAcc, 0.1 + multiply(0.9, per(dmgCalc[j].ns)));
						dmgTmp = multiply(dmgTmp, nAcc / (nAcc + eneEva));
					}
					// スタッカート分反映
					// ※スタッカートには会心ダメージ乗らない…？ぽいので分岐させて会心ダメージは適用しない
					if(dmgCalc[j].skill && dmgCalc[j].skill["スタッカート"] && dmgCalc[j].cnt % 4 == 3){
						
					}else{
						// 会心率＋会心ダメージによる補正
						// ※会心攻撃も実際は各攻撃の度に判定が行われるため、実際の数値と乖離が大きい可能性が高い
						let effCrt = dmgCalc[j].effCrt;
						if(effCrt > 100){
							effCrt = 100;
						}
						dmgTmp = dmgTmp + multiply(dmgTmp, multiply(per(effCrt), per(dmgCalc[j].cm) - 1));
					}
				}
				// ダメージの最小値は1のため、1未満なら1にする
				if(dmgTmp < 1){
					dmgTmp = 1;
				}
				// 敵に影響するスキルが設定されている場合、全スキルを適用
				for(let k = 0; k < enemyEffectSkill.length; k++){
					// ダメージUPスキルが発動している場合
					if(enemyEffectSkill[k].fire > 0 && enemyEffectSkill[k].eff.dmup > 0){
						// ダメージUPを適用する
						dmgTmp = multiply(dmgTmp, 1 + per(enemyEffectSkill[k].eff.dmup));
					}
				}
				dmg += dmgTmp;
				// 攻撃待ちをリセット
				dmgCalc[j].rest = dmgCalc[j].effFrame;
				// 攻撃回数加算
				dmgCalc[j].cnt++;
				// ヒートブラストの銃身温度のコントロール
				if(dmgCalc[j].skill && dmgCalc[j].skill["ヒートブラスト"]){
					if(dmgCalc[j].skill.mode == "fever"){
						dmgCalc[j].skill.temp++;
					}else if(dmgCalc[j].skill.mode == "note"){
						if(dmgCalc[j].skill.temp > 0){
							dmgCalc[j].skill.temp--;
						}
						dmgCalc[j].skill.noteCnt++;
					}
				}
				// 弾薬数分打ち切った場合
				// ※弾薬量増加のスキルが途中で発動した場合、restSlotにそこまで撃った分が退避されているのでその分を考慮して計算する
				if(dmgCalc[j].cnt != 0 && dmgCalc[j].effSlot > 0 && (dmgCalc[j].cnt - dmgCalc[j].restSlot) % dmgCalc[j].effSlot == 0){
					// MG,SGはリロードを発生させる
					// MG
					if(dmgCalc[j].type == MG){
						// リロード時間＝(4+200/射速)秒→30Fに変換
						dmgCalc[j].reload = Math.ceil(multiply(4 + (200 / dmgCalc[j].effSpe), 30));
						// マニックブラッドの場合
						if(dmgCalc[j].skill["マニックブラッド"]){
							// スキルスタックの初期化
							if(!dmgCalc[j].skill.stack){
								dmgCalc[j].skill.stack = new Array();
							}
							// スキルスタック追加(25秒=750F)
							dmgCalc[j].skill.stack.push(750);
							// スキルが切れることはないので常時発動状態にする
							dmgCalc[j].skill.fire = 99999;
						}
					// SG
					}else if(dmgCalc[j].type == SG){
						// リロード時間＝(1.5+0.5×弾薬量)→30Fに変換
						dmgCalc[j].reload = Math.ceil(multiply(1.5 + multiply(0.5, dmgCalc[j].effSlot), 30));
					}
				}
			}
			// ダメージを加算（小数点以下切り捨て）
			unitDmg[name] += Math.floor(dmg);
			// 1秒=30Fのタイミングの場合
			if(i % 30 == 29){
				// 表示用のスタイル定義
				const style = {textAlign:R, paddingRight:px(4), backgroundColor:null};
				// スキル持ちの場合
				if(dmgCalc[j].skill != null){
					// ボムスキル発動のタイミングの場合
					if(dmgCalc[j].skill.bomb){
						// 赤っぽくする
						style.color = "#FFB000";
						style.fontWeight = "bold";
						// ボムスキル発動フラグのOFF
						dmgCalc[j].skill.bomb = false;
					// スキル発動中の場合
					}else if(dmgCalc[j].skill.fire > 0){
						// 自己バフ
						if(dmgCalc[j].skill.t == "self"){
							// 赤っぽくする
							style.color = "#FF0000";
							style.fontWeight = "bold";
						// 自己バフ以外
						}else{
							// DoTダメージ
							if(dmgCalc[j].skill.eff.dot && dmgCalc[j].skill.eff.dot.rest != null){
								// 茶色っぽい色
								style.color = "#D06000";
								style.fontWeight = "bold";
							}
						}
					// Feverモード
					}else if(dmgCalc[j].skill.mode == "fever"){
						// 赤っぽくする
						style.color = "#FF0000";
						style.fontWeight = "bold";
					}
				}
				// 味方全体スキル持ちがいる場合
				if(allRangeSkill.length > 0){
					// ループ
					for(let k = 0; k < allRangeSkill.length; k++){
						// 発動中のスキルがある場合
						if(allRangeSkill[k].fire > 0){
							// 黄色っぽくする
							style.backgroundColor = "#FFFFCC";
							break;
						}
					}
				}
				// 陣形効果スキル持ちがいる場合
				if(formationSkill.length > 0){
					// ループ
					for(let k = 0; k < formationSkill.length; k++){
						// 該当スキル使用者の陣形範囲取得
						const ufr = unitFormationRange[formationSkill[k].name];
						// 陣形範囲外の場合
						if(!ufr || !ufr[dmgCalc[j].r][dmgCalc[j].c]){
							// 次へ
							continue;
						}
						// 発動中のスキルの場合
						if(formationSkill[k].fire > 0){
							// 黄色っぽくする
							style.backgroundColor = "#FFFFCC";
							break;
						}
					}
				}
				// セル追加
				add(rows[j], unitDmg[name], style);
			}
			if(!fod[name]){
				fod[name] = new Array();
			}
			fod[name].push(unitDmg[name]);
			if(!wot[name]){
				wot[name] = new Array();
			}
			wot[name].push(false);
		}
		// 1秒=30Fのタイミングの場合
		if(i % 30 == 29){
			let ttl = 0;
			for(let tdoll in unitDmg){
				ttl += unitDmg[tdoll];
			}
			ttlAll.push(ttl);
		}
	}
	// 基本位置
	const basePos = {
		x:45,
		y:475
	};
	// グラフの目盛幅
	const baseScale = {
		x:(timeMesure >= 20 ? 1.5 : 3),
		y:dmgMesure * 2.25
	};
	// グラフ領域
	const mtrxWidth = {
		name:basePos.x + 140,
		dmg:baseScale.x * 30 * (timeMesure >= 20 ? 0.95: 0.97)
	};
	
	/* 表作成 */
	const dmgMtrx = elem("dmgMtrx");
	// 表の幅調整
	dmgMtrx.style.width = px(mtrxWidth.name + 2 + (mtrxWidth.dmg + 1) * timeMesure);
	// 秒間ダメージマトリクスクリア
	dmgMtrx.innerHTML = "";
	// ヘッダ作る
	const h = createElem("tr");
	const nh = createElem("th");
	nh.innerText = "戦術人形";
	nh.style.width = px(mtrxWidth.name);
	h.appendChild(nh);
	// 秒間ダメージの反映
	for(let i = 0; i < timeMesure; i++){
		const hd = createElem("th");
		hd.innerText = (i + 1) + "s";
		hd.style.width = px(mtrxWidth.dmg);
		h.appendChild(hd);
	}
	dmgMtrx.appendChild(h);
	for(let i = 0; i < rows.length; i++){
		dmgMtrx.appendChild(rows[i]);
	}
	const ttlRow = createElem("tr");
	add(ttlRow, "合計", {paddingLeft:px(4), borderTop:"3px double black"});
	elem("dps5sec").innerHTML = "-";
	elem("dps8sec").innerHTML = "-";
	elem("dps20sec").innerHTML = "-";
	for(let i = 0; i < ttlAll.length; i++){
		add(ttlRow, ttlAll[i], {textAlign:R, paddingRight:px(4), borderTop:"3px double black"});
		if(i == 4){
			elem("dps5sec").innerHTML = ttlAll[i];
		}else if(i == 7){
			elem("dps8sec").innerHTML = ttlAll[i];
		}else if(i == 19){
			elem("dps20sec").innerHTML = ttlAll[i];
		}
	}
	dmgMtrx.appendChild(ttlRow);
	/* グラフ描画 */
	// インデクサ
	let idx = 0;
	// 色付け用の配列
	const clrArray = ["#FF0000","#00F000","#0000FF","#FF00FF","#00FFF0"];
	const clrArray2 = [{r:255,g:0,b:0},{r:0,g:240,b:0},{r:0,g:0,b:255},{r:255,g:0,b:255},{r:0,g:255,b:240}];
	// キャンバス取得
	const canvas = elem("glaf");
	// キャンバスの幅取得
	const canvasWidth = basePos.x + (baseScale.x * 30 * timeMesure) + 25;
	canvas.setAttribute("width", canvasWidth);
	canvas.style.width = px(canvasWidth);
	// コンテキスト取得
	const ctx = canvas.getContext("2d");
	// クリアする
	ctx.clearRect(0, 0, canvasWidth, 575);
	elem("glafNames").innerHTML = "";
	// フォント設定
	ctx.font = "11px Meiryo UI";
	// 灰色の線にする
	ctx.strokeStyle = "#E0E0E0";
	// 描画開始
	ctx.beginPath();
	// 直線
	ctx.setLineDash([0,0,0,0]);
	// ダメージ軸目盛を入れる
	for(let i = 1; i <= dmgMesure; i++){
		ctx.moveTo(basePos.x, basePos.y - (1000 * i) / baseScale.y);
		ctx.lineTo(baseScale.x * 30 * timeMesure + basePos.x, basePos.y - (1000 * i) / baseScale.y);
	}
	// 描画
	ctx.stroke();
	// 描画終了
	ctx.closePath();
	// 描画色設定
	ctx.strokeStyle = "#000000";
	// 描画開始
	ctx.beginPath();
	// ダメージ軸線追加
	ctx.moveTo(basePos.x, basePos.y);
	ctx.lineTo(basePos.x, 5);
	// ダメージ軸の目盛に値を振る
	for(let i = 1; i <= dmgMesure; i++){
		if(dmgMesure >= 10 && i >= 10){
			ctx.strokeText(1000 * i, 6, basePos.y + 4 - (1000 * i) / baseScale.y);
		}else{
			ctx.strokeText(1000 * i, 11, basePos.y + 4 - (1000 * i) / baseScale.y);
		}
	}
	// 縦軸横軸の基線追加
	ctx.moveTo(basePos.x, basePos.y);
	ctx.lineTo(basePos.x + baseScale.x * 30 * timeMesure, basePos.y);
	// 時間軸目盛追加
	for(let i = 1; i <= timeMesure ;i++){
		ctx.moveTo(basePos.x + i * 30 * baseScale.x, basePos.y);
		ctx.strokeText(i + "s", basePos.x - 5 + i * 30 * baseScale.x, basePos.y + 16);
		ctx.lineTo(basePos.x + i * 30 * baseScale.x, basePos.y + 5);
	}
	// 描画
	ctx.stroke();
	// 描画終了
	ctx.closePath();
	// ダメージデータループ
	idx = 0;
	for(let name in fod){
		// 敵に適用されるスキルの影響下にある時間に色を塗る
		if(ee[name] && ee[name].length > 0){
			// 開始位置にポインタ設定
			ctx.moveTo(basePos.x, basePos.y);
			// 配色設定
			const clrData = clrArray2[idx];
			ctx.fillStyle = "rgba(" + clrData.r + "," + clrData.g + "," + clrData.b + ",0.2)";
			// パス設定を開始
			ctx.beginPath();
			// 適用開始フレーム、適用終了フレームの初期化
			let fillStart = 0;
			let fillEnd = 0;
			// スキル適用中リストループ
			for(let f = 0; f < ee[name].length; f++){
				// 適用中
				if(ee[name][f]){
					// 適用開始フレームが未設定だった場合
					if(fillStart == 0){
						// 適用開始フレームの退避
						fillStart = f;
					}
				// 未適用
				}else{
					// 適用→未適用に切り替わっている
					if(fillStart > 0){
						// 適用終了フレーム退避
						fillEnd = f - 1;
					}
				}
				// 適用→未適用への切り替わりのタイミングだった場合
				if(fillEnd > 0){
					// 色を塗る
					ctx.fillRect(fillStart * baseScale.x + basePos.x, basePos.y + idx * 5, fillEnd * baseScale.x - (fillStart * baseScale.x), 5);
					// 適用開始フレームと適用終了フレームのリセット
					fillStart = 0;
					fillEnd = 0;
				}
			}
			// 適用中に終了しているケース
			if(ee[name][ee[name].length - 1]){
				// 最後のとこまで色を塗る
				ctx.fillRect(fillStart * baseScale.x + basePos.x, basePos.y + idx * 5 , timeMesure * 30 * baseScale.x - (fillStart * baseScale.x), 5);
			}
			// 描画する
			ctx.stroke();
			// パスを閉じる
			ctx.closePath();
		}
		idx++;
	}
	idx = 0;
	// ダメージデータループ
	for(let name in fod){
		var span = createElem("div");
		span.style.color = clrArray[idx];
		span.style.marginRight = "6px";
		span.style.fontWeight = "bold";
		span.innerHTML = "－&nbsp;" + name.replace("@","");
		elem("glafNames").appendChild(span);
		// 色を指定
		ctx.strokeStyle = clrArray[idx];
		// ダメージデータ取得
		const dmgArray = fod[name];
		// 開始位置にポインタ設定
		ctx.moveTo(basePos.x, basePos.y);
		// パス設定を開始
		ctx.beginPath();
		// ダメージデータをグラフ化していく
		for(let f = 0; f < dmgArray.length; f++){
			// リロード中
			if(wot[name][f]){
				// 線を描画しない（別で描画）
				ctx.moveTo(f * baseScale.x + basePos.x, basePos.y - dmgArray[f] / baseScale.y);
			// リロード中でない
			}else{
				// 線を描画
				ctx.lineTo(f * baseScale.x + basePos.x, basePos.y - dmgArray[f] / baseScale.y);
			}
		}
		// 描画する
		ctx.stroke();
		// パスを閉じる
		ctx.closePath();
		// インデクサインクリメント
		idx++;
	}
	// 点線にする
	ctx.setLineDash([5,5,5,5]);
	// インデクサをリセット
	idx = 0;
	// ダメージデータループ
	for(let name in fod){
		// 色を指定
		ctx.strokeStyle = clrArray[idx];
		// ダメージデータ取得
		const dmgArray = fod[name];
		// 開始位置にポインタ設定
		ctx.moveTo(basePos.x, basePos.y);
		// パス設定を開始
		ctx.beginPath();
		// ダメージデータをグラフ化していく
		for(let f = 0; f < dmgArray.length; f++){
			// リロード中
			if(wot[name][f]){
				// 線を描画
				ctx.lineTo(f * baseScale.x + basePos.x, basePos.y - dmgArray[f] / baseScale.y);
			// リロード中でない
			}else{
				// 描画しない
				ctx.moveTo(f * baseScale.x + basePos.x, basePos.y - dmgArray[f] / baseScale.y);
			}
		}
		// 描画する
		ctx.stroke();
		// パスを閉じる
		ctx.closePath();
		// インデクサインクリメント
		idx++;
	}
}
/**
 * 浮動小数点乗算
 */
function multiply(val1, val2){
	// 値1の小数点位置の取得
	let pos1 = String(val1).indexOf(".");
	// 小数点なし
	if(pos1 < 0){
		// 小数点位置は0
		pos1 = 0;
	// 小数点あり
	}else{
		// 小数点以下桁数の取得
		pos1 = String(val1).length - pos1 - 1;
	}
	// 値2の小数点位置の取得
	let pos2 = String(val2).indexOf(".");
	// 小数点なし
	if(pos2 < 0){
		// 小数点位置は0
		pos2 = 0;
	// 小数点あり
	}else{
		// 小数点以下桁数の取得
		pos2 = String(val2).length - pos2 - 1;
	}
	// 計算後の小数点以下桁数の算出
	let pos = pos1 + pos2;
	// 小数点を消して整数値にする
	let tmp1 = String(val1).replace(".", "");
	let tmp2 = String(val2).replace(".", "");
	// 整数値で乗算
	let result = parseInt(tmp1, 10) * parseInt(tmp2, 10);
	// 小数点以下桁数が計算結果の桁数を超える
	if(String(result).length < pos){
		// 0埋めする(0.は後付け）
		for(let i = String(result).length; i < pos; i++){
			result = "0" + result;
		}
		result = "0." + result;
		// 浮動小数点値にして返却
		return parseFloat(result);
	}
	// 桁数オーバー対応
	if(String(result).indexOf("e+") >= 0){
		pos = parseInt(String(result).substring(String(result).indexOf("e+") + 2, String(result).length), 10) - pos;
		result = parseFloat(String(result).substring(0, String(result).indexOf("e+"))) * Math.pow(10, pos);
	}
	// 小数点以下桁数部分に.を打って浮動小数点値にして返却
	return parseFloat(String(result).substring(0, String(result).length - pos) + "." + String(result).substring(String(result).length - pos, result.length));
}
/**
 * パーセント変換
 */
function per(val){
	// 小数点位置の割り出し
	let pos = String(val).indexOf(".");
	// 小数点なし
	if(pos < 0){
		// 小数点位置は0
		pos = 0;
	// 小数点あり
	}else{
		// 小数点以下桁数の取得
		pos = String(val).length - pos - 1;
	}
	// 小数点以下桁数に2桁足す(/100のため）
	pos += 2;
	// 小数点を消して整数値にする
	tmp = String(val).replace(".", "");
	// 小数点以下桁数が計算結果の桁数を超える
	if(tmp.length <= pos){
		// 0埋めする(0.は後付け）
		for(let i = tmp.length; i < pos; i++){
			tmp = "0" + tmp;
		}
		tmp = "0." + tmp;
		// 浮動小数点にして返却
		return parseFloat(tmp);
	}
	// 小数点以下桁数部分に.を打って浮動小数点値にして返却
	return parseFloat(tmp.substring(0, tmp.length - pos) + "." + tmp.substring(tmp.length - pos, tmp.length));
}
