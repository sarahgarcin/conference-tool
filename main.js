var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path"),
	exec = require('child_process').exec;

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		
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
			socket.emit("mediaDragPositionForAll", pos);
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


	});


// ------------- F U N C T I O N S -------------------
	function listMedias(socket){
		var jsonFile = 'uploads/lyon.json';
		var data = fs.readFileSync(jsonFile,"UTF-8");
		var jsonObj = JSON.parse(data);
		for (var i = 0; i < jsonObj["files"].length; i++){
			var name = jsonObj['files'][i].name;
			var id = jsonObj['files'][i].id;
			var xPos = jsonObj['files'][i].xPos;
			var yPos = jsonObj['files'][i].yPos;
			var zPos = jsonObj['files'][i].zPos;
			var random = jsonObj['files'][i].random;
			socket.emit("listMedias", {name:name, id:id, xPos:xPos, yPos:yPos, zPos:zPos, random:random});
		}
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


// - - - END FUNCTIONS - - - 
};
