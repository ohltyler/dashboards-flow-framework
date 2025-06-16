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
      <EuiFlexItem grow={false}>
        <EuiFlexGroup direction="row" justifyContent="spaceBetween">
          <EuiFlexItem grow={false}>
            <EuiTitle>
              <h3>Test</h3>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiSmallButtonEmpty
              onClick={() => {
                console.log('view agent resources here...');
              }}
            >
              View resources
            </EuiSmallButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexItem>
          <EuiHorizontalRule
            style={{ marginTop: '8px', marginBottom: '8px' }}
          />
        </EuiFlexItem>
      </EuiFlexItem>
      <EuiFlexGroup direction="column" gutterSize="s">
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
                  <EuiFlexItem grow={false}>
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
                    {`Task created. Task ID: ${taskId}`}
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
        {/* <EuiFlexItem grow={5}>
          {hasResources && (
            <EuiFlexItem grow={false}>
              <EuiTitle size="s">
                <h3>Resources</h3>
              </EuiTitle>
            </EuiFlexItem>
          )}
          <EuiFlexItem>
            <Resources hasResources={hasResources} workflow={props.workflow} />
          </EuiFlexItem>
        </EuiFlexItem> */}
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
