import crypto from 'node:crypto';
import { gql } from '@apollo/client';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { makeExecutableSchema } from '@graphql-tools/schema';
import bcrypt from 'bcrypt';
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
import { createSessionInsecure } from '../../../database/sessions';
import {
  createUserInsecure,
  getUserInsecure,
  getUserWithPasswordHashInsecure,
} from '../../../database/users';
import { Animal, Resolvers } from '../../../graphql/graphqlGeneratedTypes';

export type Context = {
  sessionTokenCookie?: { value: string };
};

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

    register(username: String!, password: String!): User

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
    createAnimal: async (parent, args, context: Context) => {
      if (!context.sessionTokenCookie) {
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

      const animal = await createAnimal(context.sessionTokenCookie.value, {
        accessory: args.accessory || null,
        firstName: args.firstName,
        type: args.type,
      });

      if (!animal) {
        throw new GraphQLError('Failed to create animal');
      }

      return animal;
    },

    updateAnimal: async (parent, args, context: Context) => {
      if (!context.sessionTokenCookie) {
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

      return await updateAnimal(context.sessionTokenCookie.value, {
        id: Number(args.id),
        firstName: args.firstName,
        type: args.type,
        accessory: args.accessory || null,
      });
    },

    deleteAnimal: async (parent, args, context: Context) => {
      if (!context.sessionTokenCookie) {
        throw new GraphQLError('Unauthorized operation');
      }
      return await deleteAnimal(
        context.sessionTokenCookie.value,
        Number(args.id),
      );
    },

    register: async (parent, args) => {
      if (
        typeof args.username !== 'string' ||
        typeof args.password !== 'string' ||
        !args.username ||
        !args.password
      ) {
        throw new GraphQLError('Required field missing');
      }

      // 2. Check if user already exist in the database
      const user = await getUserInsecure(args.username);

      if (user) {
        throw new GraphQLError('Username already taken');
      }

      // 3. Hash the plain password from the user
      const passwordHash = await bcrypt.hash(args.password, 12);

      // 4. Save the user information with the hashed password in the database
      const newUser = await createUserInsecure(args.username, passwordHash);

      if (!newUser) {
        throw new GraphQLError('Registration failed');
      }

      // 5. Create a token
      const token = crypto.randomBytes(100).toString('base64');

      // 6. Create the session record
      const session = await createSessionInsecure(token, newUser.id);

      if (!session) {
        throw new GraphQLError('Sessions creation failed');
      }

      (await cookies()).set({
        name: 'sessionToken',
        value: session.token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
      });

      return null;
    },

    login: async (parent, args) => {
      if (
        typeof args.username !== 'string' ||
        typeof args.password !== 'string' ||
        !args.username ||
        !args.password
      ) {
        throw new GraphQLError('Required field missing');
      }

      // 3. verify the user credentials
      const userWithPasswordHash = await getUserWithPasswordHashInsecure(
        args.username,
      );

      if (!userWithPasswordHash) {
        throw new GraphQLError('username or password not valid');
      }

      // 4. Validate the user password by comparing with hashed password
      const passwordHash = await bcrypt.compare(
        args.password,
        userWithPasswordHash.passwordHash,
      );

      if (!passwordHash) {
        throw new GraphQLError('username or password not valid');
      }

      // 5. Create a token
      const token = crypto.randomBytes(100).toString('base64');

      // 6. Create the session record
      const session = await createSessionInsecure(
        token,
        userWithPasswordHash.id,
      );

      if (!session) {
        throw new GraphQLError('Sessions creation failed');
      }

      (await cookies()).set({
        name: 'sessionToken',
        value: session.token,
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        sameSite: 'lax',
      });

      return null;
    },

    createNote: async (parent, args, context: Context) => {
      if (!context.sessionTokenCookie) {
        throw new GraphQLError('You must be logged in to create a note');
      }

      if (
        typeof args.title !== 'string' ||
        typeof args.textContent !== 'string' ||
        !args.title ||
        !args.textContent
      ) {
        throw new GraphQLError('Required field missing');
      }

      return await createNote(
        context.sessionTokenCookie.value,
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
        sessionTokenCookie: await req.cookies.get('sessionToken'),
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
