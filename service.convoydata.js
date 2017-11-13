app.service('ConvoyDataService', ['$rootScope', function($rootScope) {
    const sheetId = '1Y5-oXfdmcHlXrUeQRAF1vL8nyPwy3QzopY1rVaTPvbU';
    var inventory;

    this.getItems = function() {
        return inventory;
    };

    this.loadConvoyData = function() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Convoy!B2:Z',
        }).then(function(response) {
            var items = response.result.values;
            inventory = [];

            for (var i = 0; i < items.length; i++) {
                var c = items[i];
                if (c.length == 0 || c[0].length == 0) continue;

                inventory.push({
                    'name': c[0],
                    'owner': c[1],
                    'uses': parseInt(c[2]) | 0,
                    'category' : c[3],
                    'rank' : c[4] != "-" ? c[4] : "",
                    'type' : c[5] != "-" ? c[5] : "",
                    'might': parseInt(c[6]) | 0,
                    'hit': parseInt(c[7]) | 0,
                    'crit': parseInt(c[8]) | 0,
                    'grd': parseInt(c[9]) | 0,
                    'avo': parseInt(c[10]) | 0,
                    'range': c[14],
                    'rangeVal': parseInt(c[14].substring(c[14].lastIndexOf("-")+1).trim()) | 0,
                    'effect': c[15],
                    'desc' : c[16],
                    'value' : parseInt(c[24]) | 0
                })
            }

            $rootScope.$broadcast('convoy-load-finished'); //signal end of load
        });
    };
}]);
