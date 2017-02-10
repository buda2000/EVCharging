const util = require('util')

const elasticsearch = require('elasticsearch');
export const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

export let queryByArea = (args) => 
{
    return {
            query: {
            bool : {
                must : {
                    match_all : {}
                },
                filter : {
                    geo_distance : {
                        distance : args.radius,
                        position : {
                            lat : args.lat,
                            lon : args.lon
                        }
                    }
                }
            }
        }
    }
};


export let searchByArea = (args) => {
    //TODO >> args.charging_speed
    client.search({
        index: 'ev_chargers',
        type: 'ev_charger',
        body: queryByArea,
        }).then(function (resp) {
            
            const hits = resp.hits.hits;
            let results = [];
            for (let hit of hits){
                results.push(hit._source);
            } 
            console.log("results_searchByArea > " + util.inspect(results, false, null));

            return results;
            
        }, function (err) {
            console.trace(err.message);
            return {status: "error"};
        });
};


export let addReservation = (userID, chargerID, startTime, endTime) => {

    client.search({
        index: 'ev_chargers',
        type: 'ev_charger',
        body: {
                query: {
                    bool : {
                        must : {
                            match_all : {}
                        },
                        filter : {
                            geo_distance : {
                                distance : 11200,
                                position : {
                                    lat : 41,
                                    lon : -71
                                }
                            }
                        }
                    }
                }
        }
        }).then(function (resp) {
            const hits = resp.hits.hits._source;
            console.log("Result: " + hits);
            let results = [];
            for (let hit of hits) 
                results.push(hit);
            
            return results;
            

        }, function (err) {
            console.trace(err.message);
        });
};


