/**
 * Created by weiwarren on 19/01/2014.
 */
module.exports = function () {
    function GMap() {
        //var _self = this;
    }

    if (typeof(Number.prototype.toRad) === "undefined") {
        Number.prototype.toRad = function () {
            if (this) {
                return this * Math.PI / 180;
            }
        }
    }

    //p = {lat,lng}
    GMap.prototype.getDistance = function (location1, location2) {
        if (location1 && location2) {
            var lat1 = location1.d || location1.k,
                lng1 = location1.e || location1.A,
                lat2 = location2.d || location2.k,
                lng2 = location2.e || location2.A,
                R = 6371, // km
                dLat = (lat2 - lat1).toRad(),
                dLon = (lng2 - lng1).toRad(),
                lat1 = lat1.toRad(),
                lat2 = lat2.toRad(),

                a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2),
                c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)),
                d = R * c;
            return d;
        }
        return 0;
    };
    return new GMap();
}

