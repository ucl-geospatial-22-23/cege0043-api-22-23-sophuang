"use strict";
// express is the server that forms part of the nodejs program
let express = require('express');
let path = require("path");
let app = express();
let fs = require('fs');

// add an http server to serve files 	
let http = require('http');	let https = require('https');

// add an https server to serve files 
let httpServer = http.createServer(app);

let port = 4480;
httpServer.listen(port);

// adding functionality to allow cross-domain queries
app.use(function(req, res, next) {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "X-Requested-With");
	res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	next();
});



app.get('/',function (req,res) {
	res.send("hello world from the Data API on port: "+port);
});


// adding functionality to log the requests
app.use(function (req, res, next) {
	let filename = path.basename(req.url);
	let extension = path.extname(filename);
	console.log("The file " + filename + " was requested.");
	next();
});


const geoJSON = require('./routes/geoJSON');
app.use('/', geoJSON);


const crud = require('./routes/crud');
app.use('/', crud);