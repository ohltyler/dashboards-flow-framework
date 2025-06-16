/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { isEmpty } from 'lodash';
import {
  EuiCompressedFormRow,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSmallButton,
  EuiCodeEditor,
  EuiCallOut,
  EuiPanel,
  EuiText,
  EuiSmallButtonEmpty,
  EuiLoadingSpinner,
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
import { Resources } from '../../tools/resources';

// styling
import '../../workspace/workspace-styles.scss';
import '../../../../global-styles.scss';
import { getIn } from 'formik';

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

  const [executeInput, setExecuteInput] = useState<string>(
    customStringify({ parameters: { question: '' } })
  );
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
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexGroup direction="column">
        {hasResources && (
          <EuiFlexItem grow={5}>
            <EuiFlexGroup direction="column">
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
                      disabled={
                        isEmpty(agentId) ||
                        isEmpty(executeInput) ||
                        taskInProgress
                      }
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
                            setTaskId(resp?.task_id || '');
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
                  <>
                    {!isEmpty(taskId) && (
                      <EuiText size="xs" color="subdued">
                        <i>{`Task created. ID: ${taskId}`}</i>
                      </EuiText>
                    )}
                    {taskInProgress && (
                      <EuiSmallButtonEmpty
                        iconType="refresh"
                        iconSide="right"
                        style={{ marginLeft: '-8px', marginBottom: '12px' }}
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
                      >
                        Refresh
                      </EuiSmallButtonEmpty>
                    )}
                    {!taskInProgress && (
                      <EuiCodeEditor
                        mode="json"
                        theme="textmate"
                        width="100%"
                        height={'15vh'}
                        value={executeOutput}
                        isReadOnly={true}
                        readOnly={true}
                        setOptions={{
                          fontSize: '14px',
                          useWorker: true,
                          highlightActiveLine: false,
                          highlightSelectedWord: false,
                          highlightGutterLine: false,
                          wrap: true,
                        }}
                        aria-label="Execute agent output"
                        tabSize={2}
                      />
                    )}
                  </>
                </EuiCompressedFormRow>
                {taskInProgress && (
                  <>
                    <EuiFlexGroup direction="row">
                      <EuiFlexItem grow={false}>
                        <EuiText size="s">Agent is executing...</EuiText>
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        <EuiLoadingSpinner size="m" />
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </>
                )}
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
        )}
        <EuiFlexItem grow={5}>
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
