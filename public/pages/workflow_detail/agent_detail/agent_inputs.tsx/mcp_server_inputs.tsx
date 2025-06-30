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

interface MCPServerInputsProps {}

export function MCPServerInputs(props: MCPServerInputsProps) {
  const mcpServers = [
    {
      id: 'id-1',
      tool_filters: [],
    },
    {
      id: 'id-2',
      tool_filters: [],
    },
  ];

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
              <EuiFlexItem grow={false} key={mcpServer.id} id={mcpServer.id}>
                <MCPServer id={mcpServer.id} description="My MCP server" />
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
