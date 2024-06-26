/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiContextMenu,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
  EuiPanel,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { cloneDeep } from 'lodash';
import { useFormikContext } from 'formik';
import {
  IConfig,
  IProcessorConfig,
  PROCESSOR_CONTEXT,
  WorkflowConfig,
  WorkflowFormValues,
} from '../../../../common';
import { ConfigFieldList } from './config_field_list';
import { formikToUiConfig } from '../../../utils';
import {
  MLIngestProcessor,
  MLSearchRequestProcessor,
  MLSearchResponseProcessor,
} from '../../../configs';

interface ProcessorsListProps {
  onFormChange: () => void;
  uiConfig: WorkflowConfig;
  setUiConfig: (uiConfig: WorkflowConfig) => void;
  context: PROCESSOR_CONTEXT;
}

const PANEL_ID = 0;

/**
 * General component for configuring pipeline processors (ingest / search request / search response)
 */
export function ProcessorsList(props: ProcessorsListProps) {
  const { values } = useFormikContext<WorkflowFormValues>();

  // Popover state when adding new processors
  const [isPopoverOpen, setPopover] = useState(false);
  const closePopover = () => {
    setPopover(false);
  };

  // Current processors state
  const [processors, setProcessors] = useState<IProcessorConfig[]>([]);
  useEffect(() => {
    if (props.uiConfig && props.context) {
      setProcessors(
        props.context === PROCESSOR_CONTEXT.INGEST
          ? props.uiConfig.ingest.enrich.processors
          : props.context === PROCESSOR_CONTEXT.SEARCH_REQUEST
          ? props.uiConfig.search.enrichRequest.processors
          : props.uiConfig.search.enrichResponse.processors
      );
    }
  }, [props.context, props.uiConfig]);

  // Adding a processor to the config. Fetch the existing one
  // (getting any updated/interim values along the way) and add to
  // the list of processors
  function addProcessor(processor: IProcessorConfig): void {
    const existingConfig = cloneDeep(props.uiConfig as WorkflowConfig);
    let newConfig = formikToUiConfig(values, existingConfig);
    switch (props.context) {
      case PROCESSOR_CONTEXT.INGEST: {
        newConfig.ingest.enrich.processors = [
          ...newConfig.ingest.enrich.processors,
          processor,
        ];
        break;
      }
      case PROCESSOR_CONTEXT.SEARCH_REQUEST: {
        newConfig.search.enrichRequest.processors = [
          ...newConfig.search.enrichRequest.processors,
          processor,
        ];
        break;
      }
      case PROCESSOR_CONTEXT.SEARCH_RESPONSE: {
        newConfig.search.enrichResponse.processors = [
          ...newConfig.search.enrichResponse.processors,
          processor,
        ];
        break;
      }
    }
    props.setUiConfig(newConfig);
    props.onFormChange();
  }

  // Deleting a processor from the config. Fetch the existing one
  // (getting any updated/interim values along the way) delete
  // the specified processor from the list of processors
  function deleteProcessor(processorIdToDelete: string): void {
    const existingConfig = cloneDeep(props.uiConfig as WorkflowConfig);
    let newConfig = formikToUiConfig(values, existingConfig);
    switch (props.context) {
      case PROCESSOR_CONTEXT.INGEST: {
        newConfig.ingest.enrich.processors = newConfig.ingest.enrich.processors.filter(
          (processorConfig) => processorConfig.id !== processorIdToDelete
        );
        break;
      }
      case PROCESSOR_CONTEXT.SEARCH_REQUEST: {
        newConfig.search.enrichRequest.processors = newConfig.search.enrichRequest.processors.filter(
          (processorConfig) => processorConfig.id !== processorIdToDelete
        );
        break;
      }
      case PROCESSOR_CONTEXT.SEARCH_RESPONSE: {
        newConfig.search.enrichResponse.processors = newConfig.search.enrichResponse.processors.filter(
          (processorConfig) => processorConfig.id !== processorIdToDelete
        );
        break;
      }
    }

    props.setUiConfig(newConfig);
    props.onFormChange();
  }

  return (
    <EuiFlexGroup direction="column">
      {processors.map((processor: IConfig, processorIndex) => {
        return (
          <EuiFlexItem key={processorIndex}>
            <EuiPanel>
              <EuiFlexGroup direction="row" justifyContent="spaceBetween">
                <EuiFlexItem grow={false}>
                  <EuiText>{processor.name || 'Processor'}</EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    iconType={'trash'}
                    color="danger"
                    aria-label="Delete"
                    onClick={() => {
                      deleteProcessor(processor.id);
                    }}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiHorizontalRule size="full" margin="s" />
              <ConfigFieldList
                config={processor}
                baseConfigPath={
                  props.context === PROCESSOR_CONTEXT.INGEST
                    ? 'ingest.enrich'
                    : props.context === PROCESSOR_CONTEXT.SEARCH_REQUEST
                    ? 'search.enrichRequest'
                    : 'search.enrichResponse'
                }
                onFormChange={props.onFormChange}
              />
            </EuiPanel>
          </EuiFlexItem>
        );
      })}
      <EuiFlexItem grow={false}>
        <div>
          <EuiPopover
            button={
              <EuiButton
                iconType="arrowDown"
                iconSide="right"
                onClick={() => {
                  setPopover(!isPopoverOpen);
                }}
              >
                {processors.length > 0
                  ? 'Add another processor'
                  : 'Add processor'}
              </EuiButton>
            }
            isOpen={isPopoverOpen}
            closePopover={closePopover}
            panelPaddingSize="none"
            anchorPosition="downLeft"
          >
            <EuiContextMenu
              initialPanelId={PANEL_ID}
              panels={[
                {
                  id: PANEL_ID,
                  title: 'Processors',
                  // TODO: add more processor types
                  items: [
                    {
                      name: 'ML Inference Processor',
                      onClick: () => {
                        closePopover();
                        const processorToAdd =
                          props.context === PROCESSOR_CONTEXT.INGEST
                            ? new MLIngestProcessor()
                            : props.context === PROCESSOR_CONTEXT.SEARCH_REQUEST
                            ? new MLSearchRequestProcessor()
                            : new MLSearchResponseProcessor();
                        addProcessor(processorToAdd.toObj());
                      },
                    },
                  ],
                },
              ]}
            />
          </EuiPopover>
        </div>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}
