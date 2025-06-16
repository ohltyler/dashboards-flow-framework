/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  EuiEmptyPrompt,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
} from '@elastic/eui';
import { Workflow } from '../../../../../common';
import { ResourceListWithFlyout } from './resource_list_with_flyout';

interface ResourcesProps {
  hasResources: boolean;
  workflow?: Workflow;
}

/**
 * The basic resources component for the Tools panel. Displays all created
 * resources for the particular workflow
 */
export function Resources(props: ResourcesProps) {
  return (
    <>
      {props.hasResources ? (
        <>
          <EuiFlexGroup direction="row">
            <EuiFlexItem>
              <ResourceListWithFlyout workflow={props.workflow} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      ) : (
        <EuiEmptyPrompt
          title={<h2>No resources available</h2>}
          titleSize="s"
          body={
            <>
              <EuiText size="s">
                Configure and create your workflow to start testing.
              </EuiText>
            </>
          }
        />
      )}
    </>
  );
}
