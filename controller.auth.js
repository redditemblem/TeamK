app.controller('AuthCtrl', ['$scope', '$location', '$interval', 'DataService', function($scope, $location, $interval, DataService) {
    var id = fetch();
    var sheetId = '';
    $scope.ready = false;
    var checkGapi = $interval(checkAuth, 250);
    $scope.loadingIcon = pickLoadingIcon();
    var bar = document.getElementById('progress');

    //Hide dialogs at start
    $scope.showShop = false;
    $scope.showConvoy = false;

    //Set div visibility
    var authorizeDiv = document.getElementById('authorize-div');
    var unavailableDiv = document.getElementById('unavailable-div');
    var loadingDiv = document.getElementById('loading-div');
    var bar = document.getElementById('progress');
    unavailableDiv.style.display = 'none';
    loadingDiv.style.display = 'none';
    bar.style.value = '0px';

    function displayShopDialog() {
        $scope.showShop = true;
        $scope.$apply();
    };

    function displayConvoyDialog() {
        $scope.showConvoy = true;
        $scope.$apply();
    };

    //Continue to check gapi until it's loaded
    function checkAuth() {
        if (gapi.client != undefined) {
            $scope.ready = true;
            $interval.cancel(checkGapi);
        }
    }

    //Initiate auth flow in response to user clicking authorize button.
    $scope.loadAPI = function(event, type) {
        gapi.client.init({
            'apiKey': id,
            'discoveryDocs': ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        }).then(function() {
            if (type == 3) displayConvoyDialog();
            else if (type == 4) displayShopDialog();
            else {
                sheetId = DataService.FetchSheetID(type);
                DataService.SetSheetID(type);
                testWebAppAvailability();
            }
        });
    };

    function testWebAppAvailability() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "COLUMNS",
            range: 'Map Data!A1:A1',
        }).then(function(response) {
            var toggle = response.result.values[0][0];
            if (toggle == "Off") {
                authorizeDiv.style.display = 'none';
                unavailableDiv.style.display = 'inline';
            } else {
                authorizeDiv.style.display = 'none';
                loadingDiv.style.display = 'inline';
                DataService.loadMapData();
            }
        });
    };

    function pickLoadingIcon() {
        var rand = Math.floor((Math.random() * 13) + 1); //generate a number between 1 and 14
        switch (rand) {
            case 1:  return "IMG/LOAD/Alistair.gif"; break;
            case 2:  return "IMG/LOAD/Amby.gif"; break;
            case 3:  return "IMG/LOAD/Basil.gif"; break;
            case 4:  return "IMG/LOAD/Evelynne.gif"; break;
            case 5:  return "IMG/LOAD/Golem.gif"; break;
            case 6:  return "IMG/LOAD/Jack.gif"; break;
            case 7:  return "IMG/LOAD/Lelle.png"; break;
            case 8:  return "IMG/LOAD/Lily.gif"; break;
            case 9:  return "IMG/LOAD/Lucibelle.gif"; break;
            case 10: return "IMG/LOAD/Lucretia.png"; break;
            case 11: return "IMG/LOAD/Ril.png"; break;
            case 12: return "IMG/LOAD/Stranger.gif"; break;
            case 13: return "IMG/LOAD/Virgil.png"; break;
        }
    };

    function fetch() {
        var request = new XMLHttpRequest();
        request.open('GET', 'LIB/text.txt', false);
        request.send();
        if (request.status == 200)
            return request.responseText;
    };

    //Redirect user to the map page once data has been loaded
    function redirect() {
        $location.path('/map').replace();
        $scope.$apply();
    };

    var img = document.getElementById("mapImg");
    img.onload = function() {
        DataService.calculateRanges();
    };

    $scope.$on('loading-bar-updated', function(event, data, map) {
        bar.value = data;

        if (map != undefined && img.src == "") img.src = map;
        if (data >= 100) redirect();
    });
}]);
