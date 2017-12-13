app.service('DataService', ['$rootScope', function($rootScope) {
    const sheetId = '1fwzq_64mPMmCndomAe7sZeBrhJEhR9S-CJvIitzVrDI';
    const updateVal = (100 / 14) + 0.1;
    const boxWidth = 16;
    const gridWidth = 0;
    var progress = 0;

    var characters = null;
    var enemies = null;
    var rows = [];
    var cols = [];
    var map, characterData, classIndex, itemIndex, skillIndex, motifIndex, familiarIndex, statusIndex, coordMapping, terrainIndex, terrainLocs;

    this.getCharacters = function() { return characters; };
    this.getMap = function() { return map; };
    this.getRows = function() { return rows; };
    this.getColumns = function() { return cols; };
    this.getTerrainTypes = function() { return terrainIndex; };
    this.getTerrainMappings = function() { return terrainLocs; };

    this.loadMapData = function() { fetchCharacterData(); };
    this.calculateRanges = function() { getMapDimensions(); };

    //\\//\\//\\//\\//\\//
    // DATA AJAX CALLS  //
    //\\//\\//\\//\\//\\//

    function fetchCharacterData() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            range: 'Unit Tracker!B1:ZZ',
        }).then(function(response) {
            characterData = response.result.values;
            updateProgressBar();
            fetchClassIndex();
        });
    };

    function fetchClassIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Classes!B2:AZ',
        }).then(function(response) {
            var results = response.result.values;
            classIndex = {};

            for (var i = 0; i < results.length; i++) {
                var c = results[i];
                if (c.length == 0 || c[0].length == 0) continue;

                classIndex[c[0]] = {
                    'name': c[0],
                    'weaknesses' : c[3] != "-" ? c[3].replace(/^\s*|\s*$/g,'').split(/\s*,\s*/) : [],
                    'desc' : c[39],
                    'terrainType' : c[40] != undefined ? c[40] : ""
                }
            }

            updateProgressBar();
            fetchItemIndex();
        });
    }

    function fetchItemIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Item Index!B2:y',
        }).then(function(response) {
            var results = response.result.values;

            itemIndex = {};
            for (var i = 0; i < results.length; i++) {
                var itm = results[i];
                if (itm.length == 0) continue;

                if (itm[0].length > 0) { //if the item has a name
                    itemIndex[itm[0]] = {
                        'name': itm[0],
                        'isFamiliar' : false,
                        'equipped' : false,
                        'class': itm[1],
                        'rank' : itm[2],
                        'atkStat': itm[3],
                        'might': parseInt(itm[4]) | 0,
                        'hit': parseInt(itm[5]) | 0,
                        'crit': parseInt(itm[6]) | 0,
                        'guard' : parseInt(itm[7]) | 0,
                        'avo': parseInt(itm[8]) | 0,
                        'cEva': parseInt(itm[9]) | 0,
                        'range': itm[12],
                        'effect': itm[13],
                        'desc' : itm[14],
                        'StrEqpt': parseInt(itm[15]) | 0,
                        'MagEqpt': parseInt(itm[16]) | 0,
                        'SklEqpt': parseInt(itm[17]) | 0,
                        'SpdEqpt': parseInt(itm[18]) | 0,
                        'DefEqpt': parseInt(itm[19]) | 0,
                        'ResEqpt': parseInt(itm[20]) | 0,
                        'spriteUrl': itm[23] != undefined ? itm[23] : "",
                    }
                }
            }

            updateProgressBar();
            fetchSkillIndex();
        });
    };

    function fetchSkillIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Skills!A2:E',
        }).then(function(response) {
            var skills = response.result.values;
            skillIndex = {};
            for (var i = 0; i < skills.length; i++) {
                var s = skills[i];
                if (s.length == 0 || s[0].length == 0) continue;

                skillIndex[s[0]] = {
                    'name': s[0],
                    'category' : s[1],
                    'isCommand' : s[3].trim() == "Command",
                    'desc': s[4]
                }
            }

                updateProgressBar();
                fetchMotifIndex();
        });
    };

    function fetchMotifIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Motifs!A2:O',
        }).then(function(response) {
            var motifs = response.result.values;
            motifIndex = {};

            for (var i = 0; i < motifs.length; i++) {
                var m = motifs[i];
                if (m.length == 0 || m[0].length == 0) continue;

                motifIndex[m[0]] = {
                    'name': m[0],
                    'weaknesses' : m[5] != "-" ? m[5].replace(/^\s*|\s*$/g,'').split(/\s*,\s*/) : [],
                    'desc' : m[14] != undefined ? m[14] : ""
                }
            }

                updateProgressBar();
                fetchFamiliarIndex();
        });
    };

    function fetchFamiliarIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Familiars!B2:G',
        }).then(function(response) {
            var familiars = response.result.values;
            familiarIndex = {};

            for (var i = 0; i < familiars.length; i++) {
                var f = familiars[i];
                if (f.length == 0 || f[0].length == 0) continue;

                familiarIndex[f[0]] = {
                    'name': f[0],
                    'isFamiliar' : true,
                    'isCommand' : f[2].trim() == "Command",
                    'equipped' : false,
                    'effect' : f[3],
                    'desc' : f[4],
                    'spriteUrl' : f[5]
                }
            }

                updateProgressBar();
                fetchStatusIndex();
        });
    };

    function fetchStatusIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Statuses!A2:D',
        }).then(function(response) {
            var statuses = response.result.values;
            statusIndex = {};

            for (var i = 0; i < statuses.length; i++) {
                var s = statuses[i];
                if (s.length == 0 || s[0].length == 0) continue;

                statusIndex[s[0]] = {
                    'name': s[0],
                    'category' : s[1] == "Positive" ? "+" : (s[1] == "Negative" ? "-" : " "),
                    'duration' : parseInt(s[2]) | 0,
                    'desc' : s[3]
                }
            }

                updateProgressBar();
                fetchTerrainIndex();
        });
    };

    function fetchTerrainIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Terrain Chart!A2:N',
        }).then(function(response) {
            var rows = response.result.values;
            terrainIndex = {};

            for (var i = 0; i < rows.length; i++) {
                var r = rows[i];
                if (r.length == 0 || r[0].length == 0) continue;

                terrainIndex[r[0]] = {
                    'avo': parseInt(r[1]) | 0,
                    'def': parseInt(r[2]) | 0,
                    'heal': parseInt(r[3]) | 0,
                    'Foot': r[4],
                    'Armor': r[5],
                    'Mounted': r[6],
                    'Monster' : r[7],
                    'Mage' : r[8],
                    'Flier' : r[9],
                    'effect' : r[10] != undefined ? r[10] : "",
                    'desc': r[11] !=  undefined ? r[11] : "",
                    'waterWalker' : r[12] == "Water Walker",
                    'rockClimber' : r[12] == "Rock Climber",
                    'skillParam' : r[13] != undefined ? r[13] :""
                }
            }

            updateProgressBar();
            fetchTerrainChart();
        });
    };

    function fetchTerrainChart() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Terrain Locations!A1:ZZ',
        }).then(function(response) {
            coordMapping = response.result.values;

            updateProgressBar();
            processCharacters();
        });
    };

    function processCharacters() {
        characters = {};

        for (var i = 0; i < characterData.length; i++) {
            var c = characterData[i];
            if (c[0].length == 0) continue;

            var currObj = {
                'name': c[0],
                'spriteUrl' : c[1],
                'class': getClass(c[2]),
                'motif' : getMotif(c[3]),
                'affiliation' : c[4],
                'position' : c[5],
                'hasMoved' : c[6] == "1",
                'currHp' : parseInt(c[7]) | 0,
                'maxHp' : parseInt(c[8]) | 0,
                'Str' : parseInt(c[9]),
                'Mag' : parseInt(c[10]),
                'Skl' : parseInt(c[11]),
                'Spd' : parseInt(c[12]),
                'Def' : parseInt(c[13]),
                'Res' : parseInt(c[14]),
                'Mov' : parseInt(c[15]),
                'exp' : parseInt(c[16]) % 100,
                'level' : Math.floor(parseInt(c[16])/100),
                'money' : c[17],
                'tags' : c[18],
                'inventory' : {},
                'familiar' : getFamiliar(c[25]),
                'skills' : {},
                'statuses' : [],
                'maxHpBuff' : c[39].length > 0 ? parseInt(c[39]) : 0,
                'StrBuff' : c[40].length > 0 ? parseInt(c[40]) : 0,
                'MagBuff' : c[41].length > 0 ? parseInt(c[41]) : 0,
                'SklBuff' : c[42].length > 0 ? parseInt(c[42]) : 0,
                'SpdBuff' : c[43].length > 0 ? parseInt(c[43]) : 0,
                'DefBuff' : c[44].length > 0 ? parseInt(c[44]) : 0,
                'ResBuff' : c[45].length > 0 ? parseInt(c[45]) : 0,
                'MovBuff' : c[46].length > 0 ? parseInt(c[46]) : 0,
                'maxHpBoost' : c[47].length > 0 ? parseInt(c[47]) : 0,
                'StrBoost' : c[48].length > 0 ? parseInt(c[48]) : 0,
                'MagBoost' : c[49].length > 0 ? parseInt(c[49]) : 0,
                'SklBoost' : c[50].length > 0 ? parseInt(c[50]) : 0,
                'SpdBoost' : c[51].length > 0 ? parseInt(c[51]) : 0,
                'DefBoost' : c[52].length > 0 ? parseInt(c[52]) : 0,
                'ResBoost' : c[53].length > 0 ? parseInt(c[53]) : 0,
                'MovBoost' : c[54].length > 0 ? parseInt(c[54]) : 0,
                'weaponRanks' : {
                    'wpn1' : {
                        'class' : c[55] != "-" ? c[55] : "",
                        'exp' : calculateExpPercent(c[56]),
                        'rank' : calculateWpnRank(c[56])
                    },
                    'wpn2' : {
                        'class' : c[57] != "-" ? c[57] : "",
                        'exp' : calculateExpPercent(c[58]),
                        'rank' : calculateWpnRank(c[58])
                    }
                },
                'mimic' : c[59] != "None" ? c[59] : "",
                'behavior' : c[60] != undefined ? c[60] : "",
                'desc' : c[61] != undefined ? c[61] : "",
                'portrait' : c[62] != undefined ? c[62] : ""
            };

            //Inventory
            currObj.equippedWeapon = getItem(c[19]);
            for(var m = 20; m < 25; m++)
                currObj.inventory["itm_" + (m-19)] = getItem(c[m]);

            //Replace equipped item & familiar with ghost
            var inv = c.slice(20, 25); //grab inventory items
            var eqpIndex = inv.indexOf(currObj.equippedWeapon.name);
            if(currObj.equippedWeapon.name.length > 0 && eqpIndex > -1){
                var key = "itm_" + (eqpIndex+1);
                currObj.inventory[key] = getDefaultWeaponObj(currObj.equippedWeapon.name);
                currObj.inventory[key].class = currObj.equippedWeapon.class;
                currObj.inventory[key].spriteUrl = currObj.equippedWeapon.spriteUrl;
                currObj.inventory[key].equipped = true;
            }

            //Skills
            for (var k = 26; k < 33; k++)
                currObj.skills["skl" + (k - 25)] = getSkill(c[k]);

            //Statuses
            for(var l = 34; l < 39; l++)
                if(c[l].length > 0)
                    currObj.statuses.push(getStatus(c[l]));

            //Calculate true stats
            currObj.TrueHp = calculateTrueStat(currObj, "maxHp");
            currObj.TrueStr = calculateTrueStat(currObj, "Str");
            currObj.TrueMag = calculateTrueStat(currObj, "Mag");
            currObj.TrueSkl = calculateTrueStat(currObj, "Skl");
            currObj.TrueSpd = calculateTrueStat(currObj, "Spd");
            currObj.TrueDef = calculateTrueStat(currObj, "Def");
            currObj.TrueRes = calculateTrueStat(currObj, "Res");
            currObj.TrueMov = calculateTrueStat(currObj, "Mov");

            currObj.maxHp = calculateBaseStat(currObj, "maxHp");
            currObj.Str = calculateBaseStat(currObj, "Str");
            currObj.Mag = calculateBaseStat(currObj, "Mag");
            currObj.Skl = calculateBaseStat(currObj, "Skl");
            currObj.Spd = calculateBaseStat(currObj, "Spd");
            currObj.Def = calculateBaseStat(currObj, "Def");
            currObj.Res = calculateBaseStat(currObj, "Res");
            currObj.Mov = calculateBaseStat(currObj, "Mov");

            currObj.weaknesses = currObj.class.weaknesses.concat(currObj.motif.weaknesses);

            characters["char_" + i] = currObj;
        }

        updateProgressBar();
        fetchMapUrl();
    };

    function fetchMapUrl() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            valueRenderOption: "FORMULA",
            range: 'Map Data!A2:A2',
        }).then(function(response) {
            map = response.result.values[0][0];
            updateProgressBar();
        });
    };

    //******************\\
    // CHARACTER RANGES \\
    //******************\\

    function getMapDimensions() {
        var map = document.getElementById('mapImg');

        var height = map.naturalHeight; //calculate the height of the map
        height = (height / (boxWidth + gridWidth));
        for (var i = 0; i < height; i++)
            rows.push((i+1)+"");

        var width = map.naturalWidth; //calculate the width of the map
        width = (width / (boxWidth + gridWidth));
        for (var i = 0; i < width; i++)
            cols.push((i+1)+"");

        updateProgressBar();
        initializeTerrain();
    };

    function initializeTerrain() {
        terrainLocs = {};

        for (var r = 0; r < rows.length; r++)
            for (var c = 0; c < cols.length; c++)
                terrainLocs[cols[c] + "," + rows[r]] = getDefaultTerrainObj();
        terrainLocs["-1,-1"] = getDefaultTerrainObj();

        //Update terrain types from input list
        for (var r = 0; r < coordMapping.length; r++) {
            var row = coordMapping[r];
            for (var c = 0; c < cols.length && c < row.length; c++) {
                if (row[c].length > 0) terrainLocs[cols[c] + "," + rows[r]].type = row[c];
            }
        }

        for (var c in characters){
            var char = characters[c];

            //Check if unit is paired
            if(char.position.indexOf(",") != -1 && isRescuing(char.name)){
                char.OrigSkl = char.TrueSkl;
                char.OrigSpd = char.TrueSpd;
                char.TrueSkl = Math.floor(char.TrueSkl / 2);
                char.TrueSpd = Math.floor(char.TrueSpd / 2);
                char.paired = true;
            }
            else{ char.paired = false; }

            //Calculate battle stats
            if(char.equippedWeapon.atkStat == "Physical") char.Atk = Math.floor(calculateAtk(char.TrueStr, char.equippedWeapon.might));
            else if(char.equippedWeapon.atkStat == "Magical") char.Atk = Math.floor(calculateAtk(char.TrueMag, char.equippedWeapon.might));
            else char.Atk = 0;

            char.Hit = Math.floor(calculateHit(char.TrueSkl, char.equippedWeapon.hit));
            char.Crit = Math.floor(calculateCrit(char.TrueSkl));
            if(char.position.indexOf(",") != -1) char.Avo = Math.floor(calculateAvo(char.TrueSpd,  terrainIndex[terrainLocs[char.position].type].avo));
            else char.Avo = Math.floor(calculateAvo(char.TrueSpd, 0));
            
            if (terrainLocs[characters[c].position] != undefined)
                terrainLocs[characters[c].position].occupiedAffiliation = characters[c].affiliation;
        }

        updateProgressBar();
        calculateCharacterRanges();
    };

    function isRescuing(name){
        for(var p in characters)
        if(characters[p].position == name)
            return true;
        return false;
    };

    function getDefaultTerrainObj() {
        return {
            'type': "Plain",
            'movCount': 0,
            'atkCount': 0,
            'healCount': 0,
            'occupiedAffiliation': ''
        }
    };

    function calculateCharacterRanges() {
		for(var c in characters){
			var char = characters[c];
			var list = [];
			var atkList = [];
			var healList = [];
		
			var pos = char.position;
			if (pos.length > 0 && pos.indexOf(",") != -1 && pos != "-1,-1" && pos != "Not Deployed" && pos != "Defeated") {
				var horz = cols.indexOf(pos.substring(0,pos.indexOf(",")));
				var vert = rows.indexOf(pos.substring(pos.indexOf(",")+1));
				var range = parseInt(char.Mov);

                //Calculate max ranges
				var maxAtkRange = 0;
                var maxHealRange = 0;
                var isWonder = false;
				for (var i in char.inventory) {
                    var item = char.inventory[i];
                    if(item.isFamiliar) continue; //skip familiars

					var r = formatItemRange(item.range);
					if (isAttackingItem(item.class, item.might) && r > maxAtkRange && r <= 10) maxAtkRange = r;
                    else if (!isAttackingItem(item.class, item.might) && r > maxHealRange && r <= 10){ 
                        if(item.class == "Wonder") isWonder = true;
                        else isWonder = false;
                        maxHealRange = r;
                    }
				}

                if(char.equippedWeapon.name.length > 0){
                    var eR = formatItemRange(char.equippedWeapon.range);
                    if (isAttackingItem(char.equippedWeapon.class, char.equippedWeapon.might) && eR > maxAtkRange && r <= 10) maxAtkRange = eR;
                    else if (!isAttackingItem(char.equippedWeapon.class, char.equippedWeapon.might) && eR > maxHealRange && r <= 10){ 
                        if(char.equippedWeapon.class == "Wonder") isWonder = true;
                        else isWonder = false;
                        maxHealRange = eR;
                    }
                }

                var hasWaterWalker = false;
                var hasRockClimber = false;
                var hasHover = false;

				for(var s in char.skills){
					var skl = char.skills[s];
					switch(skl.name){
                        case "Water Walker" : hasWaterWalker = true; break;
                        case "Rock Climber" : hasRockClimber = true; break;
                        case "Hover" : hasHover = true; break;
                        case "Wondrous" : if(isWonder) maxHealRange += 1; break;
                        case "Phantom Edge" : if(maxAtkRange == 1) maxAtkRange = 2; break;
					}
				}

				var params = {
					'atkRange' : maxAtkRange,
					'healRange' : maxHealRange,
					'terrainClass' : char.class.terrainType,
                    'affiliation' : char.affiliation,
                    'hasWaterWalker' : hasWaterWalker,
                    'hasRockClimber' : hasRockClimber,
                    'hasHover' : hasHover
				};

				recurseRange(horz, vert, range, params, list, "_");
				
				list.forEach(function(e){
					horz = cols.indexOf(e.substring(0,e.indexOf(",")));
					vert = rows.indexOf(e.substring(e.indexOf(",")+1));

					recurseItemRange(horz, vert, params.atkRange, list, atkList, "_");
					recurseItemRange(horz, vert, params.healRange, list, healList, "_");
				});

				char.range = list;
				char.atkRange = atkList;
				char.healRange = healList;
			} else {
				char.range = [];
				char.atkRange = [];
				char.healRange = [];
			}
		}

		//Final progress update
		updateProgressBar();
	};

    function recurseRange(horzPos, vertPos, range, params, list, trace){
		//Don't calculate cost for starting tile
		var coord = cols[horzPos]+","+rows[vertPos];
		var tile = terrainLocs[coord];

		//Mov mode calcs
		if(trace.length > 1){
			var classCost = terrainIndex[tile.type][params.terrainClass];
			if(classCost == undefined) return;

            if((params.hasWaterWalker && terrainIndex[tile.type].waterWalker) ||
               (params.hasRockClimber && terrainIndex[tile.type].rockClimber)) 
                    classCost = parseFloat(terrainIndex[tile.type].skillParam) || 99;
            else if(params.hasHover && classCost != "-") classCost = 1;
            else classCost = parseFloat(classCost) || 99;
            
            //Determine traversal cost
			if(  classCost == 99
			 || (tile.occupiedAffiliation.length > 0 && tile.occupiedAffiliation != params.affiliation)
			 || (classCost > range)
			){
				return;
			}
			else range -= classCost;
		}

		if(list.indexOf(coord) == -1) list.push(coord);
		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+","+rows[vertPos]+"_") == -1)
			recurseRange(horzPos-1, vertPos, range, params, list, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+","+rows[vertPos]+"_") == -1)
			recurseRange(horzPos+1, vertPos, range, params, list, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+","+rows[vertPos-1]+"_") == -1)
			recurseRange(horzPos, vertPos-1, range, params, list, trace);

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+","+rows[vertPos+1]+"_") == -1)
			recurseRange(horzPos, vertPos+1, range, params, list, trace);
    };
    
    function recurseItemRange(horzPos, vertPos, range, list, itemList, trace){
		if(trace.length > 1){
			var coord = cols[horzPos]+","+rows[vertPos];
			var tile = terrainLocs[coord];

			var classCost = terrainIndex[terrainLocs[coord].type].Flier;
			if(classCost == undefined || classCost == "-") return;
			else range -= 1;

			if(itemList.indexOf(coord) == -1) itemList.push(coord);
		}

		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+","+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos-1]+","+rows[vertPos]) == -1)
			recurseItemRange(horzPos-1, vertPos, range, list, itemList, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+","+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos+1]+","+rows[vertPos]) == -1)
			recurseItemRange(horzPos+1, vertPos, range, list, itemList, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+rows[vertPos-1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos-1]) == -1)
			recurseItemRange(horzPos, vertPos-1, range, list, itemList, trace)

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+rows[vertPos+1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos+1]) == -1)
			recurseItemRange(horzPos, vertPos+1, range, list, itemList, trace)
	}

    function formatItemRange(range) {
        if (range.indexOf("-") != -1 && range.length > 1)
            range = range.substring(range.indexOf("-") + 1, range.length);
        range = range.trim();
        return parseInt(range) | 0;
    };

    function isAttackingItem(wpnClass, might) {
        if(wpnClass == "Wonder") return might != 0;
        else return wpnClass != "Item" && wpnClass != "Trophy" && wpnClass != "Mystery";
    };

    //\\//\\//\\//\\//\\//
    // HELPER FUNCTIONS //
    //\\//\\//\\//\\//\\//

    function updateProgressBar() {
        if (progress < 100) {
            progress = progress += updateVal; //13 calls
            $rootScope.$broadcast('loading-bar-updated', progress, map);
        }
    };

    function processImageURL(str) {
        if (str == undefined || str.length == 0) return "";
        else return str.substring(str.indexOf("\"") + 1, str.lastIndexOf("\""));
    };

    function getItem(name) {
        var originalName = name;
        if (name != undefined && name.length > 0) {
            if (name.indexOf("(") != -1)
                name = name.substring(0, name.indexOf("("));
            name = name.trim();
        }

        if (name == undefined || name.length == 0 || itemIndex[name] == undefined){
            var familiar = getFamiliar(name); //if not an item, try to locate familiar

            if(familiar.effect.length > 0) return familiar;
            else return getDefaultWeaponObj(name);
        }

        var copy = Object.assign({}, itemIndex[name]);
        copy.name = originalName;
        return copy;
    };

    function getSkill(name) {
        if (name == undefined || name.length == 0 || skillIndex[name] == undefined)
            return {
                'name': name != undefined ? name : "",
                'category' : "",
                'isCommand' : false,
                'desc': "This skill could not be located."
            }
        else return skillIndex[name];
    };

    function getClass(name) {
        if (name == undefined || name.length == 0 || classIndex[name] == undefined)
            return {
                'name': name != undefined ? name : "Undefined",
                'weaknesses' : [],
                'desc' : "This class could not be located.",
                'terrainType' : ""
            }
        else return classIndex[name];
    };

    function getMotif(name){
        if (name == undefined || name.length == 0 || motifIndex[name] == undefined)
        return {
            'name': name != undefined ? name : "Undefined",
            'weaknesses' : [],
            'desc' : "This motif could not be located."
        }
        else return motifIndex[name];
    };

    function getFamiliar(name){
        if (name == undefined || name.length == 0 || familiarIndex[name] == undefined)
            return getDefaultFamiliarObj(name);
        else return familiarIndex[name];
    };

    function getStatus(name){
        if (name == undefined || name.length == 0 || statusIndex[name] == undefined)
            return {
                'name' : name,
                'category' : "",
                'duration' : 0,
                'desc' : "This status could not be located."
            }
        else return statusIndex[name];
    };

    function getDefaultWeaponObj(name){
        return{
            'name': name != undefined ? name : "",
            'isFamiliar' : false,
            'equipped' : false,
            'class': "Mystery",
            'rank' : "",
            'atkStat': "",
            'might': 0,
            'hit': 0,
            'crit': 0,
            'guard' : 0,
            'avo': 0,
            'cEva': 0,
            'range' : "",
            'effect': "",
            'desc' : "",
            'StrEqpt': 0,
            'MagEqpt': 0,
            'SklEqpt': 0,
            'SpdEqpt': 0,
            'DefEqpt': 0,
            'ResEqpt': 0,
            'spriteUrl': "",
        }
    };

    function getDefaultFamiliarObj(name){
        return {
            'name': name != undefined ? name : "",
            'isFamiliar' : true,
            'isCommand' : false,
            'equipped' : false,
            'effect' : "",
            'desc' : "",
            'spriteUrl' : "", 
        }
    };

    //\\//\\//\\//\\//\\//
    //   CALCULATIONS   //
    //\\//\\//\\//\\//\\//

    function calculateTrueStat(char, stat){
        return char[stat] + (char.equippedWeapon[stat+"Eqpt"] != undefined ? char.equippedWeapon[stat+"Eqpt"] : 0);
    };

    function calculateBaseStat(char, stat){
        return char[stat] - char[stat+"Buff"] - char[stat+"Boost"];
    }

    function calculateAtk(strMag, wpnMight){
        return strMag + wpnMight;
    };

    function calculateHit(skl, wpnAccuracy){
        return (skl * 2.5) + wpnAccuracy;  
    };

    function calculateCrit(skl){
        return (skl * 2.5);
    };

    function calculateAvo(spd, terrainBonus){
        return (spd * 2.5) + terrainBonus;
    };

    function calculateExpPercent(exp){
        const pixels = 33;
        exp = parseInt(exp) | 0;

        if(exp >= 150) return pixels;
        else if(exp >= 100) return Math.floor(((exp-100)/50) * pixels);
        else if(exp >= 60) return Math.floor(((exp-60)/540) * pixels);
        else if(exp >= 30) return Math.floor(((exp-30)/30) * pixels);
        else if(exp >= 10) return Math.floor(((exp-10)/20) * pixels);
        else return Math.floor((exp/10) * pixels);
    };

    function calculateWpnRank(exp){
        exp = parseInt(exp) | 0;

        if(exp >= 150) return "S";
        else if(exp >= 100) return "A";
        else if(exp >= 60) return "B";
        else if(exp >= 30) return "C";
        else if(exp >= 10) return "D";
        else return "E";
    };

}]);
