app.service('ShopDataService', ['$rootScope', function($rootScope) {
    const sheetId = '1Y9xK4Dr02jSW_b_7pT6Cc25_qSwS2I6eeafECd2lu7k';
    var inventory;

    this.getItems = function() {
        return inventory;
    };

    this.loadShopData = function() {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            majorDimension: "ROWS",
            range: 'Shop Things!A2:O',
        }).then(function(response) {
            var items = response.result.values;
            inventory = [];

            for (var i = 0; i < items.length; i++) {
                var c = items[i];
                if (c.length == 0 || c[0].length == 0) continue;

                inventory.push({
                    'name': c[0],
                    'stock': c[1] == "∞" ? 99 : (parseInt(c[1]) | 0),
                    'cost': parseInt(c[2]) | 0,
                    'type': c[3],
                    'rank': c[5],
                    'might': parseInt(c[6]) | 0,
                    'hit': parseInt(c[7]) | 0,
                    'crit': parseInt(c[8]) | 0,
                    'crit%': parseFloat(c[9]) | 0,
                    'critMod': parseInt(c[10]) | 0,
                    'avo': c[11],
                    'cEva': c[12],
                    'range': c[13],
                    'rangeVal': parseInt(c[13].substring(c[13].lastIndexOf("~")+1).trim()) | 0,
                    'desc': c[14] != undefined ? c[14] : ""
                })
            }

            $rootScope.$broadcast('shop-load-finished'); //signal end of load
        });
    };
}]);
