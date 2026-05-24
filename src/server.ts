import express, { type Application, type Request, type Response } from "express"
const app:Application = express();
const port = 5000;
import {Pool} from "pg"

//as middleware
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({extended: true}));

// server connected Neondb by pg
const pool = new Pool({
  connectionString:"postgresql://neondb_owner:npg_XV9nTa8GevUR@ep-nameless-surf-ap8vqmop-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
})


//method
app.get('/', (req: Request, res:Response) => {
  // res.send('Dev Pulse Server Running !')
  res.status(200).json({
    message:"Express Server",
    "author": "Dev Pulse",
  })
})

//POST
app.post('/',async(req: Request, res: Response)=>{
  console.log(req.body);
  const{name,email,password} = req.body;
  res.status(201).json({
    meassage:"Created",
    data:{
      name,email,password
    }
  })
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

