/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getIn, useFormikContext } from 'formik';
import {
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiAccordion,
  EuiPanel,
  EuiFlexItem,
} from '@elastic/eui';
import {
  AGENT_TYPE,
  IConfigField,
  LLM_INTERFACE,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { NumberField, SelectField, TextField } from '../../component_input';
import { AppState } from '../../../../store';

interface AdvancedSettingsInputsProps {
  uiConfig: WorkflowConfig;
}

export function AdvancedSettingsInputs(props: AdvancedSettingsInputsProps) {
  // try to auto-fill the LLM interface to the best of our ability. This is required for the agent
  // configurations to know how to make the proper LLM calls when orchestrating / planning tool executions.
  const { values, setFieldValue } = useFormikContext<WorkflowFormValues>();
  const { connectors, models } = useSelector((state: AppState) => state.ml);
  useEffect(() => {
    const model = getIn(models, values?.agent?.llm?.id, {});
    const connectorId = getIn(model, 'connectorId', '');
    const connector = getIn(connectors, connectorId, {});
    const connectorModelParameter = getIn(
      connector,
      'parameters.model',
      ''
    ) as string;
    if (connectorModelParameter.includes('claude')) {
      setFieldValue(
        'agent.llmInterface',
        LLM_INTERFACE.BEDROCK_CONVERSE_CLAUDE
      );
    }
  }, [values?.agent?.llm?.id]);

  return (
    <EuiAccordion
      id="agentAdvancedSettings"
      buttonContent={<EuiText size="s">Advanced settings</EuiText>}
      initialIsOpen={false}
    >
      <EuiSpacer size="s" />
      <EuiPanel>
        <EuiFlexGroup direction="column" gutterSize="s">
          <EuiFlexItem grow={false}>
            <TextField fieldPath="agent.name" label="Agent name" />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <TextField
              fieldPath="agent.description"
              label="Agent description"
              textArea={true}
            />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <SelectField
              label="LLM Interface"
              fieldPath="agent.llmInterface"
              field={props.uiConfig.agent?.llmInterface as IConfigField}
            />
          </EuiFlexItem>
          {getIn(values, 'agent.type') === AGENT_TYPE.PLAN_EXECUTE_REFLECT && (
            <>
              <EuiFlexItem grow={false}>
                <NumberField fieldPath="agent.maxSteps" label="Max steps" />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <NumberField
                  fieldPath="agent.executorMaxIterations"
                  label="Executor max iterations"
                />
              </EuiFlexItem>
            </>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiAccordion>
  );
}
