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
} from '@elastic/eui';
import {
  AGENT_TYPE,
  AgentConfig,
  Tool,
  Workflow,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../common';
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
            <EuiFlexItem grow={false}>
              <EuiSmallButton
                fill={false}
                onClick={() => {
                  const complexChatAgent = generateComplexChatAgent(
                    formInputs.name,
                    formInputs.description,
                    []
                  );

                  console.log('agent: ', complexChatAgent);
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
    </EuiPanel>
  );
}

// Generate the final plan-execute-reflect agent config, based on available LLM IDs and MCP IDs (if applicable)
function generateComplexChatAgent(
  name: string,
  description: string,
  tools: Tool[]
): AgentConfig {
  return {
    ...getDefaultAgentConfig(),
    name,
    description,
    type: AGENT_TYPE.PLAN_EXECUTE_REFLECT,
    tools,
  } as AgentConfig;
}

function getDefaultAgentConfig(): Partial<AgentConfig> {
  return {
    name: 'default_agent',
    description: '',
    llm: {
      model_id: '',
      parameters: {},
    },
    memory: {
      type: 'conversation_index',
    },
    parameters: {},
    tools: [],
    app_type: 'os_chat',
  };
}
