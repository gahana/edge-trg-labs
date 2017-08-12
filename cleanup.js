var fs = require('fs');
var async = require('async');
var request = require('request');
var config = require('./config.js');


var base_url = config.uri + '/' + config.org + '/' + config.app + '/';
var data = {};
var bearer_token = '';

function getAllCollections(callback) {
    var options = {
        url: base_url,
        headers: {
            'Authorization': bearer_token
        }
    };
    request(options, function (err, response, body) {
        if (!err && response.statusCode == 200) {
            var b = JSON.parse(body);
            var collections = b.entities[0].metadata.collections;
            for (var c in collections) {
                if (c == 'roles') continue;
                cleanup(c, collections[c].count);
            }
        }
    });
}


function cleanup(c, count) {
    var url = base_url + c + '?limit=1000';
    var options = {
        url: url,
        headers: {
            'Authorization': bearer_token
        }
    };
    request.del(options, function (err, response, body) {
        console.log(response.statusCode);
        count = count - 1000;
        if (count > 0) {
            cleanup(c, count);
        } else {
            console.log(c + ' cleanedup');
        }
    });
}

function accessTokenOptions() {
    return {
        url: config.uri + 'management/token',
        method: 'POST',
        json: {
            grant_type: 'client_credentials',
            client_id: config.clientId,
            client_secret: config.clientSecret
        }
    };
}

function getAccessToken(callback) {
    request(accessTokenOptions(), function(err, res, body) {
        if (!err && res.statusCode == 200) {
            bearer_token = 'Bearer ' + body.access_token;
            console.log(bearer_token);
            callback();
        } else {
            logError("getAccessToken", err, res, body);
            callback(errorSummary(err, res, body));
        }
    });
}

function execute() {
    async.waterfall(
        [
          getAccessToken, 
          getAllCollections
        ], 
        function(err, result) {
            if (err) console.log('Error: ' + err);
            console.log("Finished cleanup script.");
        }
    );
}

execute();