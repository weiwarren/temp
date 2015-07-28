var q = require("q");
/*
var giftrating = {
     "from" : ObjectId("53a6a630d77c0ca049779992"),
     "to" : ObjectId("53a6a630d77c0ca049779992"),
     "rating" : 2,
     "giftId" : "53a6a973d25d580093000033",
     "giftuuId" : "53a6ab9dd77c0ca049779999",
     "created" : ISODate("2014-06-22T10:11:17.016Z"),
     "_id" : ObjectId("53a6abc5d25d580093000081")

}
* */

module.exports = function (db) {
    function GiftRating() {
        this.GiftRaingDB = db.collection("giftratings");
    }

    GiftRating.prototype.id = function (id) {
        return this.GiftRaingDB.id(id);
    }

    GiftRating.prototype.find = function (id) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRaingDB.findOne({_id: _self.GiftDB.id(id)}, function (err, doc) {
            if (doc) {
                deferred.resolve(doc);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    };

    GiftRating.prototype.findRatedGiftIds = function (userId) {
        var deferred = q.defer();
        var _self = this;
        var giftIds = [];

        _self.GiftRaingDB.find({from: userId},{}).toArray(function (err, docs) {
            if (docs) {
                for (var i = 0; i < docs.length; i++) {
                    giftIds.push(docs[i].giftId);
                }
                deferred.resolve(giftIds);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    }

    GiftRating.prototype.userRatedForGift = function(userId, giftId){
        var deferred = q.defer();
        this.GiftRaingDB.findOne({giftId: giftId, from: userId}, function (err, doc) {
            deferred.resolve(doc != null);
        });
        return deferred.promise;
    }

    GiftRating.prototype.hasRating = function (giftId) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRaingDB.findOne({giftId: giftId}, function (err, doc) {
            deferred.resolve(doc != null);
        });
        return deferred.promise;

    }

    GiftRating.prototype.rated = function (userId, giftId) {
        var deferred = q.defer();
        var _self = this;
        _self.GiftRaingDB.findOne({from: userId, giftId: giftId}, function (err, doc) {
            deferred.resolve(doc != null);
        });
        return deferred.promise;
    }

    GiftRating.prototype.rate = function (from, to, request) {
        var deferred = q.defer(),
            _self = this,
            rating = 0;
        switch (parseInt(request.rating)) {
            case 1:
                rating = -2;
                break;
            case 2:
                rating = -1;
                break;
            case 3:
                rating = 0;
                break;
            case 4:
                rating = 1;
                break;
            case 5:
                rating = 2;
                break;
        }
        _self.GiftRaingDB.save({
            from: from,
            to: to,
            rating: rating,
            giftId: request.giftId,
            giftuuId: request.giftuuId,
            created: new Date()
        }, function (err, doc) {
            if (doc) {
                deferred.resolve(rating);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    }

    return new GiftRating();
}

