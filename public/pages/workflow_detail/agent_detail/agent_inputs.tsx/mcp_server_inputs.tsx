/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiAccordion,
  EuiPanel,
} from '@elastic/eui';
import { MCPServer } from './mcp_server';
import { MCPServersConfig } from '../../../../../common';

interface MCPServerInputsProps {}

export function MCPServerInputs(props: MCPServerInputsProps) {
  const mcpServers = [
    {
      connectorId: 'id-1',
      toolFilters: [],
    },
    {
      connectorId: 'id-2',
      toolFilters: [],
    },
  ] as MCPServersConfig;

  return (
    <EuiAccordion
      id="agentMCPServers"
      buttonContent={<EuiText size="s">MCP servers</EuiText>}
      initialIsOpen={true}
    >
      <EuiSpacer size="s" />
      <EuiPanel>
        <EuiFlexGroup direction="column" gutterSize="s">
          {Object.values(mcpServers).map((mcpServer) => {
            return (
              <EuiFlexItem
                grow={false}
                key={mcpServer.connectorId}
                id={mcpServer.connectorId}
              >
                <MCPServer
                  id={mcpServer.connectorId}
                  description="My MCP server"
                />
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
