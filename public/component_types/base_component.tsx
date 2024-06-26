/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  COMPONENT_CLASS,
  IComponent,
  IComponentInput,
  IComponentOutput,
} from '../../common';

/**
 * A base UI drag-and-drop component class.
 */
export abstract class BaseComponent implements IComponent {
  type: COMPONENT_CLASS;
  label: string;
  description: string;
  inputs?: IComponentInput[];
  outputs?: IComponentOutput[];

  // No-op constructor. If there are general / defaults for field values, add in here.
  constructor() {
    this.inputs = [];
    this.outputs = [];
  }

  // Persist a standard toObj() fn that all component classes can use. This is necessary
  // so we have standard JS Object when serializing comoponent state in redux.
  toObj() {
    return Object.assign({}, this);
  }

  // Helper fn to strip all fields for a component if we want to view it in the UI
  // but not have it tied to any form/inputs. Example: showing an Index component in search,
  // even if it is provisioned in ingest.
  toPlaceholderObj() {
    return {
      ...Object.assign({}, this),
      createFields: [],
      fields: [],
    };
  }
}
