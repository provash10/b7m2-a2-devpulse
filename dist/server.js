
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express from "express";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(50),
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'contributor'
      CHECK(role IN ('contributor','maintainer')),
      is_active BOOLEAN  DEFAULT true,
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    await pool.query(`
            CREATE TABLE IF NOT EXISTS issues (
            id SERIAL PRIMARY KEY, 
            title VARCHAR(150) UNIQUE NOT NULL,
            description TEXT NOT NULL CHECK (LENGTH(description) >= 20),
            type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
            status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
            reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,

            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )
            `);
    console.log("Database Connected Successfully !!!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) 
    VALUES($1, $2, $3, COALESCE($4, 'contributor')) 
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials !!");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Password does not match!");
  }
  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  const token = jwt.sign(jwtpayload, config_default.secret, {
    expiresIn: "1d"
  });
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var getAllUsersFromDB = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at FROM users
  `);
  return result;
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB,
  getAllUsersFromDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, responseData) => {
  const responseBody = {
    success: responseData.success
  };
  if (responseData.message !== void 0) {
    responseBody.message = responseData.message;
  }
  if (responseData.data !== void 0) {
    responseBody.data = responseData.data;
  }
  if (responseData.errors !== void 0) {
    responseBody.errors = responseData.errors;
  }
  return res.status(responseData.statusCode).json(responseBody);
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error
    });
  }
};
var getAllUser = async (req, res) => {
  try {
    const result = await authService.getAllUsersFromDB();
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "All Users Received Successfully",
      data: result.rows
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      errors: error
    });
  }
};
var authController = {
  registerUser,
  loginUser,
  getAllUser
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      let jwt_token = req.headers.authorization;
      if (!jwt_token) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access !!!"
        });
      }
      if (jwt_token.startsWith("Bearer ")) {
        jwt_token = jwt_token.split(" ")[1];
      }
      const decoded = jwt2.verify(
        jwt_token,
        config_default.secret
      );
      const userData = await pool.query(
        `
            SELECT * FROM users WHERE email=$1
            `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found in database !"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden!!; This role have no access !"
        });
      }
      if (user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: "Forbidden ! Account is inactive."
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      console.log("Auth Error:", error?.message || error);
      return res.status(401).json({
        success: false,
        message: "Unauthorized Access !! Invalid token.",
        error: error?.message
      });
    }
  };
};
var auth_default = auth;

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
router.get("/users", auth_default(), authController.getAllUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
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
var getAllIssuesFromDB = async (filters) => {
  const { sort = "newest", type, status } = filters;
  const conditions = [];
  const values = [];
  if (type) {
    values.push(type);
    conditions.push(`type = $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const sortOrder = sort === "oldest" ? "ASC" : "DESC";
  const query = `SELECT * FROM issues ${whereClause} ORDER BY created_at ${sortOrder}`;
  const issuesResult = await pool.query(query, values);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((i) => i.reporter_id))];
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [reporterIds]
  );
  const userMap = /* @__PURE__ */ new Map();
  usersResult.rows.forEach((user) => {
    userMap.set(user.id, {
      id: user.id,
      name: user.name,
      role: user.role
    });
  });
  return issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(
    `SELECT * FROM issues WHERE id = $1`,
    [id]
  );
  if (issueResult.rows.length === 0) {
    return null;
  }
  const issue = issueResult.rows[0];
  const userResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = userResult.rows[0] || null;
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var getIssueByIdFromDB = async (id) => {
  const result = await pool.query(`SELECT * FROM issues WHERE id = $1`, [id]);
  return result.rows[0] || null;
};
var updateSingleIssueIntoDB = async (id, payload) => {
  const { title, description, type, status } = payload;
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
  return result.rows[0];
};
var deleteIssueFromDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING *`,
    [id]
  );
  return result;
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  getIssueByIdFromDB,
  updateSingleIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user?.id;
    if (!reporter_id) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified."
      });
    }
    if (!title || !description || !type) {
      return sendResponse_default(res, {
        statusCode: 400,
        success: false,
        message: "Validation Error: title, description, and type are required."
      });
    }
    const result = await issuesService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id
    });
    return sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to create issue",
      errors: error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const result = await issuesService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to retrieve issues",
      errors: error
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issuesService.getSingleIssueFromDB(id);
    if (!result) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrived successfully",
      data: result
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to retrieve issue",
      errors: error
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified."
      });
    }
    const issue = await issuesService.getIssueByIdFromDB(id);
    if (!issue) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    if (user.role === "contributor") {
      if (issue.reporter_id !== user.id) {
        return sendResponse_default(res, {
          statusCode: 403,
          success: false,
          message: "Forbidden! You can only update your own issues."
        });
      }
      if (issue.status !== "open") {
        return sendResponse_default(res, {
          statusCode: 409,
          success: false,
          message: "Conflict! Cannot update issue that is not in open status."
        });
      }
    }
    const { title, description, type, status } = req.body;
    const updatedIssue = await issuesService.updateSingleIssueIntoDB(
      id,
      {
        title,
        description,
        type,
        status
      }
    );
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to update issue",
      errors: error
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    if (!user) {
      return sendResponse_default(res, {
        statusCode: 401,
        success: false,
        message: "Unauthorized access! User not identified."
      });
    }
    if (user.role !== "maintainer") {
      return sendResponse_default(res, {
        statusCode: 403,
        success: false,
        message: "Forbidden! Only maintainer can delete issues."
      });
    }
    const result = await issuesService.deleteIssueFromDB(id);
    if (result.rowCount === 0) {
      return sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    return sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    return sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error?.message || "Failed to delete issue",
      errors: error
    });
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post(
  "/",
  auth_default("contributor", "maintainer"),
  issuesController.createIssue
);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch(
  "/:id",
  auth_default("contributor", "maintainer"),
  issuesController.updateIssue
);
router2.delete(
  "/:id",
  auth_default("maintainer"),
  issuesController.deleteIssue
);
var issueRoute = router2;

// src/middleware/logger.ts
import fs from "fs";
var logger = (req, res, next) => {
  console.log("Method - URL -Time:", req.method, req.url, Date.now());
  const log = `
Method -> ${req.method} - Time-> ${Date.now()} - URL ->${req.url}
`;
  fs.appendFile("logger.txt", log, (err) => {
    console.log(err);
  });
  next();
};
var logger_default = logger;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(logger_default);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Dev Pulse"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
var app_default = app;

// src/server.ts
var main = async () => {
  await initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
var server_default = app_default;
export {
  server_default as default
};
//# sourceMappingURL=server.js.map