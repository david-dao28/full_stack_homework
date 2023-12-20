// types.ts

export interface Customer {
  customer_name: string;
  parts: Part[];
}

export interface Part {
  part_name: string;
  part_revisions: PartRevision[];
}

export interface PartRevision {
  part_revision_name: string;
  trials: Trial[];
}

export interface Trial {
  trial_uuid: string;
  trial_status: number | null;
  process_runs: ProcessRun[];
}

export interface ProcessRun {
  run_type: string;
  files: File[];
}

export interface File {
  location: string;
  type: string;
}
