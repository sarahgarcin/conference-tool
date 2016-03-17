var _ = require("underscore");
var url = require('url')
var fs = require('fs-extra');
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();


module.exports = function(app,io,m){

  /**
  * routing event
  */
  app.get("/", getIndex);
  app.post("/file-upload", multipartMiddleware, postFile);

  /**
  * routing functions
  */

  // GET
  function getIndex(req, res) {
    res.render("index", {title : "Conférence Lyon"});
  };

  function postFile(req, res) {
    var id = convertToSlug(req.files.file.name);
    fs.readFile(req.files.file.path, function (err, data) {
      var newPath = __dirname + "/uploads/"+req.files.file.name;
      fs.writeFile(newPath, data, function (err) {
        //write Json File to save data
        var jsonFile = 'uploads/lyon.json';
        var data = fs.readFileSync(jsonFile,"UTF-8");
        var jsonObj = JSON.parse(data);
        var jsonAdd = { "name" : req.files.file.name, "id":id};
        jsonObj["files"].push(jsonAdd);
        var jsonString = JSON.stringify(jsonObj, null, 4);
        fs.writeFile(jsonFile, jsonString, function(err) {
          if(err) {
            console.log(err);
          } else {
            console.log("The file was saved!");
            io.sockets.emit("newMedia", {path: newPath, name:req.files.file.name, id: id});
          }
        });
      });
    });
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

};
