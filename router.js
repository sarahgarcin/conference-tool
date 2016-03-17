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
    fs.readFile(req.files.file.path, function (err, data) {
      var newPath = __dirname + "/uploads/"+req.files.file.name;
      fs.writeFile(newPath, data, function (err) {
        io.sockets.emit("newMedia", {path: newPath, name:req.files.file.name});
      });
    });
  };

};
