var q = require("q");
/*
 var wisher = {
 "from": ObjectId("538456f963283b36e2729f1f"),
 "on": "538457a98dea0d37d6000001",
 "comment": null,
 "created": ISODate("2014-05-30T12:32:58.764Z"),
 "type": "wishGift",
 "_id": ObjectId("53887a7ab62ccd0527000001")
 }*/
//wisher is added to the comment collections for aggregation purpose
module.exports = function (db) {
    function Wisher() {
        this.WisherDB = db.collection("comments");
    }

    Wisher.prototype.id = function (id) {
        return this.WisherDB.id(id);
    }

    Wisher.prototype.findByGift = function (giftId, limit, skip) {
        var deferred = q.defer();
        var _self = this;
        _self.WisherDB.find({on: giftId.toString(), type: 'wishGift'}, {sort: [
            ["_id", -1]
        ], limit: limit, skip: skip}).toArray(function (err, docs) {
                if (docs) {
                    deferred.resolve(docs);
                }
                else {
                    deferred.reject(err);
                }
            });
        return deferred.promise;
    }

    // wisher is associated with gift and user
    Wisher.prototype.find = function (giftObjId, userId) {
        var d = q.defer()
        this.WisherDB.findOne({from: userId, on: giftObjId.toString(), type: 'wishGift'}, function (e, result) {
            if (e) {
                d.reject(e);
            }
            else {
                d.resolve(result);
            }
        });
        return d.promise;
    }

    Wisher.prototype.findByUser = function (userId) {
        var d = q.defer();
        this.WisherDB.find({from: userId, type: 'wishGift'}, {sort: [
            ["_id", -1]
        ]}).toArray(function (e, docs) {
                if (e) {
                    d.reject(e);
                }
                else {
                    d.resolve(docs);
                }
            });
        return d.promise;
    }


    Wisher.prototype.findAll = function (query) {
        var deferred = q.defer(),
            _self = this;
        query.type = 'wishGift';
        _self.WisherDB.find(query, {sort: [
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
    }

    Wisher.prototype.update = function (giftObjId, userId, request) {
        var d = q.defer();
        this.WisherDB.save({from: userId, on: giftObjId.toString(), comment: request, created: new Date(), type: 'wishGift'}, function (e, result) {
            if (e) d.reject(e);
            else {
                if (result)
                    d.resolve();
                else
                    d.reject();
            }
        })
        return d.promise;
    }

    Wisher.prototype.deleteAll = function (giftId) {
        var deferred = q.defer();
        this.WisherDB.remove({on: giftId.toString(), type: 'wishGift'}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                console.log("deleted wishers");
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    Wisher.prototype.count = function (giftId) {
        var deferred = q.defer();
        this.WisherDB.count({on: giftId, type: 'wishGift'}, function (e, count) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(count);
            }
        });
        return deferred.promise;
    }

    return new Wisher();
}

