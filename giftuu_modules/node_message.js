var q = require("q");
/*
var message = {
    "giftId": "538457a98dea0d37d6000001",
    "from": "538456f963283b36e2729f1f",
    "to": "538456f963283b36e2729f1f",
    "title": "ipad",
    "body": "ry",
    "read": true,
    "created": ISODate("2014-05-30T12:34:37.737Z"),
    "_id": ObjectId("53887addb62ccd0527000005")
}
*/
module.exports = function (db) {
    function Message() {
        this.MessageDB = db.collection("messages");
    }

    Message.prototype.findByGift = function (giftId, limit, skip) {
        var deferred = q.defer();
        this.MessageDB.find({giftId: giftId}, {sort: [
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

    Message.prototype.findNewByReceiver = function (userId, limit, skip) {
        var deferred = q.defer();
        this.MessageDB.find({to: userId.toString(), read: false}, {limit: limit, skip: skip, sort: [
            ["created", -1]
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

    Message.prototype.findAllByReceiver = function (userId, limit, skip) {
        var deferred = q.defer();
        this.MessageDB.find({to: userId.toString()}, {limit: limit, skip: skip, sort: [
            ["created", -1]
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

    Message.prototype.findAll = function (query, limit, skip) {
        var deferred = q.defer();
        this.MessageDB.find(query, {limit: limit, skip: skip, sort: [
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

    Message.prototype.add = function (giftId, from, to, title, content) {
        var deferred = q.defer();
        if (from.toString() != to.toString()) {
            var postMessage = {
                giftId: giftId,
                from: from.toString(),
                to: to.toString(),
                title: title,
                body: content,
                read: false,
                created: new Date()
            }
            this.MessageDB.save(postMessage, function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            });
        }
        else {
            deferred.resolve(null);
        }
        return deferred.promise;
    }

    Message.prototype.markAllAsRead = function (userId) {
        var deferred = q.defer();
        this.MessageDB.update({to: userId.toString()}, {$set: {read: true}}, {multi: true},
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            })
        return deferred.promise;
    }

    Message.prototype.update = function (gift) {

    }

    Message.prototype.deleteAll = function (giftId) {
        var deferred = q.defer();
        this.MessageDB.remove({giftId: giftId}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                console.log("deleted Messages");
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }

    return new Message();
}

