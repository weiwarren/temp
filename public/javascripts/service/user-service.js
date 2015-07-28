'use strict';
giftuuApp.service('UserService', function UserService($http, $timeout, $rootScope, $location, $q, localStorageService) {
    return {
        messages: {},
        notifications: {},
        checkUser: function () {
            var defer = $q.defer();
            $http.get('/account?t=' + (new Date()).getTime())
                .success(function (response, status) {
                    defer.resolve(response);
                }).error(function () {
                    defer.resolve(null);
                });
            return defer.promise;
        },
        ensureLoggedIn: function () {
            var defer = $q.defer();
            $http.get('/account?t=' + (new Date()).getTime())
                .success(function (response, status) {
                    defer.resolve(response);
                }).error(function () {
                    $location.url('/login?redirectUrl=' + $location.path());
                });
            return defer.promise;
        },
        ensureRegisted: function () {
            var defer = $q.defer();
            $http.get('/account?t=' + (new Date()).getTime())
                .success(function (response) {
                    if (response && response.location && response.email)
                        defer.resolve(response);
                    else {
                        $location.path('/registration/step2');
                    }
                }).error(function () {
                    $location.path('/login');
                });
            return defer.promise;

        },
        getLoginStatus: function () {
            var defer = $q.defer();
            $http.get('/account?t=' + (new Date()).getTime()).success(function (response, status) {
                if (status == 200 && response) {
                    defer.resolve(response);
                }
                else {
                    defer.reject(null);
                }
            });
            return defer.promise;
        },
        getUserById: function (uid) {
            var defer = $q.defer();
            $http.get('/profile/' + uid, { cache: true}).success(function (response, status) {
                if (status == 200 && response) {
                    defer.resolve(response);
                }
                else {
                    defer.reject(null);
                }
            });
            return defer.promise;
        },
        getAvailGifts: function (userId) {
            return $http.get('/gifts/avail/by/user/' + userId).then(function (results) {
                return results.data;
            })
        },
        getGivenGiftsBy: function (userId) {
            var defer = $q.defer();
            $http.get('/gifts/given/by/user/' + userId).then(function (results) {
                defer.resolve(results.data);
            })
            return defer.promise;
        },
        getExpiredGifts: function (userId) {
            return $http.get('/gifts/expired/by/user/' + userId).then(function (results) {
                return results.data
            })
        },
        getRequestedGifts: function (userId) {
            return $http.get('/gifts/requested/user/' + userId).then(function (results) {
                return results.data;
            })
        },
        canAskGift: function (giftId) {
            var defer = $q.defer();
            $http.get('/canAskGift/' + giftId).then(function (results) {
                defer.resolve(results.data);
            });
            return defer.promise;
        },
        canGiveGift: function (giftId) {
            return $http.get('/canGiveGift/' + giftId).then(function (results) {
                return results.data;
            })
        },
        canReportGift: function (giftId) {
            var defer = $q.defer();
            $http.get('/canReportGift/' + giftId).success(function (result) {
                defer.resolve(result.canReport);
            });
            return defer.promise;
        },
        canReportUser: function (userId) {
            var defer = $q.defer();
            $http.get('/canReportUser/' + userId).success(function (result) {
                defer.resolve(result.canReport);
            });
            return defer.promise;
        },
        getNewMessages: function () {
            var defer = $q.defer();
            $http.get('/userNewMessages').success(function (data, status) {
                defer.resolve(data);
            })
            return defer.promise;
        },
        getAllMessages: function () {
            var defer = $q.defer();
            $http.get('/allUserMessages', {cache: true}).success(function (data, status) {
                defer.resolve(data);
            });
            return defer.promise;
        },
        getNewNotifications: function () {
            var defer = $q.defer();
            $http.get('/userNewNotifications').success(function (data, status) {
                defer.resolve(data);
            })
            return defer.promise;
        },
        getAllNotifications: function () {
            var defer = $q.defer();
            $http.get('/allUserNotifications', {cache: true}).success(function (data, status) {
                defer.resolve(data);
            })
            return defer.promise;
        },
        addComment: function (userId, comment) {
            var defer = $q.defer();
            $http.post('/commentProfile/' + userId, comment).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise;
        },
        getComments: function (userId, limit, skip) {
            var defer = $q.defer();
            $http.get('/profileComments/' + userId + '/' + limit + '/' + skip).
                success(function (data, status, headers, config) {
                    defer.resolve(data);

                });
            return defer.promise
        },
        getTotalComments: function (id) {
            var defer = $q.defer();
            $http.get('/count/reviews/' + id).success(function (response, status, headers, config) {
                if (status == 200) {
                    defer.resolve(response.count);
                }
            })
            return defer.promise;
        },
        readAllNotifications: function () {
            return $http.put('/notifications/readAll').success(function (response) {
                return response;
            })
        },
        readAllMessages: function () {
            return $http.put('/messages/readAll').success(function (response) {
                return response;
            })
        },
        updateProfile: function (profileDetail) {
            return $http.put('/profile', profileDetail).success(function (response) {
                return response;
            })
        },
        deleteProfile: function () {
            return $http.delete('/profile').success(function (response) {
                localStorageService.add('deletedProfile', 'true');
                return response;
            });
        },
        canRate: function (giftId) {
            var defer = $q.defer();
            $http.get('/canRate/' + giftId).success(function (response, status, headers, config) {
                if (status == 200) {
                    defer.resolve(response.canRate);
                }
            })
            return defer.promise;
        },
        reportUser: function (userId, reason) {
            var defer = $q.defer();
            $http.post('/reportProfile/' + userId, {reason: reason}).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise
        }
    };
});
