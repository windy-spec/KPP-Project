import User from "../models/User.js";

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
