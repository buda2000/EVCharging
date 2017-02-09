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




//OBJ TYPES Definition
const charging_speed = new GraphQLEnumType({
  name: 'charging_speed',
  description: 'Speed of the Charging Station',
  values: {
    FAST: {value: 'fast'},
    MEDIUM: {value: 'medium'},
    SLOW: {value: 'slow'}
  }
});

const User = new GraphQLObjectType({
  name: 'User',
  description: 'Represent the type of an User',
  fields: () => ({
    _id: {type: GraphQLString},
    name: {type: GraphQLString},
    email: {type: GraphQLString}
  })
});

const Reservation = new GraphQLObjectType({
  name: 'Reservation',
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
  name: 'Position',
  fields: {
    latitude: { type: new GraphQLNonNull(GraphQLFloat) },
    longitude: { type: new GraphQLNonNull(GraphQLFloat) },
  }
});


const EVChargingStation = new GraphQLObjectType({
  name: 'EVChargingStation',
  description: 'Electric Vehicle Charging Station ObjectType',
  fields: () => ({
    _id: {type: GraphQLString},
    charging_speed: {type: charging_speed},
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


    EVChargingStations: {
      type: new GraphQLList(EVChargingStation),
      description: 'List of Electric Vehicle Charging Stations',
      args: {
        charging_speed: {type: charging_speed}
      },
      resolve: function(source, {charging_speed}) {
        if (charging_speed){
          return _.filter(EVChargerStationsList, EVChargingStation => EVChargingStation.charging_speed === charging_speed);
        } else {
          console.log(EVChargerStationsList)
          return _.filter(EVChargerStationsList, EVChargingStation => true);
        }
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
