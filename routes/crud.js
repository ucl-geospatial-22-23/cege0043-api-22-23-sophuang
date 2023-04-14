"use strict";
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
let pool = new pg.Pool(config); 
console.log(config);

const bodyParser = require('body-parser'); crud.use(bodyParser.urlencoded({ extended: true }));



// test endpoint for GET requests (can be called from a browser URL or AJAX) 
crud.get('/testCRUD',function (req,res) {
   res.json({message:req.originalUrl+" " +"GET REQUEST"}); 
});
// test endpoint for POST requests - can only be called from AJAX 
crud.post('/testCRUD',function (req,res) {
    res.json({message:req.body}); 
});


// Test userid endpoint
crud.get('/userId', function (req,res) {
    //res.json({message:req.originalUrl+" " +"GET REQUEST"}); 
    pool.connect(function(err,client,done) {
           if(err){
               console.log("not able to get connection "+ err);
               res.status(400).send(err);
           } 
    var querystring = "select user_id from ucfscde.users where user_name = current_user;";
           client.query(querystring,function(err,result) {
               done(); 
               if(err){
                   console.log(err);
                   res.status(400).send(err);
               }
               res.status(200).send(result.rows);
           });
        });
    });

/*   Test insertAssetPoint endpoint
    -- REFERENCE: A1
    -- SQL for insert functionality
    
    -- ENDPOINT
    -- crud.post(/insertAssetPoint/,....
    
    -- REMINDER:  use req.body.xxx to get the parameters
    -- Assets
          var geometrystring = "st_geomfromtext('POINT("+req.body.longitude+ " "+req.body.latitude +")',4326)";
          var querystring = "INSERT into cege0043.asset_information (asset_name,installation_date, location) values ";
          querystring += "($1,$2,";
          querystring += geometrystring + ")";

*/
crud.post('/insertAssetPoint', function (req, res) {
    pool.connect(function (err, client, done) {
    
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }
  
      // Use req.body and req.params to get the parameters
      let assetName = req.body.asset_name;
      let installationDate = req.body.installation_date;
      let longitude = req.body.longitude;
      let latitude = req.body.latitude;
  
      // Construct the geometry string and query string
      let geometryString = "st_geomfromtext('POINT(" + longitude + " " + latitude + ")',4326)";
      let querystring = "INSERT into cege0043.asset_information(asset_name, installation_date, location) values ";
      querystring += "($1,$2,"; 
      querystring += geometryString + ")";
  
      // Execute the query
      client.query(querystring, [assetName, installationDate], function (err, result) {
        // Release the client back to the pool
        done();
  
        if (err) {
          console.log(err);
          res.status(400).send(err);
        } 
        else {
          res.status(200).send("Form Data "+ req.body.asset_name + " has been inserted");
        }
      });
    });
  });


  

module.exports = crud;