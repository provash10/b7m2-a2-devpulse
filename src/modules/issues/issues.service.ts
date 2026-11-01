import { pool } from "../../db";
import type { ICreateIssuePayload } from "./issues.interface";

const createIssueIntoDB = async (payload: ICreateIssuePayload) => {
  const { title, description, type, reporter_id } = payload;

  // Validate reporter_id in application logic (requirement constraint)
  const userCheck = await pool.query(
    `SELECT id FROM users WHERE id = $1`,
    [reporter_id]
  );

  if (userCheck.rows.length === 0) {
    throw new Error("User does not exist");
  }

  const result = await pool.query(
    `
    INSERT INTO issues (title, description, type, reporter_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [title, description, type, reporter_id]
  );

  return result.rows[0];
};

export const issuesService = {
  createIssueIntoDB,
};
