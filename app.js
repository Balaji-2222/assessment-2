const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
app.use(express.json());
let db = null;
const jwt = require("jsonwebtoken");
const path = require("path");
const dbPath = path.join(__dirname, "twitterClone.db");
const dbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running");
    });
  } catch (e) {
    console.log(`Error is : ${e.message}`);
    process.exit(1);
  }
};
dbServer();
app.post("/register/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const query = `SELECT * FROM user
    WHERE username = '${username}'`;
  const r = await db.get(query);
  if (r === undefined) {
    const doubt = password;
    if (doubt.length >= 6) {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `INSERT INTO user(username, name,
        password, gender) VALUES
        ('${username}', '${name}', '${hashedPassword}',
        '${gender}')`;
      const a = await db.run(query);
      response.send("User created successfully");
    } else {
      response.status(400);
      response.send("Password is too short");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const query1 = `SELECT * FROM user
    WHERE username= '${username}'`;
  const ans = await db.get(query1);
  if (ans === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, ans.password);
    if (isPasswordMatched === false) {
      response.status(400);
      response.send("Invalid password");
    } else {
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_TOKEN");
      response.send({ jwtToken });
      console.log(jwtToken);
    }
  }
});
module.exports = app;
const authenticateToken = (request, response, next) => {
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        next();
      }
    });
  }
};
//API-4
app.get("/user/following/", authenticateToken, async (request, response) => {
  const getQuery = `SELECT user.name FROM user LEFT JOIN 
    follower ON user.user_id = follower.follower_id;`;
  const ans = await db.all(getQuery);
  response.send(ans);
});
