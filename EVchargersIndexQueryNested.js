********************************************************************************************************
INDEX CREATION and MAPPING 
********************************************************************************************************
PUT ev_chargers 
{
  "mappings": {
    "ev_charger": { 
      "properties": { 
        "charging_speed": { "type": "keyword"  }, 
        "position": { "type": "geo_point" },
	 	"available": { "type": "boolean" },
		"reservations": { "type": "nested",  
						  "properties": { 
							    "userID" :    { "type": "string" }, 
							    "timeslot":   { "type": "date_range", "format": "yyyy-MM-dd HH:mm:ss"} 
						  }
						}
      }
    }
  }
}

PUT ev_chargers/ev_charger/1
{
  "charging_speed" : "slow",
  "position": { "lat": 41.00,"lon": -71.00 },
  "available": true,
  "reservations" : [
    {
      "userID" : "andrea.buda@aalto.fi",
      "timeslot" :  { "gte" : "2015-10-31 12:00:00",  "lte" : "2015-10-31 13:00:00" }
    },
    {
      "userID" : "andrea_buda@hotmail.com",
      "timeslot" :  { "gte" : "2017-10-31 16:00:00",  "lte" : "2017-10-31 18:00:00" }
    }
  ]
}

PUT ev_chargers/ev_charger/2
{
  "charging_speed" : "fast",
  "position": { "lat": 41.01,"lon": -71.01 },
  "available": true,
  "reservations" : [
    {
      "userID" : "andrea.buda@aalto.fi",
      "timeslot" :  { "gte" : "2015-10-31 12:00:00",  "lte" : "2015-10-31 13:00:00" }
    },
    {
      "userID" : "andrea_buda@hotmail.com",
      "timeslot" :  { "gte" : "2018-10-31 16:00:00",  "lte" : "2018-10-31 18:00:00" }
    }
  ]
}



********************************************************************************************************
FILTER TO BE APPLIED to cleanup RESULTS GET /ev_chargers/ev_charger/_search          ?pretty&filter_path=hits.hits._id,hits.hits._source
********************************************************************************************************


********************************************************************************************************
SEARCH ALL CHARGER IN A GIVEN AREA
********************************************************************************************************
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
********************************************************************************************************
FIND ALL FUTURE RESERVATION for the day (gte: now+1d) for a given _id
********************************************************************************************************
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





********************************************************************************************************
ADD A NEW RESERVATION
********************************************************************************************************
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

********************************************************************************************************
REMOVE ALL OLD REVERVATIONS (cronjob admin)
********************************************************************************************************
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





