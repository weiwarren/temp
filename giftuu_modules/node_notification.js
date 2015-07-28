var q = require("q");
/*
var notification = {
    "from" : ObjectId("538456f963283b36e2729f1f"),
    "to" : ObjectId("538456f963283b36e2729f1f"),
    "type" : "askGift",
    "body" : null,
    "gift" : {
        "_id" : ObjectId("538457a98dea0d37d6000001"),
        "giftType" : "thing",
        "title" : "ipad"
    },
    "read" : true,
    "created" : ISODate("2014-05-30T12:32:58.776Z"),
    "_id" : ObjectId("53887a7ab62ccd0527000002")
}
*/
module.exports = function (db) {
    function Notification() {
        this.NotificationDB = db.collection("notifications");
    }

    Notification.prototype.findNewByReceiver = function (userId, limit, skip) {
        var deferred = q.defer();
        this.NotificationDB.find({to: userId, read: false}, {sort: [
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

    Notification.prototype.findAllByReceiver = function (userId, limit, skip) {
        var deferred = q.defer();
        this.NotificationDB.find({to: userId}, {sort: [
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

    Notification.prototype.findByGift = function (giftId, limit, skip) {
        var deferred = q.defer();
        this.NotificationDB.find({giftId: giftId}, {sort: [
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

    Notification.prototype.findAll = function (query, limit, skip) {
        var deferred = q.defer();
        this.NotificationDB.find(query, {limit: limit, skip: skip, sort: [
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

    // from: notifications raised from
    // to: notification send to
    // type: type of notifications
    // content: text content of the message
    // gift: gift reference
    Notification.prototype.add = function (from, to, type, content, gift) {
        var deferred = q.defer();
        if (from && to && from.toString() != to.toString()) {
            var notification = {
                from: from,
                to: to,
                type: type,
                body: content,
                gift: {
                    _id: gift._id,
                    giftType: gift.giftType,
                    title: gift.title
                },
                read: false,
                created: new Date()
            }
            this.NotificationDB.save(notification, function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            });
        }
        else{
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    Notification.prototype.update = function (gift) {

    }

    Notification.prototype.markAllAsRead = function (to) {
        var deferred = q.defer();
        this.NotificationDB.update({to: to}, {$set: {read: true}}, {multi: true},
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            })
        return deferred.promise;
    }

    Notification.prototype.deleteAll = function (giftId) {
        var deferred = q.defer();
        this.NotificationDB.remove({giftId: giftId}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                console.log("deleted Notifications");
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }

    Notification.prototype.count = function (giftId) {
        var deferred = q.defer();
        this.NotificationDB.count({giftId: giftId}, function (e, count) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    }

    return new Notification();
}

