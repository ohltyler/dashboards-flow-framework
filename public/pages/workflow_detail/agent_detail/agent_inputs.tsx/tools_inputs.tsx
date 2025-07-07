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
import { TOOL_DESCRIPTIONS, TOOL_TYPE } from '../../../../../common';
import { Tool } from './tool';

interface ToolsInputsProps {}

export function ToolsInputs(props: ToolsInputsProps) {
  return (
    <EuiAccordion
      id="agentTools"
      buttonContent={<EuiText size="s">OpenSearch Tools</EuiText>}
      initialIsOpen={true}
    >
      <EuiSpacer size="s" />
      <EuiPanel>
        <EuiFlexGroup direction="column" gutterSize="s">
          {Object.values(TOOL_TYPE).map((tool) => {
            return (
              <EuiFlexItem grow={false} key={tool} id={tool}>
                <Tool type={tool} description={TOOL_DESCRIPTIONS[tool] || ''} />
              </EuiFlexItem>
            );
          })}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
