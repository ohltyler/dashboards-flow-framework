/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import {
  EuiCompressedFormRow,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTextArea,
  EuiTitle,
  EuiSmallButton,
  EuiPanel,
} from '@elastic/eui';
import {
  Workflow,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { ModelField } from '../../component_input';
import {
  getWorkflow,
  provisionWorkflow,
  updateWorkflow,
  useAppDispatch,
} from '../../../../store';
import {
  configToTemplateFlows,
  formikToUiConfig,
  getDataSourceId,
  reduceToTemplate,
  sleep,
  useDataSourceVersion,
} from '../../../../utils';

interface ToolsInputsProps {}

export function ToolsInputs(props: ToolsInputsProps) {
  const dispatch = useAppDispatch();
  const dataSourceId = getDataSourceId();
  const dataSourceVersion = useDataSourceVersion(dataSourceId);
  const { values } = useFormikContext<WorkflowFormValues>();

  return (
    <EuiFlexGroup direction="column">
      <EuiFlexItem grow={false}>
        <EuiTitle size="s">
          <h3>Tools</h3>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiPanel grow={false} style={{ height: '30vh' }}></EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
