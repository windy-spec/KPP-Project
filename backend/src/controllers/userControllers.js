import express from "express";

export const authMe = async (req, res) => {
  try {
    const user = req.user;
    return res.status(200).json({ user });
  } catch (error) {
    console.log("Lỗi khi gọi authMe", error);
    return res.status(404).json({ message: "Lỗi hệ thống" });
  }
};
