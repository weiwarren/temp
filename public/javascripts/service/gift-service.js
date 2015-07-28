'use strict';
giftuuApp.service('GiftService', function GiftService($http, $timeout, $location, $q, localStorageService) {
    return {

        getGiftsByRadius: function (queryText, giftType, radius, limit, skip) {
            var defer = $q.defer(),
                query = 'skip=' + (skip || 0);
            if (giftType) {
                query += '&giftType=' + giftType.toLowerCase();
            }
            if (radius) {
                query += '&radius=' + radius;
            }
            if (limit) {
                query += '&limit=' + limit;
            }
            if (queryText) {
                query += '&query=' + queryText;
            }
            $http.get('/findByRadius?' + query).success(function (response, status, headers, config) {
                defer.resolve(response);
            }).error(function (reason) {
                    defer.reject(reason)
                });
            return defer.promise;
        },
        getAllGifts: function (limit, skip, queryText, giftType) {
            var defer = $q.defer();
            var query = [], queryString = '';
            if (giftType) {
                query.push('giftType=' + giftType.toLowerCase());
            }
            if (queryText) {
                query.push('query=' + queryText);
            }

            if (query.length) {
                queryString = '?' + query.join('&')
            }
            $http.get('/findAllGifts/' + limit + '/' + skip + queryString).success(function (response, status, headers, config) {
                defer.resolve(response);
            }).error(function (reason) {
                    defer.reject(reason)
                });
            return defer.promise;
        },
        getGiftById: function (id) {
            var defer = $q.defer();
            $http.get('/gifts/' + id).success(function (response, status, headers, config) {
                if (response.status == 'available' && moment().diff(moment(response.activityDate), 'days') > 365) {
                    response.status = 'expired';
                }
                defer.resolve(response);
            })
            return defer.promise;
        },
        removeImage: function (id, file) {
            var defer = $q.defer();
            $http.post('/delete/giftImage', {giftId: id, image: file}).success(function (response, status, headers, config) {
                defer.resolve(response);
            })
            return defer.promise;
        },
        getTotalWishers: function (id) {
            var defer = $q.defer();
            $http.get('/count/wishers/' + id).success(function (response, status, headers, config) {
                if (status == 200) {
                    defer.resolve(response.count);
                }
            })
            return defer.promise;
        },
        getTotalComments: function (id) {
            var defer = $q.defer();
            $http.get('/count/comments/' + id).success(function (response, status, headers, config) {
                if (status == 200) {
                    defer.resolve(response.count);
                }
            })
            return defer.promise;
        },
        addComment: function (giftId, comment) {
            var defer = $q.defer();
            $http.post('/commentGift/' + giftId, {comment: comment}).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise;
        },
        getComments: function (giftId, limit, skip) {
            var defer = $q.defer();
            $http.get('/giftComments/' + giftId + '/' + limit + '/' + skip).
                success(function (data, status, headers, config) {
                    defer.resolve(data);

                });
            return defer.promise
        },
        getWishers: function (giftId, limit, skip) {
            var defer = $q.defer();
            $http.get('/wishers/' + giftId + '/' + limit + '/' + skip).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise;
        },
        requestGift: function (giftId, request) {
            return $http.post('/wishers', {giftId: giftId, request: request})
                .success(function (data, status, headers, config) {
                    return status == 200
                })
                .error(function (data, status, headers, config) {
                    return false;
                });
        },
        getActivities: function (giftId, limit, skip) {
            var defer = $q.defer();
            $http.get('/giftActivities/' + giftId + '/' + limit + '/' + skip).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise;
        },
        updateGift: function (giftId, giftDetail) {
            var defer = $q.defer();
            $http.put('/gifts/' + giftId, giftDetail).success(function (response) {
                defer.resolve(response);
            })
            return defer.promise;
        },
        deleteGift: function (giftId) {
            var defer = $q.defer();
            $http.delete("/gifts/" + giftId).success(function (data) {
                defer.resolve(data);
            });
            return defer.promise;
        },
        deleteProfileVar: function () {
            localStorageService.add('deletedProfile', true);
        },
        isDeletedProfile: function () {
            return localStorageService.get('deletedProfile');
        },
        reportGift: function (giftId, reason) {
            var defer = $q.defer();
            $http.post('/reportGift/' + giftId, {reason: reason}).
                success(function (data, status, headers, config) {
                    defer.resolve(data);
                });
            return defer.promise
        }
    };
});
