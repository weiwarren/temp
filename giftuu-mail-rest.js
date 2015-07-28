/**
 * Created by BOBBY on 24/07/14.
 */
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
    , url = require("url")
    , mongostore = require('connect-mongo-store')(express)
    , winston = require("winston")
    , moment = require("moment")
    , socket = require("socket.io")
    , nodemailer = require('nodemailer')
    , events = require("events")
    , q = require("q");
var app = express();



// configure Express
app.configure(function () {
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.use(express.logger());
    app.use(express.cookieParser());
    //app.use(express.bodyParser({ keepExtensions: true, uploadDir: __dirname + "/public/uploads" }));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + "/public"));
});
app.set('port', process.env.PORT || 4650);
// create reusable transporter object using SMTP transport

var transporter = nodemailer.createTransport(
    {
        'host' : 'smtpout.asia.secureserver.net',
        'secureConnection' : true,
        'port' : 25,
        'auth' : {
            'user' : 'donotreply@giftuu.com',
            'pass' : 'Hepu11edhispantsup'
        }
    });

app.post("/mail/:email/:subject/:message", function (req, res, next) {
    var email = req.params.email;
    var subject = req.params.subject;
    var message = req.params.message;
// setup e-mail data with unicode symbols
    var mailOptions = {
        from: 'donotreply@giftuu.com', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: message, // plaintext body
        html: '<b>'+message+'</b>' // html body
    };

// send mail with defined transport object
    transporter.sendMail(mailOptions, function(error, info){
        if(error){
            console.log(error);
        }else{
            console.log('Message sent: ' + info.response);
            res.send(200);
        }
    })});

var server = http.createServer(app);

server.listen(app.get('port'), function (req, res) {
    console.log('Express server listening on port ' + app.get('port'));
});

/*server.get('/', respond);*/
