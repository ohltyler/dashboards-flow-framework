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

// styling
import '../workspace/workspace-styles.scss';
import '../../../global-styles.scss';

interface AgentDetailProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
}

export function AgentDetail(props: AgentDetailProps) {
  return (
    <EuiPanel
      paddingSize="s"
      borderRadius="l"
      className="stretch-absolute"
      style={{
        width: '100%',
        gap: '4px',
      }}
    >
      {props.uiConfig !== undefined ? (
        <EuiFlexGroup direction="row" className="stretch-absolute">
          <EuiFlexItem grow={5}>
            <AgentInputs workflow={props.workflow} uiConfig={props.uiConfig} />
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <TestAgent workflow={props.workflow} uiConfig={props.uiConfig} />
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        // <AgentInputs workflow={props.workflow} uiConfig={props.uiConfig} />
        <EuiLoadingSpinner size="xl" />
      )}
    </EuiPanel>
  );
}
