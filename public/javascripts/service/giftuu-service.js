'use strict';
giftuuApp.service("GiftuuService", function GiftuuService($http, $timeout, $location, $q, localStorageService) {
    return {
        getGiftuuReceivers: function(giftId){
            var defer = $q.defer();
            $http.get("/giftuuReceivers/" + giftId)
                .success(function (response, status, headers, config) {
                    defer.resolve({receivers: response});
                })
                .error(function (response, status, headers, config) {
                    defer.reject(response);
                });
            return defer.promise;
        },
        getGiftuuByGift: function (giftId) {
            var defer = $q.defer();
            $http.get("/giftuu/" + giftId)
                .success(function (response, status, headers, config) {
                    defer.resolve({giftuuDetail: response.giftuu[0], messages: response.messages});
                })
                .error(function (response, status, headers, config) {
                    defer.reject(response);
                });
            return defer.promise;
        },
        addComment: function(giftId, title, content){
            var defer = $q.defer();
            $http.post("/commentPickup/" + giftId, {comment: content}).
                success(function (response, status, headers, config) {
                    defer.resolve(response);
                }).
                error(function (response, status, headers, config) {
                    defer.reject(response);
                });
            return defer.promise;
        },
        sendMessage: function (giftId, title, content) {
            var defer = $q.defer();
            $http.post("/message/" + giftId, {title: title, message: content}).
                success(function (response, status, headers, config) {
                    defer.resolve(response);
                }).
                error(function (response, status, headers, config) {
                    defer.reject(response);
                });
            return defer.promise;
        },
        getTotalComments: function(giftId){
            var defer = $q.defer();
            $http.get("  /count/pickupComments/" + giftId).
                success(function (response, status, headers, config) {
                    defer.resolve(response.count);
                }).
                error(function (response, status, headers, config) {
                    defer.reject(response);
                });
            return defer.promise;
        },
        getComments: function (giftId, limit, skip) {
            var defer = $q.defer();
            return $http.get("/pickupComments/" + giftId + "/"+limit + "/"+skip).
                success(function (response, status, headers, config) {
                    defer.resolve(response);
                }).
                error(function (response, status, headers, config) {
                    defer.reject(response);
                });
        },
        give: function (wishers, giftId) {
            localStorageService.add("wishers", wishers);
            $location.path("/pickupGift/" + giftId);
        },
        wishers: function (wishers) {
            if (wishers)
                localStorageService.add("wishers", wishers);
            else
                return localStorageService.get("wishers");
        },
        giftuu: function (giftId, giftuu) {
            var defer = $q.defer();
            return $http.post("/giftuu/" + giftId, giftuu).
                success(function (response, status, headers, config) {
                    defer.resolve(response);
                }).
                error(function (response, status, headers, config) {
                    defer.reject(response);
                });
        }
    };
});
