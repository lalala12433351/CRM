import {
  getAwsClient,
  executeAwsQuery,
  testAwsDbConnection,
  initializeAwsDbTables,
  seedAwsDbMockData,
  getAwsDbTablesSummary,
  getActiveDbPassword
} from '../../src/lib/awsDb';

export {
  getAwsClient,
  executeAwsQuery,
  testAwsDbConnection,
  initializeAwsDbTables,
  seedAwsDbMockData,
  getAwsDbTablesSummary,
  getActiveDbPassword
};

export const query = executeAwsQuery;
