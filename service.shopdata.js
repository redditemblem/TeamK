app.service('ShopDataService', ['$rootScope', function($rootScope) {
    const sheetId = '1Y5-oXfdmcHlXrUeQRAF1vL8nyPwy3QzopY1rVaTPvbU';
    var inventory;

    this.getItems = function() {
        return inventory;
    };

    this.loadShopData = function() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Shop!B2:Y',
        }).then(function(response) {
            var items = response.result.values;
            inventory = [];

            for (var i = 0; i < items.length; i++) {
                var c = items[i];
                if (c.length == 0 || c[0].length == 0) continue;

                inventory.push({
                    'name': c[0],
                    'stock': parseInt(c[1]) | 0,
                    'category': c[2],
                    'rank' : c[3] != "-" ? c[3] : "",
                    'type': c[4] != "-" ? c[4] : "",
                    'might': parseInt(c[5]) | 0,
                    'hit': parseInt(c[6]) | 0,
                    'crit': parseInt(c[7]) | 0,
                    'grd': parseInt(c[8]) | 0,
                    'avo': parseInt(c[9]) | 0,
                    'range': c[13],
                    'rangeVal': parseInt(c[13].substring(c[13].lastIndexOf("-")+1).trim()) | 0,
                    'effect' : c[14],
                    'desc': c[15],
                    'cost' : parseInt(c[23]) | 0
                })
            }

            $rootScope.$broadcast('shop-load-finished'); //signal end of load
        });
    };
}]);
