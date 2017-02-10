const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

createIndex();

function createIndex(){
    client.indices.delete({
        index: 'ev_chargers',
        ignore: [404]
        }).then(function (body) {
            console.log('1) Index:ev_chargers was deleted or never existed');
            client.indices.create({
                index: 'ev_chargers',
                }).then(function (body) {
                    console.log('2) ev_chargers Index Created');
                    createMapping();
                }, function (error) {
                    console.log('ERROR: indices.create');
                });
        }, function (error) {
            console.log('ERROR: indices.delete');
        });
}

function createMapping() {
    client.indices.putMapping({
        index: 'ev_chargers',
        type: 'ev_charger',
        body: {
            properties:{
                c_id:	{ type: 'string'  }, 
                charging_speed: { type: 'keyword'  }, 
                position: { type: 'geo_point' },
                available: { type: 'boolean' },
                reservations: { type: 'nested',  
                                    properties: { 
                                        userID :    { type: 'string' }, 
                                        timeslot:   { type: 'date_range', format: 'yyyy-MM-dd HH:mm:ss'} 
                                    }
                                }
                }
            }
    }).then(function (body) {
        console.log('3) ev_charger Type Mapping Created');
        insertBulkData()
        return true;
    }, function (error) {
        console.log('ERROR: indices.putMapping: ' + error);
        return false;
    });
}

// Sample Data Insert
function insertBulkData()
{
    client.bulk({
    body: [
        { create:  {index: 'ev_chargers', type: 'ev_charger', id: '1',
                    body: {
                            "c_id": "1",	
                            "charging_speed" : "slow",
                            "position": { "lat": 41.00,"lon": -71.00 },
                            "available": false,
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
                }
        },
        { create:  {index: 'ev_chargers', type: 'ev_charger', id: '2',
                    body: {
                            "id": "1",		
                            "charging_speed" : "fast",
                            "position": { "lat": 41.01,"lon": -71.01 },
                            "available": true,
                            "reservations" : [
                                {
                                "userID" : "andrea.buda@aalto.fi",
                                "timeslot" :  { "gte" : "2015-10-31 12:00:00",  "lte" : "2015-10-31 13:00:00" }
                                },
                                {
                                "userID" : "andrea_buda@aalto.fi",
                                "timeslot" :  { "gte" : "2018-10-31 16:00:00",  "lte" : "2018-10-31 18:00:00" }
                                }
                            ]
                         }
                }
        },
    ]
    }, function (err, resp) {
       if(resp)
       console.log('client.bulk INSERT Success!');
       else
        console.log('ERROR: client.bulk failed: ' + error);
         
    });
}
