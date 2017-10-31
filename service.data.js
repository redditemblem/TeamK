app.service('DataService', ['$rootScope', function($rootScope) {
    const sheetId = '1fwzq_64mPMmCndomAe7sZeBrhJEhR9S-CJvIitzVrDI';
    const updateVal = (100 / 10) + 0.1;
    const boxWidth = 16;
    const gridWidth = 0;
    var progress = 0;

    var characters = null;
    var enemies = null;
    var rows = [];
    var cols = [];
    var map, characterData, classIndex, itemIndex, skillIndex, coordMapping, terrainIndex, terrainLocs;

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
            range: 'Unit Tracker!B1:AZ',
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
                fetchTerrainIndex();
        });
    };

    function fetchTerrainIndex() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Terrain Chart!A2:K',
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
                    'effect' : r[10] != "No effect." ? r[10] : "",
                    'desc': r[11] != "No notes." ? r[11] : ""
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
                //'class': getClass(c[2]),
                //'motif' : getMotif(c[3]),
                'affiliation' : c[4],
                'position' : c[5],
                'hasMoved' : c[6] == "1",
                'currHp' : c[7],
                'maxHp' : c[8],
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
                //'familiar' : getFamiliar(c[25]),
                'skills' : {},
                'statuses' : {},
                'HpBuff' : c[38].length > 0 ? parseInt(c[38]) : 0,
                'StrBuff' : c[39].length > 0 ? parseInt(c[39]) : 0,
                'MagBuff' : c[40].length > 0 ? parseInt(c[40]) : 0,
                'SklBuff' : c[41].length > 0 ? parseInt(c[41]) : 0,
                'SpdBuff' : c[42].length > 0 ? parseInt(c[42]) : 0,
                'DefBuff' : c[43].length > 0 ? parseInt(c[43]) : 0,
                'ResBuff' : c[44].length > 0 ? parseInt(c[44]) : 0,
                'MovBuff' : c[45].length > 0 ? parseInt(c[45]) : 0,
                'HpBoost' : c[46].length > 0 ? parseInt(c[46]) : 0,
                'StrBoost' : c[47].length > 0 ? parseInt(c[47]) : 0,
                'MagBoost' : c[48].length > 0 ? parseInt(c[48]) : 0,
                'SklBoost' : c[49].length > 0 ? parseInt(c[49]) : 0,
                'SpdBoost' : c[50].length > 0 ? parseInt(c[50]) : 0,
                'DefBoost' : c[51].length > 0 ? parseInt(c[51]) : 0,
                'ResBoost' : c[52].length > 0 ? parseInt(c[52]) : 0,
                'MovBoost' : c[53].length > 0 ? parseInt(c[53]) : 0,
                'weaponRanks' : {
                    'wpn1' : {
                        'class' : c[54],
                        'exp' : c[55]
                    },
                    'wpn2' : {
                        'class' : c[56],
                        'exp' : c[57]
                    }
                },
                'mimic' : c[58] != "None" ? c[58] : "",
                'behavior' : c[59] != undefined ? c[59] : "",
                'desc' : c[60] != undefined ? c[60] : "",
            };

            /*//Find and append weapons
            var itemArray = c.slice(36, 41);
            var eqptIndex = itemArray.indexOf(c[35]);
            if (eqptIndex != -1) { //if there is an equipped item, move it to the head of the list
                itemArray.splice(eqptIndex, 1);
                itemArray.splice(0, 0, c[35] + " (E)");
            }

            for (var j = 0; j < itemArray.length; j++)
                currObj.inventory["itm" + j] = getItem(itemArray[j]);

            for (var k = 47; k <= 52; k++)
                currObj.skills["skl" + (k - 46)] = getSkill(c[k]);*/

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

        //Update terrain types from input list
        for (var r = 0; r < coordMapping.length; r++) {
            var row = coordMapping[r];
            for (var c = 0; c < cols.length && c < row.length; c++) {
                if (row[c].length > 0) terrainLocs[cols[c] + "," + rows[r]].type = row[c];
            }
        }

        for (var c in characters)
            if (terrainLocs[characters[c].position] != undefined)
                terrainLocs[characters[c].position].occupiedAffiliation = characters[c].affiliation;

        updateProgressBar();
        //runRangeCalculations();
    };

    function getDefaultTerrainObj() {
        return {
            'type': "Plains",
            'movCount': 0,
            'atkCount': 0,
            'healCount': 0,
            'occupiedAffiliation': ''
        }
    };

    function runRangeCalculations(){
        for (var c in characters) {
            var char = characters[c];

            if(char.stance == "Backpack"){
                var pos = "";
                for(var i in characters)
                    if(characters[i].name == char.partner)
                        pos = characters[i].position;
                char.position = pos;
            }

            calculateCharacterRange(char, c);
        }

        for (var e in enemies) {
            var enmy = enemies[e];

            if(enmy.stance == "Backpack"){
                var pos = "";
                for(var i in enemies)
                    if(enemies[i].name == enmy.partner)
                        pos = enemies[i].position;
                enmy.position = pos;
            }

            calculateCharacterRange(enmy, e);
        }

        //Finish load
        updateProgressBar();
    };

    function calculateCharacterRange(char, index) {
        var list = [];
        var atkList = [];
        var healList = [];

        if (char.position.length > 0) {
            var horz = cols.indexOf(char.position.match(/[a-zA-Z]+/g)[0]);
            var vert = rows.indexOf(char.position.match(/[0-9]+/g)[0]);
            var range = parseInt(char.MovPair);

            var maxAtkRange = 0;
            var maxHealRange = 0;
            for (var i in char.inventory) {
                var item = char.inventory[i];
                var r = formatItemRange(item.range);
                if (isAttackingItem(item.type, item.critDmg) && r > maxAtkRange && r <= 10) maxAtkRange = r;
                else if (!isAttackingItem(item.type, item.critDmg) && r > maxHealRange && r <= 10) maxHealRange = r;
            }

            var hasPass = false;
            var hasSeaLegs = false;
            for(var s in char.skills){
                var skl = char.skills[s];
                switch(skl.name){
                    case "Pass" : hasPass = true; break;
                    case "Sea Legs" : hasSeaLegs = true; break;
                }
            }

            var params = {
                'atkRange' : maxAtkRange,
                'healRange' : maxHealRange,
                'terrainClass' : char.class.terrainType,
                'affiliation' : index.indexOf("char_") > -1 ? "char" : "enemy",
                'hasPass' : hasPass,
                'hasSeaLegs' : hasSeaLegs
            };

            recurseRange(horz, vert, range, params, list, "_");
            
            list.forEach(function(e){
                horz = cols.indexOf(e.match(/[a-zA-Z]+/g)[0]);
                vert = rows.indexOf(e.match(/[0-9]+/g)[0]);

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
    };

    function recurseRange(horzPos, vertPos, range, params, list, trace){
		//Don't calculate cost for starting tile
		var coord = cols[horzPos]+rows[vertPos];
		var tile = terrainLocs[coord];

		//Mov mode calcs
		if(trace.length > 1){
			var classCost = terrainIndex[tile.type][params.terrainClass];

            //Determine traversal cost
            if(params.hasSeaLegs && (tile.type == "Sea" || tile.type == "Lake" || tile.type == "Big Puddle") && range >= 2) range -= 2;
			else if( classCost == undefined
			   || classCost == "-"
			   || (tile.occupiedAffiliation.length > 0 && tile.occupiedAffiliation != params.affiliation && !params.hasPass)
			   || (parseFloat(classCost) > range)
			){
				return;
            }
			else range -= parseFloat(classCost);
		}

		if(list.indexOf(coord) == -1) list.push(coord);
		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+rows[vertPos]+"_") == -1)
			recurseRange(horzPos-1, vertPos, range, params, list, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+rows[vertPos]+"_") == -1)
			recurseRange(horzPos+1, vertPos, range, params, list, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+rows[vertPos-1]+"_") == -1)
			recurseRange(horzPos, vertPos-1, range, params, list, trace);

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+rows[vertPos+1]+"_") == -1)
			recurseRange(horzPos, vertPos+1, range, params, list, trace);
    };
    
    function recurseItemRange(horzPos, vertPos, range, list, itemList, trace){
		if(trace.length > 1){
			var coord = cols[horzPos]+rows[vertPos];
			var tile = terrainLocs[coord];

			var classCost = terrainIndex[terrainLocs[coord].type].Flier;
			if(classCost == undefined || classCost == "-") return;
			else range -= 1;

			if(itemList.indexOf(coord) == -1) itemList.push(coord);
		}

		trace += coord + "_";

		if(range <= 0) //base case
			return;

		if(horzPos > 0 && trace.indexOf("_"+cols[horzPos-1]+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos-1]+rows[vertPos]) == -1)
			recurseItemRange(horzPos-1, vertPos, range, list, itemList, trace);

		if(horzPos < cols.length-1 && trace.indexOf("_"+cols[horzPos+1]+rows[vertPos]+"_") == -1 && list.indexOf(cols[horzPos+1]+rows[vertPos]) == -1)
			recurseItemRange(horzPos+1, vertPos, range, list, itemList, trace);

		if(vertPos > 0 && trace.indexOf("_"+cols[horzPos]+rows[vertPos-1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos-1]) == -1)
			recurseItemRange(horzPos, vertPos-1, range, list, itemList, trace)

		if(vertPos < rows.length-1 && trace.indexOf("_"+cols[horzPos]+rows[vertPos+1]+"_") == -1 && list.indexOf(cols[horzPos]+rows[vertPos+1]) == -1)
			recurseItemRange(horzPos, vertPos+1, range, list, itemList, trace)
	}

    function formatItemRange(range) {
        if (range.indexOf("~") != -1 && range.length > 1)
            range = range.substring(range.indexOf("~") + 1, range.length);
        range = range.trim();
        return parseInt(range) | 0;
    };

    function isAttackingItem(wpnClass, critDmg) {
        if(wpnClass == "Staff")
            return critDmg != 0;
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

    function calcExpPercent(exp) {
        if (exp.length < 3) return 0;

        var split = exp.split("/");
        var curr = parseInt(split[0].trim()) | 0;
        var nextRank = parseInt(split[1].trim()) | 0;

        if (curr == 0 || nextRank == 0) return 0;
        else return curr / nextRank;
    };

    function getItem(name) {
        var originalName = name;
        if (name != undefined && name.length > 0) {
            if (name.indexOf("(") != -1)
                name = name.substring(0, name.indexOf("("));
            name = name.trim();
        }

        if (name == undefined || name.length == 0 || itemIndex[name] == undefined)
            return {
                'name': name != undefined ? name : "",
                'type': "Mystery",
                'effective': "",
                'critDmg' : 0,
                'range' : "0",
                'StrInv': 0,
                'MagInv': 0,
                'SklInv': 0,
                'SpdInv': 0,
                'LckInv': 0,
                'DefInv': 0,
                'ResInv': 0,
                'MovInv': 0,
                'desc': "This item could not be located."
            }

        var copy = Object.assign({}, itemIndex[name]);
        copy.name = originalName;
        return copy;
    };

    function getSkill(name) {
        if (name == undefined || name.length == 0 || skillIndex[name] == undefined)
            return {
                'name': name != undefined ? name : "",
                'desc': "This skill could not be located.",
                'spriteUrl': ""
            }
        else return skillIndex[name];
    };

    function getClass(name) {
        if (name == undefined || name.length == 0 || classIndex[name] == undefined)
            return {
                'name': name != undefined ? name : "",
                'terrainType' : "",
                'StrPair': 0,
                'MagPair': 0,
                'SklPair': 0,
                'SpdPair': 0,
                'LckPair': 0,
                'DefPair': 0,
                'ResPair': 0,
                'MovPair': 0
            }
        else return classIndex[name];
    };
}]);
