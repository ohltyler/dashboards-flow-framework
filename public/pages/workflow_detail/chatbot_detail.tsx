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
} from '@elastic/eui';
import { Workflow, WorkflowConfig, WorkflowFormValues } from '../../../common';
import { ModelField } from './workflow_inputs';

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
  // useEffect(() => {
  //   if (props.uiConfig?.chat !== undefined) {
  //     setFormInputs({
  //       ...formInputs,
  //       llmId: props.uiConfig.chat.llm?.value || '',
  //     });
  //   }
  // }, [props.uiConfig]);

  console.log('final form inputs (name/description): ', formInputs);
  console.log('chat form values: ', values?.chat);
  console.log('chat config: ', props.uiConfig?.chat);

  return (
    <EuiPanel paddingSize="s" grow={true} borderRadius="l">
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
    </EuiPanel>
  );
}
