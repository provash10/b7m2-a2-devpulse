import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IUser } from "./auth.interface";

const registerUserIntoDB= async(payload : IUser)=>{
    const {name, email, password, role} = payload;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
  INSERT INTO users(name,email,password,role) VALUES($1,$2,$3,$4) RETURNING *
  `,
      [name, email, hashedPassword, role]
    );
    // console.log(result);
    return result;
};


export const authService={
    registerUserIntoDB,
}
