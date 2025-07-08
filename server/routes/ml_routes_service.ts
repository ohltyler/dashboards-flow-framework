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
  BASE_TASK_NODE_API_PATH,
  BASE_AGENT_NODE_API_PATH,
  GET_MESSAGES_NODE_API_PATH,
  GET_TRACES_NODE_API_PATH,
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
  router.get(
    {
      path: `${BASE_TASK_NODE_API_PATH}/{task_id}`,
      validate: {
        params: schema.object({
          task_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getTask
  );
  router.get(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/task/{task_id}`,
      validate: {
        params: schema.object({
          data_source_id: schema.string(),
          task_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getTask
  );
  router.delete(
    {
      path: `${BASE_TASK_NODE_API_PATH}/{task_id}`,
      validate: {
        params: schema.object({
          task_id: schema.string(),
        }),
      },
    },
    mlRoutesService.deleteTask
  );
  router.delete(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/task/{task_id}`,
      validate: {
        params: schema.object({
          data_source_id: schema.string(),
          task_id: schema.string(),
        }),
      },
    },
    mlRoutesService.deleteTask
  );
  router.get(
    {
      path: `${BASE_AGENT_NODE_API_PATH}/{agent_id}`,
      validate: {
        params: schema.object({
          agent_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getAgent
  );
  router.get(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/agent/{agent_id}`,
      validate: {
        params: schema.object({
          data_source_id: schema.string(),
          agent_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getAgent
  );
  router.get(
    {
      path: `${GET_MESSAGES_NODE_API_PATH}/{memory_id}`,
      validate: {
        params: schema.object({
          memory_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getMessages
  );
  router.get(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/memory/messages/{memory_id}`,
      validate: {
        params: schema.object({
          data_source_id: schema.string(),
          memory_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getMessages
  );
  router.get(
    {
      path: `${GET_TRACES_NODE_API_PATH}/{message_id}`,
      validate: {
        params: schema.object({
          message_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getTraces
  );
  router.get(
    {
      path: `${BASE_NODE_API_PATH}/{data_source_id}/memory/messages/traces/{message_id}`,
      validate: {
        params: schema.object({
          data_source_id: schema.string(),
          message_id: schema.string(),
        }),
      },
    },
    mlRoutesService.getTraces
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

  // Defaults to running async due to long-running nature of complex tasks.
  // If non-async support wanted in the future, can add a param or standalone fn.
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
      const resp = await callWithRequest('mlClient.executeAgentAsync', {
        agent_id,
        body,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  getTask = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    try {
      const { task_id } = req.params as {
        task_id: string;
      };
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.getTask', {
        task_id,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  deleteTask = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    try {
      const { task_id } = req.params as {
        task_id: string;
      };
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.deleteTask', {
        task_id,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  getAgent = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
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
      const resp = await callWithRequest('mlClient.getAgent', {
        agent_id,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  getMessages = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    try {
      const { memory_id } = req.params as {
        memory_id: string;
      };
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.getMessages', {
        memory_id,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };

  getTraces = async (
    context: RequestHandlerContext,
    req: OpenSearchDashboardsRequest,
    res: OpenSearchDashboardsResponseFactory
  ): Promise<IOpenSearchDashboardsResponse<any>> => {
    try {
      const { message_id } = req.params as {
        message_id: string;
      };
      const { data_source_id = '' } = req.params as { data_source_id?: string };
      const callWithRequest = getClientBasedOnDataSource(
        context,
        this.dataSourceEnabled,
        req,
        data_source_id,
        this.client
      );
      const resp = await callWithRequest('mlClient.getTraces', {
        message_id,
      });
      return res.ok({ body: resp });
    } catch (err: any) {
      return generateCustomError(res, err);
    }
  };
}
