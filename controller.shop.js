app.controller('ShopCtrl', ['$scope', 'ShopDataService', function($scope, ShopDataService) {
    $scope.items = [];
    var loadingListener;

    //Fetch shop data
    $scope.fetchShop = function() {
        if ($scope.refreshing == true) return;

        $scope.refreshing = true;
        loadingListener = $scope.$on('shop-load-finished', function(event) {
            loadingListener();
            $scope.refreshing = false;
            $scope.items = ShopDataService.getItems();
            $scope.$apply(); //force update of items list
        });

        ShopDataService.loadShopData();
    };

    //Initialize items list, load it if it hasn't been already
    if (ShopDataService.getItems() == null) $scope.fetchShop();
    else $scope.items = ShopDataService.getItems();

    //Color Constants
    const ROW_COLORS = {
        'Sword': '#ff8282',
        'Lance': '#8290ff',
        'Axe': '#5eba60',
        'Bow': '#fccc7e',
        'Knife': '#fafc7e',
        'Tome': '#fc7eaa',
        'Stone': '#6c5372',
        'Staff': '#ceebed'
    }

    //Filter settings
    var sortOrder = 'name';
    $scope.showSword = true;
    $scope.showLance = true;
    $scope.showAxe = true;
    $scope.showBow = true;
    $scope.showKnife = true;
    $scope.showTome = true;
    $scope.showStone = true;
    $scope.showStaff = true;
    $scope.showOther = true;

    $scope.getItemSortOrder = function() {
        return sortOrder;
    };

    $scope.displayItemType = function(type) {
        if (type == "None" || type == "Trophy" || type == "Consumable" || type == "Item") return $scope.showOther;
        return $scope["show" + type] == true;
    };

    $scope.updateSortOrder = function(newOrder) {
        sortOrder = newOrder;
    };

    $scope.getRowColor = function(type) {
        var color = ROW_COLORS[type];
        if (color != undefined) return color;
        else return 'lightgray';
    };

    $scope.allChecked = function() {
        return $scope.showSword && $scope.showLance && $scope.showAxe && $scope.showBow && $scope.showKnife &&
            $scope.showTome && $scope.showStone && $scope.showStaff && $scope.showOther;
    };

    $scope.setAllCheckboxes = function() {
        var val = !($scope.allChecked());
        $scope.showSword = val;
        $scope.showLance = val;
        $scope.showAxe = val;
        $scope.showTome = val;
        $scope.showBow = val;
        $scope.showKnife = val;
        $scope.showStone = val;
        $scope.showStaff = val;
        $scope.showOther = val;
    };

    $scope.hasUses = function(type) {
        return type == "Item" || type == "Staff";
    };

    $scope.closeShop = function() {
        $scope.$parent.$parent.showShop = false;
    };
}]);
