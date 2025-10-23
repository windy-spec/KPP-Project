import Session from "../models/Session.js";
import User from "../models/User.js";
import JWT from "jsonwebtoken";
const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;
// FUNCTION SIGNUP

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, phone } = req.body;
    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "Không thể thiếu username, password, email, firstName, lastName",
      });
    }
    // check username isExists

    const isExists = await User.findOne({ username });
    if (isExists) {
      return res.status(409).json({ message: "Username đã tồn tại" });
    }

    // create user

    await User.create({
      username,
      password,
      email,
      displayName: `${firstName} ${lastName}`,
      phone,
    });

    // return
    return res.status(204);
  } catch (error) {
    console.error("Lỗi khi gọi signUp", error);
    return res.status(505).json({ message: "Lỗi hệ thống" });
  }
};

// FUNCTION SIGNIN

export const signIn = async (req, res) => {
  try {
    // get inputs user send

    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Không thể thiếu username hoặc password." });
    }

    // compare User with database

    // check username

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: "Sai username hoặc password." });
    }
    // check password
    const passwordCorrect = await User.findOne({ password });
    if (!passwordCorrect) {
      return res.status(401).json({ message: "Sai username hoặc password." });
    }
    // create accessToken with jwt

    const accessToken = JWT.sign(
      { userID: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // create refreshToken

    const refreshToken = JWT.sign(
      {
        UserID: user._id,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "14d",
      }
    );

    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });
    // send refreshToken to cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: REFRESH_TOKEN_TTL,
    });
    // send access to res
    return res.status(200).json({
      message: `User ${user.displayName} đã logged in! `,
      accessToken,
    });
  } catch (error) {
    console.log("Lỗi khi gọi signIn: ", error);
    return res.status(500).json({ message: "Lỗi hệ thống" });
  }
};
