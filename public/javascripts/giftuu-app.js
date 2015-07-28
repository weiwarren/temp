
var giftuuApp = angular.module('giftuu', [
        'ngRoute',
        'ngAnimate',
        'ngSanitize',
        //3rd party modules
        'ui.bootstrap',
        'LocalStorageModule',
        'fx.animations',
        'compile',
        'monospaced.elastic',
        'angularFileUpload',
        'geolocation',
        'angulartics',
        'angulartics.google.analytics'
    ])
    .filter('ago', function () {
        return function (date, suffix) {
            return moment(date).fromNow(suffix);
        };
    })
    .filter('addressShort', function () {
        return function (gPlace) {
            if (gPlace && gPlace.address_components && gPlace.address_components.length) {
                if (gPlace.address_components.length == 1) {
                    var area = gPlace.address_components[0].long_name,
                        state = "";
                }
                else if (gPlace.address_components.length == 3) {
                    var area = gPlace.address_components[gPlace.address_components.length - 3].short_name,
                        state = gPlace.address_components[gPlace.address_components.length - 2].short_name;
                }
                else if (gPlace.address_components.length > 3) {
                    var area = gPlace.address_components[gPlace.address_components.length - 4].short_name,
                        state = gPlace.address_components[gPlace.address_components.length - 3].short_name;
                }
                else {
                    var area = gPlace.address_components[0].short_name,
                        state = gPlace.address_components[1].short_name;
                }
                for (var i = 2; i < gPlace.address_components.length, area == state; i++) {
                    state = gPlace.address_components[i].short_name;
                }
                if (gPlace.address_components.length == 1) {
                    return area;
                }
                else {
                    return area + ', ' + state;
                }
            }
        }
    })
    .filter('truncate', function () {
        return function (text, length, end) {
            if (isNaN(length))
                length = 10;

            if (end === undefined)
                end = "...";

            if (text.length <= length || text.length - end.length <= length) {
                return text;
            }
            else {
                return String(text).substring(0, length - end.length) + end;
            }

        };
    })
    .filter('characters', function () {
        return function (input, chars, breakOnWord) {
            if (isNaN(chars)) return input;
            if (chars <= 0) return '';
            if (input && input.length > chars) {
                input = input.substring(0, chars);

                if (!breakOnWord) {
                    var lastspace = input.lastIndexOf(' ');
                    //get last space
                    if (lastspace !== -1) {
                        input = input.substr(0, lastspace);
                    }
                } else {
                    while (input.charAt(input.length - 1) === ' ') {
                        input = input.substr(0, input.length - 1);
                    }
                }
                return input + '...';
            }
            return input;
        };
    })
    .filter('words', function () {
        return function (input, words) {
            if (isNaN(words)) return input;
            if (words <= 0) return '';
            if (input) {
                var inputWords = input.split(/\s+/);
                if (inputWords.length > words) {
                    input = inputWords.slice(0, words).join(' ') + '...';
                }
            }
            return input;
        };
    })
    .filter('parseUrlFilter', function () {
        var urlPattern = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi;
        return function (text, target, otherProp) {
            if (text) {
                var t = text.toString();
                angular.forEach(t.match(urlPattern), function (url) {
                    t = t.replace(url, '<a target="' + target + '" href=' + url + '>' + url + '</a>');
                });
                return t;
            }
            return text;
        };
    });
google.load('search', '1');