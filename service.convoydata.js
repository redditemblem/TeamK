app.service('ConvoyDataService', ['$rootScope', function($rootScope) {
    const sheetId = '1Y9xK4Dr02jSW_b_7pT6Cc25_qSwS2I6eeafECd2lu7k';
    var inventory;

    this.getItems = function() {
        return inventory;
    };

    this.loadConvoyData = function() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Convoy!A2:M',
        }).then(function(response) {
            var items = response.result.values;
            inventory = [];

            for (var i = 0; i < items.length; i++) {
                var c = items[i];
                if (c.length == 0 || c[0].length == 0) continue;

                inventory.push({
                    'name': c[0],
                    'type': c[1],
                    'rank': c[3],
                    'might': parseInt(c[4]) | 0,
                    'hit': parseInt(c[5]) | 0,
                    'crit': parseInt(c[6]) | 0,
                    'crit%': parseInt(c[7]) | 0,
                    'critMod': parseInt(c[8]) | 0,
                    'avo': c[9],
                    'cEva': c[10],
                    'range': c[11],
                    'rangeVal': parseInt(c[11].substring(c[11].lastIndexOf("~")+1).trim()) | 0,
                    'desc': c[12] != undefined ? c[12] : ""
                })
            }

            $rootScope.$broadcast('convoy-load-finished'); //signal end of load
        });
    };
}]);
