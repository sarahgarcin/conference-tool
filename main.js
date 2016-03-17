var fs = require('fs-extra'),
	glob = require("glob"),
	path = require("path");

module.exports = function(app, io){

	console.log("main module initialized");

	io.on("connection", function(socket){
		socket.on('dropPosition', function(mouse){
			io.sockets.emit("mediaPosition", mouse);
		});
	});


// ------------- F U N C T I O N S -------------------



// - - - END FUNCTIONS - - - 
};
