var fs = require('fs');
var async = require('async');
var request = require('request');
var lineReader = require('line-reader');
var config = require('./config.js');

var dataLoc = 'data/';
var base_url = config.uri + '/' + config.org + '/' + config.app + '/';
var bearer_token = '';

function errorSummary(error, response, body) {
    return "code=" + response && response.statusCode + "&error=" + error + "&body=" + body;
}

function logError(fnName, error, response, body) {
	console.log("Error while calling " + fnName);
  	console.log('statusCode:', response && response.statusCode);
  	console.log('error:', error);
  	console.log('body:', body);
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

function createAppOptions() {
	return {
		url: config.uri + 'management/orgs/' + config.org + '/apps',
		method: 'POST',
		headers: {
			'Authorization': bearer_token
		},
		json: {
			name: config.app
		}
	};
}

function createApp(callback) {
	request(createAppOptions(), function(err, res, body) {
		if (!err && res.statusCode == 200) {
			console.log(config.app + ' app created');
			callback();
		} else {
			if (res.statusCode === 500 && body.error === 'application_already_exists') {
				console.log(config.app + ' app already exists');
				callback();
			} else {
				logError("createApp", err, res, body);
				callback(errorSummary(err, res, body));
			}
		}
	});
}

function getPermissionsOptions() {
	return {
		url: base_url + 'roles/guest/permissions',
		method: 'GET',
		headers: {
			'Authorization': bearer_token
		}
	};
}

function getPermissions(callback) {
	request(getPermissionsOptions(), function(err, res, body) {
		if (!err && res.statusCode == 200) {
			var result = JSON.parse(body);
			console.log('current permissions for guest role: ' + result.data);
			callback(null, result.data);
		} else {
			logError("getPermission", err, res, body);
			callback(errorSummary(err, res, body));
		}
	});
}

function cleanupPermissions(perms, callback) {
	async.each(
		perms,
		deletePermission,
		function(err) {
			callback();
		}
	);
}

function deletePermissionOptions(perm) {
	return {
		url: base_url + 'roles/guest/permissions',
		method: 'DELETE',
		headers: {
			'Authorization': bearer_token
		},
		qs: {
			'permission': perm
		}
	};
}

function deletePermission(permission, callback) {
	request(deletePermissionOptions(permission), function(err, res, body) {
		if (!err && res.statusCode == 200) {
			console.log('deleted default permission: ' + permission);
			callback();
		} else {
			logError("deletePermission", err, res, body);
			callback(errorSummary(err, res, body));
		}
	});
}

function addSandboxPermissionOptions() {
	return {
		url: base_url + 'roles/guest/permissions',
		method: 'POST',
		headers: {
			'Authorization': bearer_token
		},
		json: {
			permission: 'get:/**'
		}
	};
}

function addSandboxPermission(callback) {
	request(addSandboxPermissionOptions(), function(err, res, body) {
		if (!err && res.statusCode == 200) {
			console.log('added sanbox permission');
			callback();
		} else {
			logError("addPermission", err, res, body);
			callback(errorSummary(err, res, body));
		}
	});
}


function createSandbox(callback) {
	async.waterfall(
		[
		  getPermissions, 
		  cleanupPermissions, 
		  addSandboxPermission
		], 
		function(err, result) {
			if (err) console.log('Error creating sandbox: ' + err);
			console.log("sandbox created");
			callback();
		}
	);
}

function readDataDir(callback) {
	fs.readdir(dataLoc, function (err, files) {
		if (err) {
			console.log("Error while calling readDataDir");
			callback(err);
		} else {
			console.log('files in data dir: ' + JSON.stringify(files));
			callback(null, files);
		}
	});
}

function fileType(files, type) {
	return files.filter(function(file) {
		return file.includes(type);
	});	
}

function uploadData(files, callback) {
	async.each(
		fileType(files, '.json'), 
		uploadCollection,
		function(err) { callback(err); }
	);
}

function collectionOptions(fileName) {
	return {
		url: base_url + fileName.split('.json')[0],
		method: 'POST',
		headers: {
			'Authorization': bearer_token
		}
	};
}

function uploadCollection(fileName, callback) {
  fs.createReadStream(dataLoc + fileName)
  	.pipe(
  		request(
  			collectionOptions(fileName), 
  			function (err, res, body) {
		      if (!err && res.statusCode == 200) {
		        console.log('upload completed for ' + fileName);
		      } else {
						logError("uploadCollection", err, res, body);
		      }
		      callback();
		    }
		  )
  	);
}

function queryOptions(line) {
	return {
		url: base_url + line,
		method: 'POST',
		headers: {
			'Authorization': bearer_token
		}
	};
}

function uploadConnections(callback) {
  lineReader.eachLine(dataLoc + 'post.query', function (line, last) {
    request.post(queryOptions(line), function (err, res, body) {
      if (!err && res.statusCode == 200) {
        // console.log('\t\tupload complete for relation ' + line);
      } else {
        logError(err, res, body);
      }
      if (last) {
      	console.log('upload completed for connections in post.query');
      	callback();
      }
    });
  });
}

function execute() {
	async.waterfall(
		[
		  getAccessToken, 
		  createApp, 
		  createSandbox,
		  readDataDir,
		  uploadData,
		  uploadConnections
		], 
		function(err, result) {
			if (err) console.log('Error: ' + err);
			console.log("Finished upload script.");
		}
	);
}

execute();
