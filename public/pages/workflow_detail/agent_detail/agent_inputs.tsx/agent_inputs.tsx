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

interface AgentInputsProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
}

// non-ui-config inputs, like name/description
type AgentMetadataInputs = {
  name: string;
  description: string;
};

export function AgentInputs(props: AgentInputsProps) {
  const dispatch = useAppDispatch();
  const dataSourceId = getDataSourceId();
  const dataSourceVersion = useDataSourceVersion(dataSourceId);
  const { values } = useFormikContext<WorkflowFormValues>();

  // Update name/description if users set
  const [formInputs, setFormInputs] = useState<AgentMetadataInputs>({
    name: '',
    description: '',
  });
  useEffect(() => {
    if (props.workflow !== undefined) {
      setFormInputs({
        ...formInputs,
        name: props.workflow?.name,
        description: props.workflow?.description || '',
      });
    }
  }, [props.workflow]);

  return (
    <EuiFlexGroup direction="column">
      <EuiFlexItem grow={false}>
        <EuiTitle size="s">
          <h3>Configure</h3>
        </EuiTitle>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCompressedFormRow label="Name">
          <EuiFieldText
            disabled={false}
            value={formInputs.name}
            onChange={(e) => {
              setFormInputs({
                ...formInputs,
                name: e.target.value,
              });
            }}
          />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCompressedFormRow label="Description">
          <EuiTextArea
            disabled={false}
            value={formInputs.description}
            onChange={(e) => {
              setFormInputs({
                ...formInputs,
                description: e.target.value,
              });
            }}
          />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiCompressedFormRow label="Large language model">
          <ModelField fieldPath="agent.llm" hasModelInterface={true} />
        </EuiCompressedFormRow>
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row">
          <EuiFlexItem grow={false}>
            <EuiSmallButton
              fill={false}
              onClick={async () => {
                const updatedConfig = formikToUiConfig(
                  values,
                  props.uiConfig as WorkflowConfig
                );
                const updatedWorkflow = {
                  ...props.workflow,
                  ui_metadata: {
                    ...props.workflow?.ui_metadata,
                    config: updatedConfig,
                  },
                  workflows: configToTemplateFlows(updatedConfig, false, false),
                } as Workflow;

                await dispatch(
                  updateWorkflow({
                    apiBody: {
                      workflowId: updatedWorkflow.id as string,
                      workflowTemplate: reduceToTemplate(updatedWorkflow),
                      reprovision: false,
                    },
                    dataSourceId,
                  })
                )
                  .unwrap()
                  .then(async () => {
                    await sleep(1000);
                    await dispatch(
                      provisionWorkflow({
                        workflowId: updatedWorkflow.id as string,
                        dataSourceId,
                        dataSourceVersion,
                      })
                    )
                      .unwrap()
                      .then(async (resp) => {
                        console.log('provision response: ', resp);
                        await dispatch(
                          getWorkflow({
                            workflowId: updatedWorkflow.id as string,
                            dataSourceId,
                          })
                        );
                      });
                  });
              }}
            >
              Create
            </EuiSmallButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
