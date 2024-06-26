/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { COMPONENT_CLASS } from '../../../common';
import { ResultsTransformer } from './results_transformer';

/**
 * A normalization results transformer UI component
 */
export class NormalizationTransformer extends ResultsTransformer {
  constructor() {
    super();
    (this.type = COMPONENT_CLASS.NORMALIZATION_TRANSFORMER),
      (this.label = 'Normalization Transformer');
    this.description = 'A transformer to normalize search results';
  }
}
