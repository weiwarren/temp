var q = require("q");
/*
giftuu = {
     _id: [string],

     contactEmail: [string],

     contactNumber: [int],

     created: [datetime UTC],

     exchangeDate: [datetime UTC],

     exchangeTime: [dattime UTC],

     giftId: [string],

     location: [gmap object],

     modified: [datetime],

     wishersId: [string array]
}
*/

module.exports = function (db) {

    function Giftuu() {
        this.GiftuuDB = db.collection("giftuu");
    }

    Giftuu.prototype.findByGift = function (giftId, limit, skip) {
        var deferred = q.defer();
        this.GiftuuDB.find({giftId: giftId}, {sort: [
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

    Giftuu.prototype.findByReceiver = function (userId) {
        var deferred = q.defer();
        this.GiftuuDB.find({ wishersId: {$in: [userId.toString()]}}).toArray(function (e, results) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(results);
            }
        });
        return deferred.promise;
    }

    Giftuu.prototype.isReceiver = function (giftId, userId) {
        var deferred = q.defer();
        this.GiftuuDB.findOne({giftId: giftId, wishersId: {$in: [userId.toString()]}}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    Giftuu.prototype.findReceivers = function (giftId) {
        var deferred = q.defer();
        this.GiftuuDB.findOne({giftId: giftId}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(result?result.wishersId:[]);
            }
        });
        return deferred.promise;
    }

    Giftuu.prototype.findAll = function (query, limit, skip) {
        var deferred = q.defer();
        this.GiftuuDB.find(query, {limit: limit, skip: skip, sort: [
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

    Giftuu.prototype.add = function (giftuu) {
        var deferred = q.defer();
        giftuu.created = new Date();
        this.GiftuuDB.save(giftuu, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    Giftuu.prototype.save = function (request) {
        var deferred = q.defer();
        this.GiftuuDB.findAndModify({giftId: request.giftId},
            {},
            {
                $set: {
                    giftId: request.giftId,
                    wishersId: request.wishersId,
                    exchangeDate: request.exchangeDate ? new Date(request.exchangeDate) : null,
                    exchangeTime: request.exchangeTime ? new Date(request.exchangeTime) : null,
                    contactEmail: request.contactEmail,
                    contactNumber: request.contactNumber,
                    room: request.room,
                    location: request.location,
                    modified: (new Date())
                },
                $setOnInsert: {
                    created: (new Date())
                }
            },
            {upsert: true, new: true},
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            });
        return deferred.promise;
    }

    Giftuu.prototype.deleteAll = function (giftId) {
        var deferred = q.defer();
        this.GiftuuDB.remove({giftId: giftId}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }


    return new Giftuu();
}

