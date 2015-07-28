var userCtrl = giftuuApp.controller('user',
    function ($scope, $routeParams, $timeout, $http, $q, $location, $filter,user, UserService, GiftService, $rootScope) {
        $scope.limitComments = 5;
        $scope.skipComments = 0;
        $scope.showHide = [];
        $scope.animation = [];
        $scope.pending = 0;
        $scope.review = '';
        $scope.user = user;
        $scope.req = {availGifts: [], givenGifts: [], ratedGifts: [], expiredGifts: []};

        $scope.viewPrevious = function (array) {
            if (!array.limit) {
                array.limit = 10;
            }
            else {
                array.limit += 5;
            }
        }

        $scope.getUserGifts = function (userId) {
            UserService.getAvailGifts(userId).then(function (results) {
                $scope.availGifts = results;
            })

            UserService.getRequestedGifts(userId).then(function (results) {
                $scope.requestedGifts = results;
                for (var i = 0; i < results.length; i++) {
                    var item = results[i];
                    var days = moment().diff(moment(item.activityDate), 'days');
                    switch (item.status) {
                        case 'available':
                            if (days <= 14) {
                                $scope.req.availGifts.push(item);
                            }
                            else {
                                $scope.req.expiredGifts.push(item);
                            }
                            break;
                        case 'given':
                            if (item.rated) {
                                $scope.req.ratedGifts.push(item);
                            }
                            else {
                                $scope.req.givenGifts.push(item);
                            }
                            break;
                    }
                }

            })

            UserService.getGivenGiftsBy(userId).then(function (results) {
                $scope.givenGiftsBy = results;
                $scope.gaveGifts = $filter('filter')($scope.givenGiftsBy,{rated:false});
                $scope.ratedGifts =  $filter('filter')($scope.givenGiftsBy,{rated:true});
            })

            UserService.getExpiredGifts(userId).then(function (results) {
                $scope.expiredGifts = results;
            })
        }

        if ($routeParams.id) {
            $scope.userId = $routeParams.id;
            $scope.getUserGifts($scope.userId);
            UserService.getUserById($scope.userId).then(function (user) {
                $scope.userProfile = user;
                $rootScope.page.title = $scope.userProfile.displayName;
            }, function () {
                $scope.profileDeleted = true;
            });
        }
        else {
            $scope.userId = user._id;
            $scope.userProfile = $scope.user;
            $scope.userProfile.location = $scope.user.location;
            $scope.userProfile.locationShort = $scope.user.locationShort;
            $scope.getUserGifts( $scope.userId);
        }

        $scope.$watch('userProfile', function (nv) {
            if (nv) {
                if (nv.location) {
                    nv.locationShort = $filter('addressShort')(nv.location);
                }
            }
        });

        $scope.$watch('userProfile.locationShort', function (nv) {
            if (nv && nv.geometry) {
                $scope.userProfile.location = nv;
            }
        })

        $scope.updateProfile = function (invalid, buttonNo) {
            $scope.invalidProfileUpdate=true;
            if(!invalid)
            {
                $scope.updating = true;
                $scope.buttonNo = buttonNo;
                UserService.updateProfile({
                address: angular.toJson($scope.userProfile.location),
                wishes: $scope.userProfile.wishes,
                aboutMe: $scope.userProfile.aboutMe
                }).then(function () {
                    $scope.editProfileDesc = false;
                    $scope.invalidProfileUpdate=false;
                    $scope.updating = false;
                }, function () {
                    $scope.editProfileFail = true;
                });
            }
        }

        $scope.addWish = function () {
            $scope.userProfile.wishes.push({value: null})
        }


        $scope.growWishes = function () {
            if(!$scope.userProfile.wishes)
            {
                $scope.userProfile.wishes = [];
            }
            $scope.userProfile.wishes.push({value: '', focused: true});
        }

        $scope.report = function () {
            UserService.reportUser($scope.userProfile._id, $scope.reportReason).then(function () {
                $scope.user.canReportUser = false;
                $scope.reported = true;
            })
        }

        $scope.multiLine = function (text) {
            if (text != null) {
                return text.toString().split("\n").join("<br/>");
            }
            else {
                return text;
            }
        }


        $scope.addReview = function (review) {
            UserService.addComment( $scope.userId, {comment: review}).then(function (result) {
                $scope.limitComments++;
                getComments();
                review = '';
                $scope.commenting = false;
            })
        }

        $scope.rate = function (giftId, giftuuId, rating, index) {
            $http.post('/giftRating', {giftId: giftId, giftuuId: giftuuId, rating: rating}).then(function (results) {
                $scope.pending--;
                $scope.showHide[index] = 'fading';
                $timeout(function () {
                    $scope.showHide[index] = 'hide';
                }, 5000);
            })
        }

        $scope.deleteProfile = function () {
            UserService.deleteProfile().then(function () {
                window.location.href = "/#/profile/deleted";
                window.location.reload();
            })
        }

        $scope.viewMoreComments = function () {
            $scope.skipComments += 3;
        }

        var getComments = function () {
            UserService.getComments($scope.userId, $scope.limitComments, 0).then(function (results) {
                $scope.comments = results;
            });

            UserService.getTotalComments($scope.userId).then(function (response) {
                $scope.totalComments = response;
            })
        }

        //user paging
        $scope.$watch('skipComments', function (nv) {
            if (nv) {
                UserService.getComments( $scope.userId, $scope.limitComments, $scope.skipComments).then(function (results) {
                    $scope.comments.push.apply($scope.comments, results);
                    $scope.limitComments = $scope.comments.length
                })
            }
        })
        $scope.$watch('userId',function(nv){
            if(nv){
                getComments();
            }
        })
    }
);


var messageCtrl = giftuuApp.controller('message',
    function ($scope, $routeParams, $timeout, $http, $q, $location,user, UserService) {
        $scope.user = user;
        UserService.getAllMessages().then(function (data) {
            $scope.user.messages = data;
            $scope.user.messages.limit = 5;
            UserService.getNewMessages().then(function (response) {
                $scope.user.newMessages = response;
                $scope.user.newMessagesCount = $scope.user.newMessages.length;
                UserService.readAllMessages().then(function () {
                    $timeout(function () {
                        $scope.user.newMessages = [];
                    }, 3000);
                });
            });
        });

        $scope.multiLine = function (text) {
            if (text != null) {
                return text.toString().split("\n").join("<br/>");
            }
            else {
                return text;
            }
        }
    }
);


var notificationCtrl = giftuuApp.controller('notification',
    function ($scope, $routeParams, $timeout, $http, $q, $location, user, UserService) {
        $scope.user = user;
        UserService.getAllNotifications().then(function (response) {
            $scope.user.notifications = response;
            $scope.user.notifications.limit = 5;
            UserService.getNewNotifications().then(function (response) {
                $scope.user.newNotifications = response;
                $scope.user.newNotificationsCount = $scope.user.newNotifications.length;
                UserService.readAllNotifications().then(function () {
                    $timeout(function () {
                        $scope.user.newNotifications = [];
                    }, 3000);
                });
            });

        });


        $scope.multiLine = function (text) {
            if (text != null) {
                return text.toString().split("\n").join("<br/>");
            }
            else {
                return text;
            }
        }


    }
);