/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiText,
  EuiAccordion,
  EuiPanel,
  EuiEmptyPrompt,
  EuiLink,
} from '@elastic/eui';
import { MCPServer } from './mcp_server';
import {
  EXTERNAL_MCP_CONNECTOR_LINK,
  MCPServersConfig,
  REMOTE_MCP_PROTOCOL,
} from '../../../../../common';
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
      buttonContent={<EuiText size="s">MCP Servers</EuiText>}
      initialIsOpen={true}
    >
      <EuiSpacer size="s" />
      <EuiPanel>
        {isEmpty(mcpServers) ? (
          <EuiEmptyPrompt
            iconType={'cross'}
            title={<h2>No MCP servers found</h2>}
            titleSize="s"
            body={
              <>
                <EuiText size="s">
                  To create connectors to external MCP servers, see the{' '}
                  <EuiLink href={EXTERNAL_MCP_CONNECTOR_LINK}>
                    documentation
                  </EuiLink>
                  .
                </EuiText>
              </>
            }
          />
        ) : (
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
        )}
      </EuiPanel>
    </EuiAccordion>
  );
}
