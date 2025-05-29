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
  EuiPanel,
  EuiTextArea,
  EuiTitle,
  EuiSmallButton,
  EuiLoadingSpinner,
} from '@elastic/eui';
import { Workflow, WorkflowConfig, WorkflowFormValues } from '../../../common';
import { ModelField } from './workflow_inputs';
import { provisionWorkflow, updateWorkflow, useAppDispatch } from '../../store';
import {
  configToTemplateFlows,
  formikToUiConfig,
  getDataSourceId,
  reduceToTemplate,
  sleep,
  useDataSourceVersion,
} from '../../utils';

interface ChatbotDetailProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
}

// non-ui-config inputs, like name/description
type ChatbotInputs = {
  name: string;
  description: string;
};

export function ChatbotDetail(props: ChatbotDetailProps) {
  const dispatch = useAppDispatch();
  const dataSourceId = getDataSourceId();
  const dataSourceVersion = useDataSourceVersion(dataSourceId);
  const { values } = useFormikContext<WorkflowFormValues>();
  const [formInputs, setFormInputs] = useState<ChatbotInputs>({
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
    <EuiPanel paddingSize="s" grow={true} borderRadius="l">
      {props.uiConfig !== undefined ? (
        <EuiFlexGroup direction="row">
          <EuiFlexItem grow={5}>
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
                  <ModelField fieldPath="chat.llm" />
                </EuiCompressedFormRow>
              </EuiFlexItem>
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
                      workflows: configToTemplateFlows(
                        updatedConfig,
                        false,
                        false
                      ),
                    } as Workflow;

                    console.log('updated workflow: ', updatedWorkflow);

                    console.log(
                      JSON.stringify(reduceToTemplate(updatedWorkflow))
                    );

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
                          .then((resp) => {
                            console.log('provision response: ', resp);
                          });
                      });
                  }}
                >
                  Create
                </EuiSmallButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                <EuiTitle size="s">
                  <h3>Test</h3>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <EuiLoadingSpinner size="xl" />
      )}
    </EuiPanel>
  );
}

// // Generate the final plan-execute-reflect agent config, based on available LLM IDs and MCP IDs (if applicable)
// function generateComplexChatAgent(
//   name: string,
//   description: string,
//   tools: Tool[]
// ): AgentConfig {
//   return {
//     ...getDefaultAgentConfig(),
//     name,
//     description,
//     // TODO: change back to plan-execute-reflect after updating local backend
//     type: AGENT_TYPE.CONVERSATIONAL,
//     tools,
//   } as AgentConfig;
// }

// function getDefaultAgentConfig(): Partial<AgentConfig> {
//   return {
//     name: 'default_agent',
//     description: '',
//     llm: {
//       model_id: '',
//       parameters: {},
//     },
//     memory: {
//       type: 'conversation_index',
//     },
//     parameters: {},
//     tools: [],
//     app_type: 'os_chat',
//   };
// }
