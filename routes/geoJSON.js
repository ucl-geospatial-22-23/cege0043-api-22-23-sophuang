"use strict";
var express = require('express');
var pg = require('pg');
var geoJSON = require('express').Router();
var fs = require('fs');

const os = require('os');
const userInfo = os.userInfo();

const username = userInfo.username;
console.log(username);
// locate the database login details
var configtext = ""+fs.readFileSync("/home/"+username+"/certs/postGISConnection.js");

// now convert the configruation file into the correct format -i.e. a name/value pair array
var configarray = configtext.split(",");
var config = {};
for (var i = 0; i < configarray.length; i++) {
    var split = configarray[i].split(':');
    config[split[0].trim()] = split[1].trim();
}
var pool = new pg.Pool(config);
console.log(config);

geoJSON.route('/testGeoJSON').get(function (req,res) {
    res.json({message:req.originalUrl});
});

geoJSON.get('/postgistest', function (req,res) {
pool.connect(function(err,client,done) {
       if(err){
           console.log("not able to get connection "+ err);
           res.status(400).send(err);
       } 
   var query = "select * from information_schema.tables";

       client.query(query ,function(err,result) {
           done(); 
           if(err){
               console.log(err);
               res.status(400).send(err);
           }
           res.status(200).send(result.rows);
       });
    });
});

geoJSON.get('/postgistest_parameters', function (req,res) {
pool.connect(function(err,client,done) {
   var schemaname = 'ucfscde';
    var tabletype ='BASE TABLE';
   if(err){
       console.log("not able to get connection "+ err);
       res.status(400).send(err);
   } 
  var query = 'select * from information_schema.tables where table_schema = $1 and table_type =$2' ;
   client.query(query, [schemaname,tabletype],function(err,result) {
       done(); 
       if(err){
           console.log(err);
           res.status(400).send(err);
       }
       res.status(200).send(result.rows);
   });
});
});


 geoJSON.get('/getRoom', function (req,res) {
pool.connect(function(err,client,done) {
       if(err){
           console.log("not able to get connection "+ err);
           res.status(400).send(err);
       } 
var querystring = "SELECT 'FeatureCollection'";
querystring = querystring + " as type, array_to_json(array_agg(f)) As features ";
querystring = querystring + " FROM (SELECT 'Feature' As type , ST_AsGeoJSON(lg.location)::json As geometry , ";
querystring = querystring + "row_to_json(lp) As properties FROM ucfscde.rooms As lg INNER JOIN (SELECT room_id, room_use, building_id FROM ucfscde.rooms)  ";
querystring = querystring + "   As lp ON lg.room_id = lp.room_id ) As f";

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

//conditionDetails endpoint
geoJSON.get('/conditionDetails', function (req,res) {
    pool.connect(function(err,client,done) {
           if(err){
               console.log("not able to get connection "+ err);
               res.status(400).send(err);
           } 
    var querystring = "select * from cege0043.asset_condition_options;";
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







geoJSON.get('/getGeoJSON/:schemaname/:tablename/:idcolumn/:geomcolumn', function (req,res) {
 pool.connect(function(err,client,done) {
    if(err){
        console.log("not able to get connection "+ err);
        res.status(400).send(err);
    } 

    var colnames = "";

    // first get a list of the columns that are in the table 
    // use string_agg to generate a comma separated list that can then be pasted into the next query
    var tablename = req.params.tablename;
var schema = req.params.schemaname;
var idcolumn = req.params.idcolumn;
    var geomcolumn = req.params.geomcolumn;
    var querystring = "select string_agg(colname,',') from ( select column_name as colname ";
    querystring = querystring + " FROM information_schema.columns as colname ";
    querystring = querystring + " where table_name   =$1";
    querystring = querystring + " and column_name <> $2 and table_schema = $3 and data_type <> 'USER-DEFINED') as cols ";

        console.log(querystring);
        
        // now run the query
        client.query(querystring,[tablename,geomcolumn,schema], function(err,result){
          if(err){
            console.log(err);
                res.status(400).send(err);
        }
        thecolnames = result.rows[0].string_agg;
        colnames = thecolnames;
        console.log("the colnames "+thecolnames);

var cols = colnames.split(",");
                    var colString="";
                    for (var i =0; i< cols.length;i++){
                        console.log(cols[i]);
                        colString = colString + JSON.stringify(cols[i]) + ",";
                    }
                    console.log(colString);

                    //remove the extra comma
                    colString = colString.substring(0,colString.length -1);

        // now use the inbuilt geoJSON functionality
        // and create the required geoJSON format using a query adapted from here:  
        // http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
        // note that query needs to be a single string with no line breaks so built it up bit by bit


// to overcome the polyhedral surface issue, convert them to simple geometries
// assume that all tables have an id field for now - to do add the name of the id field as a parameter
querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
querystring += "(select 'Feature' as type, x.properties,st_asgeojson(y.geometry)::json as geometry from ";
querystring +=" (select "+idcolumn+", row_to_json((SELECT l FROM (SELECT "+colString + ") As l )) as properties   FROM "+schema+"."+JSON.stringify(tablename) + " ";


querystring += " ) x";
querystring +=" inner join (SELECT "+idcolumn+", c.geom as geometry";

querystring +=" FROM ( SELECT "+idcolumn+", (ST_Dump(st_transform("+JSON.stringify(geomcolumn)+",4326))).geom AS geom ";

querystring +=" FROM "+schema+"."+JSON.stringify(tablename)+") c) y  on y."+idcolumn+" = x."+idcolumn+") f";
console.log(querystring);

        // run the second query
        client.query(querystring,function(err,result){
          //call `done()` to release the client back to the pool
        done(); 
        if(err){    


                        console.log(err);
                res.status(400).send(err);
         }
        console.log(result.rows);
        
        var geoJSONData = JSON.stringify(result.rows);
        // the data from PostGIS is surrounded by [ ] which doesn't work in QGIS, so remove
        geoJSONData = geoJSONData.substring(1); 
        geoJSONData = geoJSONData.substring(0, geoJSONData.length - 1);         
        console.log(geoJSONData);
        res.status(200).send(JSON.parse(geoJSONData));
    });
    
    });
});
});


module.exports = geoJSON;
