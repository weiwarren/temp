var allGiftCtrl = giftuuApp.controller('allGifts',
    function ($scope, $rootScope, $timeout, $http, $location, $routeParams, user, GiftService) {
        $scope.radius = 100;
        /* limit / skip - batch loading limit and pagination */
        $scope.limit = 20;
        $scope.skip = 0;
        $scope.user = user;
        $scope.isDeletedProfile = function () {
            GiftService.isDeletedProfile().then(function (results) {
                $scope.isDeleted = results;
            })
        }
        if ($location.search().redirectUrl != null) {
            if ($location.search().redirectUrl.match('deleted')) {
                $scope.isDeleted = true;
            }
        }

        $scope.deleteProfileVar = function () {
            $timeout(function () {
                GiftService.deleteProfileVar().then(function () {
                });
            }, 3000);
        }

        /* loadTimes - number of service calls for every scroll, used for stacking calls */
        $scope.loadTimes = 0;

        $scope.gifts = [];

        /* new gifts loaded */
        $scope.loadedNewGifts = [];

        /* flag to disable loader */
        $scope.canLoadMore = true;

        /* search term */
        $rootScope.term = $routeParams.term || '';

        /* search type */
        $rootScope.searchType = $routeParams.searchType || '';

        /* this function controls the loading on scrolling
         when scroll, each wall item loader triggers this method, service calls are stacked until the loader disappears from the window */
        $scope.scrollLoad = function (animation) {
            if (!$scope.loading) {
                $scope.loading = true;
                $scope.loadMoreGifts(animation);
            }
        }

        $scope.loadMoreGifts = function (animation) {
            if ($scope.user) {
                GiftService.getGiftsByRadius($scope.term, $scope.searchType, $scope.radius, $scope.limit, $scope.skip).then(function (response) {
                    if (response) {
                        $scope.loadedNewGifts = response;
                        $scope.bindLoadedGifts(animation);
                    }
                }, function () {
                    $scope.canLoadMore = false
                });
            }
            else {
                GiftService.getAllGifts($scope.limit, $scope.skip, $scope.term, $scope.searchType).then(function (response) {
                    if (response) {
                        $scope.loadedNewGifts = response;
                        $scope.bindLoadedGifts(animation);
                    }
                }, function () {
                    $scope.canLoadMore = false
                });
            }
        }

        $scope.bindLoadedGifts = function (animation) {
            animation = false;
            $scope.skip = $scope.skip + $scope.limit;
            var itemCount = $scope.loadedNewGifts.length;
            if (!itemCount) {
                $scope.canLoadMore = false;
            }
            else {
                if ($scope.loadedNewGifts.length < $scope.limit) {
                    $scope.canLoadMore = false;
                }
                if (animation) {
                    for (var i = 0; i < itemCount; i++) {
                        (function (ind, loadedGift) {
                            $timeout(function () {
                                $scope.gifts.push(loadedGift);
                                if (ind == itemCount - 1) {
                                    $scope.loading = false;
                                }
                            }, (200 * ind))
                        })(i, $scope.loadedNewGifts[i]);
                    }
                }
                else {
                    $scope.gifts.push.apply($scope.gifts, $scope.loadedNewGifts);
                    $scope.loading = false;
                }
            }
        }
    }
);


var addGiftCtrl = giftuuApp.controller('addGift',
    function ($scope, $rootScope, $location,  geolocation, UserService, user, $routeParams, $timeout, $http, $q, $filter) {
        $scope.position = null;
        $scope.giftTypes = ['skill', 'thing', 'help'];
        $scope.giftType = $scope.giftTypes[0];
        $scope.imageCount = 0;
        $scope.imageSearchResults = {result: []};
        $scope.selectedSearchImages = [];
        $scope.user = user;
        $scope.switchGiftType = function (option) {
            $scope.giftType = option;
        }
        //todo:replace with current directive
        user.locationShort = $filter('addressShort')(user.location);
        $scope.$watch('user.locationShort', function (nv) {
            if (nv && nv.geometry) {
                $scope.user.location = nv;
            }
        })

    }
);

var viewGiftCtrl = giftuuApp.controller('viewGift',
    function ($scope, $rootScope, $routeParams, $location, $http, $window, $filter, $sce, $timeout, $upload, user, GiftService, GiftuuService, UserService) {
        // Define user empty data :/
        $scope.gift = {};
        $scope.myGifts = {};
        $scope.comments = [];
        $scope.totalWishers = 0;
        $scope.totalComments = 0;
        $scope.canAcceptGift = false;
        $scope.batch = 5;
        $scope.commented = 0;
        $scope.limitComments = $scope.batch;
        $scope.limitWishers = $scope.batch;
        $scope.limitActivities = $scope.batch;
        $scope.giftRated = false;
        $scope.selectedWishers = [];
        $scope.accessible = true;
        $scope.ratingStatus = 'hide';
        $rootScope.giftId = $routeParams.giftId;
        $scope.pendingStatus = false;
        $scope.giftuu = {};
        $scope.user = user;
        GiftService.getGiftById($routeParams.giftId).then(function (response) {
            $scope.gift = response;
            $rootScope.page.title = $scope.gift.title;
            $scope.isOwner = $scope.user ? ($scope.gift.userId.toString() == $scope.user._id) : false;
            $scope.giftId = $routeParams.giftId;
            $scope.loaded = true;
            getActivities();
            getWishers();
            getComments();
        })

        /*Make All text box active*/
        /*if ($routeParams.scrollTo) {
            if ($routeParams.scrollTo == "all") {
                $scope.focusAll = true;
            }
        }*/


        GiftuuService.getGiftuuByGift($routeParams.giftId).then(function (response) {
            if (response.giftuuDetail) {
                $scope.giftuu = response.giftuuDetail;
                $scope.giftuu.isPending = $scope.giftuu.exchangeDate && (moment($scope.giftuu.exchangeDate) >= new Date());
            }
        })

        GiftuuService.getGiftuuReceivers($routeParams.giftId).then(function(response){
            $scope.giftuu.wishersId = response.receivers;
        })
        UserService.canGiveGift($routeParams.giftId).then(function (response) {
            $scope.user.canGive = response.canGive;
        })

        UserService.canAskGift($routeParams.giftId).then(function (response) {
            $scope.user.canAsk = response.canAsk;
            $scope.user.asked = response.asked;
        })

        UserService.canReportGift($routeParams.giftId).then(function (response) {
            $scope.user.canReportGift = response;
        })

        UserService.canRate($routeParams.giftId).then(function (result) {
            $scope.user.canRate = result;
            $scope.ratingStatus = $scope.user.canRate ? 'show':'hide';
        })

        $scope.$watch('giftForm.editGiftMode', function (nv) {
            if (nv) {
                $scope.upload = [];
                $scope.uploadResult = [];
                $scope.dataUrls = [];
            }
        });

        $scope.onFileSelect = function ($files) {
            $scope.uploading = true;
            $scope.progress = [];
            /*if ($scope.upload && $scope.upload.length > 0) {
             for (var i = 0; i < $scope.upload.length; i++) {
             if ($scope.upload[i] != null) {
             $scope.upload[i].abort();
             }
             }
             }*/
            $scope.selectedFiles = $files;
            for (var i = 0; i < $files.length; i++) {
                var $file = $files[i];
                var globalIndex = $scope.uploadResult.length + i;
                if (window.FileReader && $file.type.indexOf('image') > -1) {
                    var fileReader = new FileReader();
                    fileReader.readAsDataURL($files[i]);
                    var loadFile = function (fileReader, index) {
                        fileReader.onload = function (e) {
                            $timeout(function () {
                                $scope.dataUrls[index] = e.target.result;
                                $scope.uploadResult[index] = {processing: true};
                            });
                        }
                    }(fileReader, globalIndex);
                }
                $scope.progress[i] = -1;
                $scope.startUploadImage(i, globalIndex);
            }
        };


        $scope.startUploadImage = function (index, globalIndex) {
            $scope.progress[index] = 0;
            $scope.errorMsg = null;
            $scope.upload[index] = $upload.upload({
                url: '/giftImages',
                method: 'POST',
                data: {
                    giftId: $routeParams.giftId
                },
                file: $scope.selectedFiles[index]
            }).then(function (response) {
                    response.data[0].selected = true;
                    $scope.uploadResult[globalIndex] = response.data[0];
                },function (response) {
                    if (response.status > 0) $scope.errorMsg = response.status + ': ' + response.data;
                },function (evt) {
                    $scope.progress[index] = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
                }).xhr(function (xhr) {
                    xhr.upload.addEventListener('abort', function () {
                        console.log('abort complete')
                    }, false);
                });
        };

        $scope.$watch('selectedFiles', function (nvs, ov) {
            if (nvs) {
                var allUploaded = true;
                for (var i = 0; i < nvs.length; i++) {
                    if (!nvs[i].uploaded) {
                        allUploaded = false;
                        break;
                    }
                }
                $scope.uploading = !allUploaded;
                console.log($scope.uploading)
            }
        }, true);

        $scope.toggleSelection = function (image) {
            if (!image.processing && image.url) {
                image.selected = !image.selected;
                if (!$scope.gift.removedImages) {
                    $scope.gift.removedImages = [];
                }
                if (!image.selected) {
                    $scope.gift.removedImages.push(image)
                }
                else {
                    var index = $scope.gift.removedImages.indexOf(image);
                    $scope.gift.removedImages.splice(index, 1);

                }
                console.log($scope.gift.removedImages);
            }
        }

        //todo: this is used to handle address input, can be refactored using the directive
        $scope.$watch('gift', function (nv) {
            if (nv) {
                if (nv.location) {
                    nv.locationShort = $filter('addressShort')(nv.location);
                }
            }
        });

        $scope.$watch('gift.locationShort', function (nv) {
            if (nv && nv.geometry) {
                $scope.gift.location = nv;
            }
        })

        if ($routeParams) {
            if ($routeParams.scrollTo) {
                if ($routeParams.scrollTo == 'all') {
                    $scope.$broadcast('newItemAdded');
                }
            }
        }

        //multi line
        $scope.multiLine = function (text) {
            if (text != null) {
                return text.toString().split("\n").join("<br/>");
            }
            else {
                return text;
            }
        }

        $scope.deleteGift = function () {
            GiftService.deleteGift($scope.giftId).then(function () {
                $scope.deleted = true;
                $window.location = "/"
            })
        }


        $scope.updateGift = function (invalid, buttonNo) {
            $scope.invalidGiftUpdate=true;
            if(!invalid)
            {
                $scope.updating = true;
                $scope.buttonNo = buttonNo;
                GiftService.updateGift($scope.giftId, $scope.gift).then(function (giftResult) {
                console.log(giftResult)
                $scope.gift = giftResult;
                    $scope.invalidGiftUpdate=false;
                    $scope.giftForm.editGiftMode = false;
                    $scope.updating = false;
                }, function () {
                    $scope.giftForm.editGiftMode = true;
                });
            }
        }

        $scope.requestGift = function (request) {
            GiftService.requestGift($scope.giftId, request).then(function () {
                getWishers();
                $scope.user.canAsk = false;
                $scope.user.asked = true;
                $scope.user.wantingGift = false;
                $scope.user.requesting = false;
                $scope.user.comment = '';
            })
        };

        $scope.getUserLocation = function () {
            $window.navigator.geolocation.getCurrentPosition(function (position) {
                $scope.userCurrentLocation = {latitude: position.coords.latitude, longitude: position.coords.longitude};
            }, function (error) {
                console.log(error);
            });
        };

        var getWishers = function () {
            GiftService.getWishers($routeParams.giftId, $scope.limitWishers, 0).then(function (results) {
                $scope.wishers = results;
                $scope.wishers.forEach(function (wisher) {
                    if ($scope.selectedWishers.indexOf(wisher.from) > -1) {
                        wisher.selected = true;
                    }
                });
            })

            GiftService.getTotalWishers($routeParams.giftId).then(function (response) {
                $scope.totalWishers = response;
            })
        }

        $scope.viewMoreWishers = function () {
            $scope.limitWishers += $scope.batch;
            getWishers();
        }

        var getComments = function () {
            GiftService.getComments($routeParams.giftId, $scope.limitComments, 0).then(function (results) {
                $scope.comments = results;
            })

            GiftService.getTotalComments($routeParams.giftId).then(function (response) {
                $scope.totalComments = response;
            })
        }

        $scope.viewMoreComments = function () {
            $scope.limitComments += $scope.batch;
            getComments();
        }

        $scope.addComment = function (comment) {
            if (comment) {
                GiftService.addComment($routeParams.giftId, comment).then(function (result) {
                    $scope.limitComments++;
                    getComments();
                    $scope.user.comment = '';
                    $scope.user.commenting = false;
                });
            }
        }

        var getActivities = function () {
            GiftService.getActivities($routeParams.giftId, $scope.limitActivities, 0).then(function (results) {
                $scope.activities = results;
                $scope.activities.forEach(function (activity) {
                    if ($scope.selectedWishers.indexOf(activity.from) > -1) {
                        activity.selected = true;
                    }
                });
            });
        }

        $scope.viewMoreActivity = function () {
            $scope.limitActivities += $scope.batch;
            getActivities();
        }

        $scope.$watchCollection('[comments,wishers]', function (nv) {
            if (nv) {
                getActivities()
            }
        });

        $scope.rate = function (giftId, giftuuId, rating) {
            $http.post('/giftRating', {giftId: giftId, giftuuId: giftuuId, rating: rating}).then(function (results) {
                $scope.ratingStatus = 'fading';
                $timeout(function () {
                    $scope.ratingStatus = 'faded';
                    $timeout(function () {
                        $scope.ratingStatus = 'hide';
                    }, 300);
                }, 4000);
            })
        }

        $scope.selectWisher = function (wisher) {
            wisher.selected = !wisher.selected;
            if (wisher.selected) {
                //todo: optimization
                $scope.wishers.forEach(function (w) {
                    if (w.from == wisher.from) {
                        w.selected = true;
                    }
                });
                $scope.activities.forEach(function (a) {
                    if (a.from == wisher.from) {
                        a.selected = true;
                    }
                });
                $scope.selectedWishers.push(wisher.from);
            }
            else {
                var index = $scope.selectedWishers.indexOf(wisher.from);
                $scope.selectedWishers.splice(index, 1);
                //todo: optimization
                $scope.wishers.forEach(function (w) {
                    if (w.from == wisher.from) {
                        w.selected = false;
                    }
                });
                $scope.activities.forEach(function (a) {
                    if (a.from == wisher.from) {
                        a.selected = false;
                    }
                });
                ;
            }
        }

        $scope.$watch('selectedWishers', function (nv, ov) {
            if (nv && nv.length) {
                var isSingleReceiver = ($scope.gift.giftType == 'thing' || ($scope.gift.sessionType == 'oneOnOne') || ($scope.totalWishers == 1 && $scope.gift.giftType == 'help'));
                if (isSingleReceiver) {
                    GiftuuService.give($scope.selectedWishers, $routeParams.giftId);
                }
            }
        }, true);

        $scope.give = function () {
            if ($scope.selectedWishers.length) {
                GiftuuService.give($scope.selectedWishers, $routeParams.giftId);
            }
            else {
                GiftuuService.give($scope.selectedWishers, $routeParams.giftId);
            }
        }

        $scope.giveToOne = function () {
            if ($scope.gift.giftType == 'thing' || ($scope.gift.sessionType == 'oneOnOne') || ($scope.totalWishers == 1 && $scope.gift.giftType == 'help')) {
                GiftuuService.give($scope.selectedWishers, $routeParams.giftId);
            }
        }

        $scope.report = function () {
            GiftService.reportGift($routeParams.giftId, $scope.reportReason).then(function () {
                $scope.user.canReportGift = false;
                $scope.reported = true;
            })
        }
    });

var pickupGiftCtrl = giftuuApp.controller('pickupGift',
    function ($scope, $routeParams, $location, $http, $window, $filter, $anchorScroll,user, GiftService, GiftuuService, UserService, $timeout) {
        $scope.giftuuDetail = {};
        $scope.giftuuDetail.wishersId = [];
        $scope.message = {skip: 0, limit: 5};
        $scope.totalMessages = 0;
        $scope.user = user;
        $scope.ratingStatus = 'hide';
        if ($scope.giftuuDetail.new) {
            $scope.giftuuDetail.exchangeDate = null;
            $scope.giftuuDetail.exchangeTime = null;
            $scope.giftuuDetail.location = null;
            $scope.giftuuDetail.contactEmail = null;
            $scope.giftuuDetail.contactNumber = null;
        }

        var getGift = function () {
            return GiftService.getGiftById($routeParams.giftId).then(function (response) {
                $scope.gift = response;
                $scope.isOwner = $scope.user ? ($scope.gift.userId.toString() == $scope.user._id) : false;
                return $scope.gift;
            });
        }

        var getGiftuu = function () {
            return GiftuuService.getGiftuuByGift($routeParams.giftId).then(function (response) {
                if (response.giftuuDetail) {
                    $scope.giftuuDetail = response.giftuuDetail;
                    $scope.giftuuDetail.locationShort = $scope.giftuuDetail.location ? $scope.giftuuDetail.location.formatted_address : null;
                    if ($scope.giftuuDetail.contactEmail) {
                        $scope.openEmail = true;
                    }
                    if ($scope.giftuuDetail.contactNumber) {
                        $scope.openPhone = true;
                    }
                }
                else {
                    $scope.giftuuDetail.new = true;
                    if (!$scope.giftuuDetail.new) {
                        $scope.giftuuDetail.contactEmail = $scope.user.email;
                        $scope.giftuuDetail.exchangeDate = new Date();
                        $scope.giftuuDetail.exchangeTime = new Date();
                    }
                    /*$scope.giftuuDetail.locationShort = $filter('addressShort')($scope.user.location);*/
                }
                $scope.giftuuDetail.giftId = $scope.gift._id;
                $scope.giftuuDetail.title = $scope.gift.title;
                $scope.giftuuDetail.description = $scope.gift.description;

                if($scope.giftuuDetail.new == true)
                {
                    $scope.giftuuDetail.wishersId = GiftuuService.wishers() || $scope.giftuuDetail.wishersId;
                }
                if ($scope.giftuuDetail.wishersId.length) {
                    $scope.accessible = true;
                }
                else
                {
                    $scope.giftuuDetail.wishersId = GiftuuService.wishers();
                }
            })
        }

        //move this logic to server for security reason
        var getUserMode = function () {
            if ($scope.user && $scope.gift.userId &&
                $scope.gift.userId.toString() == $scope.user._id.toString()) {
                if ($scope.giftuuDetail.new) {
                    $scope.giftuuDetail.userMode = "edit";
                }
                else {
                    $scope.giftuuDetail.userMode = "view";
                }
            }
            else {
                angular.forEach($scope.giftuuDetail.wishersId, function (wisherId) {
                    if (wisherId == $scope.user._id) {
                        $scope.giftuuDetail.userMode = "view";
                    }
                })
            }
        }

        $scope.prefillEmail = function () {
            $scope.giftuuDetail.contactEmail = $scope.user.email;
        }

        $scope.prefillTime = function () {
            $scope.giftuuDetail.exchangeTime = new Date();
        }

        $scope.prefillDate = function () {
            $scope.giftuuDetail.exchangeDate = new Date();
        }

        $scope.prefillLocation = function () {
            $scope.giftuuDetail.location = $scope.gift.location;
            $scope.giftuuDetail.locationShort = $scope.gift.location.formatted_address;
        }

        $scope.saveGiftuu = function (invalid, openEmail, openPhone) {

            /*Because the custom validation we created for google address doesn't work with this new method of validation*/
            if (!$scope.giftuuDetail.location) {
                if ((openEmail && !$scope.giftuuDetail.contactEmail) || (openPhone && !$scope.giftuuDetail.contactNumber)) {
                    invalid = true;
                }
                else {
                    invalid = false;
                }
            }
            $scope.invalidExchange = invalid;
            if (!invalid) {
                $scope.saving = true;
                if ($scope.giftuuDetail.locationShort && $scope.giftuuDetail.locationShort.geometry) {
                    $scope.giftuuDetail.location = $scope.giftuuDetail.locationShort;
                }
                GiftuuService.giftuu($routeParams.giftId, $scope.giftuuDetail).then(function () {
                    /*Send message on first giftuu save*/
                    if ($scope.giftuuDetail.new) {
                        $scope.sendMessage($scope.gift.title, $scope.giftuuDetail.message);
                        $scope.confirmAlert = true;
                        $timeout(function () {
                            $scope.confirmAlert = false;
                        }, 5000);
                    }
                    getGiftuu().then(getUserMode);
                    getMessages();
                    $scope.saving = false;
                });
            }
        }

        $scope.rate = function (giftId, giftuuId, rating) {
            $http.post('/giftRating', {giftId: giftId, giftuuId: giftuuId, rating: rating}).then(function (results) {
                $scope.ratingStatus = 'fading';
                $timeout(function () {
                    $scope.ratingStatus = 'faded';
                    $timeout(function () {
                        $scope.ratingStatus = 'hide';
                    }, 300);
                }, 4000);
            })
        }

        UserService.canRate($routeParams.giftId).then(function (result) {
            $scope.user.canRate = result;
            $scope.ratingStatus = $scope.user.canRate ? 'show':'hide';
        })

        $scope.$watch('message.skip', function (nv, ov) {
            if (nv && nv != ov) {
                getMessages();
            }
        });

        var getMessages = function () {
            GiftuuService.getTotalComments($routeParams.giftId).then(function (total) {
                $scope.totalMessages = total;
            });
            return GiftuuService.getComments($routeParams.giftId, $scope.message.limit, 0).then(function (messages) {
                if (!$scope.giftuuDetail.messages) {
                    $scope.giftuuDetail.messages = [];
                }
                $scope.giftuuDetail.messages = messages.data;
                $scope.limitMessages = $scope.giftuuDetail.messages.length;
                $scope.giftuuDetail.message = '';
                $scope.giftuuDetail.messaging = false;
            });
        }

        $scope.sendMessage = function (title, content) {
            $scope.sending=true;
            GiftuuService.addComment($routeParams.giftId, title, content).then(function () {
                $scope.message.limit++;
                getMessages();
                $scope.sending=false;
            })
        }

        $scope.disabled = function (date, mode) {
            return ( mode === 'day' && ($scope.user._id == $scope.gift.userId));
        };

        getGift().then(getGiftuu).then(function () {
            getMessages();
            getUserMode()
        });
    });

var confirmGiftCtrl = giftuuApp.controller('confirmGift', function ($scope, $routeParams,user, GiftService) {
    $scope.user = user;
    GiftService.getGiftById($routeParams.giftId).then(function (response) {
        $scope.gift = response;
        //$scope.page.title = 'Gift Detail - ' + $scope.gift.title;
        //$scope.gift.description = $sce.trustAsHtml($scope.gift.description)
        $scope.isOwner = $scope.user ? ($scope.gift.userId.toString() == $scope.user._id) : false;
        $scope.giftId = $routeParams.giftId;
    })
});