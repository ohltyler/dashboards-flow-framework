/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { RouteComponentProps, useLocation } from 'react-router-dom';
import {
  EuiPageHeader,
  EuiTitle,
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiSpacer,
} from '@elastic/eui';
import queryString from 'query-string';
import { useSelector } from 'react-redux';
import { BREADCRUMBS } from '../../utils';
import { getCore } from '../../services';
import { WorkflowList } from './workflow_list';
import { NewWorkflow } from './new_workflow';
import { AppState, searchWorkflows, useAppDispatch } from '../../store';
import { EmptyListMessage } from './empty_list_message';
import { FETCH_ALL_QUERY_BODY } from '../../../common';

export interface WorkflowsRouterProps {}

interface WorkflowsProps extends RouteComponentProps<WorkflowsRouterProps> {}

export enum WORKFLOWS_TAB {
  MANAGE = 'manage',
  CREATE = 'create',
}

const ACTIVE_TAB_PARAM = 'tab';

function replaceActiveTab(activeTab: string, props: WorkflowsProps) {
  props.history.replace({
    ...history,
    search: queryString.stringify({
      [ACTIVE_TAB_PARAM]: activeTab,
    }),
  });
}

/**
 * The base workflows page. From here, users can toggle between views to access
 * existing created workflows, or explore the library of workflow templates
 * to get started on a new workflow.
 */
export function Workflows(props: WorkflowsProps) {
  const dispatch = useAppDispatch();
  const { workflows, loading, errorMessage } = useSelector(
    (state: AppState) => state.workflows
  );

  const tabFromUrl = queryString.parse(useLocation().search)[
    ACTIVE_TAB_PARAM
  ] as WORKFLOWS_TAB;
  const [selectedTabId, setSelectedTabId] = useState<WORKFLOWS_TAB>(tabFromUrl);

  // If there is no selected tab or invalid tab, default to manage tab
  useEffect(() => {
    if (
      !selectedTabId ||
      !Object.values(WORKFLOWS_TAB).includes(selectedTabId)
    ) {
      setSelectedTabId(WORKFLOWS_TAB.MANAGE);
      replaceActiveTab(WORKFLOWS_TAB.MANAGE, props);
    }
  }, [selectedTabId, workflows]);

  // If the user navigates back to the manage tab, re-fetch workflows
  useEffect(() => {
    if (selectedTabId === WORKFLOWS_TAB.MANAGE) {
      dispatch(searchWorkflows(FETCH_ALL_QUERY_BODY));
    }
  }, [selectedTabId]);

  useEffect(() => {
    getCore().chrome.setBreadcrumbs([
      BREADCRUMBS.FLOW_FRAMEWORK,
      BREADCRUMBS.WORKFLOWS,
    ]);
  });

  // Show a toast if an error message exists in state
  useEffect(() => {
    if (errorMessage) {
      console.error(errorMessage);
      getCore().notifications.toasts.addDanger(errorMessage);
    }
  }, [errorMessage]);

  // On initial render: fetch all workflows
  useEffect(() => {
    dispatch(searchWorkflows(FETCH_ALL_QUERY_BODY));
  }, []);

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader
          pageTitle="Workflows"
          tabs={[
            {
              id: WORKFLOWS_TAB.MANAGE,
              label: 'Manage workflows',
              isSelected: selectedTabId === WORKFLOWS_TAB.MANAGE,
              onClick: () => {
                setSelectedTabId(WORKFLOWS_TAB.MANAGE);
                replaceActiveTab(WORKFLOWS_TAB.MANAGE, props);
              },
            },
            {
              id: WORKFLOWS_TAB.CREATE,
              label: 'New workflow',
              isSelected: selectedTabId === WORKFLOWS_TAB.CREATE,
              onClick: () => {
                setSelectedTabId(WORKFLOWS_TAB.CREATE);
                replaceActiveTab(WORKFLOWS_TAB.CREATE, props);
              },
            },
          ]}
          bottomBorder={true}
        />

        <EuiPageContent>
          <EuiTitle>
            <h2>
              {selectedTabId === WORKFLOWS_TAB.MANAGE && 'Workflows'}
              {selectedTabId === WORKFLOWS_TAB.CREATE &&
                'Create a new workflow'}
            </h2>
          </EuiTitle>
          <EuiSpacer size="m" />
          {selectedTabId === WORKFLOWS_TAB.MANAGE && (
            <WorkflowList setSelectedTabId={setSelectedTabId} />
          )}
          {selectedTabId === WORKFLOWS_TAB.CREATE && <NewWorkflow />}
          {selectedTabId === WORKFLOWS_TAB.MANAGE &&
            Object.keys(workflows || {}).length === 0 &&
            !loading && (
              <EmptyListMessage
                onClickNewWorkflow={() => {
                  setSelectedTabId(WORKFLOWS_TAB.CREATE);
                  replaceActiveTab(WORKFLOWS_TAB.CREATE, props);
                }}
              />
            )}
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
}
