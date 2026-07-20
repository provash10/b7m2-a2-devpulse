import bcrypt from "bcryptjs";
import type { IUser } from "./auth.interface";
import { pool } from "../../db";
import jwt from "jsonwebtoken";
import config from "../../config";


const registerUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;

  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
  INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING *
  `,
    [name, email, hashedPassword, role]
  );
  delete result.rows[0].password;

  // console.log(result);
  return result;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;
//check user access, compare with password, generate token
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials !!");
  }

  const user = userData.rows[0];
  console.log(user);
  const matchPassword = await bcrypt.compare(password, user.password);
  console.log(matchPassword)
  if (!matchPassword) {
    throw new Error("Password does not match!");
  }

  const jwtpayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  const accesstoken = jwt.sign(jwtpayload, config.secret as string, {
    expiresIn: "1d",
  });

  console.log("Access Token:", accesstoken);

  delete user.password;
  return { accesstoken };
};

const getAllUsersFromDB = async () => {
  const result = await pool.query(`
    SELECT id, name, email, role, created_at, updated_at FROM users
  `);
  return result;
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
  getAllUsersFromDB
};
