// user roles definition
export const role = ["contributor", "maintainer"] as const;
export type Role = (typeof role)[number];

export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

// user type
export type User = {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: Role;
  created_at: Date;
  updated_at: Date;
};

// issue types
export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";

export type Issue = {
  id: number;
  title: string;
  description: string;
  type: IssueType;
  status: IssueStatus;
  reporter_id: number;
  created_at: Date;
  updated_at: Date;
};

