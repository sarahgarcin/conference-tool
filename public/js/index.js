/* VARIABLES */
var socket = io.connect();

Dropzone.autoDiscover = false;

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('listMedias', onListMedias);
socket.on('newMedia', onNewMedia);
socket.on('mediaPosition', onMediaPosition);
socket.on('mediaDragPosition', onMediaDragPosition);




jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){

	var myDropzone = new Dropzone("#my-awesome-dropzone");
	var mediaX;
	var mediaY;
  myDropzone.on("drop", function(event) {
  	mediaX = event.offsetX;
  	mediaY = event.offsetY;
  });
   myDropzone.on("addedfile", function(file) {
  	//console.log(file);
  	var id = convertToSlug(file.name);
  	setTimeout(function(){
			socket.emit("dropPosition", {mediaX:mediaX, mediaY:mediaY, id:id});
  	},200);
  	
  });

}

function onListMedias(data){
	console.log(data);
	var mediaItem = $(".js--templates .image").clone(false); 
	var path = "../"+data.name;
	var id = data.id;
	mediaItem
	  .find( 'img')
	    .attr('src', path)
	  .end()
	  .attr('id', id)
	  .css({
	  	"top":data.yPos,
	  	"left":data.xPos
	  })
  ;
  $('.medias-list').prepend(mediaItem);
  
  //draggable media
  mediaItem.draggable({
    start: function() {
    },
    drag: function(event) {
    	// console.log(event);
    	var offset = $(this).offset();
      var posX = offset.left;
      var posY = offset.top;
    	socket.emit("dragMediaPos", {x: posX, y:posY, id:id});
    },
    stop: function() {

    }
  });
}

function onNewMedia(data){
	var mediaItem = $(".js--templates .image").clone(false); 
	var path = "../"+data.name;
	var id = data.id;
		mediaItem
		  .find( 'img')
		    .attr('src', path)
		  .end()
		  .addClass('no-position')
		  .attr('id', id)
	  ;
	  $('.medias-list').prepend(mediaItem);
	  
	  //draggable media
	  mediaItem.draggable({
	    start: function() {
	    },
	    drag: function(event) {
	    	// console.log(event);
	    	var offset = $(this).offset();
        var posX = offset.left;
        var posY = offset.top;
	    	socket.emit("dragMediaPos", {x: posX, y:posY, id:id});
	    },
	    stop: function() {

	    }
	  });
}

function onMediaPosition(mouse){
	//setTimeout(function(){
		console.log(mouse);
		$(".medias-list li.no-position")
			.css({
				"top": mouse.mediaY,
		  	"left":mouse.mediaX
			})
			.removeClass('no-position');
	//},200);
	
}

function onMediaDragPosition(pos){
	$(".medias-list li#"+pos.id)
		.css({
			"top": pos.y,
	  	"left":pos.x,
		});	
}

/* sockets */
function onSocketConnect() {
	sessionId = socket.io.engine.id;
	console.log('Connected ' + sessionId);
};

function onSocketError(reason) {
	console.log('Unable to connect to server', reason);
};




function convertToSlug(Text){
  // converti le texte en minuscule
	var s = Text.toLowerCase();
	// remplace les a accentué
	s = s.replace(/[àâäáã]/g, 'a');
	// remplace les e accentué
	s = s.replace(/[èêëé]/g, 'e');
	// remplace les i accentué
	s = s.replace(/[ìîïí]/g, 'i');
	// remplace les u accentué
	s = s.replace(/[ùûüú]/g, 'u');
	// remplace les o accentué
	s = s.replace(/[òôöó]/g, 'o');
	// remplace le c cédille
	s = s.replace(/[ç]/g, 'c');
	// remplace le ene tilde espagnol
	s = s.replace(/[ñ]/g, 'n');
	// remplace tous les caractères qui ne sont pas alphanumérique en tiret
	s = s.replace(/\W/g, '-');
	// remplace les double tirets en tiret unique
	s = s.replace(/\-+/g, '-');
	// renvoi le texte modifié
	return s;
}