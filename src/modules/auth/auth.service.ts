import bcrypt from "bcryptjs";
import type { IUser } from "./auth.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken";
import config from "../../config";

const registerUserIntoDB = async (payload: IUser) => {
  // get registration payload
  // console.log(payload);
  const { name, email, password, role } = payload;

  // hash user password
  const hashedPassword = await bcrypt.hash(password, 10);

  // insert user into database
  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) 
    VALUES($1, $2, $3, COALESCE($4, 'contributor')) 
    RETURNING id, name, email, role, created_at, updated_at
    `,
    [name, email, hashedPassword, role]
  );
  // console.log(result.rows[0]);

  return result;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  // get login payload
  // console.log(payload);
  const { email, password } = payload;

  // find user by email
  const userData = await pool.query(
    `SELECT * FROM users WHERE email=$1`,
    [email]
  );
  // console.log(userData.rows);

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials !!");
  }

  const user = userData.rows[0];
  // console.log(user);

  // compare password
  const matchPassword = await bcrypt.compare(password, user.password);
  // console.log(matchPassword);

  if (!matchPassword) {
    throw new Error("Password does not match!");
  }

  // create jwt payload
  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  // generate auth token
  const token = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });
  // console.log(token);

  // return token and user data
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

const getAllUsersFromDB = async () => {
  // fetch all users from database
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at FROM users
  `);
  // console.log(result.rows);
  return result;
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
  getAllUsersFromDB,
};
