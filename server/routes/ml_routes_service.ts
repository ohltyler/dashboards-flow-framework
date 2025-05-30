/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { schema } from '@osd/config-schema';
import {
  IRouter,
  IOpenSearchDashboardsResponse,
  RequestHandlerContext,
  OpenSearchDashboardsRequest,
  OpenSearchDashboardsResponseFactory,
} from '../../../../src/core/server';
import {
  SEARCH_MODELS_NODE_API_PATH,
  BASE_NODE_API_PATH,
  SearchHit,
  SEARCH_CONNECTORS_NODE_API_PATH,
  REGISTER_AGENT_NODE_API_PATH,
  EXECUTE_AGENT_NODE_API_PATH,
} from '../../common';
import {
  generateCustomError,
  getConnectorsFromResponses,
  getModelsFromResponses,
} from './helpers';
import { getClientBasedOnDataSource } from '../utils/helpers';

/**
 * Server-side routes to process ml-plugin-related node API calls and execute the
 * corresponding API calls against the OpenSearch cluster.
 */
export function registerMLRoutes(
  router: IRouter,
  mlRoutesService: MLRoutesService
): void {
  router.post(
    {
      path: SEARCH_MODELS_NODE_API_PATH,
      validate: {
        body: schema.any(),
      },
    },
    mlRoutesService.searchModels
  );
  router.post(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/model/search`,
      validate: {
        body: schema.any(),
        params: schema.object({
          data_source_id: schema.string(),
        }),
      },
    },
    mlRoutesService.searchModels
  );
  router.post(
    {
      path: SEARCH_CONNECTORS_NODE_API_PATH,
      validate: {
        body: schema.any(),
      },
    },
    mlRoutesService.searchConnectors
  );
  router.post(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/connector/search`,
      validate: {
        body: schema.any(),
        params: schema.object({
          data_source_id: schema.string(),
        }),
      },
    },
    mlRoutesService.searchConnectors
  );
  router.post(
    {
      path: REGISTER_AGENT_NODE_API_PATH,
      validate: {
        body: schema.any(),
      },
    },
    mlRoutesService.registerAgent
  );
  router.post(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/agent/register`,
      validate: {
        body: schema.any(),
        params: schema.object({
          data_source_id: schema.string(),
        }),
      },
    },
    mlRoutesService.registerAgent
  );
  router.post(
    {
      path: `${EXECUTE_AGENT_NODE_API_PATH}/{agent_id}`,
      validate: {
        body: schema.any(),
        params: schema.object({
          agent_id: schema.string(),
        }),
      },
    },
    mlRoutesService.executeAgent
  );
  router.post(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/agent/execute/{agent_id}`,
      validate: {
        body: schema.any(),
        params: schema.object({
          data_source_id: schema.string(),
          agent_id: schema.string(),
        }),
      },
    },
    mlRoutesService.executeAgent
  );
}

export class MLRoutesService {
  private client: any;
  dataSourceEnabled: boolean;

  constructor(client: any, dataSourceEnabled: boolean) {
    this.client = client;
    this.dataSourceEnabled = dataSourceEnabled;
  }

  searchModels = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    const body = req.body;
    try {
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const modelsResponse = await callWithRequest('mlClient.searchModels', {
        body,
      });

      const modelHits = modelsResponse.hits.hits as SearchHit[];
      const modelDict = getModelsFromResponses(modelHits);

      return res.ok({ body: { models: modelDict } });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  searchConnectors = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    const body = req.body;
    try {
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const connectorsResponse = await callWithRequest(
        'mlClient.searchConnectors',
        {
          body,
        }
      );

      const connectorHits = connectorsResponse.hits.hits as SearchHit[];
      const connectorDict = getConnectorsFromResponses(connectorHits);

      return res.ok({ body: { connectors: connectorDict } });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  registerAgent = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    const body = req.body;
    try {
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.registerAgent', {
        body,
      });

      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  executeAgent = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    const body = req.body;
    try {
      const { agent_id } = req.params as {
        agent_id: string;
      };
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.executeAgent', {
        agent_id,
        body,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };
}
