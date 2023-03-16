let express = require('express'); 
let pg = require('pg');
let crud = require('express').Router();
let fs = require('fs');
let os = require('os');
const userInfo = os.userInfo();
const username = userInfo.username;
console.log(username);
// locate the database login details
let configtext = ""+fs.readFileSync("/home/"+username+"/certs/postGISConnection.js");

// now convert the configruation file into the correct format -i.e. a name/value pair array 
let configarray = configtext.split(",");
let config = {};
for (let i = 0; i < configarray.length; i++) {
let split = configarray[i].split(':');
config[split[0].trim()] = split[1].trim(); }
let pool = new pg.Pool(config); console.log(config);

const bodyParser = require('body-parser'); crud.use(bodyParser.urlencoded({ extended: true }));

// test endpoint for GET requests (can be called from a browser URL or AJAX) 
crud.get('/testCRUD',function (req,res) {
   res.json({message:req.originalUrl+" " +"GET REQUEST"}); 
});
// test endpoint for POST requests - can only be called from AJAX 
crud.post('/testCRUD',function (req,res) {
    res.json({message:req.body}); 
});








module.exports = crud;