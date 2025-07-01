/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { getIn, useFormikContext } from 'formik';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiSwitch } from '@elastic/eui';
import {
  MCPServerConfig,
  MCPServersConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { isEmpty } from 'lodash';

interface MCPServerProps {
  id: string;
  description?: string;
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

  console.log('mcp servers value: ', mcpServersValue);

  // dynamically render based on the MCP server existing in the form or not
  useEffect(() => {
    const isIncluded = getIn(values, MCP_SERVERS_PATH, [])
      .map((mcpServer: MCPServerConfig) => mcpServer.connectorId)
      .includes(props.id);
    setEnabled(isIncluded);
  }, [props.id, mcpServersValue?.length]);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText size="s">{props.id}</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSwitch
              data-testid={`switch-${props.id}`}
              id={`switch-${props.id}`}
              disabled={false}
              label={''}
              checked={enabled}
              onChange={(e) => {
                // disabling: remove from form list
                let newMCPServersVal = [...mcpServersValue] as MCPServersConfig;
                if (enabled) {
                  newMCPServersVal = newMCPServersVal.filter(
                    (mcpServer: MCPServerConfig) =>
                      mcpServer.connectorId !== props.id
                  );
                  // enabling: append to list
                } else {
                  newMCPServersVal.push({
                    connectorId: props.id,
                    toolFilters: [],
                  });
                }
                setFieldValue(MCP_SERVERS_PATH, newMCPServersVal);
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      {!isEmpty(props.description) && (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <i>{props.description}</i>
          </EuiText>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}
