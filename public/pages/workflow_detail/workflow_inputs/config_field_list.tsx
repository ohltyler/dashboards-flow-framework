/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiFlexItem, EuiSpacer } from '@elastic/eui';
import {
  TextField,
  SelectField,
  BooleanField,
  NumberField,
  JsonField,
} from './input_fields';
import { IConfigField } from '../../../../common';
import { camelCaseToTitleString } from '../../../utils';

/**
 * A helper component to format all of the input fields for a component. Dynamically
 * render based on the input type.
 */

interface ConfigFieldListProps {
  configId: string;
  configFields: IConfigField[];
  baseConfigPath: string; // the base path of the nested config, if applicable. e.g., 'ingest.enrich'
  onFormChange: () => void;
}

const CONFIG_FIELD_SPACER_SIZE = 'm';

export function ConfigFieldList(props: ConfigFieldListProps) {
  return (
    <EuiFlexItem grow={false}>
      {props.configFields.map((field, idx) => {
        let el;
        switch (field.type) {
          case 'string': {
            el = (
              <EuiFlexItem key={idx}>
                <TextField
                  label={camelCaseToTitleString(field.id)}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  showError={true}
                  onFormChange={props.onFormChange}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
          case 'select': {
            el = (
              <EuiFlexItem key={idx}>
                <SelectField
                  field={field}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  onFormChange={props.onFormChange}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
          case 'boolean': {
            el = (
              <EuiFlexItem key={idx}>
                <BooleanField
                  label={camelCaseToTitleString(field.id)}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  onFormChange={props.onFormChange}
                  enabledOption={{
                    id: 'true',
                    label: 'True',
                  }}
                  disabledOption={{
                    id: 'false',
                    label: 'False',
                  }}
                  showLabel={true}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
          case 'number': {
            el = (
              <EuiFlexItem key={idx}>
                <NumberField
                  label={camelCaseToTitleString(field.id)}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  showError={true}
                  onFormChange={props.onFormChange}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
          case 'json': {
            el = (
              <EuiFlexItem key={idx}>
                <JsonField
                  label={camelCaseToTitleString(field.id)}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  onFormChange={props.onFormChange}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
          case 'jsonString': {
            el = (
              <EuiFlexItem key={idx}>
                <JsonField
                  validate={false}
                  label={camelCaseToTitleString(field.id)}
                  fieldPath={`${props.baseConfigPath}.${props.configId}.${field.id}`}
                  onFormChange={props.onFormChange}
                />
                <EuiSpacer size={CONFIG_FIELD_SPACER_SIZE} />
              </EuiFlexItem>
            );
            break;
          }
        }
        return el;
      })}
    </EuiFlexItem>
  );
}
