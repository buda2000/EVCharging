# EVCharging
Electric Vehicle Charging Station - GraphQL API 

Disclaimer: Still under heavy development - Repository not yet usable

<h2>INSTALLATION and START</h2>
1) git clone https://github.com/buda2000/EVCharging.git
2) npm install
3) npm start

GraphyQL Query Builder -> Open the browser -> http://localhost:3000

<h2>TEST QUERIES</h2> 
Cut & paste on the GraphyQL Query Builder available at -> http://localhost:3000

query
{
  searchByArea(lat: 41, lon: -71, radius: 11200) {
    charger_id
    charging_speed
    available
    position {
      lat
      lon
    }
    reservations {
      reservation_id
      user_id
      timeslot {
        gte
        lte
      }
    }
  }
}


<h2>TODO</h2>
addReservation -> Mutation

