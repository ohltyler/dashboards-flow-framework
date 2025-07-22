/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual, sortBy } from 'lodash';
import { useFormikContext } from 'formik';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSmallButton,
  EuiPanel,
  EuiHorizontalRule,
  EuiLoadingSpinner,
  EuiSmallButtonIcon,
} from '@elastic/eui';
import {
  Workflow,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { ModelField, SelectField } from '../../component_input';
import {
  AppState,
  deprovisionWorkflow,
  getWorkflow,
  provisionWorkflow,
  updateWorkflow,
  useAppDispatch,
} from '../../../../store';
import {
  configToTemplateFlows,
  formikToUiConfig,
  getDataSourceId,
  hasProvisionedAgentResources,
  reduceToTemplate,
  sleep,
  USE_NEW_HOME_PAGE,
  useDataSourceVersion,
} from '../../../../utils';
import { ToolsInputs } from './tools_inputs';
import { MCPServerInputs } from './mcp_server_inputs';
import { AdvancedSettingsInputs } from './advanced_settings_inputs';
import { getCore } from '../../../../services';

// styling
import '../../workspace/workspace-styles.scss';
import '../../../../global-styles.scss';

interface AgentInputsProps {
  workflow: Workflow;
  uiConfig: WorkflowConfig | undefined;
  setUiConfig: (uiConfig: WorkflowConfig) => void;
  setUnsavedChanges: (unsavedChanges: boolean) => void;
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
  const {
    values,
    dirty,
    setTouched,
    submitForm,
    validateForm,
    resetForm,
  } = useFormikContext<WorkflowFormValues>();

  const { loading } = useSelector((state: AppState) => state.workflows);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const isLoading = loading || isCreating;
  const agentProvisioned = hasProvisionedAgentResources(props.workflow);

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

  const [templateNodesDifferent, setTemplateNodesDifferent] = useState<boolean>(
    false
  );
  const allChangesSaved =
    !templateNodesDifferent || (!dirty && agentProvisioned);

  // for any form changes, check if it would produce a new template.
  // this is so we can dynamically enable/disable the create/update buttons if applicable.
  useEffect(() => {
    const persistedTemplateNodes =
      props.workflow?.workflows?.provision?.nodes || [];
    const persistedTemplateNodesSorted = persistedTemplateNodes
      .map((node) => sortBy(Object.entries(node)))
      .sort();
    const formGeneratedTemplateNodes =
      (values?.ingest &&
        values?.search &&
        props.uiConfig &&
        props.workflow &&
        configToTemplateFlows(
          formikToUiConfig(values, props.uiConfig as WorkflowConfig),
          false,
          false
        )?.provision?.nodes) ||
      [];
    const formGeneratedTemplateNodesSorted = formGeneratedTemplateNodes
      .map((node) => sortBy(Object.entries(node)))
      .sort();
    setTemplateNodesDifferent(
      !isEqual(
        persistedTemplateNodesSorted,
        formGeneratedTemplateNodesSorted
      ) || false
    );
  }, [
    values?.agent,
    values?.agent?.tools?.length,
    props.uiConfig,
    props.workflow,
  ]);

  useEffect(() => {
    props.setUnsavedChanges(!allChangesSaved || isLoading);
  }, [allChangesSaved, isLoading]);

  // Utility fn to validate the form and update the workflow if valid
  async function validateAndUpdateWorkflow(
    agentProvisioned: boolean
  ): Promise<boolean> {
    let success = false;
    await submitForm();
    await validateForm()
      .then(async (validationResults: { agent?: {} }) => {
        const { agent } = validationResults;
        if (agent !== undefined && Object.keys(agent)?.length > 0) {
          getCore().notifications.toasts.addDanger('Missing or invalid fields');
        } else {
          setTouched({});
          setIsCreating(true);
          // if the agent resource already exists, deprovision first.
          if (agentProvisioned) {
            await dispatch(
              deprovisionWorkflow({
                apiBody: {
                  workflowId: props.workflow?.id as string,
                },
                dataSourceId,
              })
            )
              .unwrap()
              .then(async (resp) => {
                await sleep(1000);
              });
          }
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
                  await dispatch(
                    getWorkflow({
                      workflowId: updatedWorkflow.id as string,
                      dataSourceId,
                    })
                  )
                    .unwrap()
                    .then(async (resp) => {
                      setIsCreating(false);
                    });
                })
                .catch((err: any) => {
                  setIsCreating(false);
                });
            })
            .catch((err: any) => {
              setIsCreating(false);
            });
        }
      })
      .catch((error) => {
        console.error('Error validating form: ', error);
      });

    return success;
  }

  // Utility fn to revert any unsaved changes, reset the form
  function revertUnsavedChanges(): void {
    resetForm();
    if (props.workflow?.ui_metadata?.config !== undefined) {
      props.setUiConfig(props.workflow?.ui_metadata?.config);
    }
  }

  return (
    <>
      {props.uiConfig?.agent !== undefined ? (
        <EuiPanel
          data-testid="leftNavPanel"
          paddingSize="s"
          grow={false}
          className="workspace-panel"
          borderRadius="l"
          style={{
            marginRight: '0px',
          }}
        >
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="row" justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
                <EuiTitle>
                  <h3>Configure</h3>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexItem>
              <EuiHorizontalRule
                style={{ marginTop: '8px', marginBottom: '8px' }}
              />
            </EuiFlexItem>
          </EuiFlexItem>
          <EuiFlexGroup
            direction="column"
            justifyContent="spaceBetween"
            gutterSize="none"
            style={{
              height: '100%',
              gap: '16px',
            }}
          >
            <EuiFlexItem grow={false} className="left-nav-scroll">
              <>
                {props.uiConfig === undefined ? (
                  <EuiLoadingSpinner size="xl" />
                ) : (
                  <EuiFlexGroup
                    direction="column"
                    gutterSize="s"
                    style={{
                      height: '100%',
                      gap: '4px',
                    }}
                  >
                    <EuiFlexItem grow={false}>
                      <SelectField
                        field={props.uiConfig.agent?.type}
                        fieldPath={'agent.type'}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <ModelField
                        fieldPath="agent.llm"
                        showMissingInterfaceCallout={false}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <ToolsInputs />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <MCPServerInputs />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <AdvancedSettingsInputs uiConfig={props.uiConfig} />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                )}
              </>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup direction="column" gutterSize="none">
                <EuiFlexItem>
                  <EuiHorizontalRule margin="m" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiFlexGroup
                    direction="row"
                    gutterSize="s"
                    style={{
                      padding: '0px',
                      marginBottom: USE_NEW_HOME_PAGE ? '12px' : '54px',
                      marginTop: '-12px',
                    }}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup direction="row">
                        <EuiFlexItem grow={false}>
                          <EuiSmallButton
                            fill={true}
                            disabled={allChangesSaved}
                            isLoading={isLoading}
                            onClick={async () => {
                              await validateAndUpdateWorkflow(agentProvisioned);
                            }}
                          >
                            {isLoading
                              ? 'Updating'
                              : agentProvisioned
                              ? 'Update'
                              : 'Create'}
                          </EuiSmallButton>
                        </EuiFlexItem>
                        {!allChangesSaved && agentProvisioned && (
                          <EuiFlexItem
                            grow={false}
                            style={{ marginLeft: '0px' }}
                          >
                            <EuiSmallButtonIcon
                              iconType={'editorUndo'}
                              aria-label="undo"
                              iconSize="l"
                              isDisabled={isLoading}
                              onClick={() => revertUnsavedChanges()}
                            />
                          </EuiFlexItem>
                        )}
                      </EuiFlexGroup>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      ) : (
        <EuiLoadingSpinner size="xl" />
      )}
    </>
  );
}
