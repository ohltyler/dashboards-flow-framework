/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
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
}

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
  const [executeOutput, setExecuteOutput] = useState<string>('{}');
  const [executeError, setExecuteError] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const [taskResponse, setTaskResponse] = useState<any>(undefined);
  const taskState = taskResponse?.state as TASK_STATE | undefined;
  const taskError = getIn(taskResponse, 'response.error_message', '');
  const taskInProgress =
    !isEmpty(taskId) &&
    taskState !== TASK_STATE.COMPLETED &&
    taskState !== TASK_STATE.FAILED;

  useEffect(() => {
    setExecuteOutput(getModelResponseFromTask(taskResponse));
  }, [taskResponse]);

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

  const containsExecutionDetails =
    !isEmpty(taskResponse) || !isEmpty(messages) || !isEmpty(traces);

  function clearExecutionState(): void {
    setExecuteOutput('');
    setTaskResponse('');
    setExecuteError('');
    setMessages([]);
    setTraces([]);
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

  return (
    <EuiPanel
      data-testid="leftNavPanel"
      paddingSize="s"
      grow={false}
      className="workspace-panel"
      borderRadius="l"
      style={{
        paddingBottom: '48px',
        marginRight: '0px',
      }}
    >
      {agentFlyoutOpen && (
        <EuiFlyout onClose={() => setAgentFlyoutOpen(false)}>
          <EuiFlyoutHeader>
            <EuiTitle>
              <h2>{`Agent`}</h2>
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
            <EuiText color="subdued">
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
        <EuiFlexItem>
          <EuiHorizontalRule
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        </EuiFlexItem>
      </EuiFlexItem>
      <EuiFlexGroup direction="column" gutterSize="xs">
        <EuiFlexItem grow={5}>
          <EuiFlexGroup direction="column">
            {!isEmpty(taskError) && (
              <EuiFlexItem grow={true}>
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
            {!isEmpty(executeError) && (
              <EuiFlexItem grow={false}>
                <EuiCallOut
                  size="s"
                  iconType="alert"
                  color="danger"
                  title="Execution failed"
                >
                  {executeError}
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
            <EuiFlexItem grow={false}>
              <EuiFlexGroup direction="row" gutterSize="xs">
                <EuiFlexItem grow={false} style={{ marginTop: '0px' }}>
                  <EuiSmallButton
                    fill={false}
                    disabled={
                      isEmpty(agentId) ||
                      isEmpty(executeInput) ||
                      taskInProgress
                    }
                    isLoading={taskInProgress}
                    onClick={async () => {
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
                        .catch((err) => {
                          setExecuteError(err);
                        });
                    }}
                  >
                    {taskInProgress
                      ? 'Running'
                      : !isEmpty(executeOutput)
                      ? 'Re-run'
                      : 'Run'}
                  </EuiSmallButton>
                </EuiFlexItem>
                {taskInProgress && (
                  <EuiFlexItem grow={false} style={{ marginTop: '0px' }}>
                    <EuiSmallButtonEmpty
                      iconType="refresh"
                      aria-label="refresh"
                      onClick={async () => {
                        refreshTaskExecution();
                      }}
                    >
                      Refresh
                    </EuiSmallButtonEmpty>
                  </EuiFlexItem>
                )}
                {containsExecutionDetails && (
                  <EuiFlexItem grow={false} style={{ marginTop: '0px' }}>
                    <EuiSmallButtonEmpty
                      aria-label="refresh"
                      onClick={async () => {
                        setExecutionDetailsFlyoutOpen(true);
                      }}
                    >
                      View execution details
                    </EuiSmallButtonEmpty>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
            {!isEmpty(executeOutput) && (
              <EuiFlexItem grow={false}>
                <EuiCodeBlock
                  fontSize="m"
                  isCopyable={true}
                  overflowHeight={500}
                >
                  {executeOutput}
                </EuiCodeBlock>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
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
