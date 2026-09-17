import {
  getAwsClient,
  executeAwsQuery,
  testAwsDbConnection,
  initializeAwsDbTables,
  seedAwsDbMockData,
  getAwsDbTablesSummary,
  getActiveDbPassword,
  saveFacebookPageIntegration,
  getFacebookPageIntegrationByPageId,
  getFacebookPageIntegrationsByClientId,
  updateFacebookPageStatus,
  deleteFacebookPageIntegration
} from '../../src/lib/awsDb';

export {
  getAwsClient,
  executeAwsQuery,
  testAwsDbConnection,
  initializeAwsDbTables,
  seedAwsDbMockData,
  getAwsDbTablesSummary,
  getActiveDbPassword,
  saveFacebookPageIntegration,
  getFacebookPageIntegrationByPageId,
  getFacebookPageIntegrationsByClientId,
  updateFacebookPageStatus,
  deleteFacebookPageIntegration
};

export const query = executeAwsQuery;

