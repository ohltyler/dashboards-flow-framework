/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Field, FieldProps, getIn, useFormikContext } from 'formik';
import { isEmpty } from 'lodash';
import { useSelector } from 'react-redux';
import {
  IProcessorConfig,
  IConfigField,
  PROCESSOR_CONTEXT,
  WorkflowFormValues,
  ModelInterface,
  WorkflowConfig,
  OutputMapEntry,
  TRANSFORM_TYPE,
  NO_TRANSFORMATION,
  getCharacterLimitedString,
  OutputMapFormValue,
  EMPTY_OUTPUT_MAP_ENTRY,
  ExpressionVar,
  ModelOutputFormField,
  OUTPUT_TRANSFORM_OPTIONS,
} from '../../../../../../common';
import { SelectWithCustomOptions, TextField } from '../../input_fields';

import { AppState } from '../../../../../store';
import { parseModelOutputs } from '../../../../../utils';
import {
  EuiCompressedFormRow,
  EuiCompressedSuperSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSmallButton,
  EuiSmallButtonEmpty,
  EuiSmallButtonIcon,
  EuiSuperSelectOption,
  EuiText,
} from '@elastic/eui';
import { ConfigureMultiExpressionModal } from './modals';

interface ModelOutputsProps {
  config: IProcessorConfig;
  baseConfigPath: string;
  uiConfig: WorkflowConfig;
  context: PROCESSOR_CONTEXT;
  isDataFetchingAvailable: boolean;
}

// Spacing between the output field columns
const KEY_FLEX_RATIO = 3;
const TYPE_FLEX_RATIO = 3;
const VALUE_FLEX_RATIO = 4;

/**
 * Base component to configure ML outputs.
 */
export function ModelOutputs(props: ModelOutputsProps) {
  const { models } = useSelector((state: AppState) => state.ml);
  const {
    errors,
    values,
    touched,
    setFieldValue,
    setFieldTouched,
  } = useFormikContext<WorkflowFormValues>();

  // get some current form & config values
  const modelField = props.config.fields.find(
    (field) => field.type === 'model'
  ) as IConfigField;
  const modelFieldPath = `${props.baseConfigPath}.${props.config.id}.${modelField.id}`;
  // Assuming no more than one set of output map entries.
  const outputMapFieldPath = `${props.baseConfigPath}.${props.config.id}.output_map.0`;
  const fullResponsePath = getIn(
    values,
    `${props.baseConfigPath}.${props.config.id}.full_response_path`
  );

  // various modal states
  const [expressionsModalIdx, setExpressionsModalIdx] = useState<
    number | undefined
  >(undefined);

  // model interface state
  const [modelInterface, setModelInterface] = useState<
    ModelInterface | undefined
  >(undefined);

  // on initial load of the models, update model interface states
  useEffect(() => {
    if (!isEmpty(models)) {
      const modelId = getIn(values, modelFieldPath)?.id;
      if (modelId) {
        setModelInterface(models[modelId]?.interface);
      }
    }
  }, [models]);

  // Adding a map entry to the end of the existing arr
  function addMapEntry(curEntries: OutputMapFormValue): void {
    const updatedEntries = [...curEntries, EMPTY_OUTPUT_MAP_ENTRY];
    setFieldValue(outputMapFieldPath, updatedEntries);
    setFieldTouched(outputMapFieldPath, true);
  }

  // Deleting a map entry
  function deleteMapEntry(
    curEntries: OutputMapFormValue,
    entryIndexToDelete: number
  ): void {
    const updatedEntries = [...curEntries];
    updatedEntries.splice(entryIndexToDelete, 1);
    setFieldValue(outputMapFieldPath, updatedEntries);
    setFieldTouched(outputMapFieldPath, true);
  }

  // The options for keys can change. We update what options are available, based
  // on if there is a model interface found, what full_response_path is, and additionally filter out any
  // options that are already being used in the output map, to discourage duplicate keys.
  const [keyOptions, setKeyOptions] = useState<ModelOutputFormField[]>([]);
  useEffect(() => {
    setKeyOptions(parseModelOutputs(modelInterface));
  }, [modelInterface]);
  useEffect(() => {
    if (modelInterface !== undefined && fullResponsePath === false) {
      const modelOutputs = parseModelOutputs(modelInterface);
      if (getIn(values, outputMapFieldPath) !== undefined) {
        const existingKeys = getIn(values, outputMapFieldPath).map(
          (outputMapEntry: OutputMapEntry) => outputMapEntry.key
        ) as string[];
        setKeyOptions(
          modelOutputs.filter(
            (modelOutput) => !existingKeys.includes(modelOutput.label)
          )
        );
      } else {
        setKeyOptions(modelOutputs);
      }
    }
  }, [getIn(values, outputMapFieldPath), modelInterface, fullResponsePath]);

  return (
    <Field name={outputMapFieldPath} key={outputMapFieldPath}>
      {({ field, form }: FieldProps) => {
        const populatedMap = field.value?.length !== 0;
        return (
          <>
            {populatedMap ? (
              <EuiPanel>
                <EuiCompressedFormRow
                  fullWidth={true}
                  key={outputMapFieldPath}
                  error={
                    getIn(errors, field.name) !== undefined &&
                    getIn(errors, field.name).length > 0
                      ? 'Invalid or missing mapping values'
                      : false
                  }
                  isInvalid={
                    getIn(errors, field.name) !== undefined &&
                    getIn(errors, field.name).length > 0 &&
                    getIn(touched, field.name) !== undefined &&
                    getIn(touched, field.name).length > 0
                  }
                >
                  <EuiFlexGroup direction="column">
                    <EuiFlexItem style={{ marginBottom: '0px' }}>
                      <EuiFlexGroup direction="row" gutterSize="xs">
                        <EuiFlexItem grow={KEY_FLEX_RATIO}>
                          <EuiFlexGroup direction="row" gutterSize="xs">
                            <EuiFlexItem grow={false}>
                              <EuiText size="s">{`Model output`}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem grow={TYPE_FLEX_RATIO}>
                          <EuiFlexGroup direction="row" gutterSize="xs">
                            <EuiFlexItem grow={false}>
                              <EuiText size="s">{`Transformation type`}</EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                        <EuiFlexItem grow={VALUE_FLEX_RATIO}>
                          <EuiFlexGroup direction="row" gutterSize="xs">
                            <EuiFlexItem grow={false}>
                              <EuiText size="s">
                                {props.context ===
                                PROCESSOR_CONTEXT.SEARCH_REQUEST
                                  ? 'Query field'
                                  : 'New document field(s)'}
                              </EuiText>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                    {field.value?.map(
                      (mapEntry: OutputMapEntry, idx: number) => {
                        // TODO: can I get this from mapEntry directly
                        const transformType = getIn(
                          values,
                          `${outputMapFieldPath}.${idx}.value.transformType`
                        );
                        return (
                          <EuiFlexItem key={idx}>
                            <EuiFlexGroup direction="row" gutterSize="xs">
                              <EuiFlexItem grow={KEY_FLEX_RATIO}>
                                <EuiFlexGroup direction="row" gutterSize="xs">
                                  <>
                                    <EuiFlexItem>
                                      <>
                                        {/**
                                         * We determine if there is an interface based on if there are key options or not,
                                         * as the options would be derived from the underlying interface.
                                         * And if so, these values should be static.
                                         * So, we only display the static text with no mechanism to change it's value.
                                         * Note we still allow more entries, if a user wants to override / add custom
                                         * keys if there is some gaps in the model interface.
                                         */}
                                        {!isEmpty(keyOptions) &&
                                        !isEmpty(
                                          getIn(
                                            values,
                                            `${outputMapFieldPath}.${idx}.key`
                                          )
                                        ) ? (
                                          <EuiText
                                            size="s"
                                            style={{ marginTop: '4px' }}
                                          >
                                            {getIn(
                                              values,
                                              `${outputMapFieldPath}.${idx}.key`
                                            )}
                                          </EuiText>
                                        ) : !isEmpty(keyOptions) ? (
                                          <SelectWithCustomOptions
                                            fieldPath={`${outputMapFieldPath}.${idx}.key`}
                                            options={keyOptions as any[]}
                                            placeholder={`Name`}
                                            allowCreate={true}
                                          />
                                        ) : (
                                          <TextField
                                            fullWidth={true}
                                            fieldPath={`${outputMapFieldPath}.${idx}.key`}
                                            placeholder={`Name`}
                                            showError={false}
                                          />
                                        )}
                                      </>
                                    </EuiFlexItem>
                                  </>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                              <EuiFlexItem grow={TYPE_FLEX_RATIO}>
                                <EuiFlexItem>
                                  <EuiCompressedSuperSelect
                                    disabled={false}
                                    options={OUTPUT_TRANSFORM_OPTIONS.map(
                                      (option) =>
                                        ({
                                          value: option.id,
                                          inputDisplay: (
                                            <>
                                              <EuiText size="s">
                                                {option.id}
                                              </EuiText>
                                            </>
                                          ),
                                          dropdownDisplay: (
                                            <>
                                              <EuiText size="s">
                                                {option.id}
                                              </EuiText>
                                              <EuiText
                                                size="xs"
                                                color="subdued"
                                              >
                                                {option.description}
                                              </EuiText>
                                            </>
                                          ),
                                          disabled: false,
                                        } as EuiSuperSelectOption<string>)
                                    )}
                                    valueOfSelected={
                                      getIn(
                                        values,
                                        `${outputMapFieldPath}.${idx}.value.transformType`
                                      ) || ''
                                    }
                                    onChange={(option) => {
                                      setFieldValue(
                                        `${outputMapFieldPath}.${idx}.value.transformType`,
                                        option
                                      );
                                      // If the transform type changes, clear any set value and/or nested vars,
                                      // as it will likely not make sense under other types/contexts.
                                      setFieldValue(
                                        `${outputMapFieldPath}.${idx}.value.value`,
                                        ''
                                      );
                                      setFieldValue(
                                        `${outputMapFieldPath}.${idx}.value.nestedVars`,
                                        []
                                      );
                                    }}
                                  />
                                </EuiFlexItem>
                              </EuiFlexItem>
                              <EuiFlexItem grow={VALUE_FLEX_RATIO}>
                                <EuiFlexGroup direction="row" gutterSize="xs">
                                  <>
                                    {/**
                                     * Conditionally render the value form component based on the transform type.
                                     * It may be a button, dropdown, or simply freeform text.
                                     */}
                                    {expressionsModalIdx ===
                                      (idx as number) && (
                                      <ConfigureMultiExpressionModal
                                        config={props.config}
                                        baseConfigPath={props.baseConfigPath}
                                        uiConfig={props.uiConfig}
                                        context={props.context}
                                        fieldPath={`${outputMapFieldPath}.${idx}.value`}
                                        modelInterface={modelInterface}
                                        modelInputFieldName={getIn(
                                          values,
                                          `${outputMapFieldPath}.${idx}.key`
                                        )}
                                        // pass the full output map field path arr
                                        outputMapFieldPath={`${props.baseConfigPath}.${props.config.id}.output_map`}
                                        isDataFetchingAvailable={
                                          props.isDataFetchingAvailable
                                        }
                                        onClose={() =>
                                          setExpressionsModalIdx(undefined)
                                        }
                                      />
                                    )}
                                    <EuiFlexItem>
                                      <>
                                        {transformType ===
                                        TRANSFORM_TYPE.EXPRESSION ? (
                                          <>
                                            {isEmpty(
                                              getIn(
                                                values,
                                                `${outputMapFieldPath}.${idx}.value.nestedVars`
                                              )
                                            ) ? (
                                              <EuiSmallButton
                                                style={{ width: '100px' }}
                                                fill={false}
                                                onClick={() =>
                                                  setExpressionsModalIdx(idx)
                                                }
                                                data-testid="configureExpressionsButton"
                                              >
                                                Configure
                                              </EuiSmallButton>
                                            ) : (
                                              <EuiFlexGroup
                                                direction="row"
                                                justifyContent="spaceAround"
                                              >
                                                <EuiFlexItem>
                                                  <EuiText
                                                    size="s"
                                                    color="subdued"
                                                    style={{
                                                      marginTop: '4px',
                                                      whiteSpace: 'pre-wrap',
                                                    }}
                                                  >
                                                    {(getIn(
                                                      values,
                                                      `${outputMapFieldPath}.${idx}.value.nestedVars`
                                                    ) as ExpressionVar[]).map(
                                                      (
                                                        expression,
                                                        idx,
                                                        arr
                                                      ) => {
                                                        return idx < 2
                                                          ? `${getCharacterLimitedString(
                                                              expression.transform ||
                                                                '',
                                                              15
                                                            )}${
                                                              idx === 0 &&
                                                              arr.length > 1
                                                                ? `,\n`
                                                                : ''
                                                            }`
                                                          : '';
                                                      }
                                                    )}
                                                  </EuiText>
                                                </EuiFlexItem>
                                                <EuiFlexItem grow={false}>
                                                  <EuiSmallButtonIcon
                                                    aria-label="edit"
                                                    iconType="pencil"
                                                    disabled={false}
                                                    color={'primary'}
                                                    onClick={() => {
                                                      setExpressionsModalIdx(
                                                        idx
                                                      );
                                                    }}
                                                  />
                                                </EuiFlexItem>
                                              </EuiFlexGroup>
                                            )}
                                          </>
                                        ) : transformType ===
                                          TRANSFORM_TYPE.FIELD ? (
                                          <TextField
                                            fullWidth={true}
                                            fieldPath={`${outputMapFieldPath}.${idx}.value.value`}
                                            placeholder={
                                              props.context ===
                                              PROCESSOR_CONTEXT.SEARCH_REQUEST
                                                ? 'Specify a query field'
                                                : 'Define a document field'
                                            }
                                            showError={false}
                                          />
                                        ) : transformType ===
                                          NO_TRANSFORMATION ? (
                                          <EuiText>-</EuiText>
                                        ) : undefined}
                                      </>
                                    </EuiFlexItem>
                                    <EuiFlexItem grow={false}>
                                      <EuiSmallButtonIcon
                                        iconType={'trash'}
                                        color="danger"
                                        aria-label="Delete"
                                        onClick={() => {
                                          deleteMapEntry(field.value, idx);
                                        }}
                                      />
                                    </EuiFlexItem>
                                  </>
                                </EuiFlexGroup>
                              </EuiFlexItem>
                            </EuiFlexGroup>
                          </EuiFlexItem>
                        );
                      }
                    )}
                    <EuiFlexItem grow={false}>
                      <div>
                        <EuiSmallButtonEmpty
                          style={{ marginLeft: '-8px', marginTop: '0px' }}
                          iconType={'plusInCircle'}
                          iconSide="left"
                          onClick={() => {
                            addMapEntry(field.value);
                          }}
                        >
                          {`Add output`}
                        </EuiSmallButtonEmpty>
                      </div>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiCompressedFormRow>
              </EuiPanel>
            ) : (
              <EuiSmallButton
                style={{ width: '100px' }}
                onClick={() => {
                  setFieldValue(field.name, [EMPTY_OUTPUT_MAP_ENTRY]);
                }}
              >
                {'Configure'}
              </EuiSmallButton>
            )}
          </>
        );
      }}
    </Field>
  );
}
