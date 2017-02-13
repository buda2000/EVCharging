const util = require('util')

const elasticsearch = require('elasticsearch');
export const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});

export let searchByArea = (args) => new Promise((resolve, reject) => {
    //TODO >> args.charging_speed
    client.search({
        index: 'ev_chargers',
        type: 'ev_charger',
        body: {query: {
                      bool : {
                        must : { match_all : {} },
                        filter : {
                            geo_distance : {
                                distance : args.radius,
                                position : {lat : args.lat, lon : args.lon}
              }}}}}
        }).then(function (resp) {
            
            const hits = resp.hits.hits;
            let results = [];
            for (let hit of hits){
                results.push(hit._source);
            } 
            resolve(results);
            
        }, function (err) {
            reject( {status: "error"} );
        });
});


export let addReservation = (args) => new Promise((resolve, reject) => {

    const rid = 'rid-' + Math.ceil(Math.random() * 99999999)
    client.update({
        index: 'ev_chargers',
        type: 'ev_charger',
        id: '1',
        body: {
            "script" : {
                    "inline": "ctx._source.reservations.add(params.reservation)",
                    "lang": "painless",
                    "params" : {
                        "reservation" : {
                                        "reservation_id": rid,
                                        "user_id" : args.user_id,
                                        "timeslot" :  { "gte" : args.gte,  "lte" : args.lte}
                                        }
                    }
                }
        }
        }).then(function (resp) {
            resolve( {reservation_id: rid});
        }, function (err) {
            reject( {status: "error"} );
        });
});