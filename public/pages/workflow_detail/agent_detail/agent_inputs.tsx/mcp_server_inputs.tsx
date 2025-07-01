/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiAccordion,
  EuiPanel,
} from '@elastic/eui';
import { MCPServer } from './mcp_server';
import { MCPServersConfig, REMOTE_MCP_PROTOCOL } from '../../../../../common';
import { AppState } from '../../../../store';

interface MCPServerInputsProps {}

export function MCPServerInputs(props: MCPServerInputsProps) {
  // consider all connectors with a configured SSE protocol are external MCP servers
  const { connectors } = useSelector((state: AppState) => state.ml);
  const [mcpServers, setMcpServers] = useState<MCPServersConfig>([]);
  useEffect(() => {
    setMcpServers(
      Object.values(connectors)
        .filter((connector) => connector.protocol === REMOTE_MCP_PROTOCOL)
        .map((connector) => {
          return {
            connectorId: connector.id,
            toolFilters: [],
            name: connector.name,
            description: connector.description,
          };
        })
    );
  }, [connectors]);

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
                <MCPServer server={mcpServer} />
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
