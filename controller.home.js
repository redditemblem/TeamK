app.controller('HomeCtrl', ['$scope', '$location', '$interval', 'DataService', function($scope, $location, $interval, DataService) {
    $scope.rows = ["1"];
    $scope.columns = ["1"];
    const boxWidth = 31;
    const gridWidth = 1;
    var refreshListener;

    $scope.statsList = [
        ["Str", "Strength. Affects damage the unit deals with physical attacks.", "5px", "5px"],
        ["Mag", "Magic. Affects damage the unit deals with magical attacks.", "29px", "14px"],
        ["Skl", "Skill. Affects hit rate and the frequency of critical hits.", "53px", "38px"],
        ["Spd", "Speed. Affects Avo. Unit strikes twice if 5 higher than opponent.", "72px", "45px"],
        ["Lck", "Luck. Has various effects. Lowers risk of enemy criticals.", "96px", "60px"],
        ["Def", "Defense. Reduces damage from physical attacks.", "106px", "76px"],
        ["Res", "Resistance. Reduces damage from physical attacks.", "109px", "94px"]
    ];

    //Interval timers
    var dragNDrop = $interval(initializeListeners, 250, 20);

    //Positioning constants
    const statVerticalPos = ["10px", "39px", "68px", "97px", "126px", "155px", "184px"];
    const weaponVerticalPos = ["10px", "45px", "80px", "115px", "150px"];
    const weaponRankHorzPos = ["345px", "395px", "445px"];
    const weaponDescVerticalPos = ["10px", "35px", "60px", "85px", "105px"];
    const skillVerticalPos = ["7px", "37px", "68px", "97px", "128px", "160px"];
    const skillDescVerticalPos = ["5px", "15px", "22px", "29px", "36px", "43px", "50px", "57px", "63px"];

    const eSkillHorzPos = ["7px", "47px", "87px", "127px", "167px"];
    const eStatVerticalPos = ["5px", "29px", "53px", "77px", "101px", "125px", "149px"];
    const eWeaponVerticalPos = ["5px", "34px", "63px", "92px", "121px"];
    const eWpnRankHorzPos = ["297px", "364px", "431px"];
    const eSklDescHorzPos = ["5px", "36px", "67px", "98px", "139px"];
    const eWpnDescVerticalPos = ["5px", "20px", "40px", "55px", "65px"];

    //Constants
    const STAT_DEFAULT_COLOR = "#E5C68D";
    const STAT_BUFF_COLOR = "#42adf4";
    const STAT_DEBUFF_COLOR = "#960000";

    //Reroutes the user if they haven't logged into the app
    //Loads data from the DataService if they have
    if (DataService.getCharacters() == null)
        $location.path('/');
    else {
        $scope.charaData = DataService.getCharacters();
        $scope.enemyData = DataService.getEnemies();
        $scope.mapUrl = DataService.getMap();
        $scope.rows = DataService.getRows();
        $scope.columns = DataService.getColumns();
        $scope.terrainTypes = DataService.getTerrainTypes();
        $scope.terrainLocs = DataService.getTerrainMappings();
    }

    $scope.redirectToHomePage = function() {
        $location.path('/');
    };

    $scope.launchConvoyDialog = function() { $scope.showConvoy = true; };
	$scope.launchShopDialog = function(){ $scope.showShop = true; };

    //Returns the vertical position of a glowBox element
    $scope.determineGlowY = function(index) {
        return ((index + 1) * (boxWidth + gridWidth)) + "px";
    };

    //Returns the horizontal position of a glowBox element
    $scope.determineGlowX = function(index) {
        return ((index + 1) * (boxWidth + gridWidth)) + "px";
    };

    //*************************\\
    // FUNCTIONS FOR MAP       \\
    // CHARACTERS/SPRITES      \\
    //*************************\\

    //Toggles character/enemy information box
    $scope.displayData = function(char) {
        var bool = $scope[char + "_displayBox"];
        if (bool == undefined || bool == false) {
            positionCharBox(char);
            toggleCharRange(char, 1);
            $scope[char + "_displayBox"] = true;
        } else {
            toggleCharRange(char, -1);
            $scope[char + "_displayBox"] = false;
        }
    };

    $scope.removeData = function(char) {
        toggleCharRange(char, -1);
        $scope[char + "_displayBox"] = false;
    };

    $scope.checkCharToggle = function(index) {
        return $scope[index + "_displayBox"] == true;
    };

    $scope.isPaired = function(partner, stance) {
        return partner.length > 0 && stance != "Attack";
    };

    //Returns the image URL for the unit in the back of a pairup
    //0 = charaData, 1 = enemyData
    $scope.getPairUnitIcon = function(pair, toggle) {
        var pairedUnit = locatePairedUnit(pair, toggle).unit;
        return pairedUnit.spriteUrl;
    };

    $scope.getPairUnitNum = function(pair){
        var size = Object.keys($scope.enemyData).length;
        var found = false;
        var inc = 0;

        //Find paired unit
        var pairedUnit = null;
        while (!found && inc < size) {
            if ($scope.enemyData["enmy_" + inc].partner == pair) {
                pairedUnit = $scope.enemyData["enmy_" + inc];
                found = true;
            } else inc++;
        }

        if(pairedUnit != null) return $scope.getEnemyNum(pairedUnit.name);
        else return "";
    };

    //Switches char info box to show the stats of the paired unit
    //Triggered when char info box "Switch to Paired Unit" button is clicked
    $scope.findPairUpChar = function(char, toggle) {
        var clickedChar;
        if (toggle == "0") clickedChar = $scope.charaData[char];
        else clickedChar = $scope.enemyData[char];

        var pairedUnit = locatePairedUnit(clickedChar.partner, toggle);

        //Toggle visibility
        $scope[char + "_displayBox"] = false;
        $scope[pairedUnit.unitLoc + "_displayBox"] = true;

        var currBox = document.getElementById(char + '_box');
        var pairBox = document.getElementById(pairedUnit.unitLoc + '_box');

        pairBox.style.top = currBox.offsetTop + 'px';
        pairBox.style.left = currBox.offsetLeft + 'px';

        //Toggle ranges
        toggleCharRange(char, -1);
        toggleCharRange(pairedUnit.unitLoc, 1);
    };

    function locatePairedUnit(unitName, toggle) {
        var dataList, dataName;

        if (toggle == "0") {
            dataList = $scope.charaData;
            dataName = "char_";
        } else {
            dataList = $scope.enemyData;
            dataName = "enmy_";
        }

        var size = Object.keys(dataList).length;
        var found = false;
        var inc = 0;

        //Find paired unit
        while (!found && inc < size) {
            if (dataList[dataName + inc].name == unitName) {
                pairedUnit = dataList[dataName + inc];
                found = true;
            } else inc++;
        }

        return {
            'unit': dataList[dataName + inc],
            'unitLoc': dataName + inc
        };
    };

    $scope.calculateHPWidth = function(currHp, maxHp) {
        return Math.min((currHp / maxHp) * 28, 28);
    };

    //Parses an enemy's name to see if it contains a number at the end
    $scope.getEnemyNum = function(name) {
        if (name.lastIndexOf(" ") == -1 || name == undefined)
            return "";
        name = name.substring(name.lastIndexOf(" ") + 1, name.length);

        if (name.match(/^[0-9]+$/) != null) return "IMG/NUM/" + name + ".png";
        else return "";
    };

    $scope.validPosition = function(pos, stance) {
        return pos != "" && stance != "Backpack";
    };

    $scope.getHealthBarColor = function(currHp, maxHp) {
        if (currHp > maxHp)
            if (currHp > maxHp) return 'purple';
            else if (cIndex.indexOf("char_") != -1) return 'skyBlue';
        else return 'red';
    };

    $scope.textTooLong = function(textA, textB) {
        return (textA.length + textB.length) > 150;
    };

    //Using a character's coordinates, calculates their horizontal
    //position on the map
    $scope.determineCharX = function(pos) {
        pos = pos.match(/[a-zA-Z]+/g)[0];
        pos = parseInt(getPosLetterEquivalent(pos));
        return (pos * (boxWidth + gridWidth)) + gridWidth + "px";
    };

    //Using a character's coordinates, calculates their vertical
    //position on the map
    $scope.determineCharY = function(pos) {
        pos = pos.match(/[0-9]+/g)[0];
        pos = parseInt(pos);
        return (pos * (boxWidth + gridWidth)) + "px";
    };

    function getPosLetterEquivalent(letter) {
        if (letter.length == 1)
            return letter.charCodeAt(0) - 64; //single letter
        else
            return letter.charCodeAt(0) - 38; //double letter
    };

    function toggleCharRange(char, val){
        var unit = undefined;
        if(char.indexOf("char") != -1) unit = $scope.charaData[char];
        else unit = $scope.enemyData[char];

		var movRangeList = unit.range;
		var atkRangeList = unit.atkRange;
		var healRangeList = unit.healRange;

		for(var i = 0; i < movRangeList.length; i++)
			$scope.terrainLocs[movRangeList[i]].movCount += val;
		for(var j = 0; j < atkRangeList.length; j++)
			$scope.terrainLocs[atkRangeList[j]].atkCount += val;
		for(var k = 0; k < healRangeList.length; k++)
			$scope.terrainLocs[healRangeList[k]].healCount += val;
	};

    $scope.determineGlowColor = function(loc){
		if($scope.terrainLocs == undefined) return '';
		var terrainInfo = $scope.terrainLocs[loc];
		if(terrainInfo.movCount > 0) return 'rgba(0, 0, 255, 0.5)';
		if(terrainInfo.atkCount > 0) return 'rgba(255, 0, 0, 0.5)';
		if(terrainInfo.healCount > 0) return 'rgba(0, 255, 0, 0.5)';
		return '';
	};

    //***********************\\
    // POSITION CALCULATIONS \\
    //***********************\\

    //Relocate the information box relative to the clicked char
    function positionCharBox(char) {
        var sprite = document.getElementById(char);
        var box = document.getElementById(char + '_box');

        var x = sprite.style.left;
        var y = sprite.style.top;
        x = parseInt(x.substring(0, x.length - 2));
        y = parseInt(y.substring(0, y.length - 2));

        if (x < 671) x += 40;
        else x -= 671;

        if (y < 77) y += 40;
        else y -= 77;

        box.style.left = x + 'px';
        box.style.top = y + 'px';
    };

    $scope.fetchStatVerticalPos = function(index) {
        return statVerticalPos[index]
    };
    $scope.fetchWeaponVerticalPos = function(index) {
        return weaponVerticalPos[index];
    };
    $scope.fetchWpnRankHorzPos = function(index) {
        return weaponRankHorzPos[index];
    };
    $scope.fetchWpnDescVerticalPos = function(index) {
        return weaponDescVerticalPos[index];
    };
    $scope.fetchSklVerticalPos = function(index) {
        return skillVerticalPos[index];
    };
    $scope.fetchSklDescVerticalPos = function(index) {
        return skillDescVerticalPos[index];
    };

    $scope.fetchESklHorzPos = function(index) {
        return eSkillHorzPos[index];
    };
    $scope.fetchEStatVerticalPos = function(index) {
        return eStatVerticalPos[index];
    };
    $scope.fetchEWeaponVerticalPos = function(index) {
        return eWeaponVerticalPos[index];
    };
    $scope.fetchEWpnRankHorzPos = function(index) {
        return eWpnRankHorzPos[index];
    };
    $scope.fetchESklDescHorzPos = function(index) {
        return eSklDescHorzPos[index];
    };
    $scope.fetchEWpnDescVerticalPos = function(index) {
        return eWpnDescVerticalPos[index];
    };

    //***********************\\
    // FUNCTIONS FOR STAT    \\
    // PROCESSING/FORMATTING \\
    //***********************\\

    $scope.fetchCharPortrait = function(name){
        return `url('IMG/PORT/${name}.png')`;
    };

    //Returns true if the value in the passed attribute is >= 0
    $scope.checkRate = function(stat) {
        return parseInt(stat) >= 0;
    };

    /* Calculates total buff/debuffs for each stat (str/mag/skl/etc) and
     * returns the appropriate text color as a hex value
     * red <- total<0
     * blue <- total>0
     * tan <- total=0
     *
     * toggle = 0 for char, 1 for enemy
     */
    $scope.determineStatColor = function(cIndex, stat, toggle) {
        var char;
        if (toggle == "0") char = $scope.charaData[cIndex];
        else char = $scope.enemyData[cIndex];

        var value = calcFinalStat(char, stat);
        if (value > char[stat + "Base"]) return STAT_BUFF_COLOR;
        if (value < char[stat + "Base"]) return STAT_DEBUFF_COLOR;
        else return STAT_DEFAULT_COLOR;
    };

    $scope.getStatValue = function(cIndex, stat, toggle) {
        var char;
        if (toggle == "0") char = $scope.charaData[cIndex];
        else char = $scope.enemyData[cIndex];

        return calcFinalStat(char, stat);
    };

    function calcFinalStat(char, stat) {
        var pair = char[stat + "Pair"];
        //var buff = char[stat + "Buff"];
        var weapon = 0;

        if (char.inventory.itm0.name.indexOf("(E)") != -1) weapon += char.inventory.itm0[stat + "Eqpt"]; //equipped weapon buff/debuff
        for (var w in char.inventory)
            weapon += char.inventory[w][stat + "Inv"]; //inventory buff/debuffs

        return pair + weapon;
    };

    $scope.validSkill = function(skill) {
        return skill != "-" && skill != "";
    };

    $scope.fetchSkillIcon = function(url, name, index) {
        if (url.length > 0) return url;
        else if (name.length > 0 && index == 0) return "IMG/SKL/skl_personal.png";
        else if (name.length > 0 && index > 0) return "IMG/SKL/skl_empty.png";
        else return "IMG/SKL/skl_blank.png";
    };

    $scope.checkShields = function(num, shields) {
        num = parseInt(num);
        shields = parseInt(shields);

        if (shields == 10) return "IMG/blueshield.png";
        else if (shields >= num) return "IMG/filledshield.png";
        else return "IMG/emptyshield.png";
    };

    $scope.validSkill = function(skill) {
        return skill != "-";
    };

    //*************************\\
    // FUNCTIONS FOR INVENTORY \\
    // & WEAPONS PROFICIENCY   \\
    //*************************\\

    //Checks to see if the weapon name in the passed slot is null
    //Version for characters
    $scope.validWeapon = function(weaponName) {
        if (weaponName != "-" && weaponName != "- (-)" && weaponName != "") return true;
        else return false;
    };

    //Returns the icon for the class of the weapon at the index
    //Version for characters
    $scope.getWeaponClassIcon = function(type) {
        type = type.toLowerCase();
        return "IMG/type_" + type + ".png";
    };

    //Checks if the passed "type" is listed in the effectiveness column of a character's weapon
    //(Ex. Flying, Monster, Beast, Dragon, Armor)
    $scope.weaponEffective = function(types, goal) {
        if(types == undefined) return false;
        types = types.toLowerCase();
        return types.indexOf(goal) != -1;
    };

    $scope.existsWeaponRank = function(cls, rank) {
        return cls != "-" && rank != "-";
    };

    //Returns the weapon rank icon relevant to the passed weapon type
    $scope.weaponIcon = function(weaponName) {
        var c = weaponName.toLowerCase();
        return "IMG/rank_" + c + ".png";
    };

    //Checks if there is a value in the index
    $scope.validDebuff = function(value) {
        return value != "" && value != "0" && value != "-";
    };

    $scope.formatWeaponName = function(name) {
        if (name.indexOf("(") == -1) return name;
        else return name.substring(0, name.indexOf("(") - 1);
    };

    $scope.hasWeaponRank = function(rank) {
        return rank != "";
    };

    //Returns true if the weapon at the index is not an item
    $scope.notItem = function(type) {
        return type != "Item" && type != "Gold" && type != "Unknown";
    };

    $scope.setDescriptionLoc = function(type) {
        if (type == "Item" || type == "Trophy" && type == "Mystery") return "25px";
        else return "60px";
    };

    $scope.setItemDescHeight = function(type) {
        if (type == "Item" || type == "Trophy" || type == "Mystery") return "118px";
        else return "80px";
    };

    //***************************\\
    // MOUSEOVER/MOUSEOUT EVENTS \\
    //***************************\\

    $scope.weaponHoverIn = function(char, index) {
        $scope[char + "wpn_" + index] = true;
    };
    $scope.weaponHoverOut = function(char, index) {
        $scope[char + "wpn_" + index] = false;
    };
    $scope.weaponHoverOn = function(char, index) {
        return $scope[char + "wpn_" + index] == true;
    };

    $scope.skillHoverIn = function(char, index) {
        $scope[char + "skl_" + index] = true;
    };
    $scope.skillHoverOut = function(char, index) {
        $scope[char + "skl_" + index] = false;
    };
    $scope.skillHoverOn = function(char, index) {
        return $scope[char + "skl_" + index] == true;
    };

    $scope.statHoverIn = function(char, stat) {
        $scope[char + "hov_" + stat] = true;
    };
    $scope.statHoverOut = function(char, stat) {
        $scope[char + "hov_" + stat] = false;
    };
    $scope.statHoverOn = function(char, stat) {
        return $scope[char + "hov_" + stat] == true;
    };

    $scope.pairUpHoverIn = function(char) {
        $scope[char + "pair"] = true;
    };
    $scope.pairUpHoverOut = function(char) {
        $scope[char + "pair"] = false;
    };
    $scope.pairUpHoverOn = function(char) {
        return $scope[char + "pair"] == true;
    };

    //*************************\\
    // SUPPORT FOR DRAGABILITY \\
    // OF CHAR INFO BOX        \\
    //*************************\\
    var currDrag = "";

    function dragStart(event) {
        var style = window.getComputedStyle(event.target, null);
        currDrag = event.target.id;
        event.dataTransfer.setData("text", (parseInt(style.getPropertyValue("left"), 10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"), 10) - event.clientY));
    };

    function dragOver(event) {
        event.preventDefault();
        return false;
    };

    function dragEnter(event) {
        event.preventDefault();
    };

    function dropDiv(event) {
        event.preventDefault();
        var data = event.dataTransfer.getData("text").split(',');

        var drag = document.getElementById(currDrag);
        drag.style.left = (event.clientX + parseInt(data[0], 10)) + 'px';
        drag.style.top = (event.clientY + parseInt(data[1], 10)) + 'px';
        currDrag = "";
    };

    function initializeListeners() {;
        var test = document.getElementById('char_0_box');
        if ($scope.charaData != undefined && test != null) {

            var i = 0;
            //Set event listeners to be activated when the div is dragged
            for (var char in $scope.charaData) {
                var box = document.getElementById('char_' + i + '_box');
                box.addEventListener('dragstart', dragStart, false);
                i++;
            }
            i = 0;

            //Set event listeners to be activated when the div is dragged
            for (var enemy in $scope.enemyData) {
                var box = document.getElementById('enmy_' + i + '_box');
                box.addEventListener('dragstart', dragStart, false);
                i++;
            }

            //Set event listeners
            var drop = document.getElementById('dropArea');
            drop.addEventListener('dragenter', dragEnter, false);
            drop.addEventListener('dragover', dragOver, false);
            drop.addEventListener('drop', dropDiv, false);

            $interval.cancel(dragNDrop); //cancel $interval timer
        }
    };
}]);
