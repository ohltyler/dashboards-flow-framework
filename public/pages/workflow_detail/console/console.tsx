/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiPanel,
  EuiSmallButtonIcon,
} from '@elastic/eui';
import {
  CONSOLE_HEIGHT_CLOSED,
  CONSOLE_HEIGHT_OPEN,
  Workflow,
} from '../../../../common';

// styling
import '../../../global-styles.scss';

interface ConsoleProps {
  workflow?: Workflow;
  consoleOpen: boolean;
  setConsoleOpen: (consoleOpen: boolean) => void;
}

/**
 * Basic console component for displaying runtime data, like ingest responses and errors.
 */
export function Console(props: ConsoleProps) {
  return (
    <EuiFlexItem
      style={{
        height: props.consoleOpen ? CONSOLE_HEIGHT_OPEN : CONSOLE_HEIGHT_CLOSED,
        marginTop: '4px',
        marginBottom: '0px',
        marginRight: '0px',
        marginLeft: '16px',
      }}
    >
      <EuiPanel
        grow={false}
        style={{
          height: props.consoleOpen
            ? CONSOLE_HEIGHT_OPEN
            : CONSOLE_HEIGHT_CLOSED,
          paddingTop: '8px',
        }}
      >
        <EuiFlexGroup direction="column">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="row" justifyContent="spaceBetween">
              <EuiFlexItem grow={false} style={{ marginLeft: '20px' }}>
                <EuiText>
                  <b>Console</b>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiSmallButtonIcon
                  iconType={props.consoleOpen ? 'arrowDown' : 'arrowUp'}
                  onClick={() => props.setConsoleOpen(!props.consoleOpen)}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiFlexItem>
          {props.consoleOpen && (
            <EuiFlexItem>
              <EuiPanel grow={true}>
                <EuiText>Some console details</EuiText>
              </EuiPanel>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  );
}
