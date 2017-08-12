var fs = require('fs');
var async = require('async');
var request = require('request');
var config = require('./config.js');

var base_url = config.uri + '/' + config.org + '/' + config.app +'/';
var data = {} ;
var downloadLoc = 'download/';
var bearer_token = '';

function getAllCollections(callback) {
    var options = {
        url: base_url,
        headers: {
            'Authorization': bearer_token
        }
    };
	request( options , function (err, response , body) {
		if( !err && response.statusCode ==200){
			var b = JSON.parse(body);
			var collections = b.entities[0].metadata.collections;
			downLoadCollections(collections);
		}
	}) ; 
}

function downLoadCollections (collections) {
	for(var c in collections ){
		var name = c ;
		var count = collections[c].count ;
		if(name=='events') continue;
		console.log('Collection ' + name + ' has ' + count + ' entities');
		if(count > 0){
			var url = base_url + name + '?limit=' + count ;
			downloadCollection (url , name , count);
		}
	}
}


function downloadCollection (url, name, count ){
    var options = {
        url: url,
        headers: {
            'Authorization': bearer_token
        }
    };

    request(options, function(err, response, body){
		if (!err && response.statusCode==200){
			var b = JSON.parse(body);
			
			if (b.count == count ){
				//all data collected
				copyToLocal(name, b.entities);
				console.log( name + ' = all done write to file');
				fs.writeFileSync(downloadLoc + name + '.json' , JSON.stringify(data[name]));
			} else {
				//some more data to collect
				copyToLocal(name, b.entities);
				count = count - b.count ;
				var cursor = b.cursor ;
				var newurl = base_url + name +  '?limit=' + count ;
				downloadCollection(newurl, name, count);
			}
		}
	});
}

function copyToLocal(name, entitites){
	if (!data[name]) {
		data[name] = [] ;
	}
	for(var i =0; i < entitites.length ; i ++ ){
		var e = entitites[i];
		delete e.uuid ;
		delete e.type  ;
		delete e.created ;
		delete e.modified ;
		delete e.metadata ;
		data[name].push(e);
	}
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

function createDownloadDir(callback) {
	fs.mkdir(downloadLoc, function() {
		callback () ;	
	});
}



function execute() {
	async.waterfall(
		[
		  getAccessToken, 
		  createDownloadDir, 
		  getAllCollections
		], 
		function(err, result) {
			if (err) console.log('Error: ' + err);
			console.log("Finished download script.");
		}
	);
}

execute();

