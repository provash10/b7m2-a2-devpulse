import { pool } from "../../db";
import type {
  ICreateIssuePayload,
  IIssueQueryFilter,
  IUpdateIssuePayload,
} from "./issues.interface";

const createIssueIntoDB = async (payload: ICreateIssuePayload) => {
  // get payload data
  // console.log(payload);
  const { title, description, type, reporter_id } = payload;

  // check if user exists
  const userCheck = await pool.query(
    `SELECT id FROM users WHERE id = $1`,
    [reporter_id]
  );
  // console.log(userCheck);

  if (userCheck.rows.length === 0) {
    throw new Error("User does not exist");
  }

  // insert new issue
  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );
  // console.log(result.rows[0]);

  return result.rows[0];
};

const getAllIssuesFromDB = async (filters: IIssueQueryFilter) => {
  // get query filters
  // console.log(filters);
  const { sort = "newest", type, status } = filters;

  const conditions: string[] = [];
  const values: unknown[] = [];

  // filter by type
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }

  // filter by status
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }

  // make where clause and sort order
  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortOrder = sort === "oldest" ? "ASC" : "DESC";

  // query issues from db
  const query = `SELECT * FROM issues ${whereClause} ORDER BY created_at ${sortOrder}`;
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  // console.log(issues);

  if (issues.length === 0) {
    return [];
  }

  // extract reporter ids
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  // console.log(reporterIds);

  // fetch reporters without join
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  // console.log(usersResult.rows);

  // map user data
  const userMap = new Map<number, { id: number; name: string; role: string }>();
  usersResult.rows.forEach((user) => {
    userMap.set(user.id, {
      id: user.id,
      name: user.name,
      role: user.role,
    });
  });
  // console.log(userMap);

  // attach reporter to each issue
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));
};

const getSingleIssueFromDB = async (id: string) => {
  // query single issue by id
  // console.log(id);
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  // console.log(issueResult.rows);

  if (issueResult.rows.length === 0) {
    return null;
  }

  const issue = issueResult.rows[0];
  // console.log(issue);

  // fetch reporter without join
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  // console.log(userResult.rows[0]);

  const reporter = userResult.rows[0] || null;

  // return issue with reporter data
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

const getIssueByIdFromDB = async (id: string) => {
  // query issue row by id
  // console.log(id);
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  // console.log(result.rows[0]);
  return result.rows[0] || null;
};

const updateSingleIssueIntoDB = async (
  id: string,
  payload: IUpdateIssuePayload
) => {
  // get update payload data
  // console.log(payload);
  const { title, description, type, status } = payload;

  // update issue in db
  const result = await pool.query(
    `
    UPDATE issues
    SET 
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      status = COALESCE($4, status),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [title, description, type, status, id]
  );
  // console.log(result.rows[0]);

  return result.rows[0];
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  getIssueByIdFromDB,
  updateSingleIssueIntoDB,
};
