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

/*
    ---------------------------------------------------------
    ---------------------------------------------------------
    ---------------------------------------------------------
    -- REFERENCE: A2
    -- Code to get only the geoJSON asset locations for a specific user_id
    -- Use when first loading the web page and also when another layer is removed
    -- ENDPOINT
    -- geoJSON.get(/userAssets/:user_id, ...
    
    -- REMINDER:  use  req.params.xxx;   to get the values
       
              var colnames = "asset_id, asset_name, installation_date, latest_condition_report_date, condition_description";
             
    
              // now use the inbuilt geoJSON functionality
              // and create the required geoJSON format using a query adapted from here:
              // http://www.postgresonline.com/journal/archives/267-Creating-GeoJSON-Feature-Collections-with-JSON-and-PostGIS-functions.html, accessed 4th January 2018
    
              // note that query needs to be a single string with no line breaks so built it up bit by bit
             var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
              querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
              querystring += "row_to_json((SELECT l FROM (SELECT "+colnames + " ) As l      )) As properties";
              querystring += "   FROM cege0043.asset_with_latest_condition As lg ";
             querystring += " where user_id = $1 limit 100  ) As f ";
*/


geoJSON.get('/userAssets/:user_id', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }
   
      var colnames = "asset_id, asset_name, installation_date, latest_condition_report_date, condition_description";
      var user_id = req.params.user_id;
   
       // first get a list of the columns that are in the table 
       // use string_agg to generate a comma separated list that can then be pasted into the next query


       var querystring = " SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
      querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
      querystring += "row_to_json((SELECT l FROM (SELECT " + colnames + " ) As l      )) As properties";
      querystring += "   FROM cege0043.asset_with_latest_condition As lg ";
      querystring += " where user_id = $1 limit 100  ) As f ";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, [user_id], function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });
  
/*
   -------------------------------------------------------------
   -- REFERENCE: A3
   -- Condition App: user is told how many condition reports they have saved, when they add a new condition report (xxxx is the user_id of the particular person)
   -- $1 is the user_id parameter passed to the query
   
   -- ENDPOINT
   -- geoJSON.get(/userConditionReports/:user_id, ...
   
   -- REMINDER:  use  req.params.xxx;   to get the values
   
   
   select array_to_json (array_agg(c))
   from
   (SELECT COUNT(*) AS num_reports from cege0043.asset_condition_information where user_id = $1) c;
*/   

geoJSON.get('/userConditionReports/:user_id', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }

      var count = req.params.user_id;
   
       // first get a list of the columns that are in the table 
       // use string_agg to generate a comma separated list that can then be pasted into the next query


       var querystring = "select array_to_json (array_agg(c))";
      querystring += "from";
      querystring += "(SELECT COUNT(*) AS num_reports from cege0043.asset_condition_information where user_id = $1) c;";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, [count], function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });


/*
   -------------------------------------------------------------
   -- REFERENCE S1
   -- Condition App: user is given their ranking (based on condition reports, in comparison to all other users) (as a menu option)
   -- $1 is the user_id parameter passed to the query
   
   -- ENDPOINT
   -- geoJSON.get(/userRanking/:user_id, ...
   
   -- REMINDER:  use  req.params.xxx;   to get the values
   
   select array_to_json (array_agg(hh))
   from
   (select c.rank from (SELECT b.user_id, rank()over (order by num_reports desc) as rank 
   from (select COUNT(*) AS num_reports, user_id 
   from cege0043.asset_condition_information
   group by user_id) b) c
   where c.user_id = $1) hh
*/
geoJSON.get('/userRanking/:user_id', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }

      var user_id = req.params.user_id;
   
       // first get a list of the columns that are in the table 
       // use string_agg to generate a comma separated list that can then be pasted into the next query


       var querystring = "select array_to_json (array_agg(hh))";
      querystring += "from";
      querystring += "(select c.rank from (SELECT b.user_id, rank()over (order by num_reports desc) as rank ";
      querystring += "from (select COUNT(*) AS num_reports, user_id ";
      querystring += "from cege0043.asset_condition_information ";
      querystring += "group by user_id) b) c ";
      querystring += "where c.user_id = $1) hh";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, [user_id], function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });


/*
   ------------------------------------------------------
   -- REFERENCE L1
   -- Asset Location App: list of all the assets with at least one report saying that they are in the best condition  (via a menu option) 
   -- Return result as a JSON list
   
   -- ENDPOINT
   -- geoJSON.get(/assetsInGreatCondition, ... 
   
   
   select array_to_json (array_agg(d)) from
   (select c.* from cege0043.asset_information c
   inner join 
   (select count(*) as best_condition, asset_id from cege0043.asset_condition_information where 
   condition_id in (select id from cege0043.asset_condition_options where condition_description like '%very good%')
   group by asset_id
   order by best_condition desc) b
   on b.asset_id = c.id) d;
*/

geoJSON.get('/assetsInGreatCondition', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }
   
       // first get a list of the columns that are in the table 
       // use string_agg to generate a comma separated list that can then be pasted into the next query


       var querystring = "select array_to_json (array_agg(d)) from ";
      querystring += "(select c.* from cege0043.asset_information c ";
      querystring += "inner join ";
      querystring += "(select count(*) as best_condition, asset_id from cege0043.asset_condition_information where ";
      querystring += "condition_id in (select id from cege0043.asset_condition_options where condition_description like '%very good%') ";
      querystring += "group by asset_id ";
      querystring += "order by best_condition desc) b ";
      querystring += "on b.asset_id = c.id) d;";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });

/*
   ------------------------------------------------------
   -- REFERENCE L2
   -- Asset App: graph showing daily reporting rates for the past week (how many reports have been submitted, and how many of these had condition as one of the two 'not working' options) (as a menu option)
   -- return data as JSON so that it can be used in D3
   -- For all users
   
   -- ENDPOINT
   -- geoJSON.get(/dailyParticipationRates, ...
   
   -- REMINDER:  use  req.params.xxx;   to get the values
   
   
   select  array_to_json (array_agg(c)) from 
   (select day, sum(reports_submitted) as reports_submitted, sum(not_working) as reports_not_working
   from cege0043.report_summary
   group by day) c 
*/

geoJSON.get('/dailyParticipationRates', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }

       var querystring = "select  array_to_json (array_agg(c)) from ";
      querystring += "(select day, sum(reports_submitted) as reports_submitted, sum(not_working) as reports_not_working ";
      querystring += "from cege0043.report_summary ";
      querystring += "group by day) c ";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });


/*
   ------------------------------------------------------
   -- REFERENCE S2
   -- Condition App: map layer showing the 5 assets closest to the user’s current location, added by any user.  The layer must be added/removed via a menu option
   -- Return result as GeoJSON for display purposes
   -- XXX and YYY are the lat/lng of the user
   -- note that as this is a geomfromtext situation you can't use the standard $1, $2 for these variables - instead build the query up using strings
   
   -- ENDPOINT
   -- geoJSON.get(/userFiveClosestAssets/:latitude/:longitude, ...
   
   -- REMINDER:  use  req.params.xxx;   to get the values
   
   
   
   SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM 
   (SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, 
   row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l 
    )) As properties
    FROM   (select c.* from cege0043.asset_information c
   inner join (select id, st_distance(a.location, st_geomfromtext('POINT(XXXX YYYY)',4326)) as distance
   from cege0043.asset_information a
   order by distance asc
   limit 5) b
   on c.id = b.id ) as lg) As f
*/
geoJSON.get('/userFiveClosestAssets/:latitude/:longitude', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }

       var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
      querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
      querystring += "row_to_json((SELECT l FROM (SELECT id, asset_name, installation_date) As l ";
      querystring += " )) As properties ";
      querystring += "FROM   (select c.* from cege0043.asset_information c ";
      querystring += "inner join (select id, st_distance(a.location, st_geomfromtext('POINT("+req.params.longitude+ " "+req.params.latitude +")',4326)) as distance ";
      querystring += "from cege0043.asset_information a ";
      querystring += "order by distance asc ";
      querystring += "limit 5) b ";
      querystring += "on c.id = b.id ) as lg) As f";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring, function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
          });
    });
   });


/*
   ------------------------------------------------------
   -- REFERENCE S3
   -- Condition App: map showing the last 5 reports that the user created (colour coded depending on the conditition rating)
   -- Return result as GeoJSON
   -- $1 is the user_id
   
   -- ENDPOINT
   -- geoJSON.get(/lastFiveConditionReports/:user_id, ... 
   
   -- REMINDER:  use  req.params.xxx;   to get the values
   
   
   SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM 
   (SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, 
   row_to_json((SELECT l FROM (SELECT id,user_id, asset_name, condition_description
   ) As l 
    )) As properties
    FROM 
   (select * from cege0043.condition_reports_with_text_descriptions 
   where user_id = $1
   order by timestamp desc
   limit 5) as lg) As f
*/
geoJSON.get('/lastFiveConditionReports/:user_id', function (req, res) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.log("not able to get connection " + err);
        res.status(400).send(err);
      }
      let user_id = req.params.user_id;

       var querystring = "SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features  FROM ";
      querystring += "(SELECT 'Feature' As type     , ST_AsGeoJSON(lg.location)::json As geometry, ";
      querystring += "row_to_json((SELECT l FROM (SELECT id,user_id, asset_name, condition_description";
      querystring += ") As l ";
      querystring += ")) As properties ";
      querystring += "FROM ";
      querystring += "(select * from cege0043.condition_reports_with_text_descriptions ";
      querystring += "where user_id = $1 ";
      querystring += "order by timestamp desc ";
      querystring += "limit 5) as lg) As f";
   
        console.log(querystring);
           
           // now run the query
           client.query(querystring,[user_id], function (err, result) {
            done();
            if (err) {
              console.log(err);
              res.status(400).send(err);
            } else {
              res.status(200).json(result.rows); // Send the result to the client
            }
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
