giftuuApp.directive('googleplace', function () {
    return {
        require: 'ngModel',
        link: function (scope, element, attrs, model) {
            var options = {
                types: [],
                componentRestrictions: {}
            };
            var autocomplete = new google.maps.places.Autocomplete(element[0], options);

            scope.$watch(attrs.ngModel, function (nv, ov) {
                if (nv && nv.geometry) {
                    element.val(nv.formatted_address);
                    model.$setValidity(attrs.ngModel, true);
                }
                else {
                    model.$setValidity(attrs.ngModel, false);
                }
            });

            google.maps.event.addListener(autocomplete, 'place_changed', function () {
                var place = autocomplete.getPlace();
                if (place.geometry) {
                    scope.$apply(function () {
                        model.$setViewValue(place);
                    });
                }
            });

            if (attrs.enablemap) {
                var mapTemplate = angular.element('<div id="map-canvas"></div>');
                element.after(mapTemplate);

                var initGeo = {latitude: 0, longitude: 0}//$scope.gift.location ? $scope.gift.location.geo : $scope.userCurrentLocation;
                var mapOptions = {
                    center: new google.maps.LatLng(initGeo.latitude, initGeo.longitude),
                    zoom: 13,
                    scrollwheel: false,
                    navigationControl: false,
                    mapTypeControl: false,
                    scaleControl: false,
                    draggable: false,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };

                var map = new google.maps.Map(mapTemplate[0],
                    mapOptions);

                var infowindow = new google.maps.InfoWindow();
                var marker = new google.maps.Marker({
                    map: map
                });

                autocomplete.bindTo('bounds', map);

                scope.$watch(attrs.ngModel, function (nv) {
                    if (nv) {
                        infowindow.close();
                        marker.setVisible(false);
                        var place = nv;
                        if (!place.geometry) {
                            // Inform the user that the place was not found and return.
                            //input.className = 'notfound';
                            return;
                        }

// If the place has a geometry, then present it on a map.
                        if (place.geometry.viewport) {
                            map.fitBounds(place.geometry.viewport);
                        } else {
                            map.setCenter(place.geometry.location);
                            map.setZoom(17);
                        }
                        marker.setIcon(/** @type {google.maps.Icon} */({
                            url: place.icon,
                            size: new google.maps.Size(71, 71),
                            origin: new google.maps.Point(0, 0),
                            anchor: new google.maps.Point(17, 34),
                            scaledSize: new google.maps.Size(35, 35)
                        }));

                        marker.setPosition(place.geometry.location);
                        marker.setVisible(true);
                        var address = 's';
                        if (place.address_components) {
                            address = [
                                (place.address_components[1] && place.address_components[1].short_name || ''),
                                (place.address_components[2] && place.address_components[2].short_name || '')
                            ].join(' ');
                            scope.addressShort = place.address_components;
                        }

                        infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
                        infowindow.open(map, marker);
                    }
                })
            }
        }
    };
});


giftuuApp.directive('googleArea', function ($http) {
    return{
        require: 'ngModel',
        link: function (scope, element, attrs, model) {
            $http.get('http://global.mapit.mysociety.org/point/4326/151.08753430000002,-33.8308619.json').then(function (data) {
                //$http.get('http://global.mapit.mysociety.org/area/'+data.+'.geojson')
            })
        }
    }
})

