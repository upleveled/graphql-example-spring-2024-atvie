import { gql } from '@apollo/client';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { GraphQLError } from 'graphql';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAnimal,
  deleteAnimal,
  getAnimalInsecure,
  getAnimalsInsecure,
  updateAnimal,
} from '../../../database/animals';
import { createNote } from '../../../database/notes';
import { Animal, Resolvers } from '../../../graphql/graphqlGeneratedTypes';

export type GraphqlResponseBody =
  | {
      animal: Animal;
    }
  | Error;

const typeDefs = gql`
  type Animal {
    id: ID!
    firstName: String!
    type: String!
    accessory: String
  }

  type User {
    id: ID!
    username: String
  }

  type Note {
    id: ID!
    title: String
    textContent: String
  }

  type Query {
    animals: [Animal]
    animal(id: ID!): Animal
  }

  type Mutation {
    createAnimal(firstName: String!, type: String!, accessory: String): Animal

    deleteAnimal(id: ID!): Animal

    updateAnimal(
      id: ID!
      firstName: String!
      type: String!
      accessory: String
    ): Animal

    login(username: String!, password: String!): User

    createNote(title: String!, textContent: String!): Note
  }
`;

const resolvers: Resolvers = {
  Query: {
    animals: async () => {
      return await getAnimalsInsecure();
    },

    animal: async (parent, args) => {
      return await getAnimalInsecure(Number(args.id));
    },
  },

  Mutation: {
    createAnimal: async (parent, args) => {
      if (
        typeof args.firstName !== 'string' ||
        typeof args.type !== 'string' ||
        (args.accessory && typeof args.type !== 'string') ||
        !args.firstName ||
        !args.type
      ) {
        throw new GraphQLError('Required field missing');
      }

      const animal = await createAnimal({
        accessory: args.accessory || null,
        firstName: args.firstName,
        type: args.type,
      });

      if (!animal) {
        throw new GraphQLError('Failed to create animal');
      }

      return animal;
    },

    updateAnimal: async (parent, args, context) => {
      if (!context.insecureSessionTokenCookie) {
        throw new GraphQLError('Unauthorized operation');
      }

      if (
        typeof args.firstName !== 'string' ||
        typeof args.type !== 'string' ||
        (args.accessory && typeof args.type !== 'string') ||
        !args.firstName ||
        !args.type
      ) {
        throw new GraphQLError('Required field missing');
      }
      return await updateAnimal({
        id: Number(args.id),
        firstName: args.firstName,
        type: args.type,
        accessory: args.accessory || null,
      });
    },

    deleteAnimal: async (parent, args, context) => {
      if (!context.insecureSessionTokenCookie) {
        throw new GraphQLError('Unauthorized operation');
      }
      return await deleteAnimal(
        // context.insecureSessionTokenCookie.value,
        Number(args.id),
      );
    },

    login: (parent, args) => {
      if (
        typeof args.username !== 'string' ||
        typeof args.password !== 'string' ||
        !args.username ||
        !args.password
      ) {
        throw new GraphQLError('Required field missing');
      }

      // FIXME: Implement secure authentication
      if (args.username !== 'victor' || args.password !== 'asdf') {
        throw new GraphQLError('Invalid username or password');
      }

      // FIXME: Create a secure session token cookie:
      // 1. Generate a token
      // 2. Store the token in the database
      // 3. Set a cookie with the token value
      cookies().set(
        'sessionToken',
        'ae96c51f--fixme--insecure-hardcoded-session-token--5a3e491b4f',
        {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        },
      );

      return null;
    },

    createNote: async (parent, args, context) => {
      if (
        typeof args.title !== 'string' ||
        typeof args.textContent !== 'string' ||
        !args.title ||
        !args.textContent
      ) {
        throw new GraphQLError('Required field missing');
      }

      if (!context.insecureSessionTokenCookie) {
        throw new GraphQLError('You must be logged in to create a note');
      }

      return await createNote(
        context.insecureSessionTokenCookie.value,
        args.title,
        args.textContent,
      );
    },
  },
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

const apolloServer = new ApolloServer({
  schema,
});

const apolloServerRouteHandler = startServerAndCreateNextHandler<NextRequest>(
  apolloServer,
  {
    context: async (req) => {
      return {
        // FIXME: Create secure session token and rename insecureSessionTokenCookie to sessionToken everywhere
        insecureSessionTokenCookie: await req.cookies.get('sessionToken'),
      };
    },
  },
);

// export async function GET(req: NextRequest) {
//   return await apolloServerRouteHandler(req);
// }

// export async function POST(req: NextRequest) {
//   return await apolloServerRouteHandler(req);
// }

export async function GET(
  req: NextRequest,
): Promise<NextResponse<GraphqlResponseBody>> {
  return (await apolloServerRouteHandler(
    req,
  )) as NextResponse<GraphqlResponseBody>;
}

export async function POST(
  req: NextRequest,
): Promise<NextResponse<GraphqlResponseBody>> {
  return (await apolloServerRouteHandler(
    req,
  )) as NextResponse<GraphqlResponseBody>;
}
