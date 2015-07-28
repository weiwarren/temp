var gmap = require('./node_googlemap')()
    , fs = require("fs")
    , im = require("imagemagick")
    , q = require("q")
    , ObjectID = require("mongoskin").ObjectID;
/*
 var gift =
 {
 "_id": ObjectId("538457a98dea0d37d6000001"),
 "activityDate": ISODate("2014-05-30T12:33:34.160Z"),
 "comments": 0,
 "created": ISODate("2014-05-27T09:15:21.776Z"),
 "description": "My ipad",
 "giftType": "thing",
 "giftuuId": ObjectId("53887a9e63283b36e2729f20"),
 "ideal": "Loves ipad",
 "images": [
 {
 "public_id": "p7msd0utxxrjbgpkhzmi",
 "version": 1401182121,
 "signature": "d3034a171db2ef91009c13ce0573c4fefe5bdeaa",
 "width": 2256,
 "height": 1208,
 "format": "jpg",
 "resource_type": "image",
 "created_at": "2014-05-27T09:15:21Z",
 "bytes": 214550,
 "type": "upload",
 "etag": "04bfb90d1bb046706162780349204f15",
 "url": "http://res.cloudinary.com/dhzzedkki/image/upload/v1401182121/p7msd0utxxrjbgpkhzmi.jpg",
 "secure_url": "https://res.cloudinary.com/dhzzedkki/image/upload/v1401182121/p7msd0utxxrjbgpkhzmi.jpg"
 }
 ],
 "loc": {
 "x": 151.08753430000002,
 "y": -33.8308619
 },
 "location": {
 "address_components": [
 {
 "long_name": "Rhodes",
 "short_name": "Rhodes",
 "types": [
 "locality",
 "political"
 ]
 },
 {
 "long_name": "New South Wales",
 "short_name": "NSW",
 "types": [
 "administrative_area_level_1",
 "political"
 ]
 },
 {
 "long_name": "Australia",
 "short_name": "AU",
 "types": [
 "country",
 "political"
 ]
 }
 ],
 "adr_address": "<span class=\"locality\">Rhodes</span> <span class=\"region\">NSW</span>, <span class=\"country-name\">Australia</span>",
 "formatted_address": "Rhodes NSW, Australia",
 "geometry": {
 "location": {
 "k": -33.8308619,
 "A": 151.08753430000002
 },
 "viewport": {
 "Ba": {
 "k": -33.839167,
 "j": -33.82151
 },
 "ra": {
 "j": 151.08068349999996,
 "k": 151.0980214
 }
 }
 },
 "icon": "http://maps.gstatic.com/mapfiles/place_api/icons/geocode-71.png",
 "id": "468eb29472a8199aaf15bf609ce4ac7da6d97f5a",
 "name": "Rhodes",
 "reference": "CoQBeAAAAJdPyy6ezgvGqqWu_Dj6Cxg0sGI6cWI8G3zIKWuVkwKjNZClEsFKJwc_KiqA0bbkkdnGQtTNgAw56jKyt42XfO_TapVHZK5kdQy1xAy3AeDHsr_-7JnOc8m5WS0S8Da-aanObrImdLVieDDZokS24UTIHxnh66flrxB4_lC9JsxbEhB8Ec3ZTkKgv4IOYenCDtrdGhRhz-Cs3wGZKwqMqdWFvmIBjr9jkg",
 "types": [
 "locality",
 "political"
 ],
 "url": "https://maps.google.com/maps/place?q=Rhodes+NSW,+Australia&ftid=0x6b12a4e374cd2aa7:0x5017d681632c860",
 "vicinity": "Rhodes",
 "html_attributions": [ ]
 },
 "sessionType": null,
 "status": "given",
 "title": "ipad",
 "userId": ObjectId("538456f963283b36e2729f1f"),
 "wishers": 1
 }
 */
module.exports = function (db) {

    function Gift() {
        this.GiftDB = db.collection("gifts");
        this.GiftDB.ensureIndex({"title": "text", "description": "text"}, function (err, log) {
            if (err)
                console.log(err);
        })
        this.GiftDB.ensureIndex({"loc": "2dsphere"}, function (err) {
            if (err)
                console.log(err);
        })
    }

    Gift.prototype.id = function (id) {
        return this.GiftDB.id(id);
    }

    Gift.prototype.find = function (id) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftDB.findOne({_id: _self.GiftDB.id(id)}, function (err, doc) {
            if (doc) {
                deferred.resolve(doc);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    };

    Gift.prototype.findByRadius = function (userId, queryText, giftType, center, maxRadiusInKm, expiryDate, limit, skip) {
        var deferred = q.defer();
        //var maxRadius = maxRadiusInKm / 6378.137;
        var _self = this,
            query = {$regex: queryText, $options: 'i'},
            giftType = {$regex: giftType, $options: 'i'}
        //mongodb searches sphear based on geo coordinates of {lat,lng} the order is important;
        //the results are sorted in distance order
        //, $maxDistance: maxRadius
        _self.GiftDB.find(
            {
                $or: [
                    {"title": query},
                    {"description": query}
                ],
                "giftType": giftType,
                "status": 'available',
                "loc": {$nearSphere: center}
                //,"activityDate": {$gte: expiryDate}
            },
            {limit: limit, skip: skip}).toArray(function (err, docs) {
                if (err) deferred.reject(err);
                else {
                    deferred.resolve(docs);
                }
            })
        return deferred.promise;
    }

    Gift.prototype.countAll = function (query) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftDB.count(query, function (err, count) {
            if (count) {
                deferred.resolve(count);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    }

    Gift.prototype.findAll = function (query, limit, skip) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftDB.find(query, {limit: limit, skip: skip, sort: [
            ["_id", -1]
        ]}).toArray(function (err, docs) {
                if (docs) {
                    deferred.resolve(docs);
                }
                else {
                    deferred.reject(err);
                }
            });
        return deferred.promise;
    };

    Gift.prototype.isOwner = function (id, userId) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftDB.findOne({_id: _self.GiftDB.id(id), userId: _self.GiftDB.id(userId)}, function (err, doc) {
            if (err) deferred.reject(err);
            else {
                deferred.resolve(doc);
            }
        });
        return deferred.promise;
    };

    Gift.prototype.isOwnerSelf = function (gift, userId) {
        return gift.userId.toString() == userId.toString();
    }

    Gift.prototype.add = function (req) {
        var googleImages = [];
        if (req.body.googleImages) {
            googleImages = JSON.parse(req.body.googleImages);
            for (var i = 0; i < googleImages.length; i++) {
                googleImages[i]._id = new ObjectID();
            }
        }

        var newGift = {
            title: req.body.title,
            description: req.body.description,
            ideal: req.body.ideal,
            images: googleImages,
            giftType: req.body.giftType,
            sessionType: req.body.sessionType,
            location: JSON.parse(req.body.address),
            userId: req.user._id,
            wishers: 0,
            comments: 0,
            status: "available",
            created: new Date(),
            activityDate: new Date()
        }
        //google changes the data return object all the time, assumption the first object is the latitude, and the second is the longitude;

        var lat, lng;
        var j = 0;
        for (var key in newGift.location.geometry.location) {
            if (newGift.location.geometry.location.hasOwnProperty(key)
                && parseFloat(newGift.location.geometry.location[key]) && j == 0) {
                lng = newGift.location.geometry.location[key];
                j = 1;
            }
            else if (newGift.location.geometry.location.hasOwnProperty(key)
                && parseFloat(newGift.location.geometry.location[key]) && j == 1) {
                lat = newGift.location.geometry.location[key];
                j = 2;
            }
        }
        newGift.loc = {x: lat, y: lng};
        var _self = this;
        var d = q.defer();
        _self.GiftDB.insert(newGift, function (e, docs) {
            if (docs && docs.length) {
                d.resolve(docs[0]);
            } else {
                d.reject(e);
            }
        });
        return d.promise;
    }

    Gift.prototype.give = function (giftId, giftuuId, receivers) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId)},
            {$set: {status: "given", giftuuId: giftuuId, receivers: receivers, activityDate: new Date()}},
            {safe: true, multi: false},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }

    Gift.prototype.rated = function (giftId) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId), status: 'given'},
            {$set: {rated: true}},
            {safe: true, multi: false},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }

    Gift.prototype.updateProperty = function (giftId, prop) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId)},
            {$set: prop},
            {safe: true, multi: false},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }
    Gift.prototype.deactivate = function (giftId) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId)},
            {$set: {status: "deactivated", activityDate: new Date()}},
            {safe: true, multi: false},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }

    Gift.prototype.deactivateByUser = function (userId) {
        var d = q.defer();
        this.GiftDB.update(
            {userId: userId},
            {$set: {status: "deactivated", activityDate: new Date()}},
            {safe: true, multi: true},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }

    Gift.prototype.updateGift = function (giftId, giftDetail) {
        var d = q.defer(),

            giftDetails = {
                title: giftDetail.title,
                description: giftDetail.description,
                ideal: giftDetail.ideal,
                sessionType: giftDetail.sessionType,
                location: giftDetail.location,
                modified: new Date(),
                activityDate: new Date()
            };

        giftDetails.loc = {};
        var i = 0;
        for (var key in giftDetails.location.geometry.location) {
            if (parseFloat(giftDetails.location.geometry.location[key]) && i == 0) {
                giftDetails.loc.y = giftDetails.location.geometry.location[key];
                i = 1;
            }
            else if (parseFloat(giftDetails.location.geometry.location[key]) && i == 1) {
                giftDetails.loc.x = giftDetails.location.geometry.location[key];
                i = 2;
            }
        }

        this.GiftDB.findAndModify(
            {_id: this.GiftDB.id(giftId)},
            {},
            {$set: giftDetails},
            {safe: true, multi: false, new: true},
            function (e, result) {
                d.resolve(result);
            });
        return d.promise;
    }

    Gift.prototype.updateTotalWishers = function (giftId) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId)},
            {$inc: { wishers: 1 }, $set: {activityDate: new Date()}},
            {safe: true, multi: false},
            function (e, result) {
                result === 1 ? d.resolve() : d.reject();
            });
        return d.promise;
    }

    Gift.prototype.updateTotalComments = function (giftId) {
        var d = q.defer();
        this.GiftDB.update(
            {_id: this.GiftDB.id(giftId)},
            {$inc: { comments: 1 }, $set: {activityDate: new Date()}},
            {safe: true, multi: false},
            function (e, result) {
                if (e) {
                    e.reject()
                }
                else {
                    d.resolve(result)
                }
            });
        return d.promise;
    }

    Gift.prototype.updateImageRef = function (gift, images) {
        var _self = this
            , d = q.defer()
            , promises = [];
        images.forEach(function (image) {
            image._id = new ObjectID();
            var promise = linkImage(gift, image, _self);
            promises.push(promise);
        });
        q.all(promises).then(function (results) {
            d.resolve(results);
        })
        return d.promise;
    }

    Gift.prototype.removeImageRef = function (giftId, imageId) {
        var d = q.defer();
        giftId = this.GiftDB.id(giftId);
        imageId = this.GiftDB.id(imageId);
        this.GiftDB.update(
            {_id: giftId},
            {$pull: {images: {_id: imageId}}}, {multi: false}, function (result) {
                console.log("delete reference")
                d.resolve(result);
            })
        return d.promise;
    }

    Gift.prototype.removeAllImageRef = function (giftId, images) {
        var d = q.defer();
        if (images && images.length) {
            console.log('removing all imaging references')
            var urls = [];
            images.forEach(function (image) {
                urls.push(image.url);
            })

            giftId = this.GiftDB.id(giftId);
            this.GiftDB.update(
                {_id: giftId},
                {$pull: {images: {url: {$in: urls}}}}, {multi: true}, function (result) {
                    console.log("removed all references");
                    console.log(result)
                    d.resolve(result);
                })
        }
        else {
            console.log('no imaging references')
            d.resolve(0)
        }
        return d.promise;
    }

    Gift.prototype.delete = function (giftId) {
        var d = q.defer();
        this.GiftDB.remove({_id: this.GiftDB.id(giftId)}, function (e, result) {
            result === 1 ? d.resolve() : d.reject();
        });
        return d.promise;
    }

    var linkImage = function (gift, image, _self) {
        var defer = q.defer();
        _self.GiftDB.update(
            {_id: gift._id},
            {$push: {images: image}},
            function (err, result) {
                if (result) {
                    defer.resolve(image._id);
                }
                else {
                    defer.reject(err);
                }
            }
        );
        return defer.promise;
    }

    return new Gift();
}

