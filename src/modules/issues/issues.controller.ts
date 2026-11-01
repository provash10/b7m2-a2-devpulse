import type { Request, Response } from "express";
import { issuesService } from "./issues.service";
import type { IssueStatus, IssueType } from "./issues.interface";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: Request, res: Response) => {
  try {
    // get request body and user
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;
    // console.log(reporter_id);

    // check reporter id exists
    if (!reporter_id) {
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // validate required fields
    if (!title || !description || !type) {
      return sendResponse(res, {
        statusCode: 400,
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

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
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

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
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
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
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
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // find issue from db
    const issue = await issuesService.getIssueByIdFromDB(id as string);
    // console.log(issue);

    // check if issue exists
    if (!issue) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    // check role permissions
    if (user.role === "contributor") {
      // contributor can only update own issue
      if (issue.reporter_id !== user.id) {
        return sendResponse(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden! You can only update your own issues.",
        });
      }

      // contributor can only update open status issue
      if (issue.status !== "open") {
        return sendResponse(res, {
          statusCode: 409,
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

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
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
      return sendResponse(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    // maintainer only check
    if (user.role !== "maintainer") {
      return sendResponse(res, {
        statusCode: 403,
        success: false,
        message: "Forbidden! Only maintainer can delete issues.",
      });
    }

    // delete issue from db
    const result = await issuesService.deleteIssueFromDB(id as string);
    // console.log(result.rowCount);

    // check if issue existed
    if (result.rowCount === 0) {
      return sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
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
