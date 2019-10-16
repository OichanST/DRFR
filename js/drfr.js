// 部隊データ
let teamData = new Array();
// ユニット編集情報
let unitStorage = {};

/**
 * 初期処理
 */
function prepare(loadFlg){
	disableCalc = true;
	// 初回ロードの場合
	if(loadFlg){
		// ローカルストレージからデータ抽出
		const s = Storage.get();
		// ストレージデータがある場合
		if(s){
			// 部隊データが登録されている場合
			if(s.team){
				// 部隊データ取得
				teamData = s.team;
			}
			// ストレージデータにユニット別定義情報がある場合
			if(s.unit){
				// フィールドに展開
				unitStorage = s.unit;
			}
		}
		// 妖精関係のリストを生成する
		Fairy.init();
		// 仮想敵リスト生成
		elem("enemy").innerHTML = "";
		for(let enemyName in enemyData){
			elem("enemy").appendChild(new Option(enemyName, enemyName));
		}
		// 敵の中にある回避値の重複を除去したリストを生成
		let evaList = {};
		for(let enemyName in enemyData){
			for(let enemyType in enemyData[enemyName]){
				evaList[enemyData[enemyName][enemyType].eva] = true;
			}
		}
		// 敵回避値のコンボ生成
		elem("eneEva").innerHTML = "";
		for(let eva in evaList){
			elem("eneEva").appendChild(new Option(eva, eva));
		}
		// 敵選択時のイベント処理トリガ
		selEnemy();
	// 初回ロード以外
	}else{
		// 陣形表示領域のクリア
		eachCell("sim", function(cell){
			cell.innerHTML = "";
		});
	}
	// 戦術人形リスト準備
	let unitArray = null;
	// 選択部隊から部隊情報を取得
	let data = teamData[TeamSelector.selectionNo];
	// 部隊情報がある場合
	if(data != null){
		// 戦術人形リストを部隊情報から取得
		unitArray = data.unit;
	}
	// 戦術人形リストがある場合
	if(unitArray != null){
		// ループ
		for(let i = 0; i < unitArray.length; i++){
			// 選択位置の割り出し
			const r = Math.ceil((i + 1) / 3) - 1;
			const c = i % 3;
			// 戦術人形が指定されている場合
			if(unitArray[i] != ""){
				// 選択位置に戦術人形名をプロット
				elem("sim").children[0].children[r].children[c].innerHTML = span(unitArray[i]);
			}
		}
	}
	// ストレージデータに妖精関連情報が定義されている場合
	if(data != null && data.fairy){
		// ストレージの選択値を反映
		fairy.value = data.fairy.name;
		fairyRank.value = data.fairy.rank;
		fairyLv.value = data.fairy.lv;
	// 定義されていない場合
	}else{
		// 初期値に戻す
		fairy.value = "";
		fairyRank.value = "1";
		fairyLv.value = "1";
	}
	// 妖精のステータス表示を更新
	Fairy.disp();
	disableCalc = false;
	// 計算処理
	calclate("prepare");
}
/**
 * 部隊選択コントローラー
 */
const TeamSelector = {
	// 選択されている部隊番号
	selectionNo:0,
	/**
	 * 部隊選択処理
	 */
	sel:function(index){
		// 部隊選択ボタン取得
		const btns = elem("teamSelector").children;
		// ループ
		for(let i = 0; i < btns.length; i++){
			// 選択された番号と同じ
			if(i == index){
					// 選択されたボタンをアクティベート
				btns[i].className = "active";
			// 選択された番号以外
			}else{
				// 非選択状態にする
				btns[i].className = null;
			}
		}
		// 選択された部隊番号を退避
		TeamSelector.selectionNo = index;
		
		Formation.clear();
		// 準備処理
		prepare(false);
	}
};
/**
 * 陣形コントローラー
 */
const Formation = {
	// 選択されている位置
	selectionIndex:0,
	// 選択されていた戦術人形名
	preSelectionTDoll:null,
	
	clear:function(){
		eachCell("sim", function(cell){
			// 色を削る
			cell.className = null;
		});
		// 選択位置のリセット
		Formation.selectionIndex = 0;
		// ステータス・陣形／スキル詳細表示を隠す
		elem("statArea").style.display = "none";
		elem("detailBtn").className = "inactive";
		elem("detailArea").className = "";
	},
	/**
	 * 陣形選択時の処理
	 */
	sel:function(index){
		elem("openSelector").className = "active";
		// 選択位置の退避
		Formation.selectionIndex = index;
		// 陣形表示領域セル
		eachCell("sim", function(cell, i, j){
			// 選択されたセルの場合
			if(i == Math.ceil(index / 3) - 1 && j == (index - 1) % 3){
				// 選択状態にする
				cell.className = "selected";
				// 
				if(countSpan(cell) > 0){
					elem("openSelector").className = "active";
				}else{
					elem("openSelector").className = "inactive";
				}
				// セルに設定されているステータスデータの取得
				const statusInput = cell.getElementsByTagName("input")[0];
				// ステータスデータがある場合
				if(statusInput){
					// ステータス詳細表示欄作成
					elem("statArea").style.display = "block";
					// 戦術人形名をHTMLごともってきて転写（幅のみ調整）
					elem("statName").innerHTML = getSpan(cell).parentNode.parentNode.outerHTML.replace("width:87%","width:100%");
					// JSON形式に変換
					const status = JSON.parse(statusInput.value);
					// ステータスの行を取得
					const statRow = elem("status").getElementsByTagName("tr");
					// ステータスの反映
					getCells(statRow[0])[0].innerHTML = status.hp;
					getCells(statRow[1])[0].innerHTML = status.ns;
					getCells(statRow[2])[0].innerHTML = status.crt;
					getCells(statRow[3])[0].innerHTML = status.cm;
					getCells(statRow[4])[0].innerHTML = status.gb;
					getCells(statRow[5])[0].innerHTML = status.atk;
					getCells(statRow[6])[0].innerHTML = status.acc;
					if(elem("calcExpected").className == "active"){
						const val = getCells(statRow[6])[0].textContent;
						getCells(statRow[6])[0].innerHTML += "<div style='float:right;'>(" + Math.round(eval(val) / (eval(val) + parseInt(elem("eneEva").value, 10)) * 1000) / 10 + "%)</div>";
					}
					getCells(statRow[7])[0].innerHTML = status.eva;
					if(elem("calcExpected").className == "active"){
						const val = getCells(statRow[7])[0].textContent;
						getCells(statRow[7])[0].innerHTML += "<div style='float:right;'>(" + Math.round(1000 - (parseInt(elem("eneAcc").textContent, 10) / (parseInt(elem("eneAcc").textContent, 10) + eval(val))) * 1000) / 10 + "%)</div>";
					}
					getCells(statRow[8])[0].innerHTML = status.spe;
					
					if(status.slot){
						getCells(statRow[9])[0].innerHTML = status.slot;
					}else{
						getCells(statRow[9])[0].innerHTML = "-";
					}
					
					if(status.def){
						getCells(statRow[10])[0].innerHTML = status.def;
					}else{
						getCells(statRow[10])[0].innerHTML = "-";
					}
					
					getCells(statRow[11])[0].innerHTML = status.fps;
					
					if(status.slot){
						getCells(statRow[12])[0].innerHTML = status.dps + "<sup>※</sup>";
						elem("dpsComment").style.display = "block";
					}else{
						getCells(statRow[12])[0].innerHTML = status.dps;
						elem("dpsComment").style.display = "none";
					}
					
					let name = getSpan(cell).innerText;
					
					if(name == "416"){
						name = "@" + name;
					}
					// 配置されていた戦術人形名を退避
					Formation.preSelectionTDoll = name;
					// 対象の戦術人形データ取得
					const unit = unitData[name];
					
					let html = "";
					// 陣形情報
					const formationInfo = [false, false, false, false, false, false, false, false, false];
					// 陣形効果範囲のコピー
					for(let i = 0; i < unit.formation.range.length; i++){
						formationInfo[unit.formation.range[i] - 1] = true;
					}
					// 陣形範囲を視覚化するためのテーブル
					html += "<table class='formation'>";
					// デフォルトは中央ベース
					let pos = 4;
					// ユニットの陣形情報に配置定義がされている場合
					if(unit.formation.pos){
						// 配置の変更
						pos = unit.formation.pos - 1;
					}
					// 陣形のセルを作る
					for(let i = 0; i < 9; i++){
						// 3行毎に改行（3x3）
						if((i + 1) % 3 == 1){
							html += "<tr>";
						}
						// セル生成
						html += "<td style='background-color:";
						// 配置位置の場合
						if(i == pos){
							// 白
							html += "white";
						// 陣形効果範囲の場合
						}else if(formationInfo[i]){
							// 青っぽい
							html += "#00FFFF";
						// 上記以外
						}else{
							// 灰色
							html += "gray";
						}
						// セル閉じる
						html += ";'></td>";
						// 3行毎改行
						if((i + 1) % 3 == 0){
							html += "</tr>";
						}
					}
					// 陣形テーブル閉じる
					html += "</table>";
					// 陣形効果セルに陣形範囲の表示を反映
					elem("detFormation").innerHTML = html;
					// 陣形効果
					html = typeName[unit.formation.target] + "に有効<br/>";
					// ループ初回判定
					let isFirst = true;
					// 陣形効果ループ
					for(let key in unit.formation.effect){
						// ループ初回でない場合
						if(!isFirst){
							// スペース追加
							html += "&nbsp;";
						}
						// 陣形効果を文章変換して追加
						html += converter[key] + "上昇<span style='color:#FFCC00;'>" + unit.formation.effect[key] + "%</span>";
						// ループ初回フラグOFF
						isFirst = false;
					}
					// 陣形効果を反映
					elem("detFormationExp").innerHTML = html;
					// スキル名、スキルレベルの取得
					const skillName = unit.skill.name
					const slv = unitStorage[name].slv;
					// スキルレベル、スキル名の反映
					elem("detSkillName").innerHTML = skillName;
					elem("detSkillLv").innerHTML = "lv." + slv;
					// 開幕CT、CTの反映
					if(unit.skill.wt != 0){
						elem("detSkillCT").innerHTML = "開幕CT" + unit.skill.wt + "秒/CT" + unit.skill.ct[slv - 1] + "秒";
					}else{
						elem("detSkillCT").innerHTML = "";
					}
					// 対応するスキル説明文が登録済の場合
					if(skillMsg[skillName]){
						// スキル説明文を取得
						html = skillMsg[skillName];
						// スキルデータパラメータループ
						for(let key in unit.skill){
							// パラメータによる分岐
							switch(key){
								// スキル効果
								case "eff":
									// スキル効果パラメータループ
									for(let param in unit.skill.eff){
										// パラメータによる分岐
										switch(param){
											// （破甲時）ダメージスキル
											case "dmg":
											case "dmggb":
												// チェーンブラストの場合
												if(skillName == "チェーンブラスト"){
													// スキル効果が範囲によって異なるため、/で結合
													let tmp = "";
													for(let i = 0; i < unit.skill.eff[param][slv - 1].length; i++){
														if(i > 0){
															tmp += "/";
														}
														tmp += unit.skill.eff[param][slv - 1][i] / 100;
													}
													// ダメージ表記の書き換え
													html = html.replace("@" + param, tmp);
												// ジェノワーズの場合
												}else if(skillName == "ジェノワーズ"){
													// スキル効果が初弾→追加攻撃のため、それらを分割反映
													let tmp = "";
													for(let i = 0; i < unit.skill.eff[param][slv - 1].length; i++){
														if(i > 0){
															tmp += "/";
														}
														html = html.replace("@" + param + "_" + (i + 1) ,unit.skill.eff[param][slv - 1][i]);
													}
												// 上記以外
												}else{
													// パラメータの変換用文言(@パラメータ)がある間繰り返す
													while(html.indexOf("@" + param) >= 0){
														// @パラメータに続く文字を取得
														const len = html.indexOf("@" + param) + param.length + 1;
														// パーセンテージの場合
														if(html.substring(len, len + 1) == "%"){
															// そのまま変換
															html = html.replace("@" + param, unit.skill.eff[param][slv - 1]);
														// パーセンテージでない（倍など）
														}else{
															// 1/100にして変換
															html = html.replace("@" + param, unit.skill.eff[param][slv - 1] / 100);
														}
													}
												}
												break;
											// DoT
											case "dot":
												// DoTは効果フレームとDoTダメージに分かれているため、それらを反映
												html = html.replace("@dotF", String(unit.skill.eff.dot.f / 30).substring(0, 4));
												html = html.replace("@dotDmg", unit.skill.eff.dot.dmg[slv - 1] / 100);
												break;
											// その他
											default:
												// 単純な変換
												html = html.replace("@" + param, Math.abs(unit.skill.eff[param][slv - 1]));
										}
									}
									break;
								default:
									// 取得結果がObject（配列）の場合
									if(typeof unit.skill[key] == "object"){
										// チェーンブラスト
										if(skillName == "チェーンブラスト"){
											// /で結合する
											let tmp = "";
											for(let i = 0; i < unit.skill[key].length; i++){
												if(i > 0){
													tmp += "/";
												}
												tmp += unit.skill[key][i];
											}
											html = html.replace("@" + key, tmp);
										// チェーンブラスト以外
										}else{
											// 該当スキルレベルの値を取得
											html = html.replace("@" + key, unit.skill[key][slv - 1]);
										}
									// 取得結果が配列ではない場合
									}else{
										// そのまま置き換え
										html = html.replace("@" + key, unit.skill[key]);
									}
							}
						}
						// スキル説明文の反映
						elem("detSkillExp").innerHTML = html;
					// 上記以外
					}else{
						// スキル説明文をクリア
						elem("detSkillExp").innerHTML = "";
					}
					// 開幕CTが0（パッシブスキル）の場合
					if(unit.skill.wt == 0){
						// スキル強制手動ボタンを表示しない
						elem("manualSkillBtn").style.display = "none";
					// 通常のスキルの場合
					}else{
						// スキル強制手動ボタンを表示
						elem("manualSkillBtn").style.display = "block";
						// 発動時間のコンボを作る
						elem("manualTime").innerHTML = "";
						for(let i = unit.skill.wt; i <= 30; i++){
							const opt = new Option(i, i);
							if(i == unitStorage[name]["manual"]){
								opt.selected = true;
							}
							elem("manualTime").appendChild(opt);
						}
						// 強制手動設定がされている場合
						if(unitStorage[name].manual){
							// 強制手動ボタンをクリックした状態にする
							elem("manualSkillBtn").className = "active";
							elem("manualTimeArea").style.display = "block";
						// されていない場合
						}else{
							// 強制手動ボタンを未クリックの状態にする
							elem("manualSkillBtn").className = "inactive";
							elem("manualTimeArea").style.display = "none";
						}
					}
					html = "";
					// スキル条件の設定
					let cond = new Array();
					// 以下のスキルの場合、特定条件によりスキル効果が変動するため
					// 条件設定できるようにする
					switch(skillName){
						case "マインドチェイン":
							cond.push("亜音速弾使用");
							cond.push("ST弾使用");
							cond.push("通常弾使用");
							break;
						case "ピアースショット":
							cond.push("攻撃対象");
							cond.push("攻撃対象外(貫通時)");
							break;
						case "夜梟咆哮":
							cond.push("3体以上に命中");
							cond.push("3体未満に命中");
							break;
						case "未来予知":
							cond.push("6組以上→3組以上");
							cond.push("6組以上→3組未満");
							cond.push("6組未満→3組以上");
							cond.push("6組未満→3組未満");
							break;
						case "桜逆像":
							cond.push("シールド破壊");
							cond.push("シールド未破壊");
					}
					
					let condVal = 0;
					
					if(unitStorage[name].cond){
						condVal = unitStorage[name].cond;
					}
					for(let i = 0; i < cond.length; i++){
						if(i == 0){
							html = "<div style='font-weight:bold;'>スキル条件設定</div>";
						}
						html += "<label><input type='radio' name='cond' value='" + i + "'" + (i == condVal ? " checked":"") + " onchange='changeSkillCond();'>" + cond[i] + "</label>" + (i != cond.length - 1 ? "<br/>":"");
					}
					elem("skillCond").innerHTML = html;
				// ステータスなし（戦術人形が配置されていないセル）の場合
				}else{
					// ステータスを非表示にする
					elem("statArea").style.display = "none";
					elem("detailArea").className = "inactive";
					// 戦術人形選択ダイアログを開く
					Formation.openSelector();
				}
			}else{
				// 色を削る
				cell.className = null;
			}
		});
	},
	/**
	 * 戦術人形ダイアログを開く
	 */
	openSelector:function(){
		// ボタン押下時の場合の対応
		if(event.target.className == "inactive"){
			// 何もしない
			return;
		}
		// 選択位置の割り出し
		const r = Math.ceil(Formation.selectionIndex / 3) - 1;
		const c = (Formation.selectionIndex - 1) % 3;
		// 選択位置のセルを取得
		const selCell = elem("sim").children[0].children[r].children[c];
		// 好感度、スキルレベルコンボ取得
		const favor = elem("favor");
		const slv = elem("slv");
		// クリアする
		TDollSelector.clear();
		// 既に戦術人形が配置されている場合
		if(hasSpan(selCell)){
			// 配置されている戦術人形名取得
			let name = getSpan(selCell).innerText;
			if(name == "416"){
				name = "@" + name;
			}
			// 戦術人形選択ダイアログの銃種ボタンを取得
			const btns = getDivs(elem("typeBtn"));
			// ループ
			for(let i = 0; i < btns.length; i++){
				// 配置されていた戦術人形と同じ銃種の場合
				if(btns[i].innerHTML == unitData[Formation.preSelectionTDoll].type){
					// クリックする
					btns[i].click();
					// 後の処理は不要なのでループブレイク
					break;
				}
			}
		// 未選択
		}else{
			// 選択されていた戦術人形名をクリア
			Formation.preSelectionTDoll = null;
			// 好感度の選択をリセット
			favor.value = "0";
			// スキルレベルの選択をリセット
			slv.value = "1";
			// 初期表示処理
			TDollSelector.init();
		}
		// 人形選択ダイアログ表示
		TDollSelector.open();
	},
	/**
	 * 戦術人形編成時の処理
	 */
	put:function(){
		// 未選択状態の場合
		if(Formation.selectionIndex <= 0){
			// 処理抜ける
			return;
		}
		// 選択された戦術人形名を取得
		const name = TDollSelector.selectionTDoll;
		// 選択位置に戦術人形名をプロット
		this.selectionUpdate(span(name.replace("@", "")));
		// 装備スロット取得
		const eqSlot = getCells(elem("equip"));
		// 装備リスト
		const eqAll = new Array();
		// 装備スロットループ
		for(let i = 0; i < eqSlot.length; i++){
			// 装備している場合
			if(countSpan(eqSlot[i]) > 1){
				// 装備データの詳細を取得
				const eq = getInputs(eqSlot[i])[0];
				// 装備品名取得
				const eqName = getSpans(eqSlot[i])[1].getAttribute("name");
				// 装備品のパラメータ取得
				const eqData = JSON.parse(eq.value);
				// 装備品名をパラメータ情報に追加
				eqData["name"] = eqName;
				// 装備リストに追加
				eqAll.push(eqData);
			// 装備していない場合
			}else{
				// null追加
				eqAll.push(null);
			}
		}
		// 戦術人形リスト
		const unitArray = this.toList();
		// 装備データを退避
		unitStorage[name] = {
			equip:eqAll,
			favor:parseInt(elem("favor").value, 10),
			slv:parseInt(elem("slv").value, 10)
		};
		// 部隊データを作成
		teamData[TeamSelector.selectionNo] = {
			unit:unitArray,
			fairy:Fairy.makeSaveData()
		};
		// 部隊データをストレージに保存
		Storage.set({
			team:teamData,
			unit:unitStorage
		});
		// 計算処理
		calclate("Formation.put");
		//
		Formation.sel(Formation.selectionIndex);
		// ダイアログ閉じる
		TDollSelector.close();
	},
	/**
	 * 人形を部隊から外す
	 */
	del:function(index){
		// 未選択状態の場合
		/*
		if(Formation.selectionIndex <= 0){
			// 処理抜ける
			return;
		}
		if(event.target.className == "inactive"){
			return;
		}
		*/
		Formation.selectionIndex = index;
		// 選択位置の戦術人形名を消す
		this.selectionUpdate("");
		// 部隊データの更新
		teamData[TeamSelector.selectionNo] = {
			unit:this.toList(),
			fairy:Fairy.makeSaveData()
		};
		// ストレージデータの更新
		Storage.set({
			team:teamData,
			unit:unitStorage
		});
		// 計算処理
		calclate("Formation.del");
		
		elem("statArea").style.display = "none";
		elem("detailBtn").className = "inactive";
		elem("detailArea").className = "";
		
		event.stopPropagation();
	},
	/**
	 * 陣形に設定されているユニットをリスト化する
	 */
	toList:function(){
		// 戦術人形リスト
		const ret = new Array();
		// 陣形ループ
		eachCell("sim", function(cell){
			// 戦術人形が配置されている場合
			if(hasSpan(cell)){
				// 戦術人形リストへ追加
				ret.push(getSpan(cell).innerText);
			// 配置されていない場合
			}else{
				// 空文字追加
				ret.push("");
			}
		});
		return ret;
	},
	/**
	 * 戦術人形ドラッグ開始処理
	 */
	dragStart:function(r,c){
		Formation.sel(Math.floor(r % 3) * 3 + c + 1);
		// D&D転送データの準備
		event.dataTransfer.setData("text/plane", JSON.stringify({
			name:getSpan(event.target).textContent,
			r:r,
			c:c
		}));
		// イベントバブルストップ
		event.stopPropagation();
	},
	/**
	 * 戦術人形ドロップ処理
	 */
	drop:function(index){
		// ドロップ位置の割り出し
		const r = Math.ceil(index / 3) - 1;
		const c = (index - 1) % 3;
		// ドロップ先の戦術人形名
		var preName = "";
		// ドロップ先に戦術人形が配置済の場合
		if(hasSpan(elem("sim").children[0].children[r].children[c])){
			// ドロップ先の戦術人形名を退避
			preName = span(getSpan(elem("sim").children[0].children[r].children[c]).innerText);
		}
		try{
			// D&D転送データを取得
			let data = JSON.parse(event.dataTransfer.getData("text/plane"));
			// ドラッグ元の戦術人形をドロップ先の戦術人形に置き換える
			elem("sim").children[0].children[data.r].children[data.c].innerHTML = preName;
			// ドロップ先の戦術人形をドラッグ元の戦術人形に置き換える
			elem("sim").children[0].children[r].children[c].innerHTML = span(data.name);
			// 部隊データの更新
			teamData[TeamSelector.selectionNo].unit = this.toList();
			// ストレージデータの更新
			Storage.set({
				team:teamData,
				unit:unitStorage
			});
			// 計算処理の実行
			calclate("Formation.drop");
			// 選択内容の更新
			Formation.sel(index);
		}catch(e){
			console.log(e);
		}
	},
	/**
	 * 選択位置の戦術人形を更新する
	 */
	selectionUpdate:function(html){
		// 選択位置の割り出し
		const r = Math.ceil(Formation.selectionIndex / 3) - 1;
		const c = (Formation.selectionIndex - 1) % 3;
		// 選択位置の戦術人形名を消す
		elem("sim").children[0].children[r].children[c].innerHTML = html;
	}
};
/**
 * 戦術人形選択ダイアログコントローラー
 */
const TDollSelector = {
	// フィルタ情報
	filterSet:{
		rare:[2, 3, 4, 5, "Extra"],
		type:[HG],
		effect:["SS", "FF", "AR", "DR", "CR", "DF", "CT"]
	},
	// ソート情報
	sortSet:{},
	// 選択された戦術人形
	selectionTDoll:null,
	// 選択された装備スロット
	selectionSlot:0,
	/**
	 * 戦術人形選択ダイアログを開く
	 */
	open:function(){
		elem("mask").className = "active";
		elem("selector").className = "dialog active";
	},
	/**
	 * 初期表示処理
	 */
	init:function(){
		// リスト表示領域取得
		const t = elem("unit");
		// リスト内容のクリア
		t.innerHTML = "";
		// 装備スロット取得
		const c = getCells(elem("equip"));
		// 入力内容のクリア
		for(let i = 0; i < c.length; i++){
			c[i].innerHTML = "";
			c[i].style.backgroundColor = null;
		}
		// 選択されている場合の選択位置
		let selectionTop = 0;
		const tmpArray = new Array();
		// 人形データループ
		for(let name in unitData){
			// 要素取得
			const unit = unitData[name];
			// レアリティフィルタ条件によるマッチング
			if(this.filterSet.rare.indexOf(unit.rare) < 0){
				continue;
			}
			// 銃種条件によるマッチング
			if(this.filterSet.type.indexOf(unit.type) < 0){
				continue;
			}
			// フィルタヒット判定用フラグ
			let hit = false;
			// 上昇パラメータ条件によるマッチング
			for(let key in unit.formation.effect){
				// 合致する場合
				if(this.filterSet.effect.indexOf(key) >= 0){
					// フラグON
					hit = true;
					// ループブレイク
					break;
				}
			}
			// 条件に合致していない場合
			if(!hit){
				// 次の人形へ
				continue;
			}
			// 戦術人形情報のクローニング
			let tmp = JSON.parse(JSON.stringify(unit));
			// キーを名前として追加
			tmp["name"] = name;
			// リストに追加
			tmpArray.push(tmp);
		}
		// ソート条件が指定されている場合
		if(this.sortSet.key){
			// ソート
			tmpArray.sort(function(a,b){
				let aVal;
				let bVal;
				// DPSによるソート
				if(TDollSelector.sortSet.key == "dps"){
					// 攻撃フレームの算出
					const aFrame = calcFrame(a.type, a.name, a.status.spe);
					const bFrame = calcFrame(a.type, b.name, b.status.spe);
					// フレームからDPS算出
					aVal = a.status.atk * 29.999994 / aFrame;
					bVal = b.status.atk * 29.999994 / bFrame;
				// レアリティ
				}else if(TDollSelector.sortSet.key == "rare"){
					aVal = a[TDollSelector.sortSet.key];
					bVal = b[TDollSelector.sortSet.key];
				// 上記以外
				}else{
					aVal = a.status[TDollSelector.sortSet.key];
					bVal = b.status[TDollSelector.sortSet.key];
				}
				// 昇順・降順による振分
				if(TDollSelector.sortSet.asc){
					return aVal - bVal;
				}
				return bVal - aVal;
			});
		}
		// ソート後のリストループ
		for(let index in tmpArray){
			// 戦術人形名を取得
			let name = tmpArray[index].name;
			// 戦術人形データ取得
			const unit = unitData[name];
			// 行生成
			const r = createElem("tr");
			// 行に属性設定
			r.setAttribute("name", name);
			// クリック時のイベント処理追加
			r.addEventListener("click", TDollSelector.sel);
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
			// レアリティをセルに追加 ※Extraだと長いのでExに変換
			add(r, String(unit.rare).replace("Extra", "Ex"), {width:px(20), textAlign:C});
			// 銃種をセルに追加
			add(r, unit.type, {width:px(40), textAlign:C});
			// 人形名をセルに追加 ※416のみ数字だけだと並び順がおかしくなるため@を付与しているので消す
			let nameHtml = "<div style='position:relative;font-family:serif;font-weight:bold;font-size:16px;'>";
			nameHtml += "<div style='position:absolute;display:inline-block;z-index:3;padding-left:6px;'>" + name.replace("@", "") + "</div>";
			nameHtml += "<div style='position:absolute:display:inline-block;z-index:2;width:178px;background-color:" + clr + "'>&nbsp;</div>";
			nameHtml += "<div style='position:absolute;display:inline-block;z-index:1;top:0px;right:0px;margin:0px;width:26px;background:linear-gradient(-55deg, " + darkClr + " 49%, " + darkClr + " 49%, " + clr + " 49%, " + clr + " 51%, " + clr + ");'>&nbsp;</div>";
			nameHtml += "</div>";
			add(r, nameHtml, {width:px(180), verticalAlign:"top", paddingTop:px(7)});
			// 体力をセルに追加
			add(r, unit.status.hp, {width:px(40), textAlign:R, paddingRight:px(5)});
			// 火力をセルに追加
			add(r, unit.status.atk, {width:px(40), textAlign:R, paddingRight:px(5)});
			// 命中をセルに追加
			add(r, unit.status.acc, {width:px(40), textAlign:R, paddingRight:px(5)});
			// 回避をセルに追加
			add(r, unit.status.eva, {width:px(40), textAlign:R, paddingRight:px(5)});
			// 射速をセルに追加
			add(r, unit.status.spe, {width:px(40), textAlign:R, paddingRight:px(5)});
			// 攻撃フレーム算出
			const frame = calcFrame(unit.type, name, unit.status.spe);
			// FPS算出
			const fps = 29.999994 / frame;
			// DPS算出
			const dps = Math.floor(unit.status.atk * fps);
			// DPSをセルに追加
			add(r, dps, {width:px(40), textAlign:R, paddingRight:px(5)});
			if(this.filterSet.type == MG || this.filterSet.type == SG){
				// 弾薬数をセルに追加
				add(r, unit.status.slot, {width:px(40), textAlign:R, paddingRight:px(5)});
				elem("slotHeader").style.display = "";
			}else{
				elem("slotHeader").style.display = "none";
			}
			if(this.filterSet.type == SG){
				// 防御をセルに追加
				add(r, unit.status.def, {width:px(40), textAlign:R, paddingRight:px(5)});
				elem("defHeader").style.display = "";
			}else{
				elem("defHeader").style.display = "none";
			}
			// 陣形情報
			const formationInfo = [false, false, false, false, false, false, false, false, false];
			// 陣形効果範囲のコピー
			for(let i = 0; i < unit.formation.range.length; i++){
				formationInfo[unit.formation.range[i] - 1] = true;
			}
			// 陣形範囲を視覚化するためのテーブル
			let html = "<table class='formation'>";
			// デフォルトは中央ベース
			let pos = 4;
			// ユニットの陣形情報に配置定義がされている場合
			if(unit.formation.pos){
				// 配置の変更
				pos = unit.formation.pos - 1;
			}
			// 陣形のセルを作る
			for(let i = 0; i < 9; i++){
				// 3行毎に改行（3x3）
				if((i + 1) % 3 == 1){
					html += "<tr>";
				}
				// セル生成
				html += "<td style='background-color:";
				// 配置位置の場合
				if(i == pos){
					// 白
					html += "white";
				// 陣形効果範囲の場合
				}else if(formationInfo[i]){
					// 青っぽい
					html += "#00FFFF";
				// 上記以外
				}else{
					// 灰色
					html += "gray";
				}
				// セル閉じる
				html += ";'></td>";
				// 3行毎改行
				if((i + 1) % 3 == 0){
					html += "</tr>";
				}
			}
			// 陣形テーブル閉じる
			html += "</table>"
			// 陣形テーブルをセルに追加
			add(r, html, {width:px(55), textAlign:C});
			if(typeof unit.formation.target == "string"){
				// 陣形の適用される銃種を追加
				html = typeName[unit.formation.target] + "に有効<br/>";
			}else{
				html = "";
				for(let k = 0; k < unit.formation.target.length; k++){
					if(k > 0){
						html += "，";
					}
					// 陣形の適用される銃種を追加
					html += typeName[unit.formation.target[k]];
				}
				html += "に有効<br/>";
			}
			// ループ初回判定
			let isFirst = true;
			// 陣形効果ループ
			for(let key in unit.formation.effect){
				// ループ初回でない場合
				if(!isFirst){
					// スペース追加
					html += "&nbsp;";
				}
				// 陣形効果を文章変換して追加
				html += converter[key] + "上昇<span style='color:#E9C000'>" + unit.formation.effect[key] + "%</span>";
				// ループ初回フラグOFF
				isFirst = false;
			}
			// 陣形効果をセルに追加
			add(r, html, {paddingLeft:px(4), width:px(247), fontSize:rem(0.8)});
			// スキル名をセルに追加
			html = "";
			if(unit.skill){
				html += unit.skill.name;
			}
			add(r, html, {paddingLeft:px(4)});
			// 開幕CTをセルに追加
			html = "";
			if(unit.skill){
				if(unit.skill.wt == 0){
					html += "－";
				}else{
					html += unit.skill.wt + "秒";
				}
			}
			add(r, html, {width:px(36), textAlign:R, paddingRight:px(5)});
			// 行を表示領域に追加
			t.appendChild(r);
			// 配置済のセルを選択していた場合
			if(Formation.preSelectionTDoll == name){
				// 選択位置を退避
				selectionTop = r.offsetTop;
				// 配置されている戦術人形をクリックする
				r.click();
			}
		}
		// 選択位置にスクロールする
		elem("unit").parentNode.scrollTop = selectionTop + 1; 
	},
	/**
	 * フィルタ
	 */
	filter:function(category, value){
		// ボタン取得
		const btns = getDivs(elem(category + "Btn"));
		// ボタンループ
		for(let i = 0; i < btns.length; i++){
			// 全て非選択にする
			btns[i].className = "inactive";
			// フィルタデータをクリア
			this.filterSet[category] = new Array();
		}
		// クリックされたボタンが選択中だった場合
		if(event.target.className == "active"){
			// 非選択にする
			event.target.className = "inactive";
			// フィルタデータから削除
			const idx = this.filterSet[category].indexOf(value);
			this.filterSet[category].splice(idx, 1);
		// 非選択だった場合
		}else{
			// 選択状態にする
			event.target.className = "active";
			// フィルタデータを追加
			this.filterSet[category].push(value);
		}
		// 初期表示
		TDollSelector.init();
	},
	/**
	 * ソート
	 */
	sort:function(category){
		// クリックされた行を取得
		const r = event.target.parentNode;
		// 全セル取得
		const h = r.getElementsByTagName("th");
		// 全セルループ
		for(let i = 0; i < h.length; i++){
			// アクティブセルがある場合
			if(h[i].className == "sortActive"){
				// インアクティブにする
				h[i].className = "sortInactive";
			}
		}
		// 選択されたセルをアクティブにする
		event.target.className = "sortActive";
		// 降順設定
		isAsc = false;
		// 既にソート条件として指定している場合
		if(this.sortSet.key == category){
			// 昇順・降順を逆転させる
			isAsc = !this.sortSet.asc;
		}
		// ソート条件の更新
		this.sortSet = {
			key:category,
			asc:isAsc
		};
		// リスト表示の更新
		TDollSelector.init();
	},
	/**
	 * 戦術人形選択時の処理
	 */
	sel:function(){
		// 選択されたのがTRでない場合、TRまで拡張する
		let t = event.target;
		while(t.tagName != "TR"){
			t = t.parentNode;
		}
		// 行取得
		const r = getRows(elem("unit"));
		// 全行ループ
		for(let i = 0; i < r.length; i++){
			// 選択されている状態をクリア
			r[i].className = null;
		}
		// 選択行を選択状態にする
		t.className = "active";
		// 選択した戦術人形名を退避
		TDollSelector.selectionTDoll = t.getAttribute("name");
		// 装備スロット取得
		let eq;
		// 特殊スロット持ちの場合
		if(equipSet[TDollSelector.selectionTDoll]){
			// 戦術人形名から装備スロットを特定
			eq = equipSet[TDollSelector.selectionTDoll];
		// それ以外
		}else{
			// 銃種から装備スロットを特定
			eq = equipSet[unitData[TDollSelector.selectionTDoll].type];
		}
		// 装備スロット情報を反映
		const c = getCells(elem("equip"));
		for(let i = 0; i < eq.length; i++){
			c[i].innerHTML = span(eq[i]);
			c[i].style.backgroundColor = null;
		}
		// 戦術人形データが構築済の場合
		if(unitStorage[TDollSelector.selectionTDoll]){
			// 現在選択している戦術人形に装備をしていた場合
			if(unitStorage[TDollSelector.selectionTDoll].equip){
				// 装備データ取得
				let eqAll = unitStorage[TDollSelector.selectionTDoll].equip;
				// 装備を反映する
				for(let i = 0; i < eqAll.length; i++){
					if(eqAll[i] != null){
						TDollSelector.selectionSlot = i + 1;
						reflectEq(eqAll[i]);
					}
				}
			}
			// 好感度が設定されている場合
			if(unitStorage[TDollSelector.selectionTDoll].favor){
				// 好感度の選択値を変更
				elem("favor").value = unitStorage[TDollSelector.selectionTDoll].favor;
			// 好感度が設定されていない場合
			}else{
				// 好感度の選択値を0～89にする
				elem("favor").value = "0";
			}
			// スキルレベルが設定されている場合
			if(unitStorage[TDollSelector.selectionTDoll].slv){
				// スキルレベルの選択値を変更
				elem("slv").value = unitStorage[TDollSelector.selectionTDoll].slv;
			// 未設定
			}else{
				// 1を選択
				elem("slv").value = "1";
			}
		// 戦術人形データ未構築
		}else{
			// 初期値として好感度は0～89、スキルレベルは1を選択
			elem("favor").value = "0";
			elem("slv").value = "1";
		}
	},
	/**
	 * 装備スロット選択時処理
	 */
	equip:function(index){
		if(!TDollSelector.selectionTDoll){
			return;
		}
		// 選択スロット番号退避
		TDollSelector.selectionSlot = index;
		// 選択スロットを取得
		let t = event.target;
		while(t.tagName != "TD"){
			t = t.parentNode;
		}
		// 銃種取得
		const unitType = unitData[TDollSelector.selectionTDoll].type;
		// 特殊装備取得
		const exeq = unitData[TDollSelector.selectionTDoll].exeq;
		// 装備リスト表示領域取得
		const eqList = elem("eqList");
		// リストクリア
		eqList.innerHTML = "";
		elem("eqDetail").style.backgroundColor = "";
		elem("eqDetail").innerHTML = "";
		// 装備可能カテゴリ取得
		let category = getSpan(t).innerText;
		// 装備済の装備品名を取得
		let selName = null;
		if(countSpan(t) > 1){
			selName = getSpans(t)[1].getAttribute("name");
		}
		// カテゴリ内の装備品を取得
		const eqAll = equipment[category];
		// 装備品ループ
		for(let subCategory in eqAll){
			// サブカテゴリ取得
			const sub = eqAll[subCategory];
			// サブカテゴリ内の装備品ループ
			for(let eqName in sub){
				// 装備可能な装備の場合
				if(
					(sub[eqName].equip && sub[eqName].equip.indexOf(unitType) >= 0) ||
					(sub[eqName].equip && subCategory == exeq) ||
					(sub[eqName].only && sub[eqName].only.indexOf(TDollSelector.selectionTDoll) >= 0)
				){
					// 装備品情報を取得
					const eq = sub[eqName];
					// 行生成
					const r = createElem("tr");
					// 行に処理用の属性設定
					r.setAttribute("category", category);
					r.setAttribute("subCategory", subCategory);
					r.setAttribute("name", eqName);
					// クリック時の処理を追加
					r.addEventListener("click", EquipSelector.sel);
					// レアリティ追加
					add(r, eq.rare, {textAlign:C, width:px(20)});
					// 装備のカテゴリ追加
					add(r, subCategory, {paddingLeft:px(4), width:px(157)});
					// 装備品名取得
					let tmp = eqName;
					// 装備品名に@が含まれる＝ホローポイント弾（レアリティが違っても名前が同じため）場合
					if(tmp.indexOf("@") >= 0){
						tmp = tmp.split("@")[0];
					}
					// 装備品名反映
					add(r, tmp, {paddingLeft:px(4), width:px(217)});
					// 装備品のパラメータ
					tmp = "";
					// パラメータループ
					for(let param in eq){
						// 複数ある場合、で区切る
						if(tmp != ""){
							tmp += "、";
						}
						// フラグ
						let hit = true;
						// 名称変換可能な場合
						if(paramConverter[param]){
							// 名称に変換して文字列に追加
							tmp += paramConverter[param];
						// 名称変換できない場合
						}else{
							// 区切りの、を消す
							if(tmp != ""){
								tmp = tmp.substring(0, tmp.length - 1);
							}
							// フラグOFF
							hit = false;
						}
						// 名称変換可能なパラメータの場合
						if(hit){
							// パラメータの最小値とパラメータの極値が同じ場合
							if(eq[param].min == eq[param].limit){
								// パラメータ値をそのまま記載
								tmp += addSign(eq[param].limit);
							// 異なる場合
							}else{
								// 振れ幅込みで記載
								tmp += addSign(eq[param].min) + "～" + addSign(eq[param].limit);
							}
						}
					}
					// セルに追加
					add(r, tmp, {paddingLeft:px(4)});
					// 行に追加
					eqList.appendChild(r);
					// 選択されていた装備の場合
					if(selName == eqName){
						// クリックする
						r.click();
					}
				}
			}
		}
		// 装備選択ダイアログ表示
		EquipSelector.open();
	},
	/**
	 * クリア処理
	 */
	clear:function(){
		// フィルタを初期化
		TDollSelector.filterSet = {
			rare:[2, 3, 4, 5, "Extra"],
			type:[HG],
			effect:["SS", "FF", "AR", "DR", "CR", "DF", "CT"]
		};
		// ソートを初期化
		TDollSelector.sortSet = {};
		// レアリティフィルタを初期化
		let btns = getDivs(elem("rareBtn"));
		for(let i = 0; i < btns.length; i++){
			btns[i].className = "active";
		}
		// 銃種フィルタを初期化
		btns = getDivs(elem("typeBtn"));
		for(let i = 0; i < btns.length; i++){
			if(i == 0){
				btns[i].className = "active";
			}else{
				btns[i].className = "inactive";
			}
		}
		// 陣形効果フィルタを初期化
		btns = getDivs(elem("effectBtn"));
		for(let i = 0; i < btns.length; i++){
			btns[i].className = "active";
		}
		// ソートを初期化
		btns = elem("header").getElementsByTagName("th");
		for(let i = 0; i < btns.length; i++){
			if(btns[i].className == "sortActive"){
				btns[i].className = "sortInactive";
			}
		}
	},
	/**
	 * 戦術人形選択ダイアログを閉じる
	 */
	close:function(){
		elem("mask").className = null;
		elem("selector").className = "dialog";
	}
};
/**
 * リセット
 */
function reset(){
	// 陣形ループ
	eachCell("sim", function(cell){
		// クリア
		cell.innerHTML = "";
	});
	const tmp = Storage.get();
	// 部隊データを削除
	delete teamData[TeamSelector.selectionNo];
	tmp.team = teamData;
	// ストレージデータの更新
	Storage.set(tmp);
}
/**
 * 装備選択ダイアログコントローラー
 */
const EquipSelector = {
	/**
	 * 装備選択ダイアログを開く
	 */
	open:function(){
		elem("eqSelector").className = "dialog active";
	},
	/**
	 * 装備選択時処理
	 */
	sel:function(){
		// 選択を行まで拡張する
		let t = event.target;
		while(t.tagName != "TR"){
			t = t.parentNode;
		}
		// 装備リストの選択状態をクリアする
		const r = getRows(elem("eqList"));
		for(let i = 0; i < r.length; i++){
			r[i].className = null;
		}
		
		t.className = "active";
		// 選択行の情報抽出
		const cat = t.getAttribute("category");
		const sub = t.getAttribute("subCategory");
		const name = t.getAttribute("name");
		// 装備品情報取得
		const eq = equipment[cat][sub][name];
		// 選択されている装備スロットを取得
		const cell = getCells(elem("equip"))[TDollSelector.selectionSlot - 1];
		// 現在のパラメータを取得
		let preParam = null;	
		if(getInputs(cell).length > 0){
			preParam = JSON.parse(getInputs(cell)[0].value);
		}
		// 装備名追加
		let tmp = "<span id='eqName' name='" + name + "'>" + name.split("@")[0] + "</span>";
		tmp += "<div style='display:flex;justify-content:flex-start'>";
		tmp += "<div style='margin-top:4px;'>";
		// パラメータ選択のためのコンボボックスを生成
		for(let param in eq){
			let hit = true;
			if(paramConverter[param]){
				tmp += paramConverter[param];
			}else{
				hit = false;
			}
			if(hit){
				tmp += "&nbsp;<select name='" + param + "'>";
				for(let i = eq[param].limit; i >= eq[param].min; i--){
					tmp += "<option value='" + i + "'"
					if(preParam != null && preParam[param] == i){
						tmp += " selected";
					}
					tmp += ">" + addSign(i) + "</option>";
				}
				tmp += "</select>　";
			}
		}
		tmp += "</div>";
		tmp += "<div class='btnArea'>";
		// 最大／最小値を設定するためのボタンを追加
		tmp += "<div class='active' onclick='EquipSelector.setMin();'>MIN</div>";
		tmp += "<div class='active' onclick='EquipSelector.setMax();'>MAX</div>";
		tmp += "</div>";
		tmp += "</div>";
		// HTMLを詳細欄に反映
		elem("eqDetail").style.backgroundColor = rareClr[eq.rare];
		elem("eqDetail").innerHTML = tmp;
	},
	/**
	 * 装備処理
	 */
	set:function(){
		// 選択されている装備スロットを取得
		const cell = getCells(elem("equip"))[TDollSelector.selectionSlot - 1];
		// 装備カテゴリ取得
		const eqCategory = getSpan(cell).innerText;
		const eqName = elem("eqName").getAttribute("name");
		const eqSub = equipment[eqCategory];
		let eqRare = null;
		for(let subCategory in eqSub){
			const eqDetail = eqSub[subCategory];
			for(let name in eqDetail){
				if(name == eqName){
					eqRare = eqDetail[name].rare;
					break;
				}
			}
			if(eqRare != null){
				break;
			}
		}
		// レアリティに応じた配色
		cell.style.backgroundColor = rareClr[eqRare];
		// 装備名を追加
		let tmp = "<div style='display:flex;justify-content:space-between;'>";
		tmp += "<div style='width:18px;'>&nbsp;</div>";
		tmp += "<div>" + span(eqCategory) + "</div>";
		tmp += "<div class='closeBtn' style='height:19px;padding-top:1px;margin-right:4px;' onclick='EquipSelector.release(" + TDollSelector.selectionSlot + ");'>×</div>";
		tmp += "</div>"
		tmp += "<span name='" + eqName + "'>" + eqName.split("@")[0] + "</span>";
		// 装備パラメータ取得
		const params = elem("eqDetail").getElementsByTagName("select");
		// パラメータ値を文字列化
		tmp += "<div style='font-size:0.85em;'>";
		const jsonData = {};
		for(let i = 0; i < params.length; i++){
			if(i > 0){
				tmp += "、";
			}
			tmp += paramConverter[params[i].name];
			tmp += addSign(params[i].value);
			jsonData[params[i].name] = params[i].value;
		}
		tmp += "</div>";
		// 処理用のhiddenパラメータを生成
		tmp += "<input type='hidden' name='params' value='" + JSON.stringify(jsonData) + "'>";
		// HTML反映
		cell.innerHTML = tmp;
		// 装備選択ダイアログを閉じる
		this.close();
	},
	/**
	 * 装備解除処理
	 */
	release:function(selectionSlot){
		// 選択されている装備スロット取得
		const cell = getCells(elem("equip"))[selectionSlot - 1];
		// 装備カテゴリ取得
		const eqName = getSpan(cell).innerText;
		// カテゴリ表記のみに更新
		cell.innerHTML = span(eqName);
		cell.style.backgroundColor = null;
		
		event.stopPropagation();
	},
	/**
	 * 最小値設定
	 */
	setMin:function(){
		var selects = elem("eqDetail").getElementsByTagName("select");
		for(let i = 0; i < selects.length; i++){
			const opts = selects[i].getElementsByTagName("option");
			selects[i].value = opts[opts.length - 1].value;
		}
	},
	/**
	 * 最大値設定
	 */
	setMax:function(){
		var selects = elem("eqDetail").getElementsByTagName("select");
		for(let i = 0; i < selects.length; i++){
			const opts = selects[i].getElementsByTagName("option");
			selects[i].value = opts[0].value;
		}
	},
	/**
	 * 装備選択ダイアログを閉じる
	 */
	close:function(){
		elem("eqSelector").className = "dialog";
	}
};
/**
 * 装備内容の反映処理
 */
function reflectEq(jsonData){
	// 選択されている装備スロットを取得
	const cell = getCells(elem("equip"))[TDollSelector.selectionSlot - 1];
	// 装備カテゴリを取得
	const eqCategory = getSpan(cell).innerHTML;
	const eqSub = equipment[eqCategory];
	let eqRare = null;
	for(let subCategory in eqSub){
		const eqDetail = eqSub[subCategory];
		for(let name in eqDetail){
			if(name == jsonData.name){
				eqRare = eqDetail[name].rare;
				break;
			}
		}
		if(eqRare != null){
			break;
		}
	}
	// レアリティに応じた配色
	cell.style.backgroundColor = rareClr[eqRare];
	// 装備カテゴリと装備名生成
	let tmp = "<div style='display:flex;justify-content:space-between;'>";
	tmp += "<div style='width:18px;'>&nbsp;</div>"
	tmp += "<div>" + span(eqCategory) + "</div>";
	tmp += "<div class='closeBtn' style='height:19px;padding-top:1px;margin-right:4px;' onclick='EquipSelector.release(" + TDollSelector.selectionSlot + ");'>×</div>";
	tmp += "</div>";
	tmp += "<span name='" + jsonData.name + "'>" + jsonData.name.split("@")[0] + "</span>";
	// 装備品のパラメータ値を文字列化
	tmp += "<div style='font-size:0.85em;'>";
	let isFirst = true;
	for(let param in jsonData){
		if(param == "name"){
			continue;
		}
		if(!isFirst){
			tmp += "、";
		}
		isFirst = false;
		tmp += paramConverter[param];
		tmp += addSign(jsonData[param]);
	}
	tmp += "</div>";
	// 設定するパラメータ値をコピー
	let copyJson = JSON.parse(JSON.stringify(jsonData));
	// 名前は不要なので削る
	delete copyJson.name;
	// hiddenパラメータとして設定
	tmp += "<input type='hidden' name='params' value='" + JSON.stringify(copyJson) + "'>";
	// 表示の更新
	cell.innerHTML = tmp;
}
/**
 * 妖精関係のコントローラー
 */
const Fairy = {
	/**
	 * 妖精関係の選択リストを生成する
	 */
	init : function(){
		// 各コンボボックスを取得
		const fairy = elem("fairy");
		const fairyRank = elem("fairyRank");
		const fairyLv = elem("fairyLv");
		const fairySkillSel = elem("fairySkill");
		// 妖精リスト生成
		fairy.innerHTML = "";
		fairy.appendChild(new Option("なし", ""));
		for(let fairyName in fairyData){
			fairy.appendChild(new Option(fairyName, fairyName));
		}
		// 妖精ランクリスト生成
		fairyRank.innerHTML = "";
		for(let i = 1; i <= 5; i++){
			fairyRank.appendChild(new Option(i, i));
		}
		// 妖精レベルリスト生成
		fairyLv.innerHTML = "";
		for(let i = 1; i <= 100; i++){
			fairyLv.appendChild(new Option(i, i));
		}
		// 天賦リスト生成
		fairySkillSel.innerHTML = "";
		for(let key in fairySkill){
			fairySkillSel.appendChild(new Option(key, key));
		}
	},
	/**
	 * ステータスバフ計算処理
	 */
	calc : function(){
		// 該当レベル分のデータをコピーするための箱
		const fCopy = {};
		// 未選択の場合空のオブジェクトを返却
		if(elem("fairy").value == ""){
			return fCopy;
		}
		// 選択されている妖精のデータ取得
		const fairy = fairyData[elem("fairy").value];
		// 選択されている妖精ランク取得
		const fairyRank = parseInt(elem("fairyRank").value, 10);
		// 選択されている妖精Lv取得
		const fairyLv = parseInt(elem("fairyLv").value, 10);
		// コピーオブジェクトに該当レベルでのバフステータスをコピー
		for(let param in fairy){
			fCopy[param] = fairy[param][fairyLv - 1];
		}
		// ランクに応じた値に補正
		for(let param in fCopy){
			fCopy[param] = fCopy[param] * fRank[fairyRank - 1] / 100;
		}
		// 処理結果を返却
		return fCopy;
	},
	/**
	 * 天賦発動変更
	 */
	changeSkill : function(){
		// ボタンアクティブのトグル
		if(event.target.className == "active"){
			event.target.className = "inactive";
		}else{
			event.target.className = "active";
		}
		// 計算処理実行
		calclate("Fairy.changeSkill");
		// 選択内容の更新
		Formation.sel(Formation.selectionIndex);
	},
	/**
	 * ステータスバフ表示
	 */
	disp : function(){
		// ステータスバフ計算
		const f = this.calc();
		
		let html = "";
		
		for(let param in f){
			if(html != ""){
				html += "<br/>";
			}
			switch(param){
				case "atk":
					html += "火力";
					break;
				case "acc":
					html += "命中";
					break;
				case "eva":
					html += "回避";
					break;
				case "def":
					html += "防御";
					break;
				case "cm":
					html += "会心ダメージ";
					break;
			}
			html += "+" + (String(f[param]).indexOf(".") >= 0 ? f[param] : f[param] + ".0") + "%";
		}
		// 出力内容の更新
		elem("fairyDetail").innerHTML = html;
		// ストレージへ選択内容の保存
		if(teamData[TeamSelector.selectionNo]){
			teamData[TeamSelector.selectionNo].fairy = this.makeSaveData();
			Storage.set({
				team:teamData,
				unit:unitStorage
			});
		}
		// 計算処理実行
		calclate("Fairy.disp");
		// 選択内容の更新
		Formation.sel(Formation.selectionIndex);
	},
	makeSaveData:function(){
		return {
			name:elem("fairy").value,
			rank:parseInt(elem("fairyRank").value, 10),
			lv:parseInt(elem("fairyLv").value, 10)
		};
	}
}
/**
 * 期待値計算制御
 */
function ctrlExpected(){
	// チェック／未チェックによる表示制御
	if(event.target.className == "inactive"){
		event.target.className = "active"
		elem("expectedDetail").style.display = "flex";
		elem("detailTable").style.display = "block";
	}else{
		event.target.className = "inactive"
		elem("expectedDetail").style.display = "none";
		elem("detailTable").style.display = "none";
	}
	// 計算処理
	calclate("ctrlExpected");
	// 選択内容の更新
	Formation.sel(Formation.selectionIndex);
}
/**
 * 敵選択時処理
 */
function selEnemy(){
	// 選択された敵のデータを取得
	const enemyDetail = enemyData[elem("enemy").value];
	// 敵分類コンボの再生成
	elem("enemyType").innerHTML = "";
	for(let enemyType in enemyDetail){
		elem("enemyType").appendChild(new Option(enemyType, enemyType));
	}
	// 敵選択時の内部処理
	setEnemyData();
}
/**
 * 敵選択時の内部処理
 */
function setEnemyData(){
	// 敵データ取得
	var enemy = enemyData[elem("enemy").value][elem("enemyType").value];
	// 各値を反映
	elem("eneHp").innerText = enemy.hp;
	elem("eneAtk").innerText = enemy.atk;
	elem("eneSpe").innerText = enemy.spe;
	elem("eneAcc").innerText = enemy.acc;
	elem("eneEva").value = enemy.eva;
	elem("eneDef").value = enemy.def;
	// 計算処理の実行
	calclate("setEnemyData");
	// 選択内容の更新
	Formation.sel(Formation.selectionIndex);
}
/**
 * 攻撃フレーム計算
 */
function calcFrame(type, name, spe){
	// マシンガン
	if(type == MG){
		// 通常10Fだが、一部スタッカートスキル持ちは11F
		switch(name){
			case "M2HB":
			case "PK":
			case "Gr MG5":
			case "PKP":
				return 11;
				break;
			default:
				return 10;
		}
	// 上記以外
	}else{
		// 1500/射速（小数点以下切り上げ）-1
		return Math.ceil(1500 / spe) - 1;
	}
}
/**
 * DPSグラフ表示
 */
function displayChange(){
	if(event.target.className == "active"){
		elem("resultArea").className = "";
		event.target.className = "inactive";
	}else{
		elem("resultArea").className = "active";
		event.target.className = "active";
	}
}
/**
 * 陣形効果・スキル詳細表示／非表示切り替え
 */
function toggleDetail(){
	if(event.target.className == "inactive"){
		event.target.className = "active";
		const bodyRect = document.body.getBoundingClientRect();
		const rect = event.target.getBoundingClientRect();
		elem("detailArea").style.top = (rect.top - bodyRect.top + rect.height + 12) + "px";
		elem("detailArea").className = "active";
	}else{
		event.target.className = "inactive";
		elem("detailArea").className = "";
	}
}
/**
 * スキル強制手動ボタン押下
 */
function changeManual(){
	if(event.target.className == "active"){
		event.target.className = "inactive";
		elem("manualTimeArea").style.display = "none";
		unitStorage[Formation.preSelectionTDoll]["manual"] = 0;
	}else{
		event.target.className = "active";
		elem("manualTimeArea").style.display = "block";
		unitStorage[Formation.preSelectionTDoll]["manual"] = unitData[Formation.preSelectionTDoll].skill.wt;
	}
	// ストレージデータの更新
	Storage.set({
		team:teamData,
		unit:unitStorage
	});
	// 計算処理実行
	calclate("changeManual");
}
/**
 * スキル使用開始時間変更
 */
function changeWt(){
	// ストレージデータの更新
	unitStorage[Formation.preSelectionTDoll]["manual"] = event.target.value;
	Storage.set({
		team:teamData,
		unit:unitStorage
	});
	// 計算処理実行
	calclate("changeWt");
}
/**
 * スキル条件変更
 */
function changeSkillCond(){
	// ストレージデータの更新
	unitStorage[Formation.preSelectionTDoll]["cond"] = parseInt(event.target.value, 10);
	Storage.set({
		team:teamData,
		unit:unitStorage
	});
	// 計算処理実行
	calclate("changeSkillCond");
}
