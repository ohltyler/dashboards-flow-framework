/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MLIngestProcessor } from '../../../configs';
import {
  USE_CASE,
  WorkflowTemplate,
  START_FROM_SCRATCH_WORKFLOW_NAME,
  DEFAULT_NEW_WORKFLOW_NAME,
  UIState,
  PROCESSOR_TYPE,
  COMPONENT_CLASS,
  COMPONENT_CATEGORY,
  NODE_CATEGORY,
  ReactFlowComponent,
  ReactFlowEdge,
  WorkspaceFlowState,
  IProcessorConfig,
  WORKFLOW_TYPE,
} from '../../../../common';
import { generateId, initComponentData } from '../../../utils';
import { MarkerType } from 'reactflow';
import {
  Document,
  KnnIndexer,
  NeuralQuery,
  TextEmbeddingTransformer,
} from '../../../component_types';

// Fn to produce the complete preset template with all necessary UI metadata.
export function enrichPresetWorkflowWithUiMetadata(
  presetWorkflow: Partial<WorkflowTemplate>
): WorkflowTemplate {
  let uiMetadata = {} as UIState;
  switch (presetWorkflow.ui_metadata?.type || WORKFLOW_TYPE.CUSTOM) {
    case WORKFLOW_TYPE.SEMANTIC_SEARCH: {
      uiMetadata = fetchSemanticSearchMetadata();
      break;
    }
    // TODO: add more presets
    default: {
      uiMetadata = fetchEmptyMetadata();
      break;
    }
  }

  return {
    ...presetWorkflow,
    ui_metadata: {
      ...presetWorkflow.ui_metadata,
      ...uiMetadata,
    },
  } as WorkflowTemplate;
}

function fetchEmptyMetadata(): UIState {
  return {
    type: WORKFLOW_TYPE.CUSTOM,
    config: {
      ingest: {
        enabled: true,
        source: {},
        enrich: {
          processors: [],
        },
        index: {
          name: {
            id: 'indexName',
            type: 'string',
            label: 'Index name',
          },
          mappings: {
            id: 'indexMappings',
            type: 'json',
            label: 'Index mappings',
          },
          settings: {
            id: 'indexSettings',
            type: 'json',
            label: 'Index settings',
          },
        },
      },
      search: {
        request: {},
        enrichRequest: {
          processors: [],
        },
        enrichResponse: {
          processors: [],
        },
      },
    },
    workspace_flow: {
      nodes: [],
      edges: [],
    },
  };
}

function fetchSemanticSearchMetadata(): UIState {
  // We can reuse the base state. Only need to override a few things,
  // such as preset ingest processors.
  let baseState = fetchEmptyMetadata();
  baseState.type = WORKFLOW_TYPE.SEMANTIC_SEARCH;
  baseState.config.ingest.enrich.processors = [new MLIngestProcessor().toObj()];
  return baseState;
}

// function fetchSemanticSearchWorkspaceFlow(): WorkspaceFlowState {
//   const ingestId0 = generateId(COMPONENT_CLASS.DOCUMENT);
//   const ingestId1 = generateId(COMPONENT_CLASS.TEXT_EMBEDDING_TRANSFORMER);
//   const ingestId2 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const ingestGroupId = generateId(COMPONENT_CATEGORY.INGEST);
//   const searchGroupId = generateId(COMPONENT_CATEGORY.SEARCH);
//   const searchId0 = generateId(COMPONENT_CLASS.NEURAL_QUERY);
//   const searchId1 = generateId(COMPONENT_CLASS.SPARSE_ENCODER_TRANSFORMER);
//   const searchId2 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const edgeId0 = generateId('edge');
//   const edgeId1 = generateId('edge');
//   const edgeId2 = generateId('edge');
//   const edgeId3 = generateId('edge');

//   const ingestNodes = [
//     {
//       id: ingestGroupId,
//       position: { x: 400, y: 400 },
//       type: NODE_CATEGORY.INGEST_GROUP,
//       data: { label: COMPONENT_CATEGORY.INGEST },
//       style: {
//         width: 1300,
//         height: 400,
//       },
//       className: 'reactflow__group-node__ingest',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new Document().toObj(), ingestId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId1,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new TextEmbeddingTransformer().toObj(),
//         ingestId1
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId2,
//       position: { x: 900, y: 70 },
//       data: initComponentData(new KnnIndexer().toObj(), ingestId2),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];
//   const searchNodes = [
//     {
//       id: searchGroupId,
//       position: { x: 400, y: 1000 },
//       type: NODE_CATEGORY.SEARCH_GROUP,
//       data: { label: COMPONENT_CATEGORY.SEARCH },
//       style: {
//         width: 1300,
//         height: 400,
//       },
//       className: 'reactflow__group-node__search',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new NeuralQuery().toObj(), searchId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId1,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new TextEmbeddingTransformer().toPlaceholderObj(),
//         searchId1
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId2,
//       position: { x: 900, y: 70 },
//       data: initComponentData(new KnnIndexer().toPlaceholderObj(), searchId2),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];

//   return {
//     nodes: [...ingestNodes, ...searchNodes],
//     edges: [
//       {
//         id: edgeId0,
//         key: edgeId0,
//         source: ingestId0,
//         target: ingestId1,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId1,
//         key: edgeId1,
//         source: ingestId1,
//         target: ingestId2,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId2,
//         key: edgeId2,
//         source: searchId0,
//         target: searchId1,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId3,
//         key: edgeId3,
//         source: searchId1,
//         target: searchId2,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//     ] as ReactFlowEdge[],
//   };
// }

// function fetchNeuralSparseSearchWorkspaceFlow(): WorkspaceFlowState {
//   const ingestId0 = generateId(COMPONENT_CLASS.DOCUMENT);
//   const ingestId1 = generateId(COMPONENT_CLASS.SPARSE_ENCODER_TRANSFORMER);
//   const ingestId2 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const ingestGroupId = generateId(COMPONENT_CATEGORY.INGEST);
//   const searchGroupId = generateId(COMPONENT_CATEGORY.SEARCH);
//   const searchId0 = generateId(COMPONENT_CLASS.NEURAL_QUERY);
//   const searchId1 = generateId(COMPONENT_CLASS.SPARSE_ENCODER_TRANSFORMER);
//   const searchId2 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const edgeId0 = generateId('edge');
//   const edgeId1 = generateId('edge');
//   const edgeId2 = generateId('edge');
//   const edgeId3 = generateId('edge');

//   const ingestNodes = [
//     {
//       id: ingestGroupId,
//       position: { x: 400, y: 400 },
//       type: NODE_CATEGORY.INGEST_GROUP,
//       data: { label: COMPONENT_CATEGORY.INGEST },
//       style: {
//         width: 1300,
//         height: 400,
//       },
//       className: 'reactflow__group-node__ingest',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new Document().toObj(), ingestId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId1,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new SparseEncoderTransformer().toObj(),
//         ingestId1
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId2,
//       position: { x: 900, y: 70 },
//       data: initComponentData(new KnnIndexer().toObj(), ingestId2),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];

//   const searchNodes = [
//     {
//       id: searchGroupId,
//       position: { x: 400, y: 1000 },
//       type: NODE_CATEGORY.SEARCH_GROUP,
//       data: { label: COMPONENT_CATEGORY.SEARCH },
//       style: {
//         width: 1300,
//         height: 400,
//       },
//       className: 'reactflow__group-node__search',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new NeuralQuery().toObj(), searchId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId1,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new SparseEncoderTransformer().toPlaceholderObj(),
//         searchId1
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId2,
//       position: { x: 900, y: 70 },
//       data: initComponentData(new KnnIndexer().toPlaceholderObj(), searchId2),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];

//   return {
//     nodes: [...ingestNodes, ...searchNodes],
//     edges: [
//       {
//         id: edgeId0,
//         key: edgeId0,
//         source: ingestId0,
//         target: ingestId1,
//         sourceClasses: ingestNodes.find((node) => node.id === ingestId0)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === ingestId1)?.data
//           .baseClasses,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId1,
//         key: edgeId1,
//         source: ingestId1,
//         target: ingestId2,
//         sourceClasses: ingestNodes.find((node) => node.id === ingestId1)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === ingestId2)?.data
//           .baseClasses,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId2,
//         key: edgeId2,
//         source: searchId0,
//         target: searchId1,
//         sourceClasses: ingestNodes.find((node) => node.id === searchId0)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === searchId1)?.data
//           .baseClasses,
//         sourceHandle: COMPONENT_CLASS.QUERY,
//         targetHandle: COMPONENT_CLASS.QUERY,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId3,
//         key: edgeId3,
//         source: searchId1,
//         target: searchId2,
//         sourceClasses: ingestNodes.find((node) => node.id === searchId1)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === searchId2)?.data
//           .baseClasses,
//         sourceHandle: COMPONENT_CLASS.QUERY,
//         targetHandle: COMPONENT_CLASS.QUERY,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//     ] as ReactFlowEdge[],
//   };
// }

// function fetchHybridSearchWorkspaceFlow(): WorkspaceFlowState {
//   const ingestId0 = generateId(COMPONENT_CLASS.DOCUMENT);
//   const ingestId1 = generateId(COMPONENT_CLASS.TEXT_EMBEDDING_TRANSFORMER);
//   const ingestId2 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const ingestGroupId = generateId(COMPONENT_CATEGORY.INGEST);
//   const searchGroupId = generateId(COMPONENT_CATEGORY.SEARCH);
//   const searchId0 = generateId(COMPONENT_CLASS.MATCH_QUERY);
//   const searchId1 = generateId(COMPONENT_CLASS.NEURAL_QUERY);
//   const searchId2 = generateId(COMPONENT_CLASS.TEXT_EMBEDDING_TRANSFORMER);
//   const searchId3 = generateId(COMPONENT_CLASS.KNN_INDEXER);
//   const searchId4 = generateId(COMPONENT_CLASS.NORMALIZATION_TRANSFORMER);
//   const edgeId0 = generateId('edge');
//   const edgeId1 = generateId('edge');
//   const edgeId2 = generateId('edge');
//   const edgeId3 = generateId('edge');
//   const edgeId4 = generateId('edge');
//   const edgeId5 = generateId('edge');

//   const ingestNodes = [
//     {
//       id: ingestGroupId,
//       position: { x: 400, y: 400 },
//       type: NODE_CATEGORY.INGEST_GROUP,
//       data: { label: COMPONENT_CATEGORY.INGEST },
//       style: {
//         width: 1300,
//         height: 400,
//       },
//       className: 'reactflow__group-node__ingest',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new Document().toObj(), ingestId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId1,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new TextEmbeddingTransformer().toObj(),
//         ingestId1
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: ingestId2,
//       position: { x: 900, y: 70 },
//       data: initComponentData(new KnnIndexer().toObj(), ingestId2),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: ingestGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];

//   const searchNodes = [
//     {
//       id: searchGroupId,
//       position: { x: 400, y: 1000 },
//       type: NODE_CATEGORY.SEARCH_GROUP,
//       data: { label: COMPONENT_CATEGORY.SEARCH },
//       style: {
//         width: 1700,
//         height: 600,
//       },
//       className: 'reactflow__group-node__search',
//       selectable: true,
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId0,
//       position: { x: 100, y: 70 },
//       data: initComponentData(new NeuralQuery().toObj(), searchId0),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId1,
//       position: { x: 100, y: 370 },
//       data: initComponentData(new MatchQuery().toObj(), searchId1),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId2,
//       position: { x: 500, y: 70 },
//       data: initComponentData(
//         new TextEmbeddingTransformer().toPlaceholderObj(),
//         searchId2
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId3,
//       position: { x: 900, y: 200 },
//       data: initComponentData(new KnnIndexer().toPlaceholderObj(), searchId3),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//     {
//       id: searchId4,
//       position: { x: 1300, y: 200 },
//       data: initComponentData(
//         new NormalizationTransformer().toObj(),
//         searchId4
//       ),
//       type: NODE_CATEGORY.CUSTOM,
//       parentNode: searchGroupId,
//       extent: 'parent',
//       draggable: true,
//       deletable: false,
//     },
//   ] as ReactFlowComponent[];

//   return {
//     nodes: [...ingestNodes, ...searchNodes],
//     edges: [
//       {
//         id: edgeId0,
//         key: edgeId0,
//         source: ingestId0,
//         target: ingestId1,
//         sourceClasses: ingestNodes.find((node) => node.id === ingestId0)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === ingestId1)?.data
//           .baseClasses,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId1,
//         key: edgeId1,
//         source: ingestId1,
//         target: ingestId2,
//         sourceClasses: ingestNodes.find((node) => node.id === ingestId1)?.data
//           .baseClasses,
//         targetClasses: ingestNodes.find((node) => node.id === ingestId2)?.data
//           .baseClasses,
//         targetHandle: COMPONENT_CLASS.DOCUMENT,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId2,
//         key: edgeId2,
//         source: searchId0,
//         target: searchId2,
//         sourceClasses: searchNodes.find((node) => node.id === searchId0)?.data
//           .baseClasses,
//         targetClasses: searchNodes.find((node) => node.id === searchId2)?.data
//           .baseClasses,
//         targetHandle: COMPONENT_CLASS.QUERY,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId3,
//         key: edgeId3,
//         source: searchId2,
//         target: searchId3,
//         sourceClasses: searchNodes.find((node) => node.id === searchId2)?.data
//           .baseClasses,
//         targetClasses: searchNodes.find((node) => node.id === searchId3)?.data
//           .baseClasses,
//         sourceHandle: COMPONENT_CLASS.QUERY,
//         targetHandle: COMPONENT_CLASS.QUERY,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId4,
//         key: edgeId4,
//         source: searchId1,
//         target: searchId3,
//         sourceClasses: searchNodes.find((node) => node.id === searchId1)?.data
//           .baseClasses,
//         targetClasses: searchNodes.find((node) => node.id === searchId3)?.data
//           .baseClasses,
//         targetHandle: COMPONENT_CLASS.QUERY,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//       {
//         id: edgeId5,
//         key: edgeId5,
//         source: searchId3,
//         target: searchId4,
//         sourceClasses: searchNodes.find((node) => node.id === searchId3)?.data
//           .baseClasses,
//         targetClasses: searchNodes.find((node) => node.id === searchId4)?.data
//           .baseClasses,
//         targetHandle: COMPONENT_CLASS.RESULTS,
//         markerEnd: {
//           type: MarkerType.ArrowClosed,
//           width: 20,
//           height: 20,
//         },
//         zIndex: 2,
//         deletable: false,
//       },
//     ] as ReactFlowEdge[],
//   };
// }

// Utility fn to process workflow names from their presentable/readable titles
// on the UI, to a valid name format.
// This leads to less friction if users decide to save the name later on.
export function processWorkflowName(workflowName: string): string {
  return workflowName === START_FROM_SCRATCH_WORKFLOW_NAME
    ? DEFAULT_NEW_WORKFLOW_NAME
    : toSnakeCase(workflowName);
}

function toSnakeCase(text: string): string {
  return text
    .replace(/\W+/g, ' ')
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join('_');
}
