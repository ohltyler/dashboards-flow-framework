/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
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
  EuiCodeEditor,
  EuiCallOut,
} from '@elastic/eui';
import {
  customStringify,
  Workflow,
  WORKFLOW_STEP_TYPE,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../common';
import { ModelField } from '../component_input';
import {
  executeAgent,
  getWorkflow,
  provisionWorkflow,
  updateWorkflow,
  useAppDispatch,
} from '../../../store';
import {
  configToTemplateFlows,
  formikToUiConfig,
  getDataSourceId,
  reduceToTemplate,
  sleep,
  useDataSourceVersion,
} from '../../../utils';
import { Resources } from '../tools/resources';

interface AgentDetailProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
}

// non-ui-config inputs, like name/description
type AgentInputs = {
  name: string;
  description: string;
};

export function AgentDetail(props: AgentDetailProps) {
  const dispatch = useAppDispatch();
  const dataSourceId = getDataSourceId();
  const dataSourceVersion = useDataSourceVersion(dataSourceId);
  const { values } = useFormikContext<WorkflowFormValues>();

  // Update name/description if users set
  const [formInputs, setFormInputs] = useState<AgentInputs>({
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

  // Fetch agent ID if set
  const [agentId, setAgentId] = useState<string>('');
  useEffect(() => {
    const agentResource = props.workflow?.resourcesCreated?.find(
      (resource) =>
        resource.stepType === WORKFLOW_STEP_TYPE.REGISTER_AGENT_STEP_TYPE
    );
    if (agentResource !== undefined) {
      setAgentId(agentResource?.id);
    }
  }, [props.workflow]);

  const [executeInput, setExecuteInput] = useState<string>('{}');
  const [executeOutput, setExecuteOutput] = useState<string>('{}');
  const [executeError, setExecuteError] = useState<string>('');

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
                          workflows: configToTemplateFlows(
                            updatedConfig,
                            false,
                            false
                          ),
                        } as Workflow;

                        await dispatch(
                          updateWorkflow({
                            apiBody: {
                              workflowId: updatedWorkflow.id as string,
                              workflowTemplate: reduceToTemplate(
                                updatedWorkflow
                              ),
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
          </EuiFlexItem>
          <EuiFlexItem grow={5}>
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={5}>
                <EuiFlexGroup direction="column">
                  <EuiFlexItem grow={false}>
                    <EuiTitle size="s">
                      <h3>Test</h3>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiCompressedFormRow label="Input" fullWidth={true}>
                      <EuiCodeEditor
                        mode="json"
                        theme="textmate"
                        width="100%"
                        height={'15vh'}
                        value={executeInput}
                        onChange={(input) => {
                          setExecuteInput(input);
                        }}
                        // format on blur
                        onBlur={() => {
                          try {
                            setExecuteInput(
                              customStringify(JSON.parse(executeInput))
                            );
                          } catch (error) {
                          } finally {
                          }
                        }}
                        readOnly={false}
                        setOptions={{
                          fontSize: '14px',
                          useWorker: true,
                          highlightActiveLine: true,
                          highlightSelectedWord: true,
                          highlightGutterLine: true,
                          wrap: true,
                        }}
                        aria-label="Exeute agent input"
                        tabSize={2}
                      />
                    </EuiCompressedFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFlexGroup direction="row">
                      <EuiFlexItem grow={false}>
                        <EuiSmallButton
                          fill={false}
                          disabled={isEmpty(agentId) || isEmpty(executeInput)}
                          onClick={async () => {
                            await dispatch(
                              executeAgent({
                                agentId,
                                apiBody: executeInput,
                                dataSourceId,
                              })
                            )
                              .unwrap()
                              .then((resp) => {
                                console.log('execute response: ', resp);
                                setExecuteError('');
                              })
                              .catch((err) => {
                                setExecuteError(err);
                              });
                          }}
                        >
                          Execute
                        </EuiSmallButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                  {!isEmpty(executeError) && (
                    <EuiFlexItem grow={false}>
                      <EuiCallOut
                        size="s"
                        iconType="alert"
                        color="danger"
                        title={executeError}
                      />
                    </EuiFlexItem>
                  )}
                  <EuiFlexItem>
                    <EuiCompressedFormRow label="Output" fullWidth={true}>
                      <EuiCodeEditor
                        mode="json"
                        theme="textmate"
                        width="100%"
                        height={'15vh'}
                        value={executeOutput}
                        // onChange={(output) => {
                        //   setExecuteInput(input);
                        // }}
                        isReadOnly={true}
                        readOnly={false}
                        setOptions={{
                          fontSize: '14px',
                          useWorker: true,
                          highlightActiveLine: false,
                          highlightSelectedWord: false,
                          highlightGutterLine: false,
                          wrap: true,
                        }}
                        aria-label="Exeute agent output"
                        tabSize={2}
                      />
                    </EuiCompressedFormRow>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={5}>
                <EuiFlexItem grow={false}>
                  <EuiTitle size="s">
                    <h3>Resources</h3>
                  </EuiTitle>
                </EuiFlexItem>
                <EuiFlexItem>
                  <Resources workflow={props.workflow} />
                </EuiFlexItem>
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
