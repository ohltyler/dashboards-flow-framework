/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ConnectorDict, ModelDict } from '../../../common';
import { HttpFetchError } from '../../../../../src/core/public';
import { getRouteService } from '../../services';

export const INITIAL_ML_STATE = {
  loading: false,
  errorMessage: '',
  models: {} as ModelDict,
  connectors: {} as ConnectorDict,
};

const MODELS_ACTION_PREFIX = 'models';
const CONNECTORS_ACTION_PREFIX = 'connectors';
const AGENTS_ACTION_PREFIX = 'agents';
const SEARCH_MODELS_ACTION = `${MODELS_ACTION_PREFIX}/search`;
const SEARCH_CONNECTORS_ACTION = `${CONNECTORS_ACTION_PREFIX}/search`;
const REGISTER_AGENT_ACTION = `${AGENTS_ACTION_PREFIX}/register`;
const EXECUTE_AGENT_ACTION = `${AGENTS_ACTION_PREFIX}/execute`;

export const searchModels = createAsyncThunk(
  SEARCH_MODELS_ACTION,
  async (
    { apiBody, dataSourceId }: { apiBody: {}; dataSourceId?: string },
    { rejectWithValue }
  ) => {
    const response: any | HttpFetchError = await getRouteService().searchModels(
      apiBody,
      dataSourceId
    );
    if (response instanceof HttpFetchError) {
      return rejectWithValue(
        'Error searching models: ' + response.body.message
      );
    } else {
      return response;
    }
  }
);

export const searchConnectors = createAsyncThunk(
  SEARCH_CONNECTORS_ACTION,
  async (
    { apiBody, dataSourceId }: { apiBody: {}; dataSourceId?: string },
    { rejectWithValue }
  ) => {
    const response:
      | any
      | HttpFetchError = await getRouteService().searchConnectors(
      apiBody,
      dataSourceId
    );
    if (response instanceof HttpFetchError) {
      return rejectWithValue(
        'Error searching connectors: ' + response.body.message
      );
    } else {
      return response;
    }
  }
);

export const registerAgent = createAsyncThunk(
  REGISTER_AGENT_ACTION,
  async (
    { apiBody, dataSourceId }: { apiBody: {}; dataSourceId?: string },
    { rejectWithValue }
  ) => {
    const response:
      | any
      | HttpFetchError = await getRouteService().registerAgent(
      apiBody,
      dataSourceId
    );
    if (response instanceof HttpFetchError) {
      return rejectWithValue(
        'Error registering agent: ' + response.body.message
      );
    } else {
      return response;
    }
  }
);

export const executeAgent = createAsyncThunk(
  EXECUTE_AGENT_ACTION,
  async (
    {
      agentId,
      apiBody,
      dataSourceId,
    }: { agentId: string; apiBody: {}; dataSourceId?: string },
    { rejectWithValue }
  ) => {
    const response: any | HttpFetchError = await getRouteService().executeAgent(
      agentId,
      apiBody,
      dataSourceId
    );
    if (response instanceof HttpFetchError) {
      return rejectWithValue('Error executing agent: ' + response.body.message);
    } else {
      return response;
    }
  }
);

const mlSlice = createSlice({
  name: 'ml',
  initialState: INITIAL_ML_STATE,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Pending states
      .addCase(searchModels.pending, (state, action) => {
        state.loading = true;
        state.errorMessage = '';
      })
      .addCase(searchConnectors.pending, (state, action) => {
        state.loading = true;
        state.errorMessage = '';
      })
      .addCase(registerAgent.pending, (state, action) => {
        state.loading = true;
        state.errorMessage = '';
      })
      .addCase(executeAgent.pending, (state, action) => {
        state.loading = true;
        state.errorMessage = '';
      })
      // Fulfilled states
      .addCase(searchModels.fulfilled, (state, action) => {
        const { models } = action.payload as { models: ModelDict };
        state.models = models;
        state.loading = false;
        state.errorMessage = '';
      })
      .addCase(searchConnectors.fulfilled, (state, action) => {
        const { connectors } = action.payload as { connectors: ConnectorDict };
        state.connectors = connectors;
        state.loading = false;
        state.errorMessage = '';
      })
      .addCase(registerAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.errorMessage = '';
      })
      .addCase(executeAgent.fulfilled, (state, action) => {
        state.loading = false;
        state.errorMessage = '';
      })
      // Rejected states
      .addCase(searchModels.rejected, (state, action) => {
        state.errorMessage = action.payload as string;
        state.loading = false;
      })
      .addCase(searchConnectors.rejected, (state, action) => {
        state.errorMessage = action.payload as string;
        state.loading = false;
      })
      .addCase(registerAgent.rejected, (state, action) => {
        state.errorMessage = action.payload as string;
        state.loading = false;
      })
      .addCase(executeAgent.rejected, (state, action) => {
        state.errorMessage = action.payload as string;
        state.loading = false;
      });
  },
});

export const mlReducer = mlSlice.reducer;
