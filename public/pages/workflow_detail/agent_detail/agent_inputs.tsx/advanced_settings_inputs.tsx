/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiAccordion,
  EuiPanel,
} from '@elastic/eui';
import { WorkflowConfig } from '../../../../../common';
import { SelectField } from '../../component_input';

interface AdvancedSettingsInputsProps {
  uiConfig: WorkflowConfig;
}

export function AdvancedSettingsInputs(props: AdvancedSettingsInputsProps) {
  return (
    <EuiAccordion
      id="agentAdvancedSettings"
      buttonContent={<EuiText size="s">Advanced settings</EuiText>}
      initialIsOpen={false}
    >
      <EuiSpacer size="s" />
      <EuiPanel>
        <EuiFlexGroup direction="column" gutterSize="s">
          <SelectField
            label="LLM Interface"
            fieldPath="agent.llmInterface"
            field={props.uiConfig.agent?.llmInterface}
          />
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
