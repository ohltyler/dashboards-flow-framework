/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  EuiPageHeader,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiText,
  EuiSpacer,
} from '@elastic/eui';
import { BREADCRUMBS } from '../../utils';
import { getCore } from '../../services';

//TODO: remove. just adding to test import for now
import { Handle, Position } from 'reactflow';

export function WorkflowBuilder() {
  useEffect(() => {
    getCore().chrome.setBreadcrumbs([
      BREADCRUMBS.AI_APPLICATION_BUILDER,
      BREADCRUMBS.WORKFLOW_BUILDER,
    ]);
  });

  return (
    <div>
      <EuiPageHeader>
        <EuiFlexGroup justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiTitle size="l">
              <h1>Workflow Builder</h1>
            </EuiTitle>
            {/** TODO: remove. just adding to test import for now */}
            <Handle
              type="target"
              position={Position.Left}
              isConnectable={true}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPageHeader>
      <EuiSpacer size="l" />
      <EuiFlexItem>
        <EuiText>Placeholder for workflow builder page...</EuiText>
      </EuiFlexItem>
    </div>
  );
}
