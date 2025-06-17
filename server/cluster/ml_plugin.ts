/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ML_AGENT_ROUTE_PREFIX,
  ML_MEMORY_ROUTE_PREFIX,
  ML_REGISTER_AGENT_ROUTE,
  ML_SEARCH_CONNECTORS_ROUTE,
  ML_SEARCH_MODELS_ROUTE,
  ML_TASKS_ROUTE_PREFIX,
} from '../../common';

/**
 * Used during the plugin's setup() lifecycle phase to register various client actions
 * representing ML plugin APIs. These are then exposed and used on the
 * server-side when processing node APIs - see server/routes/ml_routes_service
 * for examples.
 */
export function mlPlugin(Client: any, config: any, components: any) {
  const ca = components.clientAction.factory;

  Client.prototype.mlClient = components.clientAction.namespaceFactory();
  const mlClient = Client.prototype.mlClient.prototype;

  mlClient.searchModels = ca({
    url: {
      fmt: ML_SEARCH_MODELS_ROUTE,
    },
    needBody: true,
    method: 'POST',
  });

  mlClient.searchConnectors = ca({
    url: {
      fmt: ML_SEARCH_CONNECTORS_ROUTE,
    },
    needBody: true,
    method: 'POST',
  });

  mlClient.registerAgent = ca({
    url: {
      fmt: ML_REGISTER_AGENT_ROUTE,
    },
    needBody: true,
    method: 'POST',
  });

  mlClient.executeAgentAsync = ca({
    url: {
      fmt: `${ML_AGENT_ROUTE_PREFIX}/<%=agent_id%>/_execute?async=true`,
      req: {
        agent_id: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: true,
    method: 'POST',
  });

  mlClient.getTask = ca({
    url: {
      fmt: `${ML_TASKS_ROUTE_PREFIX}/<%=task_id%>`,
      req: {
        task_id: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: false,
    method: 'GET',
  });

  mlClient.getAgent = ca({
    url: {
      fmt: `${ML_AGENT_ROUTE_PREFIX}/<%=agent_id%>`,
      req: {
        agent_id: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: false,
    method: 'GET',
  });

  mlClient.getMessages = ca({
    url: {
      fmt: `${ML_MEMORY_ROUTE_PREFIX}/<%=memory_id%>/messages`,
      req: {
        memory_id: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: false,
    method: 'GET',
  });

  mlClient.getTraces = ca({
    url: {
      fmt: `${ML_MEMORY_ROUTE_PREFIX}/message/<%=message_id%>/traces`,
      req: {
        message_id: {
          type: 'string',
          required: true,
        },
      },
    },
    needBody: false,
    method: 'GET',
  });
}
