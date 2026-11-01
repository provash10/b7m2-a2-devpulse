import type { Response } from "express";

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  data?: T;
  errors?: unknown;
};

const sendResponse = <T>(res: Response, responseData: TResponse<T>) => {
  // send standard response
  // console.log(responseData);
  const responseBody: Record<string, unknown> = {
    success: responseData.success,
  };

  if (responseData.message !== undefined) {
    responseBody.message = responseData.message;
  }

  if (responseData.data !== undefined) {
    responseBody.data = responseData.data;
  }

  if (responseData.errors !== undefined) {
    responseBody.errors = responseData.errors;
  }

  return res.status(responseData.statusCode).json(responseBody);
};

export default sendResponse;

