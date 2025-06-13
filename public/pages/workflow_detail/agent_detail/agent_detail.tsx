/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { Workflow, WorkflowConfig } from '../../../../common';
import { AgentInputs } from './agent_inputs.tsx';
import { TestAgent } from './test_agent';

interface AgentDetailProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
}

export function AgentDetail(props: AgentDetailProps) {
  return (
    <EuiPanel paddingSize="s" grow={true} borderRadius="l">
      {props.uiConfig !== undefined ? (
        <EuiFlexGroup direction="row">
          <EuiFlexItem grow={5}>
            <AgentInputs workflow={props.workflow} uiConfig={props.uiConfig} />
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <TestAgent workflow={props.workflow} uiConfig={props.uiConfig} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <EuiLoadingSpinner size="xl" />
      )}
    </EuiPanel>
  );
}
