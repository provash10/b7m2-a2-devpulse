import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";
import jwt from "jsonwebtoken"
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

  const jwtpayload ={
    id: user.id,
    name: user.name,
    is_active: user.is_active,
    email: user.email
  };
  const accesstoken = jwt.sign(jwtpayload,config.secret as string,{
    expiresIn: "1d",
  });

  delete user.password;
  return {accesstoken};
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
};
