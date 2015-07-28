'use strict';

giftuuApp.directive('addGiftDirective', function ($http, $compile) {
    var getTemplateUrl = function(giftType) {
        var templateUrl = '';
        switch(giftType) {
            default:
                templateUrl = './views/directive-templates/addGift/giveThing.html';
                break;
            case 'skill':
                templateUrl = './views/directive-templates/addGift/giveSkill.html';
                break;
            case 'help':
                templateUrl = './views/directive-templates/addGift/giveHelp.html';
                break;
        }
        return templateUrl;
    }


    var linker = function(scope, element, attrs) {
        // GET template content from path
        scope.$watch(attrs.giftType, function(nv){
            if(nv){
                var templateUrl = getTemplateUrl(nv);
                $http.get(templateUrl).success(function(data) {
                    element.html(data);

                    $compile(element.contents())(scope);
                });
            }
        })
    }

    return {
        template: '<div>{{giftType}}</div>',
        restrict: 'E',
        scope: false,
        link: linker
    };
});


giftuuApp.directive('pickupGiftDirective', function ($http, $compile) {
    var getTemplateUrl = function(mode) {
        var templateUrl = '';
        switch(mode) {
            default:
                templateUrl = './views/directive-templates/pickupGift/view.html';
                break;
            case 'edit':
                templateUrl = './views/directive-templates/pickupGift/edit.html';
                break;

        }
        return templateUrl;
    }

    var linker = function(scope, element, attrs) {
        // GET template content from path
        scope.$watch(attrs.mode, function(nv){
            if(nv){
                var templateUrl = getTemplateUrl(nv);
                $http.get(templateUrl).success(function(data) {
                    element.html(data);
                    $compile(element.contents())(scope);
                });
            }
        })
    }

    return {
        template: '<div>{{mode}}</div>',
        restrict: 'E',
        scope: false,
        link: linker
    };
});


giftuuApp.directive('notificationDirective', function ($http, $compile) {
    var getTemplateUrl = function(notificationType) {
        var templateUrl = '';
        switch(notificationType) {
            case 'commentGift':
                templateUrl = './views/directive-templates/notification/comment.html';
                break;
            case 'askGift':
                templateUrl = './views/directive-templates/notification/ask.html';
                break;
            case 'feedback':
                templateUrl = './views/directive-templates/notification/feedback.html';
                break;
            case 'giveGift':
                templateUrl = './views/directive-templates/notification/give.html';
                break;
        }
        return templateUrl;
    }

    var linker = function(scope, element, attrs) {
        // GET template content from path
        scope.$watch(attrs.notificationType, function(nv){
            if(nv){
                var templateUrl = getTemplateUrl(nv);
                $http.get(templateUrl).success(function(data) {
                    element.html(data);
                    $compile(element.contents())(scope);
                });
            }
        })
    }

    return {
        template: '<div>{{notificationType}}</div>',
        restrict: 'E',
        scope: false,
        link: linker
    };
})
