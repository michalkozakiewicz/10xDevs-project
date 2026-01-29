import type { BucketValue, CardDTO } from "@/types";

// ============================================================================
// Tab State
// ============================================================================

/**
 * Tab value for session view tabs (Estimation / Summary)
 */
export type TabValue = "estimation" | "summary";

// ============================================================================
// Bucket Configuration
// ============================================================================

/**
 * Configuration for a single bucket in the estimation board
 */
export interface BucketConfig {
  value: BucketValue;
  label: string;
  colorClass: string; // Tailwind classes for gradient and border
}

/**
 * Predefined bucket configurations for all 8 buckets
 */
export const BUCKET_CONFIGS: BucketConfig[] = [
  {
    value: null,
    label: "?",
    colorClass: "bg-gray-50 border-2 border-dashed border-gray-300",
  },
  {
    value: 1,
    label: "1",
    colorClass: "bg-green-50 border-green-200",
  },
  {
    value: 2,
    label: "2",
    colorClass: "bg-green-100 border-green-300",
  },
  {
    value: 3,
    label: "3",
    colorClass: "bg-yellow-50 border-yellow-200",
  },
  {
    value: 5,
    label: "5",
    colorClass: "bg-yellow-100 border-yellow-300",
  },
  {
    value: 8,
    label: "8",
    colorClass: "bg-orange-50 border-orange-200",
  },
  {
    value: 13,
    label: "13",
    colorClass: "bg-orange-100 border-orange-300",
  },
  {
    value: 21,
    label: "21",
    colorClass: "bg-red-50 border-red-200",
  },
];

// ============================================================================
// Cards Grouping
// ============================================================================

/**
 * Map of cards grouped by bucket_value
 * Key is bucket_value as string (e.g., "5", "null")
 */
export type CardsByBucket = {
  [key: string]: CardDTO[];
};

// ============================================================================
// Modal State
// ============================================================================

/**
 * State for managing all modals in the session view
 */
export interface ModalState {
  addTask: boolean;
  importCsv: boolean;
  aiEstimate: boolean;
  taskDetail: boolean;
  selectedCard: CardDTO | null;
}

// ============================================================================
// DnD Types (from dnd-kit)
// ============================================================================

/**
 * Drag end event from dnd-kit
 */
export interface DragEndEvent {
  active: {
    id: string; // card id
  };
  over: {
    id: string; // bucket value as string
  } | null;
}

/**
 * Drag start event from dnd-kit
 */
export interface DragStartEvent {
  active: {
    id: string; // card id
  };
}

// ============================================================================
// CSV Import Types
// ============================================================================

/**
 * Parsed CSV row for import preview
 */
export interface CsvRow {
  id: string;
  title: string;
  description?: string;
}

// ============================================================================
// Form Data Types (react-hook-form)
// ============================================================================

/**
 * Form data for adding a new task
 */
export interface AddTaskFormData {
  external_id: string;
  title: string;
  description: string;
}

/**
 * Form data for AI estimation
 */
export interface AiEstimateFormData {
  context: string;
  confirm_override: boolean;
}
