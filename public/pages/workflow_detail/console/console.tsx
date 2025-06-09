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
  EuiCodeBlock,
} from '@elastic/eui';
import {
  CONSOLE_HEIGHT_CLOSED,
  CONSOLE_HEIGHT_OPEN,
  Workflow,
} from '../../../../common';

// styling
import '../../../global-styles.scss';
import { isEmpty } from 'lodash';

interface ConsoleProps {
  workflow?: Workflow;
  consoleOpen: boolean;
  setConsoleOpen: (consoleOpen: boolean) => void;
  ingestResponse: string | undefined;
}

const CONTENT_HEIGHT = '20vh';

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
          paddingTop: '10px',
        }}
      >
        <EuiFlexGroup direction="column">
          <EuiFlexItem grow={false}>
            <EuiFlexGroup direction="row" justifyContent="spaceBetween">
              <EuiFlexItem grow={false}>
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

          {props.consoleOpen &&
            props.ingestResponse !== undefined &&
            !isEmpty(props.ingestResponse) && (
              <EuiFlexItem grow={true}>
                <EuiCodeBlock
                  language="json"
                  fontSize="m"
                  isCopyable={false}
                  // @ts-ignore
                  overflowHeight={CONTENT_HEIGHT}
                  style={{ maxHeight: CONTENT_HEIGHT }}
                >
                  {props.ingestResponse}
                </EuiCodeBlock>
              </EuiFlexItem>
            )}
        </EuiFlexGroup>
      </EuiPanel>
    </EuiFlexItem>
  );
}
