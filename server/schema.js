import * as _ from 'underscore';
import * as ES from './ES';
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat,
  GraphQLEnumType,
  GraphQLNonNull,
  GraphQLInterfaceType
} from 'graphql';

const util = require('util')




//OBJ TYPES Definition
const Charging_speed = new GraphQLEnumType({
  name: 'charging_speed',
  description: 'Speed of the Charging Station',
  values: {
    fast: {value: 'fast'},
    medium: {value: 'medium'},
    slow: {value: 'slow'}
  }
});

const User = new GraphQLObjectType({
  name: 'user',
  description: 'Represent the type of an User',
  fields: () => ({
    _id: {type: GraphQLString},
    name: {type: GraphQLString},
    email: {type: GraphQLString}
  })
});

const Reservation = new GraphQLObjectType({
  name: 'reservation',
  description: 'Represent the type of a Reservation',
  fields: () => ({
    _id: {type: GraphQLString},
    user: {
      type: User,
      resolve: function({user}) {
        return UsersMap[user];
      }
    },
    timeslot: {type: GraphQLFloat}
  })
});

var Position = new GraphQLObjectType({
  name: 'position',
  fields: {
    lat: { type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/latitude' },
    lon: { type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/longitude' },
  }
});



const EVChargingStation = new GraphQLObjectType({
  name: 'EVChargingStation',
  description: 'Electric Vehicle Charging Station ObjectType',
  fields: () => ({
    c_id: {type: GraphQLString},
    charging_speed: {type: Charging_speed},
    available: {type: GraphQLBoolean},
    user: {
      type: User,
      resolve: function({user}) {
        return UsersMap[user];
      }
    },
    position: {
      type: Position,
      resolve: function({_id}) {
        return EVChargerStationsList[_id].position;
      }
    },
    reservations: {
      type: new GraphQLList(Reservation),
      args: {
        limit: {type: GraphQLInt, description: 'Limit the Reservations returing'}
      },
      resolve: function({_id}, {limit}) {
        if(limit >= 0) {
          return EVChargerStationsList[_id].reservations.slice(0, limit);
        }
        return EVChargerStationsList[_id].reservations;
      }
    }
  })
});



//Schema Building
const Query = new GraphQLObjectType({
  name: 'EVChargingStations_Schema',
  description: 'Root of the EVChargingStations Schema',
  fields: () => ({


     searchByArea: {
      type: new GraphQLList(EVChargingStation),
      description: 'List of Electric Vehicle Charging Stations with a given radius',
      args: {
        lat: {type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/latitude'  },
        lon: {type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/longitude' },
        radius: {type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/geoRadius' },
        charging_speed: {type: Charging_speed}
      },
      resolve: function(source, args) {

          return ES.client.search({index: 'ev_chargers', type: 'ev_charger', body: ES.queryByArea(args)}).
                then(function (resp) {
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
      }
    },


    Users: {
      type: new GraphQLList(User),
      description: 'Users List for EV Charging APP',
      resolve: function() {
        return _.values(UsersMap);
      }
    },

    user: {
      type: User,
      description: 'User by _id',
      args: {
        _id: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: function(source, {_id}) {
        return UsersMap[_id];
      }
    }
  })
});

const Mutation = new GraphQLObjectType({
  name: "Mutations",
  fields: {
    addReservation: {
      type: Reservation,
      args: {
        userID: {type: new GraphQLNonNull(GraphQLString)},
        chargerID: {type: new GraphQLNonNull(GraphQLString)},
        startTime: {type: new GraphQLNonNull(GraphQLString)},
        endTime: {type: new GraphQLNonNull(GraphQLString)}
      },
      resolve: function(rootValue, args) {

          let reservationID = ES.addReservation(args.userID, args.chargerID, args.startTime, args.endTime)
            
          if(reservationID != -1)
            return {_id: "ack"}
          else
            return {_id : "error", reason: "Reservation Not Placed - Check your request parameters"}
      }
    }
  }
});

const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
});

export default Schema;
