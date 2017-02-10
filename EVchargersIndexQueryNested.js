//********************************************************************************************************
//INDEX CREATION and MAPPING 
//********************************************************************************************************
DELETE ev_chargers

PUT ev_chargers 
{
  "mappings": {
    "ev_charger": { 
      "properties": {
		"charger_id":	{ "type": "string"  }, 
        "charging_speed": { "type": "keyword"  }, 
        "position": { "type": "geo_point" },
	 	"available": { "type": "boolean" },
		"reservations": { "type": "nested",  
						  "properties": { 
								"reservation_id": { "type": "string" }, 
							    "user_id" : { "type": "string" }, 
							    "timeslot": { "type": "date_range", "format": "yyyy-MM-dd HH:mm:ss"} 
						  }
						}
      }
    }
  }
}

PUT ev_chargers/ev_charger/1
{
  "charger_id": "1",	
  "charging_speed" : "slow",
  "position": { "lat": 41.00,"lon": -71.00 },
  "available": true,
  "reservations" : [
    {
	  "reservation_id": "1.1",	
      "user_id" : "andrea.buda@aalto.fi",
      "timeslot" :  { "gte" : "2015-10-31 12:00:00",  "lte" : "2015-10-31 13:00:00" }
    },
    {
	  "reservation_id": "1.2",		
      "user_id" : "andrea_buda@hotmail.com",
      "timeslot" :  { "gte" : "2017-10-31 16:00:00",  "lte" : "2017-10-31 18:00:00" }
    }
  ]
}

PUT ev_chargers/ev_charger/2
{
  "charger_id": "2",
  "charging_speed" : "fast",
  "position": { "lat": 41.01,"lon": -71.01 },
  "available": true,
  "reservations" : [
    {
	  "reservation_id": "2.1",	
      "user_id" : "andrea.buda@aalto.fi",
      "timeslot" :  { "gte" : "2015-10-31 12:00:00",  "lte" : "2015-10-31 13:00:00" }
    },
    {
	  "reservation_id": "2.2",	
      "user_id" : "andrea_buda@hotmail.com",
      "timeslot" :  { "gte" : "2018-10-31 16:00:00",  "lte" : "2018-10-31 18:00:00" }
    }
  ]
}

GET  ev_chargers/_search

//********************************************************************************************************
//FILTER TO BE APPLIED to cleanup RESULTS GET /ev_chargers/ev_charger/_search          ?pretty&filter_path=hits.hits._id,hits.hits._source
//********************************************************************************************************


//********************************************************************************************************
//SEARCH ALL CHARGER IN A GIVEN AREA
//********************************************************************************************************
GET /ev_chargers/ev_charger/_search?pretty&filter_path=hits.hits._id,hits.hits._source
{
	"_source": {
        "excludes": [ "reservations.*" ]
    },
    "query": {
        "bool" : {
            "must" : {
                "match_all" : {}
            },
            "filter" : {
                "geo_distance" : {
                    "distance" : "1200m",
                    "position" : {
                        "lat" : 41,
                        "lon" : -71
                    }
                }
            }
        }
    }
}
//********************************************************************************************************
//FIND ALL FUTURE RESERVATION for the day (gte: now+1d) for a given _id
//********************************************************************************************************
GET /ev_chargers/ev_charger/_search
{
    "_source": {
        "excludes": [ "*" ]
    },
    "query": {
        "nested" : {
            "path" : "reservations",
            "inner_hits" : { },
            "query" : {
                "bool" : {
                    "must" : [
                    { "match" : {"_id": "2"} },
                    { "range" : {"reservations.timeslot" : {"gte" : "now", "lt" :  "now+1d"}} }
                    ]
                }
            }
        }
    }
}





//********************************************************************************************************
//ADD A NEW RESERVATION
//********************************************************************************************************
POST ev_chargers/ev_charger/1/_update
{
    "script" : {
        "inline": "ctx._source.reservations.add(params.reservation)",
        "lang": "painless",
        "params" : {
            "reservation" : {
						      "userID" : "xxxx@hotmail.com",
						      "timeslot" :  { "gte" : "2015-10-31 16:00:00",  "lte" : "2015-10-31 18:00:00" }
						    }
        }
    }
}

//********************************************************************************************************
//REMOVE ALL OLD REVERVATIONS (cronjob admin)
//********************************************************************************************************
var query = run FIND ALL FUTURE RESERVATION (gte: now) for a given _id
var newReservations = jsonParse(query) > getListOf reservations.hits.hits._source 
POST ev_chargers/ev_charger/1/_update
{
    "script" : {
        "inline": "ctx._source.reservations = reservationUpdated",
        "lang": "painless",
        "params" : {
            "reservationUpdated" : [ newReservations ] 
        }
    }
}





