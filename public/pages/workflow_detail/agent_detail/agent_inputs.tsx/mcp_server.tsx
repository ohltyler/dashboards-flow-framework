/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { getIn, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiSwitch } from '@elastic/eui';
import {
  MCPServerConfig,
  MCPServersConfig,
  WorkflowFormValues,
} from '../../../../../common';

interface MCPServerProps {
  server: MCPServerConfig;
}

export function MCPServer(props: MCPServerProps) {
  const [enabled, setEnabled] = useState<boolean>(true);

  const { values, setFieldValue } = useFormikContext<WorkflowFormValues>();
  const MCP_SERVERS_PATH = 'agent.mcpServers';
  const mcpServersValue = getIn(
    values,
    MCP_SERVERS_PATH,
    []
  ) as MCPServersConfig;

  // dynamically render based on the MCP server existing in the form or not
  useEffect(() => {
    const isIncluded = getIn(values, MCP_SERVERS_PATH, [])
      .map((mcpServer: MCPServerConfig) => mcpServer.connectorId)
      .includes(props.server.connectorId);
    setEnabled(isIncluded);
  }, [props.server.connectorId, mcpServersValue?.length]);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText size="s">{props.server.name}</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSwitch
              data-testid={`switch-${props.server.connectorId}`}
              id={`switch-${props.server.connectorId}`}
              disabled={false}
              label={''}
              checked={enabled}
              onChange={(e) => {
                // disabling: remove from form list
                let newMCPServersVal = [...mcpServersValue] as MCPServersConfig;
                if (enabled) {
                  newMCPServersVal = newMCPServersVal.filter(
                    (mcpServer: MCPServerConfig) =>
                      mcpServer.connectorId !== props.server.connectorId
                  );
                  // enabling: append to list
                } else {
                  newMCPServersVal.push({
                    name: props.server.name,
                    connectorId: props.server.connectorId,
                    toolFilters: [],
                  });
                }
                setFieldValue(MCP_SERVERS_PATH, newMCPServersVal);
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      {!isEmpty(props.server.description) && (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <i>{props.server.description}</i>
          </EuiText>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}
