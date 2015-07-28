/**
 * Created by weiwarren on 24/02/2014.
 */
giftuuApp.directive('owlSlider', function ($timeout, $window) {
    return{
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.init = false;
            scope.$watch(attrs.owlSlider, function (newValue) {
                if (newValue) {
                    var options = {//autoPlay : 3000,
                        stopOnHover: true,
                        paginationSpeed: 1000,
                        goToFirstSpeed: 2000,
                        singleItem: true,
                        autoHeight: true,
                        transitionStyle: "fade",
                        afterInit: function (elem) {
                            scope.init = true;
                        }};
                    if (scope.init) {
                        $(ele[0]).data('owlCarousel').destroy();
                    }
                    $timeout(function(){
                        $(ele[0]).owlCarousel(options);
                    })

                }

            })
        }
    }
});