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
    user_id: {type: GraphQLString},
    name: {type: GraphQLString},
    email: {type: GraphQLString}
  })
});

const Reservation = new GraphQLObjectType({
  name: 'reservation',
  description: 'Represent the type of a Reservation',
  fields: () => ({
    reservation_id: {type: GraphQLString},
    user_id : {type: GraphQLString},
    timeslot: {type: Timeslot}
  })
});

var Position = new GraphQLObjectType({
  name: 'position',
  fields: {
    lat: { type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/latitude' },
    lon: { type: new GraphQLNonNull(GraphQLFloat), description: '@type: https://schema.org/longitude' },
  }
});

var Timeslot = new GraphQLObjectType({
  name: 'timeslot',
  fields: {
    gte: { type: new GraphQLNonNull(GraphQLString), description: '@type: http://schema.org/startTime' },
    lte: { type: new GraphQLNonNull(GraphQLString), description: '@type: http://schema.org/endTime' },
  }
});



const EVChargingStation = new GraphQLObjectType({
  name: 'EVChargingStation',
  description: 'Electric Vehicle Charging Station ObjectType',
  fields: () => ({
    charger_id: {type: GraphQLString},
    charging_speed: {type: Charging_speed},
    available: {type: GraphQLBoolean},
    position: {type: Position},
    reservations: {type: new GraphQLList(Reservation)}
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
          return ES.searchByArea(args);
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
        user_id: {type: new GraphQLNonNull(GraphQLString)},
        charger_id: {type: new GraphQLNonNull(GraphQLString)},
        gte: {type: new GraphQLNonNull(GraphQLString),  description: '@type: http://schema.org/startTime'},
        lte: {type: new GraphQLNonNull(GraphQLString),  description: '@type: https://schema.org/endTime'}
      },
      resolve: function(rootValue, args) {
          return ES.addReservation(args);
      }
    }
  }
});

const Schema = new GraphQLSchema({
  query: Query,
  mutation: Mutation
});

export default Schema;
