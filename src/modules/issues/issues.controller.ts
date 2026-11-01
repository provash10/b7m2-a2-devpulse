import type { Request, Response } from "express";
import { issuesService } from "./issues.service";

const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;

    if (!reporter_id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access! User not identified.",
      });
    }

    if (!title || !description || !type) {
      return res.status(400).json({
        success: false,
        message: "Validation Error: title, description, and type are required.",
      });
    }

    const result = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id,
    });

    return res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error?.message || "Failed to create issue",
      errors: error,
    });
  }
};

export const issuesController = {
  createIssue,
};
