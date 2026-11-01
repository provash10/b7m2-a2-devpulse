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

const updateIssue = async (req: Request, res: Response) => {
  try {
    // get issue id and user
    const { id } = req.params;
    const user = req.user;
    // console.log(id);
    // console.log(user);

    // check if user authenticated
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // find issue from db
    const issue = await issuesService.getIssueByIdFromDB(id as string);
    // console.log(issue);

    // check if issue exists
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // check role permissions
    if (user.role === "contributor") {
      // contributor can only update own issue
      if (issue.reporter_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden! You can only update your own issues.",
        });
      }

      // contributor can only update open status issue
      if (issue.status !== "open") {
        return res.status(409).json({
          success: false,
          message: "Conflict! Cannot update issue that is not in open status.",
        });
      }
    }

    // update issue data
    const { title, description, type, status } = req.body;
    // console.log(req.body);

    const updatedIssue = await issuesService.updateSingleIssueIntoDB(
      id as string,
      {
        title,
        description,
        type,
        status,
      }
    );
    // console.log(updatedIssue);

    return res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
  } catch (error: any) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to update issue",
      errors: error,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    // get issue id and user
    const { id } = req.params;
    const user = req.user;
    // console.log(id);
    // console.log(user);

    // check if user authenticated
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // maintainer only check
    if (user.role !== "maintainer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden! Only maintainer can delete issues.",
      });
    }

    // delete issue from db
    const result = await issuesService.deleteIssueFromDB(id as string);
    // console.log(result.rowCount);

    // check if issue existed
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    // console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to delete issue",
      errors: error,
    });
  }
};

export const issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
