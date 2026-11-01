import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const registerUser = async (req: Request, res: Response) => {
  try {
    // register user into database
    // console.log(req.body);
    const result = await authService.registerUserIntoDB(req.body);
    // console.log(result.rows[0]);

    return sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const loginUser = async (req: Request, res: Response) => {
  try {
    // login user with credentials
    // console.log(req.body);
    const result = await authService.loginUserIntoDB(req.body);
    // console.log(result);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

const getAllUser = async (req: Request, res: Response) => {
  try {
    // fetch all registered users
    const result = await authService.getAllUsersFromDB();
    // console.log(result.rows);

    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All Users Received Successfully",
      data: result.rows,
    });
  } catch (error: any) {
    // console.log(error);
    return sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error,
    });
  }
};

export const authController = {
  registerUser,
  loginUser,
  getAllUser,
};
