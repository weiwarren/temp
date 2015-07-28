var q = require("q");

module.exports = function (db) {

    function User() {
        this.UserDB = db.collection("users");
    }

    User.prototype.id = function (id) {
        return this.UserDB.id(id);
    }

    User.prototype.isAdmin = function (userId) {
        var deferred = q.defer();
        this.UserDB.findOne({_id: this.UserDB.id(userId), admin: true}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    User.prototype.registered = function (userId) {
        var deferred = q.defer();
        this.UserDB.findOne({
            _id: this.UserDB.id(userId),
            email: {$ne: null},
            location: {$ne: null}
        }, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else if (result) {
                deferred.resolve(result);
            }
        });
        return deferred.promise;
    }

    User.prototype.find = function (userId) {
        var deferred = q.defer();
        this.UserDB.findOne({_id: this.UserDB.id(userId)}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else if (result) {
                deferred.resolve({
                    _id: result._id,
                    active: result.active,
                    aboutMe: result.aboutMe,
                    displayName: result.displayName,
                    email: result.email,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    gender: result.gender,
                    heart: result.heart < 0 ? 0 : result.heart,
                    location: result.location,
                    midName: result.midName,
                    profileId: result.profileId,
                    profilePictureUrl: result.profilePictureUrl,
                    wishes: result.wishes,
                    modified: new Date(),
                    provider: result.provider,
                    deactivated: result.deactivated,
                    isAdmin: result.isAdmin

                });
            }
        });
        return deferred.promise;
    };

    User.prototype.findActive = function (userId) {
        var deferred = q.defer();
        this.UserDB.findOne({_id: this.UserDB.id(userId), active: true}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else if (result) {
                deferred.resolve({
                    _id: result._id,
                    aboutMe: result.aboutMe,
                    active: true,
                    displayName: result.displayName,
                    email: result.email,
                    firstName: result.firstName,
                    lastName: result.lastName,
                    gender: result.gender,
                    heart: result.heart,
                    location: result.location,
                    midName: result.midName,
                    profileId: result.profileId,
                    profilePictureUrl: result.profilePictureUrl,
                    wishes: result.wishes,
                    modified: new Date(),
                    provider: result.provider,
                    deactivated: result.deactivated

                });
            }
        });
        return deferred.promise;
    };

    //add through facebook or google oauth
    User.prototype.add = function (profile) {
        var deferred = q.defer();
        console.log("====", profile);
        this.UserDB.findAndModify(
            //query
            {profileId: profile.id, provider: profile.provider},
            //sort
            {},
            //update query
            {
                $set: {
                    profileId: profile.id,
                    displayName: profile.displayName,
                    provider: profile.provider,
                    profilePictureUrl: profile._json.pictureUrl,
                    lastName: profile.name.familyName,
                    midName: profile.name.middleName,
                    firstName: profile.name.givenName,
                    email: profile.emails ? profile.emails[0].value : profile._json.email,
                    lastLoginDate: (new Date()),
                    active: true,
                    modified: new Date(),
                    schema: profile,
                    isAdmin: profile.isAdmin
                },
                $setOnInsert: {
                    heart: 1,
                    created: (new Date())
                }
            },
            {upsert: true, new: true}, //options - upsert: insert new if not find, new: return newly insert result
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                }
                else {
                    deferred.resolve(result);
                }
            }
        );
        return deferred.promise;
    }

    //register user with email and address
    User.prototype.update = function (user, req) {
        var deferred = q.defer();
        var info = {modified: new Date()};
        if (req.address) {
            info.location = JSON.parse(req.address);
            info.loc = info.location.geometry.location;
        }
        if (req.wishes) {
            info.wishes = req.wishes;
        }
        if (req.aboutMe) {
            info.aboutMe = req.aboutMe;
        }
        if (req.email) {
            info.email = req.email;
        }
        this.UserDB.findAndModify(
            //query
            {profileId: user.profileId, provider: user.provider},
            //sort
            {},
            //update query
            {
                $set: info
            },
            {new: true},
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                }
                else {
                    deferred.resolve(result);
                }
            }
        );
        return deferred.promise;
    }

    User.prototype.updateHeart = function (userId, rating) {
        var deferred = q.defer();
        this.UserDB.update(
            {_id: this.UserDB.id(userId)},
            {
                $inc: {heart: rating},
                $set: {modified: new Date()}
            },
            function (e, result) {
                if (e) {
                    deferred.reject(e);
                }
                else {
                    deferred.resolve(result);
                }
            }
        );
        return deferred.promise;
    }

    User.prototype.deleteProfile = function (userId) {
        var deferred = q.defer();
        this.UserDB.update({_id: userId}, {
            $unset: {
                schema: null,
                profilePictureUrl: null
            }, $set: {displayName: 'Unknown', active: false, modified: new Date()}
        }, {}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }

    User.prototype.deactivate = function (userId) {
        var deferred = q.defer();
        this.UserDB.update(
            {_id: this.UserDB.id(userId)},
            {
                $set: {
                    active: false,
                    deactivated: true
                }
            },
            {}, function (e, result) {
                if (e) {
                    deferred.reject(e);
                } else {
                    deferred.resolve(result);
                }
            });
        return deferred.promise;
    }

    User.prototype.remove = function (userId) {
        var deferred = q.defer();
        this.UserDB.remove({_id: this.UserDB.id(userId)}, function (e, result) {
            if (e) {
                deferred.reject(e);
            } else {
                deferred.resolve(true);
            }
        });
        return deferred.promise;
    }

    return new User();
}

