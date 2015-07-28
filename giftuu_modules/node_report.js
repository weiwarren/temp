var q = require("q");
/*
 var report = {
     "_id" : ObjectId("53a6b6fed77c0ca0497799ab"),
     "from" : ObjectId("53a4060fd77c0ca049779991"),
     "reason" : null,
     "refId" : "53a6a76fd25d58009300000d",
     "type" : "gift"
 }
 * */
module.exports = function (db) {
    function Report() {
        this.ReportDB = db.collection("reports");
    }

    Report.prototype.id = function (id) {
        return this.ReportDB.id(id);
    }

    Report.prototype.count = function(query){
        var deferred = q.defer();
        this.ReportDB.count(query, function (err, result) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(result)
            }
        });
        return deferred.promise;
    };

    Report.prototype.findByUserRef = function (userId, refId) {
        var deferred = q.defer();
        var _self = this;
        _self.ReportDB.findOne({from: userId, refId: refId}, function (err, doc) {
            if (err) {
                deferred.reject(err);
            }
            else {
                deferred.resolve(doc)
            }
        });
        return deferred.promise;
    };

    Report.prototype.findByReference = function (refId) {
        var deferred = q.defer();
        var _self = this;
        _self.ReportDB.find({refId: refId}, {}).toArray(function (err, docs) {
            if (docs) {
                deferred.resolve(docs);
            }
            else {
                deferred.reject(err);
            }
        });
        return deferred.promise;
    };

    Report.prototype.findAll = function (query) {
        var deferred = q.defer();
        this.ReportDB.find(query).toArray(function (err, results) {
            deferred.resolve(results);
        })
        return deferred.promise;
    }

    Report.prototype.add = function (from, type, refId, reason) {
        var deferred = q.defer();
        var _self = this;
        _self.ReportDB.findAndModify({
                from: from,
                refId: refId,
                type: type
            },
            {},
            {
                $set: {
                    from: from,
                    type: type,
                    refId: refId,
                    reason: reason
                }
            },
            {
                upsert: true
            },
            function (err, result) {
                deferred.resolve(result);
            })
        return deferred.promise;
    }

    return new Report();
}

