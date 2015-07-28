giftuuApp.config(function ($locationProvider, $routeProvider) {
    $locationProvider.html5Mode(false);
    $routeProvider
        .when('/', {
            templateUrl: '/views/gift/all.html',
            controller: 'allGifts',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Gifts around you"
                },
                user: function(UserService){
                    return UserService.checkUser();
                }
            }
        })
        .when('/search/:term?/:searchType?', {
            templateUrl: '/views/gift/all.html',
            controller: 'allGifts',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Gifts around you"
                },
                user: function(UserService){
                    return UserService.checkUser();
                }
            }
        })
        .when('/login', {
            templateUrl: 'logIn.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Login"
                }
            }
        })
        .when('/viewGift/:giftId', {
            templateUrl: 'views/gift/detail.html',
            controller: 'viewGift',
            resolve: {
                user: function(UserService){
                    return UserService.checkUser();
                },
                giftId: function($routeParams){
                    return null;
                }
            }
        })
        .when('/addGift', {
            templateUrl: '/views/gift/add.html',
            controller: 'addGift',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureRegisted();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "Add a gift"

                }
            }
        })
        .when('/pickupGift/:giftId', {
            templateUrl: '/views/gift/pickup.html',
            controller: 'pickupGift',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureRegisted();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "Gift exchange"
                }
            }
        })
        .when('/notifications', {
            templateUrl: '/views/profile/myNotifications.html',
            controller: 'notification',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureRegisted();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "My notifications"

                }
            }
        })
        .when('/messages', {
            templateUrl: 'views/profile/myMessages.html',
            controller: 'message',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureRegisted();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "My messages"
                }
            }
        })
        .when('/registration/step1', {
            templateUrl: 'views/registration/step1.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Registration"
                }
            }
        })
        .when('/registration/step2', {
            templateUrl: 'views/registration/step2.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Registration"
                },
                user: function (UserService) {
                    return UserService.ensureLoggedIn();
                }
            }
        })
        .when('/myprofile', {
            templateUrl: 'views/profile/view.html',
            controller: 'user',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureLoggedIn();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "My profile"
                }
            }
        })
        .when('/profile/:id', {
            templateUrl: 'views/profile/view.html',
            controller: 'user',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureLoggedIn();
                }
            }
        })
        .when('/mysettings', {
            templateUrl: 'views/subscription/settings.html'
        })
        .when('/whocanseemystuff', {
            templateUrl: 'views/organisation/WhoCanSeeMyStuff.html'
        })
        .when('/help', {
            templateUrl: 'views/organisation/Help.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Help"
                }
            }
        })
        .when('/aboutkindo', {
            templateUrl: 'views/organisation/AboutUs.html',
            controller: 'aboutUs',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "About kindo"
                }
            }
        })
        .when('/communityguidelines', {
            templateUrl: 'views/organisation/CommunityGuidelines.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Community guidelines"
                }
            }
        })
        .when('/privacy', {
            templateUrl: 'views/organisation/Privacy.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Privacy policy"
                }
            }
        })
        .when('/termsandconditions', {
            templateUrl: 'views/organisation/TermsAndConditions.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Terms and conditions"
                }
            }
        })
        .when('/shareKindo', {
            templateUrl: 'views/organisation/ShareGiftuu.html',
            resolve: {
                title: function ($rootScope) {
                    $rootScope.page.title = "Share kindo"
                }
            }
        })
        .when('/giftuu_elsewhere', {
            templateUrl: 'views/GiftuuElsewhere/Help.html'
        })
        .when('/myGifts', {
            templateUrl: 'views/gift/mygifts.html',
            controller: 'user',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureLoggedIn();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "My gifts"
                }
            }
        })
        .when('/confirmGift/:giftId', {
            templateUrl: 'views/gift/confirm.html',
            controller: 'confirmGift',
            resolve: {
                user: function (UserService) {
                    return UserService.ensureLoggedIn();
                },
                title: function ($rootScope) {
                    $rootScope.page.title = "Confirm gift"
                }
            }
        })
        .when('/ui_elements', {
            templateUrl: 'views/typography/uiElements.html'
        })

        .when('/columns', {
            templateUrl: 'views/typography/columns.html'
        })
        .otherwise({
            redirectTo: '/'
        });

});