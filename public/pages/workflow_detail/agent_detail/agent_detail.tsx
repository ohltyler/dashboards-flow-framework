/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
import { hasProvisionedAgentResources } from '../../../utils';

interface AgentDetailProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
  setUiConfig: (uiConfig: WorkflowConfig) => void;
}

export function AgentDetail(props: AgentDetailProps) {
  const agentProvisioned = hasProvisionedAgentResources(props.workflow);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);

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
          <EuiFlexItem grow={3}>
            <AgentInputs
              workflow={props.workflow}
              uiConfig={props.uiConfig}
              setUiConfig={props.setUiConfig}
              setUnsavedChanges={setUnsavedChanges}
            />
          </EuiFlexItem>
          {agentProvisioned && (
            <EuiFlexItem grow={7}>
              <TestAgent
                workflow={props.workflow}
                uiConfig={props.uiConfig}
                unsavedChanges={unsavedChanges}
              />
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      ) : (
        <EuiLoadingSpinner size="xl" />
      )}
    </EuiPanel>
  );
}
