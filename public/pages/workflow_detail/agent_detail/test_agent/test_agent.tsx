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
  EuiSmallButtonIcon,
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
} from '@elastic/eui';
import {
  customStringify,
  TASK_STATE,
  Workflow,
  WORKFLOW_STEP_TYPE,
  WorkflowConfig,
} from '../../../../../common';
import { executeAgent, getTask, useAppDispatch } from '../../../../store';
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

  // Fetch agent ID and agent details if set
  const [agentId, setAgentId] = useState<string>('');
  const [agentDetails, setAgentDetails] = useState<string>('{}');
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
      //await dispatch()
      console.log('getting details...');
    };
    if (!isEmpty(agentId)) {
      getAgentDetails();
    }
  }, [agentId]);

  const [executeInput, setExecuteInput] = useState<string>('');
  const [executeOutput, setExecuteOutput] = useState<string>('{}');
  const [executeError, setExecuteError] = useState<string>('');
  const [taskError, setTaskError] = useState<string>('');
  const [taskId, setTaskId] = useState<string>('');
  const hasResources =
    (props.workflow?.resourcesCreated &&
      props.workflow.resourcesCreated.length > 0) ??
    false;
  const [taskResponse, setTaskResponse] = useState<any>(undefined);
  const taskState = taskResponse?.state as TASK_STATE | undefined;
  const taskInProgress = !isEmpty(taskId) && taskState !== TASK_STATE.COMPLETED;

  useEffect(() => {
    setExecuteOutput(getModelResponseFromTask(taskResponse));
  }, [taskResponse]);

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
            <EuiCodeBlock>{agentDetails}</EuiCodeBlock>
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
          <EuiFlexItem grow={false} style={{ marginTop: '16px' }}>
            <EuiSmallButtonEmpty
              onClick={() => {
                setAgentFlyoutOpen(true);
              }}
            >
              View agent details
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexItem>
          <EuiHorizontalRule
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        </EuiFlexItem>
      </EuiFlexItem>
      <EuiFlexGroup direction="column" gutterSize="xs">
        {hasResources && (
          <EuiFlexItem grow={5}>
            <EuiFlexGroup direction="column">
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
                <EuiFlexGroup direction="row">
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
                            setExecuteError('');
                          })
                          .catch((err) => {
                            setExecuteError(err);
                          });
                      }}
                    >
                      {taskInProgress ? 'Running' : 'Run'}
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
              {!isEmpty(taskId) && (
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    {`Task created with ID: ${taskId}`}
                  </EuiText>
                </EuiFlexItem>
              )}
              {taskInProgress && (
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup direction="row" gutterSize="xs">
                    <EuiFlexItem grow={false}>
                      <EuiText size="s" color="subdued">
                        <i>Agent is executing...</i>
                      </EuiText>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiSmallButtonIcon
                        iconType="refresh"
                        style={{ marginTop: '-4px' }}
                        onClick={async () => {
                          await dispatch(
                            getTask({
                              taskId,
                              dataSourceId,
                            })
                          )
                            .unwrap()
                            .then((resp) => {
                              setTaskResponse(resp);
                              setTaskError('');
                            })
                            .catch((err) => {
                              setTaskError(err);
                            });
                        }}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              )}
              {!isEmpty(executeOutput) && (
                <EuiFlexItem grow={false}>
                  <EuiCodeBlock
                    fontSize="m"
                    isCopyable={true}
                    overflowHeight={300}
                  >
                    {executeOutput}
                  </EuiCodeBlock>
                </EuiFlexItem>
              )}
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
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
