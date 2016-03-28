/* VARIABLES */
var socket = io.connect();
var zIndex = 0;

/* sockets */
socket.on('connect', onSocketConnect);
socket.on('error', onSocketError);

socket.on('listMedias', onListMedias);
socket.on('newMedia', onNewMedia);
socket.on('mediaPosition', onMediaPosition);
socket.on('mediaDragPosition', onMediaDragPosition);
socket.on('mediaDragPositionForAll', onMediaDragPositionForAll);

jQuery(document).ready(function($) {

	$(document).foundation();
	init();
});


function init(){

	$(window).on('dragover',function(e){
		console.log('test');
		e.preventDefault();
		e.stopPropagation();
		return false;
	});
	$(window).on('dragleave',function(e){
		e.preventDefault();
		e.stopPropagation();
		return false;
	});

	$(".drop-files-container").on("drop", function(e) {
		e.preventDefault();
		
    var files = e.originalEvent.dataTransfer.files;
    console.log(files);
    processFileUpload(files); 
    //file data to display it correctly
    var mediaX = e.offsetX;
 		var mediaY = e.offsetY;
 		var id = convertToSlug(files[0].name);
 		zIndex ++;
 		var randomRot = Math.floor((Math.random() * 60) - 30);
 		console.log(mediaX, mediaY, id, zIndex, randomRot);
    setTimeout(function(){
			socket.emit("dropPosition", {mediaX:mediaX, mediaY:mediaY, id:id, mediaZ: zIndex, random:randomRot});
  	},200);
  	// forward the file object to your ajax upload method
    return false;
	});

}

function onListMedias(data){
	var path = "../"+data.name;
	var id = data.id;
	zIndex = data.zPos;
	var ext = data.name.split('.').pop();
	var mediaItem;

	if(ext == 'jpg' || ext == "jpeg" || ext == "png" || ext == "gif" || ext == "JPG"){
		mediaItem = $(".js--templates .image").clone(false);
		mediaItem
		  .find( 'img')
		    .attr('src', path)
		  .end()
		  .attr('id', id)
		  .css({
		  	"top":data.yPos,
		  	"left":data.xPos,
		  	"z-index":data.zPos,
		  	"transform":"rotate("+data.random+"deg)",
		  	"display":"block"
		  });
	}

	if(ext == 'mp4' || ext == "avi" || ext == "ogg" || ext == "mov" || ext == "webm"){
		mediaItem = $(".js--templates .video").clone(false);
		mediaItem
		  .find( 'source')
		    .attr('src', path)
		  .end()
		  .attr('id', id)
		  .css({
		  	"top":data.yPos,
		  	"left":data.xPos,
		  	"z-index":data.zPos,
		  	"transform":"rotate("+data.random+"deg)",
		  	"display":"block"
		  });
	}

	if(ext == 'pdf'){
		mediaItem = $(".js--templates .pdf").clone(false);
		mediaItem
		  .find('a')
		    .attr('href', path)
		    .attr('title', data.name)
		    .attr('target', '_blank')
		    .append(data.name)
		  .end()
			.attr('id', id)
		  .css({
		  	"top":data.yPos,
		  	"left":data.xPos,
		  	"z-index":data.zPos,
		  	"transform":"rotate("+data.random+"deg)",
		  	"display":"block"
		  });
	}


  $('.medias-list').prepend(mediaItem);

  //imageRatio(mediaItem);
  
  //draggable media
  mediaItem.draggable({
    start: function() {
    	zIndex ++;
	    // console.log(zIndex);
    },
    drag: function(event) {
    	// console.log(event);
    	var offset = $(this).offset();
      var posX = offset.left;
      var posY = offset.top;
    	socket.emit("dragMediaPos", {x: posX, y:posY, id:id, z:zIndex});
    },
    stop: function() {
    	socket.emit('takeScreenShot');
    }
  });
}

function onNewMedia(data){
	var path = "../"+data.name;
	var id = data.id;
	var ext = data.name.split('.').pop();
	var mediaItem;
	
	if(ext == 'jpg' || ext == "jpeg" || ext == "png" || ext == "gif" || ext == "JPG"){
		mediaItem = $(".js--templates .image").clone(false);
		mediaItem
		  .find( 'img')
		    .attr('src', path)
		  .end()
		  .addClass('no-position')
		  .attr('id', id)
		  .css({
		  	"zIndex": zIndex
		  });
	}

	if(ext == 'mp4' || ext == "avi" || ext == "ogg" || ext == "mov" || ext == "webm"){
		mediaItem = $(".js--templates .video").clone(false);
		mediaItem
		  .find('source')
		    .attr('src', path)
		  .end()
		  .addClass('no-position')
		  .attr('id', id)
		  .css({
		  	"zIndex": zIndex
		  });
	}

	if(ext == 'pdf'){
		mediaItem = $(".js--templates .pdf").clone(false);
		mediaItem
		  .find('a')
		    .attr('href', path)
		    .attr('title', data.name)
		    .attr('target', '_blank')
		    .append(data.name)
		  .end()
		  .addClass('no-position')
		  .attr('id', id)
		  .css({
		  	"zIndex": zIndex
		  });
	}


	$('.medias-list').prepend(mediaItem);
	  
  //draggable media
  mediaItem.draggable({
    start: function() {
    	zIndex ++;
    },
    drag: function(event) {
    	// console.log(event);
    	var offset = $(this).offset();
      var posX = offset.left;
      var posY = offset.top;
    	socket.emit("dragMediaPos", {x: posX, y:posY,  z:zIndex, id:id});
    },
    stop: function() {
    	socket.emit('takeScreenShot');
    }
  });
}

function onMediaPosition(mouse){
	$(".medias-list li.no-position")
		.css({
			"top": mouse.mediaY,
	  	"left":mouse.mediaX,
	  	"transform":"rotate("+mouse.random+"deg)",
	  	"z-index": mouse.mediaZ,
	  	"display":"block"
		})
		.removeClass('no-position')
		.attr("data-index", mouse.mediaZ)
	;
	socket.emit('takeScreenShot');
	
}

function onMediaDragPosition(pos){
	$(".medias-list li#"+pos.id)
		.css({
			"top": pos.y,
	  	"left":pos.x
		});	
}

function onMediaDragPositionForAll(pos){
	$(".medias-list li#"+pos.id)
	.css({
  	"z-index":pos.z,
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


function imageRatio($element){
	$element.each(function() {
    var maxWidth = 200; // Max width for the image
    var maxHeight = 200;    // Max height for the image
    var ratio = 0;  // Used for aspect ratio
    var width = $(this).width();    // Current image width
    var height = $(this).height();  // Current image height

    // Check if the current width is larger than the max
    if(width > maxWidth){
        ratio = maxWidth / width;   // get ratio for scaling image
        $(this).css("width", maxWidth); // Set new width
        $(this).css("height", height * ratio);  // Scale height based on ratio
        height = height * ratio;    // Reset height to match scaled image
        width = width * ratio;    // Reset width to match scaled image
    }

    // Check if current height is larger than max
    if(height > maxHeight){
        ratio = maxHeight / height; // get ratio for scaling image
        $(this).css("height", maxHeight);   // Set new height
        $(this).css("width", width * ratio);    // Scale width based on ratio
        width = width * ratio;    // Reset width to match scaled image
        height = height * ratio;    // Reset height to match scaled image
    }
  });
}

function processFileUpload(droppedFiles) {
  // add your files to the regular upload form
  var uploadFormData = new FormData($("#form")[0]); 
  if(droppedFiles.length > 0) { // checks if any files were dropped
    for(var f = 0; f < droppedFiles.length; f++) { // for-loop for each file dropped
      uploadFormData.append("files[]",droppedFiles[f]);  // adding every file to the form so you could upload multiple files
    }
  }

// the final ajax call

 $.ajax({
  url : "/file-upload", // use your target
  type : "POST",
  data : uploadFormData,
  cache : false,
  contentType : false,
  processData : false,
  success : function(ret) {
    // callback function
    console.log(ret);
  }
 });

}


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