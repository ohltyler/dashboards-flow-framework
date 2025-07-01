/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { getIn, useFormikContext } from 'formik';
import { EuiFlexGroup, EuiFlexItem, EuiText, EuiSwitch } from '@elastic/eui';
import {
  TOOL_TYPE,
  ToolConfig,
  ToolsConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { isEmpty } from 'lodash';

interface ToolProps {
  type: TOOL_TYPE;
  description?: string;
}

export function Tool(props: ToolProps) {
  const [enabled, setEnabled] = useState<boolean>(true);

  const { values, setFieldValue } = useFormikContext<WorkflowFormValues>();
  const TOOLS_PATH = 'agent.tools';
  const toolsValue = getIn(values, TOOLS_PATH, []) as ToolsConfig;

  // dynamically render based on the tool existing in the form or not
  useEffect(() => {
    const isIncluded = getIn(values, TOOLS_PATH, [])
      .map((tool: ToolConfig) => tool.type)
      .includes(props.type);
    setEnabled(isIncluded);
  }, [props.type, toolsValue?.length]);

  return (
    <EuiFlexGroup direction="column" gutterSize="none">
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiText size="s">{props.type}</EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSwitch
              data-testid={`switch-${props.type}`}
              id={`switch-${props.type}`}
              disabled={false}
              label={''}
              checked={enabled}
              onChange={(e) => {
                // disabling: remove from form list
                let newToolsVal = [...toolsValue] as ToolsConfig;
                if (enabled) {
                  newToolsVal = newToolsVal.filter(
                    (tool: ToolConfig) => tool.type !== props.type
                  );
                  // enabling: append to list
                } else {
                  newToolsVal.push({
                    type: props.type,
                  });
                }
                setFieldValue(TOOLS_PATH, newToolsVal);
              }}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
      {!isEmpty(props.description) && (
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <i>{props.description}</i>
          </EuiText>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}
