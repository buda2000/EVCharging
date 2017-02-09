const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'error'
});

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
            const hits = resp.hits.hits;
            console.log("Result: " + hits);
        }, function (err) {
            console.trace(err.message);
        });
};


export let searchByArea = (latitude, longitude, radius) => {

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
                                distance : radius,
                                position : {
                                    lat : latitude,
                                    lon : longitude
                                }
                            }
                        }
                    }
                }
        }
        }).then(function (resp) {
            const hits = resp.hits.hits._source;
            console.log("Result: " + hits[1]._source.charging_speed);
        }, function (err) {
            console.trace(err.message);
        });
};






let calculateMonthlyPayment =  (principal, years, rate) => {
    let monthlyRate = 0;
    if (rate) {
        monthlyRate = rate / 100 / 12;
    }
    let monthlyPayment = principal * monthlyRate / (1 - (Math.pow(1 / (1 + monthlyRate), years * 12)));
    
    return {principal, years, rate, monthlyPayment, monthlyRate};
};


export let calculateAmortization = (principal, years, rate) => {
    let {monthlyRate, monthlyPayment} = calculateMonthlyPayment(principal, years, rate);
    let balance = principal;
    let amortization = [];
    for (let y=0; y<years; y++) {
        let interestY = 0;  //Interest payment for year y
        let principalY = 0; //Principal payment for year y
        for (let m=0; m<12; m++) {
            let interestM = balance * monthlyRate;       //Interest payment for month m
            let principalM = monthlyPayment - interestM; //Principal payment for month m
            interestY = interestY + interestM;
            principalY = principalY + principalM;
            balance = balance - principalM;
        }
        amortization.push({principalY, interestY, balance});
    }
    return {monthlyPayment, monthlyRate, amortization};
};