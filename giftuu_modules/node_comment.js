var q = require("q");
/*
var comment = {
    "from": ObjectId("538456f963283b36e2729f1f"),
    "on": "538457a98dea0d37d6000001",
    "comment": null,
    "created": ISODate("2014-05-30T12:32:58.764Z"),
    "type": "wishGift",
    "_id": ObjectId("53887a7ab62ccd0527000001")
}*/
module.exports = function (db) {
    var VIEW_GIFT_TYPE = 'viewGift',
        WISH_GIFT_TYPE = 'wishGift',
        PICKUP_GIFT_TYPE = 'pickupGift';

    function Comment() {
        this.CommentDB = db.collection("comments");
    }

    Comment.prototype.findByGift = function (on, limit, skip) {
        var deferred = q.defer();
        this.CommentDB.find({on: on, type: VIEW_GIFT_TYPE}, {sort: [
            ["_id", -1]
        ], limit: limit, skip: skip}).toArray(
            function (e, results) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(results);
                }
            });
        return deferred.promise;
    };

    Comment.prototype.countGiftuu = function (on) {
        var deferred = q.defer();
        this.CommentDB.count({on: on, type: PICKUP_GIFT_TYPE}, function (e, count) {
            if (e) {
                deferred.reject(e)
            }
            else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    };

    Comment.prototype.findByGiftuu = function (on, limit, skip) {
        var deferred = q.defer();
        this.CommentDB.find({on: on, type: PICKUP_GIFT_TYPE}, {sort: [
            ["_id", -1]
        ], limit: limit, skip: skip}).toArray(
            function (e, results) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(results);
                }
            });
        return deferred.promise;
    };

    Comment.prototype.findActivitiesByGift = function (on, limit, skip) {
        var deferred = q.defer();
        this.CommentDB.find({on: on, $or: [
            {"type": VIEW_GIFT_TYPE},
            {"type": WISH_GIFT_TYPE}
        ]}, {sort: [
            ["_id", -1]
        ], limit: limit, skip: skip}).toArray(
            function (e, results) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(results);
                }
            });
        return deferred.promise;
    };

    Comment.prototype.findAll = function (query, limit, skip) {
        var deferred = q.defer();
        this.CommentDB.find(query, {limit: limit, skip: skip, sort: [
            ["_id", -1]
        ]}).toArray(
            function (e, results) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(results);
                }
            });
        return deferred.promise;
    };


    Comment.prototype.add = function (from, on, type, content, title) {
        var deferred = q.defer();
        var comment = {
            from: from,
            on: on,
            type: type,
            title: title,
            comment: content,
            created: new Date()
        }
        this.CommentDB.save(comment, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    Comment.prototype.update = function (gift) {

    }

    Comment.prototype.deleteAllByGift = function (giftId) {
        var deferred = q.defer();
        this.CommentDB.remove({on: giftId}, function (e) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }

    Comment.prototype.countReview = function (on) {
        var deferred = q.defer();
        this.CommentDB.count({on: on}, function (e, count) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    }


    Comment.prototype.count = function (on) {
        var deferred = q.defer();
        this.CommentDB.count({on: on, type: VIEW_GIFT_TYPE}, function (e, count) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    }
    return new Comment();


}

