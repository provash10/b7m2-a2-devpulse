export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface IIssue {
  id?: number;
  title: string;
  description: string;
  type: IssueType;
  status?: IssueStatus;
  reporter_id: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: IssueType;
  reporter_id: number;
}

export interface IUpdateIssuePayload {
  title?: string | undefined;
  description?: string | undefined;
  type?: IssueType | undefined;
  status?: IssueStatus | undefined;
}

export interface IIssueQueryFilter {
  sort?: "newest" | "oldest" | undefined;
  type?: IssueType | undefined;
  status?: IssueStatus | undefined;
}
