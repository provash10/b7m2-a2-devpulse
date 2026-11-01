import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IssueStatus, IssueType } from "./issues.interface";

const createIssue = async (req: Request, res: Response) => {
  try {
    // get request body and user
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;
    // console.log(reporter_id);

    // check reporter id exists
    if (!reporter_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // validate required fields
    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: title, description, and type are required.",
      });
    }

    // save issue into db
    const result = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id,
    });
    // console.log(result);

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create issue",
      errors: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    // get query parameters
    const { sort, type, status } = req.query;
    // console.log(req.query);

    // fetch all issues with filter
    const result = await issuesService.getAllIssuesFromDB({
      sort: sort as "newest" | "oldest" | undefined,
      type: type as IssueType | undefined,
      status: status as IssueStatus | undefined,
    });
    // console.log(result);

    return res.status(200).json({
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve issues",
      errors: error,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    // get issue id from params
    const { id } = req.params;
    // console.log(id);

    // fetch single issue from db
    const result = await issuesService.getSingleIssueFromDB(id as string);
    // console.log(result);

    // check if issue exists
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to retrieve issue",
      errors: error,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
};
