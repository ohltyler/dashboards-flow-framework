/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEmpty } from 'lodash';
import { getIn, useFormikContext } from 'formik';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiSmallButton,
  EuiPanel,
  EuiHorizontalRule,
  EuiLoadingSpinner,
} from '@elastic/eui';
import {
  Workflow,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../../common';
import { ModelField, SelectField } from '../../component_input';
import {
  AppState,
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
import { AdvancedSettingsInputs } from './advanced_settings_inputs';

// styling
import '../../workspace/workspace-styles.scss';
import '../../../../global-styles.scss';

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
  const { values, touched, dirty } = useFormikContext<WorkflowFormValues>();

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

  // TODO: derive the LLM interface based on the model, if applicable
  useEffect(() => {
    if (!isEmpty(getIn(values, 'agent.llm'))) {
      // TODO
    }
  }, [getIn(values, 'agent.llm')]);

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
            paddingBottom: '48px',
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
                    {/* <EuiFlexItem grow={false}>
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
                </EuiFlexItem> */}
                    <EuiFlexItem grow={false}>
                      <SelectField
                        field={props.uiConfig.agent?.type}
                        fieldPath={'agent.type'}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <ModelField
                        fieldPath="agent.llm"
                        hasModelInterface={true}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <ToolsInputs />
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
                      marginBottom: USE_NEW_HOME_PAGE ? '0px' : '48px',
                    }}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiFlexGroup direction="row">
                        <EuiFlexItem grow={false}>
                          <EuiSmallButton
                            fill={false}
                            // TODO: make this smarter. Should disable again if the generated template remains unchanged (e.g., toggling something off and back on again).
                            // Can follow what's done in LeftNave for all form-related state.
                            // TODO: should have form validation and prevent creation if errors.
                            disabled={!dirty && agentProvisioned}
                            isLoading={isLoading}
                            onClick={async () => {
                              setIsCreating(true);
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
                            }}
                          >
                            {agentProvisioned ? 'Update' : 'Create'}
                          </EuiSmallButton>
                        </EuiFlexItem>
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
