giftuuApp.directive('debug', function () {
    return {
        restrict: 'E',
        scope: {
            expression: '=val'
        },
        template: '<pre>{{debug(expression)}}</pre>',
        link: function (scope) {
            // pretty-prints
            scope.debug = function (exp) {
                return angular.toJson(exp, true);
            };
        }
    }
});

giftuuApp.directive('toJson', function () {
    return {
        restrict: 'A',
        link: function (scope, elem, attrs) {
            // pretty-prints
            scope.$watch(attrs.toJson, function (nv, ov) {
                if (nv && nv != ov) {
                    elem.val(angular.toJson(nv));
                }
            })
        }
    }
});

giftuuApp.directive('a', function ($location, $anchorScroll) {
    return {
        restrict: 'E',
        link: function (scope, elem, attrs) {
            if (attrs.ngClick || attrs.href === '') {
                elem.on('click', function (e) {
                    e.preventDefault();
                });
            }
            else if (attrs.href && attrs.href.indexOf('#') == 0 && attrs.href.indexOf('#') < 0) {
                elem.on('click', function (e) {
                    e.preventDefault();
                    $location.hash(attrs.href.substring(1));
                    $anchorScroll();
                })
            }
        }
    };
});

giftuuApp.directive('scrollToBookmark', function () {
    return {
        link: function (scope, element, attrs) {
            var value = attrs.scrollToBookmark;
            element.click(function () {
                scope.$apply(function () {
                    var selector = "[scroll-bookmark='" + value + "']";
                    var element = $(selector);
                    if (element.length)
                        window.scrollTo(0, element[0].offsetTop - 100);  // Don't want the top to be the exact element, -100 will go to the top for a little bit more
                });
            });
        }
    };
});

giftuuApp.directive('preventSubmit', function ($timeout) {
    return{
        restrict: 'A',
        scope: {
            preventSubmit: '='
        },
        link: function (scope, elem, attrs) {
            elem.on('submit', function (e) {
                if (scope.preventSubmit) {
                    e.preventDefault();
                }
            });
        }
    }
});

giftuuApp.directive('ngEnter', function () {
    return function (scope, element, attrs) {
        element.bind("keydown keypress", function (event) {
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.ngEnter);
                });
                event.preventDefault();
            }
        });
    };
});
giftuuApp.directive('focusScroll', function ($timeout) {
    return{
        restrict: 'A',
        link: function (scope, elem, attrs, model) {
            scope.$watch(attrs.focusScroll, function (value) {
                if (value) {
                    $timeout(function () {
                        var rect = angular.element(elem)[0].getBoundingClientRect();
                        $("body").animate({scrollTop: rect.top}, "slow");
                        elem[0].focus();
                    }, 250);
                }
            });
        }
    }
});

giftuuApp.directive('viewPrevious', function () {
    return{
        restrict: 'E',
        scope: {
            title: '@',
            limit: '=',
            skip: '=',
            hasMore: '='
        },
        template: '<div class="View-previous" ng-click="viewPrevious()"><span ng-if="hasMore">view previous {{title}}...</span></div>',
        link: function (scope, elem, attrs) {
            scope.viewPrevious = function () {
                scope.skip += scope.limit;
                scope.limit += scope.skip;
            }
        }
    }
});

giftuuApp.directive('scrollTo', function ($location, $anchorScroll) {
    return{
        restrict: 'A',
        link: function (scope, elem, attrs) {
            var scrollTo = attrs.scrollTo;
            if (scrollTo) {
                elem.on('click', function (e) {
                    e.preventDefault();
                    $location.hash(scrollTo);
                    $anchorScroll();
                });
            }
        }
    }
});

giftuuApp.directive('infiniteScroll', function ($window) {
    return {
        restrict: 'EA',
        scope: {
            loading: '=',
            infiniteScroll: '='
        },
        link: function (scope, ele, attrs) {
            var offset = parseInt(attrs.offset) || 0;
            scope.$watch(attrs.loading, function (nv) {
                if (!nv) {
                    if (!scope.$$phase)
                        checkLoad(true);
                    else {
                        setTimeout(function () {
                            checkLoad(true);
                        }, 200);
                    }
                }
            });

            angular.element($window).on('scroll', function () {
                if (attrs.infiniteScroll) {
                    checkLoad(false);
                }
            });

            var checkLoad = function (animation) {
                if (!scope.$$phase) {
                    var rect = angular.element(ele)[0].getBoundingClientRect();
                    if (rect.top && rect.top + offset <= ($window.innerHeight || document.documentElement.clientHeight)) {
                        scope.infiniteScroll(animation);
                    }
                }
            }
        }
    };
});

/* this directive is used to bind to a ng-model for returning search results as scope object */
giftuuApp.directive('googleImageSearch', function ($timeout, $rootScope) {
    return{
        restrict: 'A',
        require: 'ngModel',
        scope: {
            searchTerm: "=ngModel",
            searchResults: "="
        },
        link: function (scope, elem, attrs) {
            var searchComplete = function () {
                if (scope.imageSearch.results) {
                    scope.searchResults = [];
                    console.log(scope.imageSearch.results)
                    angular.forEach(scope.imageSearch.results, function (r) {
                        scope.searchResults.push({
                            width: r.width,
                            height: r.height,
                            content: r.contentNoFormatting,
                            tbUrl: r.tbUrl,
                            title: r.titleNoFormatting,
                            url: r.url
                        });
                    })
                    scope.$apply(
                        function () {
                            scope.searching = false;
                        }
                    );
                }
            }
            scope.searchImage = function (term) {
                if (!scope.searching && term && scope.imageSearch.execute) {
                    $timeout(function () {
                        scope.imageSearch.execute(term);
                    }, 250)
                }
            }

            scope.$watch('searchTerm', function (nv, ov) {
                if (nv && nv != ov) {
                    scope.searchImage(nv);
                }
            });

            scope.$watch(function () {
                return $rootScope.googleAPILoaded;
            }, function (nv) {
                if (nv) {
                    scope.imageSearch = new google.search.ImageSearch();
                    scope.imageSearch.setRestriction(
                        google.search.Search.RESTRICT_SAFESEARCH,
                        google.search.Search.SAFESEARCH_STRICT,
                        google.search.ImageSearch.RESTRICT_IMAGESIZE,
                        google.search.ImageSearch.IMAGESIZE_LARGE,
                        google.search.ImageSearch.RESTRICT_IMAGETYPE,
                        google.search.ImageSearch.IMAGETYPE_PHOTO,
                        google.search.ImageSearch.RESTRICT_RIGHTS,
                        google.search.ImageSearch.RIGHTS_REUSE);
                    scope.imageSearch.setResultSetSize(8)
                    // Set searchComplete as the callback function when a search is
                    // complete.  The imageSearch object will have results in it.
                    scope.imageSearch.setSearchCompleteCallback(this, searchComplete, null);
                    scope.imageSearchResults = [];
                }
            })
        }
    }
})

giftuuApp.directive('fixMenu', [ "$window", function ($window) {
    return{
        link: function (scope, elem, attrs) {
            var scrollTop = $(elem).offset().top,
                width = $(elem).width();
            angular.element($window).on('scroll', function () {
                if ($(this).scrollTop() >= scrollTop) {
                    angular.element(elem).addClass('fixedMenu').css('width', width + 'px');
                }
                else {
                    angular.element(elem).removeClass('fixedMenu');
                }
            });
        }
    }
}]);

giftuuApp.directive('focusOnShown',function(){
    return {
        link: function(scope,ele, attrs){
            var target = attrs.focusOnShown;
            $(ele).on('shown.bs.modal',function(){
                $(target).focus();
            });
        }
    }

})

giftuuApp.directive('focusMe', function ($timeout, $parse) {
    return {
        //scope: true,   // optionally create a child scope
        link: function (scope, element, attrs, ngModel) {
            var model = $parse(attrs.focusMe);
            scope.$watch(model, function (value) {
                if (value === true) {
                    $timeout(function () {
                        element[0].focus();
                    });
                }
            });
            element.bind('blur', function () {
                scope.$apply(model.assign(scope, false));
            });
        }
    };
});

giftuuApp.directive('numbersOnly', function ($parse) {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, modelCtrl) {
            modelCtrl.$parsers.push(function (inputValue) {
                // this next if is necessary for when using ng-required on your input.
                // In such cases, when a letter is typed first, this parser will be called
                // again, and the 2nd time, the value will be undefined
                // again, and the 2nd time, the value will be undefined
                if (inputValue == undefined) return ''
                var transformedInput = inputValue.replace(/[^0-9]/g, '');
                if (transformedInput != inputValue) {
                    modelCtrl.$setViewValue(transformedInput);
                    modelCtrl.$render();
                }
                return transformedInput;
            });
        }
    };
});

giftuuApp.directive('menuItem', function ($parse) {
    return {
        restrict: 'A',
        link: function (scope, ele, attrs) {
            ele.bind('click', function () {
                $('#st-container').removeClass('st-menu-open');
            })
        }
    };
});

giftuuApp.directive('userDetail', function (UserService) {
    return {
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.userDetail, function (newValue) {
                if (newValue) {
                    scope.currentUser = null;
                    UserService.getUserById(newValue).then(function (response) {
                        scope.currentUser = response;
                    })
                }
            })
        }
    };
});

giftuuApp.directive('giftuuDetail', function (GiftuuService) {
    return {
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.giftuuDetail, function (newValue) {
                if (newValue) {
                    GiftuuService.getGiftuuByGift(newValue).then(function (response) {
                        if (response)
                            scope.currentGiftuu = response.giftuu;
                    })
                }
            })
        }
    };
});

giftuuApp.directive('giftDetail', function (GiftService) {
    return {
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.giftDetail, function (newValue, ov) {
                if (newValue) {
                    GiftService.getGiftById(newValue).then(function (response) {
                        scope.currentGift = response;
                    })
                }
            })
        }
    };
});

giftuuApp.directive('giftuuAvatar', function () {
    return{
        restrict: 'E',
        template: '<div class="avatar pull-left">' +
            '<svg xml:space="preserve" enable-background="new 0 0 25 24" viewBox="0 0 25 24" height="24px" width="25px" y="0px" x="0px" version="1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" class="redHeart"><path d="M12.487 4.281C12.49 4.3 12.5 4.3 12.5 4.285s0.01-0.003 0.013-0.004 M12.513 4.281C13.388 1.8 15.5 0 18.3 0 C22.016 0 25 3.1 25 6.857c0 0.724-0.111 1.421-0.312 2.076C22.754 15.8 12.5 24 12.5 24S2.247 15.8 0.3 8.9 C0.111 8.3 0 7.6 0 6.857C0 3.1 3 0 6.7 0c2.795 0 4.9 1.8 5.8 4.3"/></svg>' +
            '<div class="heartNumber">{{currentUser.heart || 0}}</div>' +
            '<a class="largeFace" ng-href="/#/profile/{{currentUser._id}}">' +
            '<img cloud-pic="currentUser" alt="profile image" class="img-circle gifterFace"/></a>' +
            '</div>',
        link: function (scope) {
            if (!scope.currentUser) {
                scope.currentUser = scope.user;
            }
        }
    }
});

giftuuApp.directive('addThisEvent', function ($q, $window) {
    return{
        restrict: 'EA',
        link: function (scope, elem, attrs) {
            function load_script() {
                var s = document.createElement('script');
                s.src = 'http://js.addthisevent.com/atemay.js';
                document.body.appendChild(s);
            }

            scope.$watch(attrs.addThisEvent, function (nv) {
                if (nv) {
                    var startDate = nv.exchangeTime || nv.exchangeDate;
                    if (startDate) {
                        var template = '<a href="#" title="Add to Calendar" class="addthisevent">' +
                            'Add to Calendar' +
                            '<span class="_start">' + (moment(startDate)).format('hh:mm DD/MM/YYYY') + '</span>' +
                            '<span class="_end">' + (moment(startDate).add('hour', 1)).format('hh:mm DD/MM/YYYY') + '</span>' +
                            '<span class="_summary">' + nv.title + '</span>' +
                            '<span class="_description">' + nv.description + '</span>' +
                            '<span class="_location">' + (nv.location ? nv.location.formatted_address : "") + '</span>' +
                            '<span class="_organizer_email">' + nv.contactEmail + '</span>' +
                            '<span class="_all_day_event">false</span>' +
                            '<span class="_date_format">hh:mm DD/MM/YYYY</span>' +
                            '</a>';
                        $(elem[0]).append(template);
                        load_script();
                    }
                }
            })
        }
    }
});

giftuuApp.directive('cloudPic', function (UserService) {
    return{
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.cloudPic, function (newValue) {
                if (newValue) {
                    var cloudPicFormat = 'http://res.cloudinary.com/giftuu/image/facebook/w_45,h_45,c_fill/{0}.jpg';
                    if (newValue.provider == 'facebook') {
                        if (!newValue.active) {
                            angular.element(ele).attr('src', "/images/profiles/unknownUser.png");
                        }
                        else {
                            angular.element(ele).attr('src', cloudPicFormat.replace('{0}', newValue.profileId));
                        }
                    }
                    else {
                        if(newValue.profilePictureUrl){
                            angular.element(ele).attr('src', newValue.profilePictureUrl);
                        }
                        else{
                            UserService.getUserById(newValue).then(function (response) {
                                if (response && response.provider == 'facebook') {
                                    angular.element(ele).attr('src', cloudPicFormat.replace('{0}', response.profileId));
                                }
                                else{
                                    angular.element(ele).attr('src', response.profilePictureUrl);
                                }
                            })
                        }
                    }
                }
            })
        }
    }
});

giftuuApp.directive('img', function () {
    return{
        restrict: 'E',
        link: function postLink(scope, iElement, attrs) {
            if (!attrs.fallbackSrc && !attrs.onError) {
                iElement.bind('error', function () {
                    angular.element(this).attr("src", "/images/giftplaceholder.jpg");
                });
            }
        }
    }
});

giftuuApp.directive('fallbackSrc', function () {
    var fallbackSrc = {
        link: function postLink(scope, iElement, iAttrs) {
            iElement.bind('error', function () {
                angular.element(this).attr("src", iAttrs.fallbackSrc);
            });
        }
    }
    return fallbackSrc;
});

giftuuApp.directive('imageError', function () {
    return {
        scope: {
            imageError: '='
        },
        link: function postLink(scope, iElement, iAttrs) {
            iElement.bind('error', function () {

                scope.$apply(function () {
                    scope.imageError = true;
                })
            });

        }
    }
    return fallbackSrc;
});

giftuuApp.directive('imageLoaded', function () {
    return {
        link: function imageLoad(scope, iElement, iAttrs) {
            iElement.on('load', function () {
                scope.$parent.imageLoaded = true;
            });
        }
    }
});

giftuuApp.directive('parseUrl', function () {
    var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
    return {
        restrict: 'A',
        require: 'ngModel',
        replace: true,
        scope: { props: '=parseUrl', ngModel: '=ngModel' },
        link: function compile(scope, element, attrs, controller) {
            scope.$watch('ngModel', function (value) {
                angular.forEach(value.match(urlPattern), function (url) {
                    value = value.replace(url, '<a target="' + scope.props.target + '" href=' + url + '>' + url + '</a>');
                });
                element.html(value + " | " + scope.props.otherProp);
            });
        }
    };
});

giftuuApp.directive('clickHref', function ($location) {
    return function (scope, element, attrs) {
        var path;

        attrs.$observe('clickHref', function (val) {
            path = val;
        });

        element.bind('click', function () {
            scope.$apply(function () {
                $location.path(path);
            });
        });
    };
});

giftuuApp.directive('ngThumb', ['$window', function ($window) {
    var helper = {
        support: !!($window.FileReader && $window.CanvasRenderingContext2D),
        isFile: function (item) {
            return angular.isObject(item) && item instanceof $window.File;
        },
        isImage: function (file) {
            var type = '|' + file.type.slice(file.type.lastIndexOf('/') + 1) + '|';
            return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
        }
    };

    return {
        restrict: 'A',
        template: '<canvas/>',
        link: function (scope, element, attributes) {
            if (!helper.support) return;

            var params = scope.$eval(attributes.ngThumb);

            if (!helper.isFile(params.file)) return;
            if (!helper.isImage(params.file)) return;

            var canvas = element.find('canvas');
            var reader = new FileReader();

            reader.onload = onLoadFile;
            reader.readAsDataURL(params.file);

            function onLoadFile(event) {
                var img = new Image();
                img.onload = onLoadImage;
                img.src = event.target.result;
            }

            function onLoadImage() {
                var width = params.width || this.width / this.height * params.height;
                var height = params.height || this.height / this.width * params.width;
                canvas.attr({ width: width, height: height });
                canvas[0].getContext('2d').drawImage(this, 0, 0, width, height);
            }
        }
    };
}]);

giftuuApp.directive('fbShare', function ($filter) {
    return{
        restrict: 'A',
        link: function (scope, ele, attrs) {
            scope.$watch(attrs.shareModel, function (nv) {
                if (nv) {
                    var currentHref = encodeURIComponent(attrs.fbShare);
                    var href = "https://www.facebook.com/dialog/feed?app_id=259214729757";
                    href += "&caption=" + encodeURIComponent(nv.description).substring(1000);
                    href += "&display=popup&e2e=%7B%7D&link=" + currentHref;
                    href += "&name=" + encodeURIComponent(nv.title) + " near " + $filter('addressShort')(nv.location);
                    href += "&next=" + currentHref;
                    if (nv.images && nv.images.length)
                        href += "&picture=" + nv.images[0].url;
                    attrs.$set("href", href);
                }
            });
        }
    }
})