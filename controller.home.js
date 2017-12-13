app.controller('HomeCtrl', ['$scope', '$location', '$interval', 'DataService', function ($scope, $location, $interval, DataService) {
	$scope.rows = ["1"];
	$scope.columns = ["1"];
	const boxWidth = 16;
	const gridWidth = 0;
	var numDefeat = 0;
	$scope.showGrid = 2;
	var refreshListener;
	var supportBonuses;

	$scope.battleStatsList = [
	                ["Atk", "130px", "5px"],
	                ["Hit", "130px", "95px"],
	                ["Crit", "157px", "5px"],
	                ["Avo", "157px", "95px"]
	               ];
	$scope.statsList = [
	                ["Str", "Strength. Affects damage the unit deals with physical attacks.",    "5px"],
	                ["Mag", "Magic. Affects damage the unit deals with magical attacks.",        "35px"],
	                ["Skl", "Skill. Affects hit rate and the frequency of critical hits.",       "65px"],
	                ["Spd", "Speed. Affects Avo. Unit strikes twice if 5 higher than opponent.", "95px"],
	                ["Def", "Defense. Reduces damage from physical attacks.",                    "125px"],
	                ["Res", "Resistance. Reduces damage from physical attacks.",                 "155px"]
	               ];
	
	//Interval timers
    var dragNDrop = $interval(initializeListeners, 250, 20);
    
    //Positioning constants
    const weaponVerticalPos = ["59px", "86px", "113px", "140px", "167px"];
	const weaponRankHorzPos = ["130px", "185px"];
    const weaponDescVerticalPos = ["35px", "50px", "65px", "80px", "95px"];
    const skillVerticalPos = ["5px", "32px", "59px", "86px", "113px", "140px", "167px"];
    const skillDescVerticalPos = ["5px", "20px", "35px", "50px", "65px", "80px", "95px"];
    
    //Constants
    const STAT_DEFAULT_COLOR = "#000000";
    const STAT_BUFF_COLOR = "#353cff";
	const STAT_DEBUFF_COLOR = "#ff0000";
	
	const NAMETAG_BLUE = "#255bb2";
	const NAMETAG_RED = "#c00c13";
	const NAMETAG_GREEN = "#33bb33";
	const NAMETAG_GREEN2 = "#9ef237";
	const NAMETAG_PERIWINKLE = "#9988dd";
    
    //Reroutes the user if they haven't logged into the app
    //Loads data from the DataService if they have
	if(DataService.getCharacters() == null)
		$location.path('/');
	else{
		$scope.charaData = DataService.getCharacters();
		$scope.mapUrl = DataService.getMap();
		$scope.rows = DataService.getRows();
		$scope.columns = DataService.getColumns();
		$scope.terrainTypes = DataService.getTerrainTypes();
		$scope.terrainLocs = DataService.getTerrainMappings();
	}

	$scope.redirectToHomePage = function() {
		$location.path('/');
  	};

	$scope.refreshData = function(){
		if($scope.refreshing == true) return; //If already refreshing, don't make a second call
		$scope.refreshing = true;
		
		refreshListener = $scope.$on('loading-bar-updated', function(event, data) {
			if(data >= 100){
				refreshListener(); //cancel listener
				$scope.refreshing = false;
				$scope.charaData = DataService.getCharacters();
				$scope.mapUrl = DataService.getMap();
				$scope.rows = DataService.getRows();
				$scope.columns = DataService.getColumns();
				$scope.terrainTypes = DataService.getTerrainTypes();
				$scope.terrainLocs = DataService.getTerrainMappings();
				$scope.$apply();
			}
		});

		MapDataService.loadMapData(mapType);
	};

	$scope.launchConvoyDialog = function() { $scope.showConvoy = true; };
	$scope.launchShopDialog = function(){ $scope.showShop = true; };
    
    //*************************\\
    // FUNCTIONS FOR MAP TILE  \\
    // GLOW BOXES              \\
    //*************************\\
    
    //Returns the vertical position of a glowBox element
    $scope.determineGlowY = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
    };
    
    //Returns the horizontal position of a glowBox element
    $scope.determineGlowX = function(index){
    	return (index * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineGlowColor = function(loc){
		if($scope.terrainLocs == undefined) return '';
		var terrainInfo = $scope.terrainLocs[loc];

		if(terrainInfo.movCount > 0) return 'rgba(0, 0, 255, 0.5)';
        else if(terrainInfo.atkCount > 0) return 'rgba(255, 0, 0, 0.5)';
        else if(terrainInfo.healCount > 0) return 'rgba(0, 255, 0, 0.5)';
		else return '';
	};

	$scope.toggleGrid = function(){
		if($scope.showGrid == 3) $scope.showGrid = 0;
		else $scope.showGrid++;	
	};
    
    //*************************\\
    // FUNCTIONS FOR MAP       \\
    // CHARACTERS/SPRITES      \\
    //*************************\\
    
    //Toggles character/enemy information box
    $scope.displayData = function(char){
    	var bool = $scope[char + "_displayBox"];
    	if(bool == undefined || bool == false){
    		positionCharBox(char);
			toggleCharRange(char, 1);
    		$scope[char + "_displayBox"] = true;
    	}else{
			toggleCharRange(char, -1);
    		$scope[char + "_displayBox"] = false;
    	}
    };

    $scope.removeData = function(char){
		toggleCharRange(char, -1);
    	$scope[char + "_displayBox"] = false;
    };
    
    $scope.checkCharToggle = function(char){
    	return $scope[char + "_displayBox"] == true;
    };

	//Add/remove character's range highlighted cells
	function toggleCharRange(char, val){
		var movRangeList = $scope.charaData[char].range;
		var atkRangeList = $scope.charaData[char].atkRange;
		var healRangeList = $scope.charaData[char].healRange;

		for(var i = 0; i < movRangeList.length; i++)
			$scope.terrainLocs[movRangeList[i]].movCount += val;
		for(var j = 0; j < atkRangeList.length; j++)
			$scope.terrainLocs[atkRangeList[j]].atkCount += val;
		for(var k = 0; k < healRangeList.length; k++)
			$scope.terrainLocs[healRangeList[k]].healCount += val;
	};
    
    $scope.isPaired = function(char){
		return locatePairedUnit($scope.charaData[char]).length > 0;
    };
    
    //Switches char info box to show the stats of the paired unit
    //Triggered when char info box "Switch to Paired Unit" button is clicked
     $scope.findPairUpChar = function(char){
    	var clickedChar = $scope.charaData[char];
    	var pairedUnit = locatePairedUnit(clickedChar);
    	
    	//Toggle visibility
    	$scope[char + "_displayBox"] = false;
    	$scope[pairedUnit + "_displayBox"] = true;

    	var currBox = document.getElementById(char + '_box');
    	var pairBox = document.getElementById(pairedUnit + '_box');
    
		pairBox.style.top = currBox.offsetTop + 'px';
		pairBox.style.left = currBox.offsetLeft + 'px';
		
		toggleCharRange(char, -1); //remove original char's data
		toggleCharRange(pairedUnit, 1); //display new char's data
    };
    
    function locatePairedUnit(char){
		if($scope.validPosition(char.position)){
			//Front unit
			for(var p in $scope.charaData)
				if($scope.charaData[p].position == char.name)
					return p;
			return "";
		}else{
			//Back unit
			for(var p in $scope.charaData)
				if($scope.charaData[p].name == char.position)
					return p;
			return "";
		}
    };
    
    //Parses an enemy's name to see if it contains a number at the end.
    //If it does, it returns that number
    $scope.getEnemyNum = function(name){
    	if(name.lastIndexOf(" ") == -1 || name == undefined)
    		return "";
    	name = name.substring(name.lastIndexOf(" "), name.length);
		name = name.trim();
		
    	if(name.match(/^[0-9]+$/) != null) return "IMG/NUM/num_" + name + ".png";
    	else return "";
    };
    
    $scope.validPosition = function(pos){
    	return pos == 'Not Deployed' || pos == 'Defeated' || pos.indexOf(",") != -1;
	};
    
    //Using a character's coordinates, calculates their horizontal
    //position on the map
    $scope.determineCharX = function(index, pos){
		if(index == 0) numDefeat = 0; 
		if(pos == "Defeated" || pos == "Not Deployed")
			return (((numDefeat % 30) * 16) + 16) + "px";

    	pos = pos.substring(0,pos.indexOf(","));
    	pos = parseInt(pos);
    	return (((pos-1) * (boxWidth + gridWidth)) + gridWidth) + "px";
    };
    
	//Using a character's coordinates, calculates their vertical
	//position on the map
	$scope.determineCharY = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed"){
			numDefeat +=1;
			return ((Math.floor((numDefeat-1)/30) * (gridWidth + boxWidth)) + ($scope.rows.length * (gridWidth + boxWidth)) + 16) +"px";
		}

		pos = pos.substring(pos.indexOf(",")+1).trim();
    	pos = parseInt(pos);
    	return ((pos-1) * (boxWidth + gridWidth)) + "px";
	};
	
	$scope.determineCharZ = function(pos){
		if(pos == "Defeated" || pos == "Not Deployed") return "0";

		pos = pos.substring(pos.indexOf(",")+1).trim(); //grab first number
		return pos;

	};

	$scope.getHPPercent = function(currHp, maxHp){
		return Math.min((currHp/maxHp)*14, 14) + "px";
	};

	$scope.determineHPBackgroundColor = function(currHp, maxHp){
		currHp = parseInt(currHp) || 0;
		maxHp = parseInt(maxHp) || 1;

		if(currHp > maxHp) return "#c430ff";
		else if((currHp/maxHp) > 0.5) return "#00e003";
		else if((currHp/maxHp) > 0.25) return "#ffe100";
		else return "red";
	};

    //***********************\\
    // POSITION CALCULATIONS \\
    //***********************\\
    
    //Relocate the information box relative to the clicked char
    function positionCharBox(char){
    	var sprite = document.getElementById(char);
    	var box = document.getElementById(char + '_box');
    	
		//var x = sprite.style.left;
		//x = parseInt(x.replace("px", ""));
		var x = ($scope.columns.length + 1) * (boxWidth + gridWidth);

    	var y = sprite.style.top;
		y = parseInt(y.replace("px", ""));

		if(y <= 20) y = 20;
    	
    	box.style.left = x + 'px';
    	box.style.top = y + 'px';
    };
    
	$scope.fetchWeaponVerticalPos = function(index){ return weaponVerticalPos[index]; };
    $scope.fetchWpnRankHorzPos = function(index){ return weaponRankHorzPos[index]; };
    $scope.fetchWpnDescVerticalPos = function(index){ return weaponDescVerticalPos[index]; };
    $scope.fetchSklVerticalPos = function(index){ return skillVerticalPos[index]; };
	$scope.fetchSklDescVerticalPos = function(index){ return skillDescVerticalPos[index]; };

	$scope.textTooLong = function(textA, textB){
		return (textA.length + textB.length) > 180;
	};

	$scope.setItemDescHeight = function(type){
		if(type != "Item" && type != "Consumable" && type != "Mystery") return "70px";
    	else return "108px";
	};
 
    //***********************\\
    // FUNCTIONS FOR STAT    \\
    // PROCESSING/FORMATTING \\
	//***********************\\
	
    //Returns true if the value in the passed attribute is >= 0
    $scope.checkRate = function(stat){ return parseInt(stat) >= 0; };
    
    $scope.validSkill = function(skill){
    	return skill != "" && skill != "None";
    };

	$scope.getPairName = function(pos){
		if(pos.indexOf("(") == -1) return "None";
		else return pos.substring(pos.indexOf("(")+1, pos.indexOf(")"));
    };
    
	$scope.getStatColor = function(index, stat){
		var char = $scope.charaData[index];
		var base = parseInt(char[stat]) || 0;
		var enhnc = parseInt(char["True"+stat]);

		if(enhnc > base) return STAT_BUFF_COLOR;
		else if(enhnc < base) return STAT_DEBUFF_COLOR;
		else return STAT_DEFAULT_COLOR;
	};

	$scope.fetchWeaknessIcon = function(weak){
		return `IMG/WEAK/${weak}.png`;
	};

    //*************************\\
    // FUNCTIONS FOR INVENTORY \\
    // & WEAPONS PROFICIENCY   \\
    //*************************\\
    
    //Checks to see if the weapon name in the passed slot is null
    //Version for characters
    $scope.validWeapon = function(weaponName){
    	if(weaponName != "-" && weaponName != "- (-)" && weaponName != "") return true;
    	else return false;
    };
    
    //Returns the icon for the class of the weapon at the index
    //Version for characters
    $scope.getWeaponClassIcon = function(type, override){
		if(override.length > 0) return override;
    	type = type.toLowerCase();
    	return "IMG/TYPE/type_" + type + ".png";
    };
 
    $scope.existsWeapon = function(weaponName){
    	return weaponName != "" && weaponName != "None";
    };
    
    //Returns the weapon rank icon relevant to the passed weapon type
    $scope.weaponIcon = function(wpnCls){ 
    	wpnCls = wpnCls.toLowerCase();
    	return `IMG/RANK/${wpnCls}.png`;
    };
    
    //Calculates the percentage of weapon proficicency for a specific weapon,
    //then returns the width of the progress bar in pixels
    $scope.calcWeaponExp = function(exp){
		exp = parseInt(exp);
		
		var toNextLvl;
		if(exp < 10) toNextLvl = 10;
		else if(exp < 30){ toNextLvl = 20; exp -= 10; } 
		else if(exp < 70){ toNextLvl = 40; exp -= 30; }
		else if(exp < 150){ toNextLvl = 80; exp -= 70; }
		else if(exp < 300){ toNextLvl = 150; exp -= 150; }
		else{ toNextLvl = 1; exp = 1; } //max at S rank

		return (exp/toNextLvl) * 32;
	};
    
    //Checks if there is a value in the index
    $scope.validDebuff = function(value){
    	return value != "" && value != "0" && value != "-";
    };
    
    $scope.formatWeaponName = function(name){
    	return name.replace("(D)", "");
    };
    
    $scope.hasWeaponRank = function(rank){
    	return rank != "" && rank != "-";
    };
    
    $scope.notItem = function(type){
    	return type != "Consumable" && type != "Item" && type != "Mystery";
    };
    
    $scope.setDescriptionLoc = function(type){
    	if(type != "Consumable" && type != "Item" && type != "Mystery") return "60px";
    	else return "25px";
    };

	$scope.determineNametagColor = function(aff){
		switch(aff){
			case "Alistair's Army" : return NAMETAG_BLUE;
			case "Crown Army" : return NAMETAG_RED;
			case "Villagers" : return NAMETAG_GREEN2;
			case "Allies" : return NAMETAG_GREEN;
			case "Other" : return NAMETAG_PERIWINKLE;
			default: return "#000000";
		}
	};

	$scope.getItemDamageIcon = function(type){
		if(type.length == 0) return "";
		else return `IMG/${type}.png`;
	};
    
    //***************************\\
    // MOUSEOVER/MOUSEOUT EVENTS \\
    //***************************\\
	
	$scope.boxHoverIn = function(char){ $scope[char+"_boxhover"] = true; };
	$scope.boxHoverOut = function(char){ $scope[char+"_boxhover"] = false; };
	$scope.boxHoverOn = function(char){ 
		if($scope[char+"_boxhover"] == true) return ($scope.rows.length + 2) + "";
		else return ($scope.rows.length + 1) + "";
	};

	$scope.nameHoverIn = function(char){ $scope[char + "name"] = true; };
	$scope.nameHoverOut = function(char){ $scope[char + "name"] = false; };
	$scope.nameHoverOn = function(char){ return $scope[char + "name"] == true; };
	
    $scope.weaponHoverIn = function(char, index){ $scope[char + "wpn_" + index] = true; };
    $scope.weaponHoverOut = function(char, index){ $scope[char + "wpn_" + index] = false; };
    $scope.weaponHoverOn = function(char, index){ return $scope[char + "wpn_" + index] == true; };
    
    $scope.skillHoverIn = function(char, index){ $scope[char + "skl_" + index] = true; };
    $scope.skillHoverOut = function(char, index){ $scope[char + "skl_" + index] = false; };
    $scope.skillHoverOn = function(char, index){ return $scope[char + "skl_" + index] == true; };
    
    $scope.statHoverIn = function(char, stat){ $scope[char + "hov_" + stat] = true; };
    $scope.statHoverOut = function(char, stat){ $scope[char + "hov_" + stat] = false; };
    $scope.statHoverOn = function(char, stat){ return $scope[char + "hov_" + stat] == true; };
    
	$scope.statusHoverIn = function(char){ $scope[char + "status"] = true; };
	$scope.statusHoverOut = function(char){ $scope[char + "status"] = false; };
	$scope.statusHoverOn = function(char){ return $scope[char + "status"] == true; };

	$scope.terrainHoverIn = function(char){ $scope[char + "tile"] = true; };
	$scope.terrainHoverOut = function(char){ $scope[char + "tile"] = false; };
	$scope.terrainHoverOn = function(char){ return $scope[char + "tile"] == true; };

	$scope.motifHoverIn = function(char){ $scope[char + "motif"] = true; };
	$scope.motifHoverOut = function(char){ $scope[char + "motif"] = false; };
	$scope.motifHoverOn = function(char){ return $scope[char + "motif"] == true; };
    
    //*************************\\
    // SUPPORT FOR DRAGABILITY \\
    // OF CHAR INFO BOX        \\
    //*************************\\
    var currDrag = "";
    
    function dragStart(event){
    	var style = window.getComputedStyle(event.target, null);
    	currDrag = event.target.id;
        event.dataTransfer.setData("text",(parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' + (parseInt(style.getPropertyValue("top"),10) - event.clientY));
    };
    
    function dragOver(event){
    	event.preventDefault();
    	return false;
    };
    
    function dragEnter(event){
    	event.preventDefault();
    };
    
    function dropDiv(event){
    	event.preventDefault();
    	var data = event.dataTransfer.getData("text").split(',');

    	var drag = document.getElementById(currDrag);
    	drag.style.left = (event.clientX + parseInt(data[0],10)) + 'px';
    	drag.style.top = (event.clientY + parseInt(data[1],10)) + 'px';
    	currDrag = "";
    };
    
    function initializeListeners(){;
    	var test = document.getElementById('char_0_box');
    	if($scope.charaData != undefined && test != null){

    		var i = 0;
    		//Set event listeners to be activated when the div is dragged
    	    for(var char in $scope.charaData){
    	    	var box = document.getElementById(char + '_box');
    	    	box.addEventListener('dragstart',dragStart,false);
    	    	i++;
    	    }
    	    
    	    //Set event listeners
    	    var drop = document.getElementById('dropArea');
    	    drop.addEventListener('dragenter',dragEnter,false);
    	    drop.addEventListener('dragover',dragOver,false);
    	    drop.addEventListener('drop',dropDiv,false);
    	    
    	    $interval.cancel(dragNDrop); //cancel $interval timer
    	}
    };
}]);