//todo: consistent ids storage and link id
//      consitent case sensitve e.g. ID, Id,id ==> ID
//      split the logic to multiple file blocks and use require
//third party modules
var express = require("express")
    , mongoskin = require("mongoskin")
    , http = require("http")
    , fs = require("fs")
    , passport = require("passport")
    , FacebookStrategy = require("passport-facebook").Strategy
    , GoogleStrategy = require("passport-google-oauth").OAuth2Strategy
    , LinkedinStrategy = require("passport-linkedin-oauth2").OAuth2Strategy
    , url = require("url")
    , mongostore = require('connect-mongo-store')(express)
    , winston = require("winston")
    , moment = require("moment")
    , socket = require("socket.io")
    , events = require("events")
    , mailer = require("express-mailer")
    , q = require("q")
    , MailChimpAPI = require('mailchimp').MailChimpAPI;
var app = express();

var apikey = 'a173dd455c1826ffb45c5eae1d5fb130-us8';

try {
    var api = new MailChimpAPI(apikey, {version: '2.0'});
} catch (error) {
    console.log(error.message);
}

// mongodb setup
var db_connection_string = "";

app.configure('localhost', function () {
    db_connection_string = "mongodb://localhost:27017/giftuudb";
});
app.configure('development', function () {
    db_connection_string = "mongodb://localhost:27017/giftuudb";
});

app.configure('uat', function () {
    db_connection_string = "mongodb://giftuu_uat:hepu11edhispantsup@galaga.0.mongolayer.com:10087/giftuu_uat";
});

app.configure('production', function () {
    db_connection_string = "mongodb://giftuu_prod:hepu11edhispantsup@galaga.0.mongolayer.com:10090/giftuu_prod";
});


//session store
var sessionStore = new mongostore(db_connection_string);

// configure Express
app.set('port', process.env.PORT || 80);
app.configure(function () {
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.logger());
    app.use(express.cookieParser());
    //app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/public/uploads" }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.session({secret: "top", key: 'express.sid', store: sessionStore, maxAge: (24 * 60 * 60 * 100)}));
    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});
//constants
//var defaultUploadFolder = __dirname + "/public/uploads/";

//constructor
var db = mongoskin.db(db_connection_string, {safe: true, slave_ok: true})

//db collections
var gift = require('./giftuu_modules/node_gift')(db)

    , report = require('./giftuu_modules/node_report')(db)

    , image = require('./giftuu_modules/node_image')(db)

    , comment = require('./giftuu_modules/node_comment')(db)

    , wisher = require('./giftuu_modules/node_wisher')(db)

    , user = require('./giftuu_modules/node_user')(db)

    , giftuu = require('./giftuu_modules/node_giftuu')(db)

    , message = require('./giftuu_modules/node_message')(db)

    , notification = require('./giftuu_modules/node_notification')(db)

    , giftrating = require('./giftuu_modules/node_giftrating')(db)

    , facebook = require('./giftuu_modules/node_facebook')();

mailer.extend(app, {
    'from': 'donotreply@giftuu.com',
    'host': 'smtpout.asia.secureserver.net',
    'secureConnection': true,
    'transportMethod': 'SMTP',
    'port': 465,
    'auth': {
        'user': 'donotreply@giftuu.com',
        'pass': 'Hepu11edhispantsup'
    }
});

// logger
var logger = new (winston.Logger)({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({filename: "giftuu-logs.log"})
    ],
    exceptionHandlers: [
        new winston.transports.File({filename: "giftuu-exceptions.log"})
    ]
});

// app vars
var EXPIRY_DAYS = 365;
var USER_DEACTIVATION_THRESHOLD = 2;
var GIFT_DEACTIVATION_THRESHOLD = 2;

app.param("collectionName", function (req, res, next, collectionName) {
    req.collection = db.collection(collectionName)
    return next()
})

// authentication

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.  However, since this example does not
//   have a database of user records, the complete Facebook profile is serialized
//   and deserialized.

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    user.find(obj._id).then(function (user) {
        done(null, user);
    });
});

app.get("/profile/:id", function (req, res) {
    user.find(req.params.id).then(function (result) {
        res.send(result);
    }).fail(function () {
        res.send(401);
    })
})

app.put("/myprofile", function (req, res) {
    res.redirect("#!/notifications");
})

app.get("/account", function (req, res) {
    if (req.user) {
        user.find(req.user._id)
            .then(function (result) {
                res.send(200, result);
            })
            .fail(function () {
                res.send(401);
            })
    }
    else {
        res.send(404);
    }

});

app.get("/login", ensureAuthenticated, function (req, res) {
    //res.send({ user: req.user });
    res.send({user: req.user});
    //res.render("login", { user: req.profile });
});

app.get("/logout", function (req, res) {
    req.logout();
    res.redirect("/");
});

// need to change to async call
app.put("/registration", ensureAuthenticated, function (req, res, next) {
    if (req.body.wishes) {
        req.body.wishes.forEach(function (wish, index) {
            req.body.wishes[index] = JSON.parse(wish)
        })
    }


    user.update(req.user, req.body).then(function (result) {
        //Sign up to mailchimp if email exists and if subscribe is ticked
        if (req.user.email && req.body.subscribe) {
            var email =
            {
                email: req.user.email
            };
            api.call('lists', 'subscribe', {id: '1002c49303', email: email}, function (error, data) {
                if (error)
                    console.log(error.message);
                /*console.log(JSON.stringify(data));*/
           });
        }
        res.redirect('/');
    }
    ).fail(function () {
        req.logout();
        res.redirect("#/login");
    })
});

app.get("/profile/:id?", ensureRegistration, function (req, res, next) {
    var userId = req.params.id || req.user._id;
    user.find(userId).then(function (result) {
        res.send(200, result);
    }).fail(function () {
        res.send(500);
    })
});

app.put("/profile", ensureRegistration, function (req, res) {
    user.update(req.user, req.body).then(function (result) {
        res.send(200, result);
    }).fail(function () {
        res.send(500);
    })
});

app.delete("/profile", ensureAuthenticated, function (req, res) {
    user.deleteProfile(req.user._id).then(function (result) {
        gift.findAll({userId: user.id(req.user._id), status: "available"}).then(function (gifts) {
            for (var i = 0; i < gifts.length; i++)
                gift.deactivate(gifts[i]._id);
        });
        req.logout();
        //console.log(result);
        //calculate the matrix for the user region
        res.send(200, result);
    }).fail(function () {
        res.send(500);
    })
});

/* report and deactivate users after x number reports */
app.post("/reportProfile/:userId", ensureRegistration, function (req, res) {
    report.add(req.user._id, "user", req.params.userId, req.body.reason).then(function () {
        report.count({refId: req.params.userId}).then(function (result) {
            if (result >= USER_DEACTIVATION_THRESHOLD) {
                console.log(req.params.userId)
                gift.deactivateByUser(user.id(req.params.userId));
                user.deactivate(req.params.userId);
            }
        })
        res.send(200);
    }).fail(function () {
        res.send(500);
    });
})

// Use the FacebookStrategy within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
var FACEBOOK_APP_ID = "259214729757"
var FACEBOOK_APP_SECRET = "bbab6b14d13f04e216b6ef66b29b098e";
passport.use(new FacebookStrategy({
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: "/auth/facebook/callback"
    },
    function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...

        process.nextTick(function () {
            // facebook way of storing user image;
            profile.profilePictureUrl = "https://graph.facebook.com/" + profile.id + "/picture";
            profile.accessToken = accessToken;
            user.add(profile).then(function (result) {
                return done(null, result);
            });
        });
    }
));

// GET /auth/facebook
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  The first step in Facebook authentication will involve
//   redirecting the user to facebook.com.  After authorization, Facebook will
//   redirect the user back to this application at /auth/facebook/callback
app.get("/auth/facebook", function (req, res, next) {
    var url_parts = url.parse(req.url, true);
    //{redirectUrl: "/XXXX"}
    var url_query = url_parts.query;
    if (url_query.redirectUrl) {
        req.session.redirectUrl = url_query.redirectUrl;
    }
    else {
        req.session.redirectUrl = "/";
    }
    passport.authenticate("facebook"
        , {scope: ['basic_info', 'email']}
    )(req, res, next);
});


// Use the LinkedIn within Passport.
//   Strategies in Passport require a `verify` function, which accept
//   credentials (in this case, an accessToken, refreshToken, and Facebook
//   profile), and invoke a callback with a user object.
var Linkedin_APP_ID = "75y0nshs69nt2w"
var Linkedin_APP_SECRET = "XoRQefudC1pwjyne";
passport.use(new LinkedinStrategy({
        clientID: Linkedin_APP_ID,
        clientSecret: Linkedin_APP_SECRET,
        callbackURL: "/auth/linkedin/callback",
        scope: ['r_emailaddress', 'r_basicprofile']
    },
    function (accessToken, refreshToken, profile, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            // facebook way of storing user image;
            profile.profilePictureUrl = profile.pictureUrl;
            profile.accessToken = accessToken;
            user.add(profile).then(function (result) {
                return done(null, result);
            });
        });
    }
));

app.get("/auth/linkedin", function (req, res, next) {
    var url_parts = url.parse(req.url, true);
    //{redirectUrl: "/XXXX"}
    var url_query = url_parts.query;
    if (url_query.redirectUrl) {
        req.session.redirectUrl = url_query.redirectUrl;
    }
    else {
        req.session.redirectUrl = "/";
    }
    passport.authenticate("linkedin"
        , {state: true}
    )(req, res, next);
});

app.get("/auth/linkedin/callback", function (req, res, next) {
    passport.authenticate("linkedin", function (err, user, info) {
        // This is the default destination upon successful login.
        if (err) {
            return next(err);
        }
        else {
            var redirectUrl = "#/";
            if (user && !user.location) {
                redirectUrl = "#/registration/step2";
            }
            req.logIn(user, function (err) {
                res.send(err);
            });
            res.redirect(redirectUrl);
        }
    })(req, res, next);
});

app.get("/me/friends", function (req, res, next) {
    facebook.getFriendsList(req.user.schema.accessToken).then(function (result) {
        res.send(200, result)
    })
});

app.get("/facebook/message", function (req, res, next) {
    passport.authenticate("facebook"
        , {scope: ['publish_stream']}, function () {
            user.find(req.user._id).then(function (result) {
                facebook.postMessage(result.profileId, result.schema.accessToken, "said");
            })
        }
    )(req, res, next);

});

// GET /auth/facebook/callback
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.get("/auth/facebook/callback", function (req, res, next) {
    passport.authenticate("facebook", function (err, user, info) {
        // This is the default destination upon successful login.
        if (err) {
            return next(err);
        }
        else {
            var redirectUrl = "#/";
            if (user && !user.location) {
                redirectUrl = "#/registration/step2";
            }
            req.logIn(user, function (err) {
                res.send(err);
            });
            res.redirect(redirectUrl);
        }

    })(req, res, next);
});

var GOOGLE_CLIENT_ID = "404885926424.apps.googleusercontent.com";
var GOOGLE_CLIENT_SECRET = "xqDDZkAeUavmkS4BQ4N1uhBS";
passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/return"
    },
    function (accessToken, refreshToken, profile, done) {
        process.nextTick(function () {
            profile.profilePictureUrl = profile._json["picture"];
            user.add(profile).then(function (result) {
                return done(null, result);
            });
        });
        /*User.findOrCreate({ openId: identifier }, function(err, user) {
         done(err, user);
         });*/
    }
));


// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
//     /auth/google/return
app.get("/auth/google",
    passport.authenticate("google", {
        scope: ["https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email"]
    }),
    function (req, res) {
        // The request will be redirected to Google for authentication, so this
        // function will not be called.
    });

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get("/auth/google/return",
    passport.authenticate("google", {failureRedirect: "/login"}),
    function (req, res) {
        res.redirect("/");
    });

///gifts
///gift status: available, requested, given, expired, delisted
app.get("/viewGift", function (req, res, next) {
    gift.find(req.query.id).then(function (result) {
        user.find(result.userId).then(function (owner) {
            var giftType = result.giftType;
            if (giftType != 'help') {
                giftType = 'a ' + giftType;
            }
            var giftBrief = {
                title: result.title,
                owner: owner.displayName || 'Unknown',
                description: result.description,
                giftType: giftType,
                url: req.protocol + '://' + req.host + '/viewGift/?id=' + result._id,
                giftId: result._id
            }

            if (result.images.length) {
                giftBrief.image = result.images[0].url;
            }

            res.render('gift', giftBrief);
        })

    });
});

app.get("/gifts/:id", function (req, res, next) {
    gift.find(req.params.id).then(function (result) {
        res.send(200, result)
    }).fail(function () {
        res.send(404)
    });
});

app.get("/giftsV2/:id", function (req, res, next) {
    gift.find(req.params.id).then(function (result) {
        if (result.status == "available") {
            //find the expiry date of the gift
            var expiryDate = new Date(moment().subtract(EXPIRY_DAYS, 'days'));
            if (result.created <= expiryDate) {
                result.status = "expired";
            }
            res.send(200, result);
        }
        else if (result.status == "given") {
            //given to the current user or others
            if (req.user && result.receivers.indexOf(req.user._id) > -1) {
                giftrating.userRatedForGift(user.id(req.user._id), result._id).then(function (rated) {
                    if (rated) {
                        result.status = "rated";
                    }
                    res.send(200, result);
                })
            }
            else {
                res.send(200, result);
            }
        }
    }).fail(function () {
        res.send(404)
    });
});

//get gifts by radius to the user location
app.get("/findByRadius", ensureRegistration, function (req, res, next) {
    var
        limit = req.query.limit,
        skip = req.query.skip,
        radius = req.query.radius,
        query = req.query.query,
        giftType = req.query.giftType,
        userId = req.user._id,
        userLocationGeo = req.user.location.geometry.location,
        expiryDate = new Date(moment().subtract(EXPIRY_DAYS, 'days').format()),
        center = [];

    for (var key in userLocationGeo) {
        if (parseFloat(userLocationGeo[key])) {
            center.unshift(userLocationGeo[key])
        }
    }

    var findRadiusGifts = gift.findByRadius(userId, query, giftType, center, radius, expiryDate, limit, skip)
    findRadiusGifts.then(function (radiusGifts) {
        res.send(200, radiusGifts);
    }).fail(function (err) {
        res.send(500, err)
    })
});

//get all available listed gifts sort by created date
app.get("/findAllGifts/:limit/:skip", function (req, res, next) {
    var limit = req.params.limit,
        skip = req.params.skip,
        query = {$regex: req.query.query, $options: 'i'},
        giftType = {$regex: req.query.giftType, $options: 'i'},
        expiryDate = new Date(moment().subtract(EXPIRY_DAYS, 'days').format());

    gift.findAll({
        status: "available",
        $or: [
            {"title": query},
            {"description": query}
        ],
        "giftType": giftType,
        activityDate: {$gte: expiryDate}
    }, limit, skip)
        .then(function (results) {
            res.send(200, results);
        }).fail(function (err) {
            res.send(500, err)
        })
});


//report
app.post("/reportGift/:giftId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    //from, to, type
    report.add(req.user._id, "gift", req.params.giftId, req.body.reason).then(function () {
        report.count({refId: req.params.giftId}).then(function (result) {
            gift.updateProperty(req.params.giftId, {reported: true});
            if (result >= GIFT_DEACTIVATION_THRESHOLD) {
                gift.deactivate(req.params.giftId).then(function () {
                    res.send(200);
                })
            }
            else {
                res.send(200);
            }
        })
    }).fail(function () {
        res.send(500);
    });
});

app.get("/canReportGift/:giftId", function (req, res, next) {
    report.findByUserRef(req.user._id, req.params.giftId).then(function (result) {
        res.send(200, {canReport: result ? false : true});
    }).fail(function (err) {
        res.send(500, err);
    })
});

/* my gifts aggregation -
 gifts posted by current user */
//available gifts posted by current user
app.get("/gifts/avail/by/user/:id?", ensureRegistration, function (req, res) {
    var userId = req.params.id || req.user._id,
        expiryDate = new Date(moment().subtract(EXPIRY_DAYS, 'days'));

    gift.findAll({userId: user.id(userId), status: "available", activityDate: {$gte: expiryDate}})
        .then(function (results) {
            res.send(200, results);
        }).fail(function (e) {
            res.send(500, e);
        });
})

//gifts given by the current user (both rated and not rated)
//follow this standard
app.get("/gifts/given/by/user/:id?", ensureRegistration, function (req, res) {
    var userId = req.params.id || req.user._id;
    var findGivenGifts = gift.findAll({userId: user.id(userId), status: 'given'});
    var findRatedGiftIds = giftrating.findRatedGiftIds(user.id(userId));
    q.all([findGivenGifts, findRatedGiftIds]).spread(function (givenGifts, ratedGiftIds) {
        if (ratedGiftIds) {
            givenGifts.forEach(function (givenGift) {
                if (ratedGiftIds.indexOf(givenGift._id.toString()) > -1) {
                    givenGift.rated = true;
                }
                else {
                    givenGift.rated = false;
                }
            });
        }
        res.send(200, givenGifts);
    }).fail(function (e) {
        res.send(500, e);
    })
});

//gifts posted by current user that are expired
app.get("/gifts/expired/by/user/:id?", ensureRegistration, function (req, res) {
    var userId = req.params.id || req.user._id,
        expiryDate = new Date(moment().subtract(EXPIRY_DAYS, 'days').format());
    gift.findAll({userId: user.id(userId), status: "available", activityDate: {$lt: expiryDate}})
        .then(function (results) {
            res.send(200, results);
        }).fail(function (e) {
            res.send(500, e);
        });
})

//gifts requested by current user that are available
//todo:split the logic to different services e.g./gifts/expired/to/user/:id?
app.get("/gifts/requested/user/:id?", ensureRegistration, function (req, res) {
    var userId = req.params.id || req.user._id,
        findRequestedAvailGiftsByWisher = wisher.findByUser(user.id(userId)),
        findGivenGiftsByWisher = giftuu.findByReceiver(userId),
        findRatedGiftsByWisher = giftrating.findRatedGiftIds(user.id(userId)),
        givenGiftIds = [], wishedGiftIds = [];
    q.all([findRequestedAvailGiftsByWisher, findGivenGiftsByWisher, findRatedGiftsByWisher]).spread(function (requestedGifts, givenGifts, ratedGiftIds) {
        givenGifts.forEach(function (gg) {
            givenGiftIds.push(gift.id(gg.giftId));
        });
        requestedGifts.forEach(function (rg) {
            wishedGiftIds.push(gift.id(rg.on));
        })
        var findWishedGiftDetails = gift.findAll({_id: {$in: wishedGiftIds}, status: 'available'});
        var findGivenGiftDetails = gift.findAll({_id: {$in: givenGiftIds}, status: 'given'});
        return q.all([findWishedGiftDetails, findGivenGiftDetails]).spread(function (result1, result2) {
            var result3 = result1.concat(result2);
            result3.forEach(function (giftDetails) {
                if (ratedGiftIds.indexOf(giftDetails._id.toString()) > -1) {
                    giftDetails.rated = true;
                }
            })
            res.send(200, result3);
        })
    }).fail(function (e) {
        res.send(500, e);
    });

})
//gifts requested by current user that are given (organise and rate)
//gifts requested by current user that are completed
//gifts requested by current user that are expired
//gifts posted by current user that are given

//add gift
app.post("/gifts", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var uploadedImageInputs = req.files.images;
    var uploadedImages = [];
    //1. add gift to gift collection
    //2. upload images to file system for fast and easy access
    //3. upload thumbnails to mongodb as backup
    //4. update gift collection for references
    gift.add(req).then(function (addedGift) {
        //if no images uploaded complete the process
        if (!uploadedImageInputs.length && (!uploadedImageInputs.size || !uploadedImageInputs.name)) {
            res.redirect("#/confirmGift/" + addedGift._id);
        }
        else {
            // put single image to an array as express stores the single image as object
            // and multiple images as array
            uploadedImageInputs = uploadedImageInputs.length ? uploadedImageInputs : [uploadedImageInputs];
        }

        uploadedImageInputs.forEach(function (uploadedImageInput) {
            if (uploadedImageInput && uploadedImageInput.name) {
                uploadedImages.push(uploadedImageInput);
            }
        });

        image.uploadToCloud(uploadedImages).then(function (results) {
            return gift.updateImageRef(addedGift, results);
        }).then(function () {
            res.redirect("#/confirmGift/" + addedGift._id);
        });

    })
    // upload the images to file system
});

//upload image asynchronously
app.post("/giftImages", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.body.giftId;
    var findOwner = gift.isOwner(giftId, req.user._id);
    findOwner.then(function (isOwner) {
        if (isOwner) {
            image.uploadToCloud([req.files.file]).then(function (uploadedFiles) {
                gift.updateImageRef(isOwner, uploadedFiles).then(function (results) {
                    res.send(200, uploadedFiles);
                });
            }).fail(function (e) {
                res.send(500, e);
            })
        }
        else {
            res.send(401, "Unauthorised");
        }
    });
});

app.post("/delete/giftImage", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.body.giftId;
    var findAdmin = user.isAdmin(giftId);
    var findOwner = gift.isOwner(giftId, req.user._id);
    var imageFile = req.body.image;
    q.all([findAdmin, findOwner]).spread(function (isAdmin, isOwner) {
        if (isAdmin || isOwner) {
            image.deleteAll([imageFile]).then(function () {
                gift.removeImageRef(giftId, imageFile._id).then(function () {
                    res.send(200);
                })
            }).fail(function () {
                res.send(404);
            })
        }
        else {
            res.send(401, "Unauthorised");
        }
    })
})

//update gift
app.put("/gifts/:id", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var findOwner = gift.isOwner(req.params.id, req.user._id);
    var giftDetail = req.body;
    findOwner.then(function (isOwner) {
        if (isOwner) {
            //check for image removal
            var deleteImages = image.deleteAll(giftDetail.removedImages);
            var deleteImageRefs = gift.removeAllImageRef(giftDetail._id, giftDetail.removedImages);
            var updateGiftDetails = gift.updateGift(req.params.id, giftDetail);
            return q.all([deleteImages, deleteImageRefs]).then(function () {
                updateGiftDetails.then(function (result) {
                    res.send(200, result);
                })

            });
        }
        else {
            return res.send(401, {message: 'Unauthorized access'});
        }
    }).fail(function (e) {
        res.send(500, e);
    })
});

app.delete("/gifts/:id", ensureRegistration, ensureActiveUser, function (req, res, next) {
    //only delete the gift if use is admin or owner of the gift
    var findOwner = gift.isOwner(req.params.id, req.user._id);
    var findAmin = user.isAdmin(req.params.id);
    q.all([findOwner, findAmin]).spread(function (isOwner, isAdmin) {
        if (isOwner || isAdmin) {
            q.all([
                comment.deleteAllByGift(isOwner._id),
                image.deleteAll(isOwner.images),
                gift.delete(req.params.id)
            ])
                .then(function () {
                    res.send(200);
                }).fail(function () {
                    res.send(500);
                }
            )
        }
    })
});

//can ask for an available gift when the person hasn't asked for it and not the owner
app.get("/canAskGift/:giftId", ensureRegistration, function (req, res, next) {
    var findOwner = gift.isOwner(req.params.giftId, req.user._id),
        findWisher = wisher.find(gift.id(req.params.giftId), req.user._id);

    q.all([findOwner, findWisher]).spread(function (ownerGift, wisher) {
        res.send(200, {canAsk: (!ownerGift && !wisher), asked: !!wisher})
    }).fail(function () {
        res.send(500);
    });
})

app.get("/canGiveGift/:giftId", ensureRegistration, function (req, res, next) {
    var isOwner = gift.isOwner(req.params.giftId, req.user._id)
    isOwner.then(function (ownerGift) {
        res.send(200, {canGive: (ownerGift != null)})
    })
})

//comments
app.get("/count/comments/:giftId", function (req, res, next) {
    comment.count(req.params.giftId).then(function (result) {
        res.send(200, {count: result});
    });
})


//comments
app.get("/count/reviews/:userId", function (req, res, next) {
    comment.countReview(req.params.userId).then(function (result) {
        res.send(200, {count: result});
    });
})

app.get("/giftComments/:giftId/:limit?/:skip?", function (req, res, next) {
    comment.findByGift(req.params.giftId, req.params.limit, req.params.skip).then(function (results) {
        res.send(200, results);
    });
});

app.post("/commentGift/:giftId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.params.giftId;
    gift.find(giftId)
        .then(function (giftResult) {
            //from, on, type, comment
            return comment.add(req.user._id, giftId, "viewGift", req.body.comment).then(function () {
                //update gift comments total
                gift.updateTotalComments(giftId);
            }).then(function (result) {
                notification.add(req.user._id, giftResult.userId, "commentGift", req.body.comment, giftResult);
                user.find(giftResult.userId)
                    .then(function (userResult) {
                        //email must exist and the owner should not receive email if they comment on their own gift
                        if (userResult.email != null && giftResult.userId.toString() != req.user._id.toString()) {
                            /*app.mailer.send('email', {
                                to: userResult.email,
                                subject: req.user.firstName + ' has left a comment about your gift on kindo',
                                subject2: req.user.firstName + ' has left a comment about your gift',
                                afterMessage: 'Get giving!',
                                signature: 'The Kindo team',
                                giftName: giftResult.title,
                                notificationType: 'notifications',
                                linkType: 'viewGift',
                                title: req.body.comment,
                                giftId: giftId,
                                yourName: userResult.firstName,
                                theirName: req.user.firstName
                            }, function (error, response) {
                                if (error) {
                                    console.log(error);
                                } else {
                                    console.log('Message sent');
                                }
                            });*/
                        }
                    });
                res.send(200, result);
            }).fail(function (e) {
                res.send(500, e);
            })
        });
})

// get messages by gift id
app.get("/pickupComments/:giftId/:limit?/:skip?", ensureRegistration, function (req, res, next) {
    var giftId = req.params.giftId,
        findOwner = gift.isOwner(giftId, req.user._id),
        findReceiver = giftuu.isReceiver(giftId, req.user._id.toString());
    q.all([findOwner, findReceiver]).spread(function (isOwner, isReceiver) {
        if (isOwner || isReceiver) {
            comment.findByGiftuu(req.params.giftId, req.params.limit, req.params.skip).then(function (results) {
                res.send(200, results);
            }).fail(function (e) {
                res.send(500, e);
            })
        }
    })
});

app.get("/count/pickupComments/:giftId", ensureRegistration, function (req, res, next) {
    var giftId = req.params.giftId,
        findOwner = gift.isOwner(giftId, req.user._id),
        findReceiver = giftuu.isReceiver(giftId, req.user._id.toString());
    q.all([findOwner, findReceiver]).spread(function (isOwner, isReceiver) {
        if (isOwner || isReceiver) {
            comment.countGiftuu(giftId).then(function (total) {
                res.send(200, {count: total});
            }).fail(function (e) {
                res.send(500, e);
            })
        }
    });
});

app.post("/commentPickup/:giftId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.params.giftId,
        title = req.body.title,
        content = req.body.comment;
    gift.find(giftId)
        .then(function (giftResult) {
            comment.add(req.user._id, giftId, "pickupGift", content, giftResult.title).then(function (result) {
                var isOwner = gift.isOwner(giftId, req.user._id),
                    isReceiver = giftuu.isReceiver(giftId, req.user._id.toString());
                if (content) {
                    q.all([isOwner, isReceiver]).spread(function (isOwnerGift, isReceiverGift) {
                        if (isOwnerGift) {
                            giftuu.findReceivers(giftId).then(function (receivers) {
                                for (var i = 0; i < receivers.length; i++) {
                                    (function (receiver) {
                                        message.add(giftId, req.user._id.toString(), receiver.toString(), giftResult.title, content);
                                        user.find(receiver)
                                            .then(function (userResult) {
                                                if (userResult.email) {
                                                    /*app.mailer.send('email', {
                                                        to: userResult.email,
                                                        subject: req.user.firstName + ' left a message about your gift on kindo',
                                                        subject2: req.user.firstName + ' left a message about your gift',
                                                        afterMessage: 'Enjoy giving!',
                                                        signature: 'The Kindo team',
                                                        giftName: giftResult.title,
                                                        notificationType: 'messages',
                                                        linkType: 'pickupGift',
                                                        title: content,
                                                        giftId: giftId,
                                                        yourName: userResult.firstName,
                                                        theirName: req.user.firstName
                                                    }, function (error, response) {
                                                        if (error) {
                                                            console.log(error);
                                                        } else {
                                                            console.log('Message sent: ' + response.message);
                                                        }
                                                    });*/
                                                }
                                            });
                                    })(receivers[i])
                                }
                                res.send(200);
                            })
                        }
                        else if (isReceiverGift) {
                            gift.find(giftId).then(function (ownerGift) {
                                message.add(giftId, req.user._id.toString(), ownerGift.userId.toString(), giftResult.title, content).then(function () {
                                    res.send(200);
                                });
                                user.find(ownerGift.userId)
                                    .then(function (userResult) {
                                        if (userResult.email) {
                                            /*app.mailer.send('email', {
                                                to: userResult.email,
                                                subject: req.user.firstName + ' left a message about your gift on kindo',
                                                subject2: req.user.firstName + ' left a message about your gift',
                                                afterMessage: 'Enjoy giving!',
                                                signature: 'The Kindo team',
                                                giftName: giftResult.title,
                                                notificationType: 'messages',
                                                linkType: 'pickupGift',
                                                title: content,
                                                giftId: giftId,
                                                yourName: userResult.firstName,
                                                theirName: req.user.firstName
                                            }, function (error, response) {
                                                if (error) {
                                                    console.log(error);
                                                } else {
                                                    console.log('Message sent: ' + response.message);
                                                }
                                            });*/
                                        }
                                    });
                            })
                        }
                        else {
                            res.send(401);
                        }
                    });
                }
                res.send(200, result);
            }).fail(function (e) {
                res.send(500, e);
            })
        });
})


app.get("/profileComments/:userId/:limit?/:skip?", function (req, res, next) {
    var on = req.params.userId || req.user._id;
    comment.findAll({type: 'profile', on: on}, req.params.limit, req.params.skip)
        .then(function (result) {
            res.send(200, result);
        })
        .fail(function (e) {
            res.send(500, e);
        })
});


app.post("/commentProfile/:userId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var on = req.params.userId || req.user._id,
        userComment = req.body.comment //cleaning required
    req.params.giftId;
    comment.add(req.user._id, on, 'profile', userComment)
        .then(function (result) {

            res.send(200, result);
        })
        .fail(function (e) {
            res.send(500, e);
        })
})

//merge wishers and comments
app.get("/giftActivities/:giftId/:limit?/:skip?", function (req, res, next) {
    comment.findActivitiesByGift(req.params.giftId, req.params.limit, req.params.skip).then(function (results) {
        res.send(200, results);
    });
})

//wishers
app.get("/wishers/:giftId/:limit?/:skip?", function (req, res, next) {
    wisher.findByGift(req.params.giftId, req.params.limit, req.params.skip).then(function (results) {
        res.send(200, results);
    })
})

app.get("/count/wishers/:giftId", function (req, res, next) {
    wisher.count(req.params.giftId).then(function (result) {
        res.send(200, {count: result});
    });
})

app.post("/wishers", ensureRegistration, ensureActiveUser, function (req, res, next) {
    // to do: check user is already in the wisher list
    var findUser = user.find(req.user._id),
        findGift = gift.find(req.body.giftId);
    var currentGift;
    q.all([findUser, findGift]).spread(
        function (userResult, giftResult) {
            currentGift = giftResult;
            if (gift.isOwnerSelf(giftResult, req.user._id)) {
                return res.send(500, "Can not ask for your own gift");
            }
            else {
                return wisher.update(giftResult._id, userResult._id, req.body.request)
            }
        })
        .then(function () {
            return gift.updateTotalWishers(req.body.giftId)
        })
        .then(function (result) {
            notification.add(req.user._id, currentGift.userId, "askGift", req.body.comment, currentGift);
            user.find(currentGift.userId)
                .then(function (userResult) {
                    //email must exist and the owner should not receive email if they comment on their own gift
                    if (userResult.email && currentGift.userId.toString() != req.user._id.toString()) {
                        /*app.mailer.send('email', {
                            to: userResult.email,
                            subject: req.user.firstName + ' has asked for your gift on kindo',
                            subject2: req.user.firstName + ' has asked for your gift',
                            afterMessage: 'Get giving!',
                            signature: 'The Kindo team',
                            giftName: currentGift.title,
                            notificationType: 'notifications',
                            linkType: 'viewGift',
                            title: req.body.request,
                            giftId: currentGift._id,
                            yourName: userResult.firstName,
                            theirName: req.user.firstName
                        }, function (error, response) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Message sent');
                            }
                        });*/
                    }
                });
            res.send(200, result);
        })
        .fail(function (e) {
            res.send(500, e);
        });
});

//gift transaction collection
app.get('/giftuuReceivers/:giftId', function (req, res) {
    var giftId = req.params.giftId;

    giftuu.findReceivers(giftId).then(function (receivers) {
        res.send(200, receivers);
    }).fail(function () {
        res.send(500);
    })
});

app.get('/giftuu/:giftId', ensureRegistration, function (req, res, next) {
    var giftId = req.params.giftId,
        findOwner = gift.isOwner(giftId, req.user._id),
        findReceiver = giftuu.isReceiver(giftId, req.user._id.toString());

    q.all([findOwner, findReceiver]).spread(function (owner, receiver) {
        if (owner || receiver) {
            var findGiftuu = giftuu.findByGift(giftId),
                findMessages = message.findByGift(giftId)
            q.all([findGiftuu, findMessages]).spread(function (giftuu, messages) {
                res.send(200, {giftuu: giftuu, messages: messages});
            })
        } else {
            res.send(401);
        }
    })
});

/*update and post giftuu details*/
app.post("/giftuu/:giftId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.params.giftId,
        userId = req.user._id;
//find if the user is the owner
    gift.isOwner(giftId, userId).then(function (ownerGift) {
        if (ownerGift) {
            // update giftuu information
            giftuu.save(req.body).then(function (giftuuResult) {
                //first time added
                if (giftuuResult.modified.toString() == giftuuResult.created.toString()) {
                    //insert to message (giftId, from, to, title, content)

                    //udpate gift details
                    gift.give(giftId, giftuuResult._id, giftuuResult.wishersId);

                    //send notification to wishers
                    giftuuResult.wishersId.forEach(function (wisherId) {
                        notification.add(ownerGift.userId, user.id(wisherId), "giveGift", null, ownerGift);
                        user.find(wisherId)
                            .then(function (userResult) {
                                if (userResult.email) {
                                    /*app.mailer.send('email', {
                                        to: userResult.email,
                                        subject: req.user.firstName + ' has given you a gift on kindo',
                                        subject2: req.user.firstName + ' has given you a gift',
                                        afterMessage: 'Get organising!',
                                        signature: 'The Kindo team',
                                        giftName: ownerGift.title,
                                        notificationType: 'notifications',
                                        linkType: 'pickupGift',
                                        title: "",
                                        giftId: giftId,
                                        yourName: userResult.firstName,
                                        theirName: req.user.firstName
                                    }, function (error, response) {
                                        if (error) {
                                            console.log(error);
                                        } else {
                                            console.log('Message sent');
                                        }
                                    });*/
                                }
                            });
                    })
                }
                res.send(200)
            }).fail(function () {
                res.send(500, {msg: "Error saving kindo"});
            });
        }
    }).fail(function () {
        res.send(500, {msg: "Error finding the gift"});
    })
})

app.put("/giftuu/:id", ensureRegistration, function (req, res, next) {

});

//messages
app.get("/userNewMessages", ensureRegistration, function (req, res, next) {
    message.findNewByReceiver(req.user._id).then(function (results) {
        res.send(200, results);
    });
})

app.get("/allUserMessages", ensureRegistration, function (req, res, next) {
    message.findAllByReceiver(req.user._id).then(function (results) {
        res.send(200, results);
    });
})

app.put("/messages/readAll", ensureRegistration, function (req, res, next) {
    message.markAllAsRead(req.user._id).then(function () {
        res.send(200);
    }).fail(function () {
        res.send(500);
    });
})


app.post("/message/:giftId", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var postedMessage = req.body.message,
        messageTitle = req.body.title,
        giftId = req.params.giftId,
        findOwner = gift.isOwner(giftId, req.user._id),
        findReceiver = giftuu.isReceiver(giftId, req.user._id.toString());
    gift.find(giftId)
        .then(function (giftResult) {
            if (postedMessage) {
                q.all([findOwner, findReceiver]).spread(function (isOwner, isReceiver) {
                    if (isOwner) {
                        giftuu.findReceivers(giftId).then(function (receivers) {
                            for (var i = 0; i < receivers.length; i++) {
                                (function (receiver) {
                                    message.add(giftId, req.user._id.toString(), receiver.toString(), messageTitle, postedMessage);
                                    user.find(receiver)
                                        .then(function (userResult) {
                                            if (userResult.email) {
                                                /*app.mailer.send('email', {
                                                    to: userResult.email,
                                                    subject: req.user.firstName + ' left a message about your gift on kindo',
                                                    subject2: req.user.firstName + ' left a message about your gift',
                                                    afterMessage: 'Enjoy giving!',
                                                    signature: 'The Kindo team',
                                                    giftName: giftResult.title,
                                                    notificationType: 'messages',
                                                    linkType: 'pickupGift',
                                                    title: messageTitle,
                                                    giftId: giftId,
                                                    yourName: userResult.firstName,
                                                    theirName: req.user.firstName
                                                }, function (error, response) {
                                                    if (error) {
                                                        console.log(error);
                                                    } else {
                                                        console.log('Message sent');
                                                    }
                                                });*/
                                            }
                                        });
                                })(receivers[i])
                            }
                            res.send(200);
                        })
                    }
                    else if (isReceiver) {
                        findOwner.then(function (ownerGift) {
                            message.add(giftId, req.user._id.toString(), ownerGift.userId.toString(), messageTitle, postedMessage).then(function () {
                                res.send(200);
                            });
                            user.find(ownerGift.userId)
                                .then(function (userResult) {
                                    if (userResult.email) {
                                        /*app.mailer.send('email', {
                                            to: userResult.email,
                                            subject: req.user.firstName + ' left a message about your gift on kindo',
                                            subject2: req.user.firstName + ' left a message about your gift',
                                            afterMessage: 'Enjoy giving!',
                                            signature: 'The Kindo team',
                                            giftName: giftResult.title,
                                            notificationType: 'messages',
                                            linkType: 'pickupGift',
                                            title: messageTitle,
                                            giftId: giftId,
                                            yourName: userResult.firstName,
                                            theirName: req.user.firstName
                                        }, function (error, response) {
                                            if (error) {
                                                console.log(error);
                                            } else {
                                                console.log('Message sent');
                                            }
                                        });*/
                                    }
                                });
                        })
                    }
                    else {
                        res.send(401);
                    }
                });
            }
        });
});

//notifications
app.get("/allUserNotifications", ensureRegistration, function (req, res, next) {
    notification.findAllByReceiver(req.user._id).then(function (results) {
        res.send(200, results);
    });
})
app.get("/userNewNotifications", ensureRegistration, function (req, res, next) {
    notification.findNewByReceiver(req.user._id).then(function (results) {
        res.send(200, results);
    });
})

app.put("/notifications/readAll", ensureRegistration, function (req, res, next) {
    notification.markAllAsRead(req.user._id).then(function () {
        res.send(200);
    }).fail(function () {
        res.send(500);
    });
})

app.get("/canRate/:giftId", ensureRegistration, function (req, res, next) {
    var giftId = req.params.giftId;
    var checkRated = giftrating.rated(req.user._id, giftId);
    var findGift = gift.find(gift.id(giftId));
    var findReceivers = giftuu.isReceiver(giftId, req.user._id);
    q.all([checkRated, findGift, findReceivers]).spread(function (rated, giftResult, isReceiver) {
        var isOwner = giftResult._id && gift.isOwnerSelf(giftResult, req.user._id);
        var canRate = !rated && giftResult.status == 'given' && (!!isReceiver || !!isOwner );
        res.send(200, {canRate: canRate});
    }).fail(function (e) {
        res.send(500, e)
    });
});

// gift rating
// if owner rates the gift, then all the receivers will get the same ratings for their heart score
// if receiver rates the gift, then the owner will get the ratings accumulated for their heart score
app.post("/giftRating", ensureRegistration, ensureActiveUser, function (req, res, next) {
    var giftId = req.body.giftId,
        findOwner = gift.isOwner(giftId, req.user._id),
        findReceivers = giftuu.isReceiver(giftId, req.user._id),
        checkRated = giftrating.rated(req.user._id, giftId);

    checkRated.then(function (rated) {
        if (!rated) {
            q.all([findOwner, findReceivers]).spread(function (oGift, isReceiver) {
                if (isReceiver) {
                    gift.find(isReceiver.giftId).then(function (giftDetail) {
                        return giftrating.rate(req.user._id, giftDetail.userId, req.body).then(function (rating) {
                            user.updateHeart(giftDetail.userId, rating);
                            res.send(200);
                        })
                    }).fail(function () {
                        res.send(500);
                    })

                }
                else if (oGift) {
                    //find all the receivers
                    giftrating.rate(req.user._id, oGift.userId, req.body).then(function (rating) {
                        giftuu.findReceivers(giftId).then(function (receivers) {
                            for (var i = 0; i < receivers.length; i++) {
                                (function (receiver) {
                                    user.updateHeart(receiver, rating);
                                })(receivers[i]);
                            }
                        })
                        res.send(200);
                    })
                }
            }).fail(function () {
                res.send(500);
            })
        }
    })
})

//general collections sits at bottom for catching unhandled request
app.get("/collections/:collectionName", ensureAdmin, function (req, res, next) {
    var url_parts = url.parse(req.url, true);
    var url_query = url_parts.query;
    var db_query = {
        sort: [
            ["_id", -1]
        ]
    };
    if (url_query.limit) {
        db_query.limit = url_query.limit;
    }
    if (url_query.skip) {
        db_query.skip = url_query.skip;
    }
    req.collection.find({}, db_query).toArray(function (e, results) {
        if (e) next(e)
        res.send(200, results)
    })
});

app.get("/collections/:collectionName/:id", ensureAdmin, function (req, res, next) {
    req.collection.findOne({_id: req.collection.id(req.params.id)}, function (e, result) {
        if (e)return next(e);
        else {
            res.send(200, result);
        }
    });
});

//resuable functions
// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }

    // If the user is not authenticated, then we will start the authentication
    // process.  Before we do, let's store this originally requested URL in the
    // session so we know where to return the user later.

    // Resume normal authentication...
    //req.flash("warn", "You must be logged-in to do that.");
    return res.send(401, {msg: "not logged in", redirectUrl: "#/login"});
    //req.session.redirectUrl = req.url;
    //return res.redirect("/");
}

function ensureRegistration(req, res, next) {
    //console.log(req.user.location);
    if (req.user && req.user.location && req.user.email) {
        return next();
    }

    // If the user is not authenticated, then we will start the authentication
    // process.  Before we do, let's store this originally requested URL in the
    // session so we know where to return the user later.

    // Resume normal authentication...
    //req.flash("warn", "You must be logged-in to do that.");

    //req.session.redirectUrl = req.url;
    return res.send(401, {msg: "not registered", redirectUrl: "/registration/step2"});
}

function ensureActiveUser(req, res, next) {
    if (!req.user.deactivated) {
        return next();
    }
    else {
        return false;
    }
}

function ensureAdmin(req, res, next) {
    if (req.user && req.user.isAdmin) {
        return next();
    }
    else {
        return res.send(401);
    }
}

function extend(target) {
    var sources = [].slice.call(arguments, 1);
    sources.forEach(function (source) {
        for (var prop in source) {
            target[prop] = source[prop];
        }
    });
    return target;
}
var server = http.createServer(app);

server.listen(app.get('port'), function (req, res) {
    console.log('Express server listening on port ' + app.get('port'));
});
