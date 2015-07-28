/**
 * Created by weiwarren on 19/01/2014.
 */
var fbgraph = require('fbgraph'),
    q = require("q");


module.exports = function () {
    function Facebook() {
        //var _self = this;
    }

    Facebook.prototype.setToken = function(token){
        console.log(token);
        //fbgraph.setAccessToken(token);
    }

    Facebook.prototype.getFriendsList = function(token){
        var deferred = q.defer();
        fbgraph.setAccessToken(token);
        fbgraph.get('/me/friends', function(err, res){
            deferred.resolve(res);
        });
        return deferred.promise;
    }

    Facebook.prototype.postMessage = function (userId, accessToken, message, callback) {
        fbgraph.post(userId + "/feed?access_token=" + accessToken,
            {message: message}, function (err, res) {
                if(callback)
                    callback(res);
        });
    };
    return new Facebook();
}
