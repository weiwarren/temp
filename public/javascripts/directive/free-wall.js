giftuuApp.directive('freeWall', function ($timeout, $window) {
    return{
        restrict: 'A',
        link: function (scope, ele, attrs) {
            var gap = parseFloat(attrs.gap) || 0,
                factor = parseInt(attrs.factor) || 240;
            scope.gap = gap;

            scope.cols = [];

            scope.getImageHeight = function (image) {
                var height = parseInt(scope.wallWidth / 1280 * 800);
                if (image) {
                    height = parseInt(scope.wallWidth / image.width * image.height)
                }
                return height + 'px';
            }

            scope.getClientWidth = function () {
                return angular.element(ele)[0].clientWidth;
            }

            scope.updateWall = function () {
                scope.bound = angular.element(ele)[0].clientWidth - 2 * gap;
                scope.cols = parseInt(scope.bound / factor);
                if (scope.cols < 2) {
                    scope.cols = 2;
                }
                scope.walls = new Array(scope.cols);
                scope.wallWidth = parseInt(scope.bound / scope.cols);
            }

            scope.$watch(scope.getClientWidth, function (nv, ov) {
                if (nv){
                    scope.updateWall();
                }
            }, true);

            scope.$watch(attrs.freeWall, function (nv,ov) {
                if (nv && nv.length) {
                    scope.updateWall();
                }
            },true);


        }
    }
})

