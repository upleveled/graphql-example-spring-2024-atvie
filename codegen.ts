import { CodegenConfig } from '@graphql-codegen/cli';

const codegenConfig: CodegenConfig = {
  overwrite: true,
  schema: './app/api/graphql/route.ts',
  generates: {
    './graphql/graphqlGeneratedTypes.ts': {
      plugins: ['typescript', 'typescript-resolvers'],
    },
  },
};
export default codegenConfig;
