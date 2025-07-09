/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { cloneDeep, isEmpty } from 'lodash';
import { getIn } from 'formik';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSmallButton,
  EuiCallOut,
  EuiPanel,
  EuiText,
  EuiSmallButtonEmpty,
  EuiCompressedTextArea,
  EuiHorizontalRule,
  EuiCodeBlock,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiAccordion,
  EuiLink,
  EuiSpacer,
  EuiButtonIcon,
  EuiLoadingSpinner,
} from '@elastic/eui';
import {
  customStringify,
  EXECUTE_AGENT_LINK,
  ML_COMMONS_MESSAGES_LINK,
  ML_COMMONS_TASK_LINK,
  ML_COMMONS_TRACES_LINK,
  TASK_STATE,
  Workflow,
  WORKFLOW_STEP_TYPE,
  WorkflowConfig,
} from '../../../../../common';
import {
  deleteTask,
  executeAgent,
  getAgent,
  getMessages,
  getTask,
  getTraces,
  useAppDispatch,
} from '../../../../store';
import { getDataSourceId } from '../../../../utils';

// styling
import '../../workspace/workspace-styles.scss';
import '../../../../global-styles.scss';

interface TestAgentProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
  unsavedChanges: boolean;
}

interface Interaction {
  userMsg: string;
  agentMsg: string;
}

const REFRESH_RATE_MILLIS = 2000; // how often to fetch task updates during async execution

const FAILED_MSG = 'Execution failed';
const CANCELED_MSG = 'Execution canceled';

export function TestAgent(props: TestAgentProps) {
  const dispatch = useAppDispatch();
  const dataSourceId = getDataSourceId();

  const [agentFlyoutOpen, setAgentFlyoutOpen] = useState<boolean>(false);
  const [executionDetailsFlyoutOpen, setExecutionDetailsFlyoutOpen] = useState<
    boolean
  >(false);
  // Task errors can be extremely long. So, we default to showing the full error in a flyout with scroll overflow by default.
  const [taskErrorFlyoutOpen, setTaskErrorFlyoutOpen] = useState<boolean>(
    false
  );

  // Fetch agent ID and agent details if set
  const [agentId, setAgentId] = useState<string>('');
  const [agentDetails, setAgentDetails] = useState<{}>({});
  useEffect(() => {
    const agentResource = props.workflow?.resourcesCreated?.find(
      (resource) =>
        resource.stepType === WORKFLOW_STEP_TYPE.REGISTER_AGENT_STEP_TYPE
    );
    if (agentResource !== undefined) {
      setAgentId(agentResource?.id);
    }
  }, [props.workflow]);
  useEffect(() => {
    const getAgentDetails = async () => {
      await dispatch(
        getAgent({
          agentId,
          dataSourceId,
        })
      )
        .unwrap()
        .then((resp: {}) => {
          if (!isEmpty(resp)) {
            setAgentDetails(resp);
          }
        })
        .catch((err) => {});
    };
    if (!isEmpty(agentId)) {
      getAgentDetails();
    }
  }, [agentId]);

  const [executeInput, setExecuteInput] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [taskResponse, setTaskResponse] = useState<any>(undefined);
  const taskState = taskResponse?.state as TASK_STATE | undefined;
  const taskError = getIn(taskResponse, 'response.error_message', '');
  const taskInProgress =
    !isEmpty(taskId) &&
    taskState !== TASK_STATE.COMPLETED &&
    taskState !== TASK_STATE.FAILED;

  // conversation-related state
  // TODO: persist agent responses as well.
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  // auto-refresh to fetch the latest task state, if the task is set in progress.
  // stop refreshing once the task is in a completed state (failed or completed)
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (taskInProgress) {
      intervalRef.current = setInterval(() => {
        refreshTaskExecution();
      }, REFRESH_RATE_MILLIS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    // cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [taskInProgress]);

  // Fetch more sub-resource details (memory, messages, traces) once available
  const [messages, setMessages] = useState<any>([]);
  const [traces, setTraces] = useState<any>([]);
  useEffect(() => {
    const getMessagesFromMemoryId = async (memoryId: string) => {
      await dispatch(
        getMessages({
          memoryId,
          dataSourceId,
        })
      )
        .unwrap()
        .then((resp: any) => {
          if (!isEmpty(resp?.messages)) {
            setMessages(resp.messages as []);
          }
        })
        .catch((err: any) => {});
    };
    if (!isEmpty(taskResponse?.response?.memory_id)) {
      getMessagesFromMemoryId(taskResponse?.response?.memory_id as string);
    }
  }, [taskResponse]);
  useEffect(() => {
    const getTracesFromMessageId = async (messageId: string) => {
      await dispatch(
        getTraces({
          messageId,
          dataSourceId,
        })
      )
        .unwrap()
        .then((resp: any) => {
          if (!isEmpty(resp?.traces)) {
            setTraces(resp.traces as []);
          }
        })
        .catch((err: any) => {});
    };
    if (!isEmpty(messages)) {
      // TODO: if multiple messages, figure out how to select the relevant one
      // (most recent? allow multiple?)
      const relevantMessageId = getIn(messages, '0.message_id', '') as string;
      if (!isEmpty(relevantMessageId)) {
        getTracesFromMessageId(relevantMessageId);
      }
    }
  }, [messages]);

  // If any changes to the config (e.g., adding/removing a tool), clear out any
  // leftover execution state.
  useEffect(() => {
    setTaskId('');
    clearExecutionState();
  }, [props.uiConfig]);

  const containsExecutionDetails =
    !isEmpty(taskResponse) || !isEmpty(messages) || !isEmpty(traces);

  function clearExecutionState(): void {
    setTaskResponse('');
    setMessages([]);
    setTraces([]);
  }

  function clearInteractionsState(): void {
    stopTaskExecution().then(() => {
      clearExecutionState();
      setInteractions([]);
    });
  }

  async function refreshTaskExecution() {
    await dispatch(
      getTask({
        taskId,
        dataSourceId,
      })
    )
      .unwrap()
      .then((resp) => {
        setTaskResponse(resp);
      })
      .catch((err) => {});
  }
  async function stopTaskExecution() {
    if (!isEmpty(taskId)) {
      await dispatch(
        deleteTask({
          taskId,
          dataSourceId,
        })
      )
        .unwrap()
        .then((resp) => {})
        .catch((err) => {})
        .finally(() => {
          setTaskId('');
          clearExecutionState();
          const interactionsCopy = cloneDeep(interactions);
          const curInteraction = interactions[interactions.length - 1];
          curInteraction.agentMsg = CANCELED_MSG;
          interactionsCopy[interactions.length - 1] = curInteraction;
          setInteractions(interactionsCopy);
        });
    }
  }

  // when a new agent response is generated (either error or output), update the interaction state
  useEffect(() => {
    if (!taskInProgress && !isEmpty(taskResponse)) {
      let finalAgentMsg = '';
      if (!isEmpty(taskError)) {
        finalAgentMsg = FAILED_MSG;
      } else {
        finalAgentMsg = getModelResponseFromTask(taskResponse);
      }
      const interactionsCopy = cloneDeep(interactions);
      const curInteraction = interactions[interactions.length - 1];
      curInteraction.agentMsg = finalAgentMsg;
      interactionsCopy[interactions.length - 1] = curInteraction;
      setInteractions(interactionsCopy);
    }
  }, [taskInProgress]);

  return (
    <EuiPanel
      data-testid="leftNavPanel"
      paddingSize="s"
      grow={false}
      className="workspace-panel"
      borderRadius="l"
      style={{
        marginRight: '12px',
      }}
    >
      {agentFlyoutOpen && (
        <EuiFlyout onClose={() => setAgentFlyoutOpen(false)}>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>{`Agent details`}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiCodeBlock>{customStringify(agentDetails)}</EuiCodeBlock>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
      {taskErrorFlyoutOpen && (
        <EuiFlyout onClose={() => setTaskErrorFlyoutOpen(false)}>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>{`Execution task error`}</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiCodeBlock>{customStringify(taskError)}</EuiCodeBlock>
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
      {executionDetailsFlyoutOpen && (
        <EuiFlyout onClose={() => setExecutionDetailsFlyoutOpen(false)}>
          <EuiFlyoutHeader>
            <EuiFlexGroup direction="row">
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h2>{`Execution Details`}</h2>
                </EuiTitle>
              </EuiFlexItem>
              {taskInProgress && (
                <EuiFlexItem grow={false} style={{ marginTop: '20px' }}>
                  <EuiButtonIcon
                    aria-label="refresh"
                    iconType="refresh"
                    iconSize="l"
                    onClick={async () => {
                      refreshTaskExecution();
                    }}
                  />
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText color="subdued" size="s">
              Each agent execution produces several resources to aid in
              debugging and user understanding.{' '}
              <EuiLink href={EXECUTE_AGENT_LINK} target="_blank">
                Learn more
              </EuiLink>
            </EuiText>
            {!isEmpty(taskResponse) && (
              <>
                <EuiSpacer size="m" />
                <EuiAccordion
                  id="taskResponseAccordion"
                  initialIsOpen={false}
                  buttonContent={
                    <EuiFlexGroup direction="row" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiText size="m">Task</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ marginTop: '8px' }}>
                        <EuiText size="xs">
                          <EuiLink href={ML_COMMONS_TASK_LINK} target="_blank">
                            What is this?
                          </EuiLink>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                >
                  <EuiCodeBlock>{customStringify(taskResponse)}</EuiCodeBlock>
                </EuiAccordion>
              </>
            )}
            {!isEmpty(messages) && (
              <>
                <EuiSpacer size="m" />
                <EuiAccordion
                  id="messagesAccordion"
                  initialIsOpen={false}
                  buttonContent={
                    <EuiFlexGroup direction="row" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiText size="m">Messages</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ marginTop: '8px' }}>
                        <EuiText size="xs">
                          <EuiLink
                            href={ML_COMMONS_MESSAGES_LINK}
                            target="_blank"
                          >
                            What is this?
                          </EuiLink>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                >
                  <EuiCodeBlock>{customStringify(messages)}</EuiCodeBlock>
                </EuiAccordion>
              </>
            )}
            {!isEmpty(traces) && (
              <>
                <EuiSpacer size="m" />
                <EuiAccordion
                  id="tracesAccordion"
                  initialIsOpen={false}
                  buttonContent={
                    <EuiFlexGroup direction="row" gutterSize="s">
                      <EuiFlexItem grow={false}>
                        <EuiText size="m">Traces</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ marginTop: '8px' }}>
                        <EuiText size="xs">
                          <EuiLink
                            href={ML_COMMONS_TRACES_LINK}
                            target="_blank"
                          >
                            What is this?
                          </EuiLink>
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  }
                >
                  <EuiCodeBlock>{customStringify(traces)}</EuiCodeBlock>
                </EuiAccordion>
              </>
            )}
          </EuiFlyoutBody>
        </EuiFlyout>
      )}
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <h3>Test</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="row">
              {!isEmpty(interactions) && (
                <EuiFlexItem grow={false} style={{ marginTop: '16px' }}>
                  <EuiSmallButtonEmpty
                    onClick={() => {
                      clearInteractionsState();
                    }}
                  >
                    Clear chat history
                  </EuiSmallButtonEmpty>
                </EuiFlexItem>
              )}
              {!isEmpty(agentDetails) && (
                <EuiFlexItem grow={false} style={{ marginTop: '16px' }}>
                  <EuiSmallButtonEmpty
                    onClick={() => {
                      setAgentFlyoutOpen(true);
                    }}
                  >
                    View agent details
                  </EuiSmallButtonEmpty>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexItem>
          <EuiHorizontalRule
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        </EuiFlexItem>
      </EuiFlexItem>
      {props.unsavedChanges && (
        <EuiFlexItem grow={false}>
          <EuiCallOut
            size="s"
            iconType={'alert'}
            color="warning"
            title="Unsaved configuration changes detected"
          />
        </EuiFlexItem>
      )}
      <EuiFlexItem
        className="left-nav-scroll"
        grow={true}
        style={{
          // unsaved changes adds a callout, so we need to factor it in when determining total height
          height: props.unsavedChanges
            ? 'calc(100% - 96px)'
            : 'calc(100% - 56px)',
        }}
      >
        <EuiPanel
          borderRadius="xl"
          hasBorder={false}
          color="subdued"
          paddingSize="s"
        >
          <EuiFlexItem
            style={{
              height: '100%',
            }}
          >
            <EuiFlexGroup direction="column">
              <EuiFlexItem grow={false}>
                {interactions.map((interaction, idx) => {
                  return (
                    <div key={`interaction_${idx}`}>
                      <EuiFlexGroup direction="row">
                        <EuiFlexItem grow={2}></EuiFlexItem>
                        <EuiFlexItem grow={8}>
                          <EuiFlexGroup direction="row">
                            <EuiFlexItem></EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiFlexGroup
                                direction="column"
                                gutterSize="xs"
                                alignItems="flexEnd"
                              >
                                <EuiFlexItem grow={false}>
                                  <EuiText size="xs" color="subdued">
                                    You
                                  </EuiText>
                                </EuiFlexItem>
                                <EuiPanel borderRadius="l" color="plain">
                                  <EuiText size="s">
                                    {getIn(interactions, `${idx}.userMsg`, '')}
                                  </EuiText>
                                </EuiPanel>
                              </EuiFlexGroup>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                      <EuiFlexGroup direction="row">
                        <EuiFlexItem grow={8}>
                          <EuiFlexGroup direction="row">
                            <EuiFlexItem grow={false}>
                              <EuiFlexGroup
                                direction="column"
                                gutterSize="xs"
                                alignItems="flexStart"
                              >
                                <EuiFlexItem
                                  grow={false}
                                  style={{ marginLeft: '4px' }}
                                >
                                  <EuiText size="xs" color="subdued">
                                    Agent
                                  </EuiText>
                                </EuiFlexItem>
                                <EuiPanel borderRadius="l" color="plain">
                                  {/**
                                   * For previous interactions, just display the plaintext response.
                                   * For the latest/current interactions, show extra info, such as
                                   * any errors or execution traces.
                                   */}
                                  {idx === interactions.length - 1 &&
                                  taskInProgress ? (
                                    <EuiLoadingSpinner size="l" />
                                  ) : (
                                    formatAgentMsg(
                                      getIn(interactions, `${idx}.agentMsg`, '')
                                    )
                                  )}
                                </EuiPanel>
                                {idx === interactions.length - 1 &&
                                  !isEmpty(taskError) && (
                                    <EuiSmallButtonEmpty
                                      style={{
                                        marginLeft: '-4px',
                                        marginRight: '12px',
                                        marginTop: '-4px',
                                        marginBottom: '-4px',
                                      }}
                                      onClick={async () => {
                                        setTaskErrorFlyoutOpen(true);
                                      }}
                                    >
                                      <EuiText size="xs" color="danger">
                                        View failure
                                      </EuiText>
                                    </EuiSmallButtonEmpty>
                                  )}
                                {idx === interactions.length - 1 &&
                                  taskInProgress && (
                                    <EuiSmallButtonEmpty
                                      style={{
                                        marginTop: '-4px',
                                        marginLeft: '-4px',
                                        marginBottom: '-8px',
                                      }}
                                      onClick={async () => {
                                        stopTaskExecution();
                                      }}
                                    >
                                      <EuiText size="xs" color="danger">
                                        Cancel
                                      </EuiText>
                                    </EuiSmallButtonEmpty>
                                  )}
                                {idx === interactions.length - 1 &&
                                  containsExecutionDetails && (
                                    <EuiSmallButtonEmpty
                                      style={{
                                        marginLeft: '-4px',
                                        marginRight: '12px',
                                        marginTop: '-4px',
                                        marginBottom: '-4px',
                                      }}
                                      onClick={async () => {
                                        setExecutionDetailsFlyoutOpen(true);
                                      }}
                                    >
                                      <EuiText size="xs">View details</EuiText>
                                    </EuiSmallButtonEmpty>
                                  )}
                              </EuiFlexGroup>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem grow={2}></EuiFlexItem>
                      </EuiFlexGroup>
                    </div>
                  );
                })}
              </EuiFlexItem>
              <EuiFlexItem></EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup direction="row">
                  <EuiFlexItem grow={2}></EuiFlexItem>
                  <EuiFlexItem grow={8}>
                    <EuiFlexGroup direction="row" gutterSize="s">
                      <EuiFlexItem>
                        <EuiCompressedTextArea
                          style={{ borderRadius: '12px' }}
                          fullWidth={true}
                          placeholder={'Ask a question'}
                          value={executeInput}
                          onChange={(e) => {
                            setExecuteInput(e.target.value);
                          }}
                          isInvalid={false}
                          disabled={false}
                          resize="none"
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false} style={{ marginTop: '46px' }}>
                        <EuiSmallButton
                          fill={true}
                          style={{ borderRadius: '12px' }}
                          aria-label="sendMessageButton"
                          iconType="returnKey"
                          iconSide="right"
                          disabled={
                            isEmpty(agentId) ||
                            isEmpty(executeInput) ||
                            taskInProgress
                          }
                          color="primary"
                          isLoading={false}
                          onClick={async () => {
                            setInteractions([
                              ...interactions,
                              {
                                userMsg: executeInput,
                                agentMsg: '',
                              },
                            ]);
                            await dispatch(
                              executeAgent({
                                agentId,
                                apiBody: customStringify({
                                  parameters: { question: executeInput },
                                }),
                                dataSourceId,
                              })
                            )
                              .unwrap()
                              .then((resp) => {
                                setTaskId(resp?.task_id || '');
                                clearExecutionState();
                              })
                              .catch((err) => {})
                              .finally(() => {
                                setExecuteInput('');
                              });
                          }}
                        >
                          Send
                        </EuiSmallButton>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        </EuiPanel>
        {/* <EuiFlexItem grow={true} className="left-nav-scroll">
          <EuiFlexGroup direction="column">
            {props.unsavedChanges && (
              <EuiFlexItem grow={false} style={{ marginBottom: '0px' }}>
                <EuiCallOut
                  size="s"
                  iconType={'alert'}
                  color="warning"
                  title="Unsaved configuration changes detected"
                />
              </EuiFlexItem>
            )}
            {!isEmpty(taskError) && (
              <EuiFlexItem grow={false}>
                <EuiCallOut
                  size="s"
                  iconType={'alert'}
                  color="danger"
                  title="Execution task failed"
                >
                  {
                    <EuiSmallButtonEmpty
                      onClick={() => setTaskErrorFlyoutOpen(true)}
                    >
                      View full error
                    </EuiSmallButtonEmpty>
                  }
                </EuiCallOut>
              </EuiFlexItem>
            )}
            <EuiFlexItem grow={false}>
              <EuiCompressedTextArea
                fullWidth={true}
                placeholder={'Ask a question'}
                value={executeInput}
                onChange={(e) => {
                  setExecuteInput(e.target.value);
                }}
                isInvalid={false}
                disabled={false}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ marginTop: '0px' }}>
              <EuiFlexGroup direction="row" gutterSize="xs">
                <EuiFlexItem grow={false}>
                  <EuiSmallButton
                    fill={false}
                    disabled={isEmpty(agentId) || isEmpty(executeInput)}
                    color={taskInProgress ? 'danger' : 'primary'}
                    isLoading={false}
                    onClick={async () => {
                      if (taskInProgress) {
                        stopTaskExecution();
                      } else {
                        await dispatch(
                          executeAgent({
                            agentId,
                            apiBody: customStringify({
                              parameters: { question: executeInput },
                            }),
                            dataSourceId,
                          })
                        )
                          .unwrap()
                          .then((resp) => {
                            setTaskId(resp?.task_id || '');
                            clearExecutionState();
                          })
                          .catch((err) => {});
                      }
                    }}
                  >
                    {taskInProgress
                      ? 'Cancel'
                      : !isEmpty(taskError)
                      ? 'Re-run'
                      : 'Run'}
                  </EuiSmallButton>
                </EuiFlexItem>
                {taskInProgress && (
                  <EuiFlexItem
                    grow={false}
                    style={{ marginLeft: '8px', marginTop: '4px' }}
                  >
                    <EuiLoadingSpinner size="l" />
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
            {containsExecutionDetails && (
              <EuiFlexItem
                grow={false}
                style={{ marginLeft: '4px', marginTop: '0px' }}
              >
                <EuiFlexGroup direction="row">
                  <EuiFlexItem grow={false}>
                    <EuiSmallButtonEmpty
                      onClick={async () => {
                        setExecutionDetailsFlyoutOpen(true);
                      }}
                    >
                      View execution details
                    </EuiSmallButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem> */}
      </EuiFlexItem>
    </EuiPanel>
  );
}

function getModelResponseFromTask(taskResponse: any): string {
  const taskResults = getIn(
    taskResponse,
    'response.inference_results.0.output',
    []
  ) as [];
  const modelResult = taskResults.find(
    (result: any) => result.name === 'response'
  ) as any;
  return getIn(modelResult, 'dataAsMap.response', '') as string;
}

function formatAgentMsg(agentMsg: string) {
  return agentMsg === FAILED_MSG || agentMsg === CANCELED_MSG ? (
    <i>
      <EuiText size="s">{agentMsg}</EuiText>
    </i>
  ) : (
    <EuiText size="s">{agentMsg}</EuiText>
  );
}
