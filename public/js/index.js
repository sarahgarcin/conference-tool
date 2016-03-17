/* VARIABLES */
var socket = io.connect();

Dropzone.autoDiscover = false;

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('newMedia', onNewMedia);
socket.on('mediaPosition', onMediaPosition);




jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){

	var myDropzone = new Dropzone("#my-awesome-dropzone");
  myDropzone.on("drop", function(event) {
  	console.log(event);
  	mediaX = event.offsetX;
  	mediaY = event.offsetY;
  	socket.emit("dropPosition", {mediaX:mediaX, mediaY:mediaY});
  });
}

function onNewMedia(data){
	var mediaItem = $(".js--templates .image").clone(false); 
	var path = "../"+data.name;
		mediaItem
		  .find( 'img')
		    .attr('src', path)
		  .end()
		  .addClass('no-position')
	  ;
	  $('.medias-list').prepend(mediaItem);
}

function onMediaPosition(mouse){
	setTimeout(function(){
		console.log(mouse);
		$(".medias-list li.no-position")
			.css({
				"top": mouse.mediaY,
		  	"left":mouse.mediaX
			})
			.removeClass('no-position');
	},200);
	
}

/* sockets */
function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};