var gmap = require('./node_googlemap')()
    , fs = require("fs")

    , q = require("q");


module.exports = function (db) {
    function GiftRegion() {
        this.gift = require('./node_gift')(db);
        this.GiftRegionDB = db.collection("giftregions");
    }

    GiftRegion.prototype.id = function (id) {
        return this.GiftRegionDB.id(id);
    }

    GiftRegion.prototype.findAll = function (query) {
        var deferred = q.defer();
        this.GiftRegionDB.find(query).toArray(function (err, giftRegions) {
            deferred.resolve(giftRegions);
        })
        return deferred.promise;
    }

    GiftRegion.prototype.findBySuburb = function (suburb) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRegionDB.findOne({suburb: suburb}, function (err, docs) {
            if (docs) {
                deferred.resolve(docs);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    };

    GiftRegion.prototype.add = function (newGiftRegion) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRegionDB.save(newGiftRegion, function (err, result) {
            deferred.resolve(result);
        })
        return deferred.promise;
    }

    GiftRegion.prototype.setDistanceGifts = function (suburb, distanceGifts) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRegionDB.findAndModify(
            {suburb: suburb},
            {},
            {
                $set: {
                    distances: distanceGifts
                }
            },
            {upsert: true, new: true}
            , function () {
                deferred.resolve();
            }
        )
        return deferred.promise;
    }

    GiftRegion.prototype.updateRegionGifts = function (suburb, distanceGifts) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRegionDB.findAndModify(
            {suburb: suburb},
            {},
            {
                $set: {
                    location: location,
                    distances: distanceGifts
                }
            },
            {upsert: true, new: true}
            , function () {
                deferred.resolve();
            }
        )
        return deferred.promise;
    }

    GiftRegion.prototype.calMatrixByUser = function (user) {
        var _self = this,
            region = user.location.formatted_address;

        _self.findBySuburb(region).fail(function () {
            _self.add({
                suburb: region,
                location: user.location,
                distances: []}).then(function (newRegion) {
                    _self.gift.findAll().then(function (allGifts) {
                        for (var i = 0; i < allGifts.length; i++) {
                            updateRegionMatrixByRegion(_self, allGifts[i], newRegion);
                        }
                    })
                });
        })
    }

    GiftRegion.prototype.calMatrixByGift = function (newGift) {
        var _self = this;
        //if suburb is already there
        _self.findBySuburb(newGift.location.formatted_address).then(function () {
            _self.findAll().then(function (giftRegions) {
                for (var i = 0; i < giftRegions.length; i++) {
                    updateRegionsForGift(_self, giftRegions[i], newGift);
                }
            })
        }).fail(
            function () {
                return _self.add({
                    suburb: newGift.location.formatted_address,
                    location: newGift.location,
                    distances: [
                        [newGift._id]
                    ]}).then(function (newRegion) {
                        _self.gift.findAll().then(function (allGifts) {
                            for (var i = 0; i < allGifts.length; i++) {
                                updateRegionMatrixByRegion(_self, allGifts[i], newRegion);
                            }
                        })
                    });
            })
    };

    //iterate through all the regions and update the distance based on gift location
    var updateRegionsForGift = function (_self, giftRegion, newGift) {
        var deferred = q.defer(),
            distance = parseInt(gmap.getDistance(newGift.location.geometry, giftRegion.location.geometry.location)) || 0,
            currentSuburb = giftRegion.location.formatted_address,
            distanceGifts = (giftRegion ? giftRegion.distances : []) || [];

        if (distanceGifts[distance]) {
            var found = false;
            for (var i = 0; i < distanceGifts[distance].length; i++) {
                if (distanceGifts[distance][i] == newGift._id) {
                    found = true;
                    break;
                }
            }
            if (!found)
                distanceGifts[distance].push(newGift._id);
        }
        else {
            distanceGifts[distance] = [newGift._id];
        }
        _self.setDistanceGifts(currentSuburb, distanceGifts).then(function () {
            deferred.resolve();
        })
        return deferred.promise;
    }

    //iterate through all the gifts and update the new region based on all the existing gifts
    var updateRegionMatrixByRegion = function (_self, currentGift, newRegion) {
        var currentSuburb = newRegion.location.formatted_address;
        if (currentSuburb) {
            var distance = parseInt(gmap.getDistance(newRegion.location.geometry.location, currentGift.location.geometry.location)) || 0;
            console.log(currentSuburb);
            console.log(distance);
            _self.findBySuburb(currentSuburb).then(function () {
                console.log("found suburb")
                var distanceGifts = (newRegion ? newRegion.distances : []) || [];
                if (distanceGifts[distance]) {
                    var found = false;
                    for (var i = 0; i < distanceGifts[distance].length; i++) {
                        if (distanceGifts[distance][i] == currentGift._id) {
                            found = true;
                            break;
                        }
                    }
                    if (!found)
                        distanceGifts[distance].push(currentGift._id);
                }
                else {
                    distanceGifts[distance] = [currentGift._id];
                }
                _self.setDistanceGifts(currentSuburb,distanceGifts);
            });

        }
    }

    return new GiftRegion();
}

