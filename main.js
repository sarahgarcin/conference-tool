var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	slugg = require('slugg'),
	moment = require('moment'),
	parsedown = require('woods-parsedown'),
	util = require('util'),
	exec = require('child_process').exec;


var config  = require('./public/js/settings.js');

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){

		// I N D E X
		socket.on('newConf', onNewConf);
		socket.on( 'listConf', function (data){ onListConf(socket); });

		listMedias(socket);

		socket.on('dropPosition', onDropPosition);
		
		socket.on('takeScreenShot', function(){
			var date = Date.now();
			exec('screencapture screenshots/'+date+'.png', function (error, stdout, stderr){
		    // now you have the screenshot
			});
		});
		
		socket.on('dragMediaPos', function(pos){
			socket.broadcast.emit("mediaDragPosition", pos);
			io.sockets.emit("mediaDragPositionForAll", pos);
			//Save position in json
		  var jsonFile = 'uploads/lyon.json';
	    var data = fs.readFileSync(jsonFile,"UTF-8");
	    var jsonObj = JSON.parse(data);
	    for (var i = 0; i < jsonObj["files"].length; i++){
			  if (jsonObj["files"][i].id == pos.id){
			  	jsonObj["files"][i]["xPos"] = pos.x;
			  	jsonObj["files"][i]["yPos"] = pos.y;
			  	jsonObj["files"][i]["zPos"] = pos.z;
			  	var jsonString = JSON.stringify(jsonObj, null, 4);
		      fs.writeFile(jsonFile, jsonString, function(err) {
		        if(err) {
		            console.log(err);
		        } else {

		        }
		      });
			  }
			}	
		});

		socket.on("clearPad", function(){
			var jsonFile = 'uploads/lyon.json';
			var data = fs.readFileSync(jsonFile,"UTF-8");
			var jsonObj = JSON.parse(data);
			jsonObj["files"].length = 0;
			var jsonString = JSON.stringify(jsonObj, null, 4);
      fs.writeFile(jsonFile, jsonString, function(err) {
        if(err) {
            console.log(err);
        } 
        else {
          console.log("remove all files");
          io.sockets.emit("padCleared");
        }
      });
		});
	});


// ------------- F U N C T I O N S -------------------
	
	// I N D E X      P A G E 
	function onListConf( socket){
		console.log( "EVENT - onListConf");
    listAllFolders().then(function( allFoldersData) {
      sendEventWithContent( 'listAllFolders', allFoldersData, socket);
    }, function(error) {
      console.error("Failed to list folders! Error: ", error);
    });
	}

	function onNewConf( confData) {
		console.log('New Conf: '+ confData);
		createNewConf(confData).then(function(newpdata) {
			console.log('newpdata: '+newpdata);
      sendEventWithContent('confCreated', newpdata);
    }, function(errorpdata) {
      console.error("Failed to create a new folder! Error: ", errorpdata);
      sendEventWithContent('confAlreadyExist', errorpdata);
    });
	}
	// F I N      I N D E X


	function listMedias(socket){
		// var jsonFile = 'uploads/lyon.json';
		// var data = fs.readFileSync(jsonFile,"UTF-8");
		// var jsonObj = JSON.parse(data);
		// for (var i = 0; i < jsonObj["files"].length; i++){
		// 	var name = jsonObj['files'][i].name;
		// 	var id = jsonObj['files'][i].id;
		// 	var xPos = jsonObj['files'][i].xPos;
		// 	var yPos = jsonObj['files'][i].yPos;
		// 	var zPos = jsonObj['files'][i].zPos;
		// 	var random = jsonObj['files'][i].random;
		// 	socket.emit("listMedias", {name:name, id:id, xPos:xPos, yPos:yPos, zPos:zPos, random:random});
		// }
	}

	function onDropPosition(mouse){
		io.sockets.emit("mediaPosition", mouse);

		//Save position in json
	  var jsonFile = 'uploads/lyon.json';
    var data = fs.readFileSync(jsonFile,"UTF-8");
    var jsonObj = JSON.parse(data);
    for (var i = 0; i < jsonObj["files"].length; i++){
		  if (jsonObj["files"][i].id == mouse.id){
		  	jsonObj["files"][i]["xPos"] = mouse.mediaX;
		  	jsonObj["files"][i]["yPos"] = mouse.mediaY;
		  	jsonObj["files"][i]["zPos"] = mouse.mediaZ;
		  	jsonObj["files"][i]["random"] = mouse.random;
		  	console.log(jsonObj);
		  	var jsonString = JSON.stringify(jsonObj, null, 4);
	      fs.writeFile(jsonFile, jsonString, function(err) {
	        if(err) {
	            console.log(err);
	        } else {
	            console.log("file drop -> The file was saved!");
	        }
	      });
		  }
		}	
	}


	// CONF METHOD !!
	function createNewConf( confData) {
    return new Promise(function(resolve, reject) {
    	console.log("COMMON — createNewFolder");

    	var confLieu = confData.lieu;
    	var confDate= confData.date;
    	var confName = confData.titre;
    	var confAuth = confData.auteur;
    	var slugConfName = slugg(confName);
    	var confPath = getFullPath( slugConfName);
    	var currentDateString = getCurrentDate();

  	  fs.access(confPath, fs.F_OK, function( err) {
    	  // if there's nothing at path
        if (err) {
        	console.log("New conf created with name " + confName + " and path " + confPath);
          fs.ensureDirSync(confPath);//write new folder in folders
          var fmeta =
            {
              "name" : confName,
              "lieu" : confLieu, 
              "date" : confDate,
              "auteur": confAuth,
              "created" : currentDateString,
            };
          storeData( getMetaFileOfFolder(confPath), fmeta, "create").then(function( meta) {
          	console.log('sucess ' + meta)
            resolve( meta);
          });

        } else {
          // if there's already something at path
          console.log("WARNING - the following folder name already exists: " + slugConfName);
          var objectJson = {
            "name": confName,
            "timestamp": currentDateString
          };
          reject( objectJson);
        }
  	  });

    });
  }

  function listAllFolders() {
    return new Promise(function(resolve, reject) {
  		fs.readdir(config.contentDir, function (err, filenames) {
        if (err) return console.log( 'Couldn\'t read content dir : ' + err);

        var folders = filenames.filter( function(slugFolderName){ return new RegExp("^([^.]+)$", 'i').test( slugFolderName); });
  	    console.log( "Number of folders in " + config.contentDir + " = " + folders.length + ". Folders are " + folders);

  	    var foldersProcessed = 0;
  	    var allFoldersData = [];
  		  folders.forEach( function( slugFolderName) {

  		    if( new RegExp("^([^.]+)$", 'i').test( slugFolderName)
  		    && slugFolderName.indexOf( config.deletedPrefix)){
          	var fmeta = getFolderMeta( slugFolderName);
          	fmeta.slugFolderName = slugFolderName;
            allFoldersData.push( fmeta);
          }

          foldersProcessed++;
          if( foldersProcessed === folders.length && allFoldersData.length > 0) {
            console.log( "- - - - all folders JSON have been processed.");
            resolve( allFoldersData);
          }
  		  });
  		});
    });
	}

	function getMetaFileOfFolder( folderPath) {
    return folderPath + '/' + config.confMetafilename + config.metaFileext;
  }

  // C O M M O N     F U N C T I O N S
  function eventAndContent( sendEvent, objectJson) {
    var eventContentJSON =
    {
      "socketevent" : sendEvent,
      "content" : objectJson
    };
    return eventContentJSON;
  }

  function sendEventWithContent( sendEvent, objectContent, socket) {
    var eventAndContentJson = eventAndContent( sendEvent, objectContent);
    console.log("eventAndContentJson " + JSON.stringify( eventAndContentJson, null, 4));
    if( socket === undefined)
      io.sockets.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
    else
      socket.emit( eventAndContentJson["socketevent"], eventAndContentJson["content"]);
  }

  function getFullPath( path) {
    return config.contentDir + "/" + path;
  }
  function getCurrentDate() {
    return moment().format( config.metaDateFormat);
  }

  function getFolderMeta( slugFolderName) {
		console.log( "COMMON — getFolderMeta");

    var folderPath = getFullPath( slugFolderName);
  	var folderMetaFile = getMetaFileOfFolder( folderPath);

		var folderData = fs.readFileSync( folderMetaFile,config.textEncoding);
		var folderMetadata = parseData( folderData);

    return folderMetadata;
  }

  function textifyObj( obj) {
    var str = '';
    console.log( '1. will prepare string for storage');
    for (var prop in obj) {
      var value = obj[prop];
      console.log('2. value ? ' + value);
      // if value is a string, it's all good
      // but if it's an array (like it is for medias in publications) we'll need to make it into a string
      if( typeof value === 'array')
        value = value.join(', ');
      // check if value contains a delimiter
      if( typeof value === 'string' && value.indexOf('\n----\n') >= 0) {
        console.log( '2. WARNING : found a delimiter in string, replacing it with a backslash');
        // prepend with a space to neutralize it
        value = value.replace('\n----\n', '\n ----\n');
      }
      str += prop + ': ' + value + config.textFieldSeparator;
    }
    console.log( '3. textified object : ' + str);
    return str;
  }

	function storeData( mpath, d, e) {
    return new Promise(function(resolve, reject) {
      console.log('Will store data', mpath);
      var textd = textifyObj(d);
      if( e === "create") {
        fs.appendFile( mpath, textd, function(err) {
          if (err) reject( err);
          resolve(parseData(textd));
        });
      }
		  if( e === "update") {
        fs.writeFile( mpath, textd, function(err) {
        if (err) reject( err);
          resolve(parseData(textd));
        });
      }
    });
	}

	function parseData(d) {
  	var parsed = parsedown(d);
		return parsed;
	}

// - - - END FUNCTIONS - - - 
};
