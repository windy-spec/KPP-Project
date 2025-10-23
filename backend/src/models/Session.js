import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      require: true,
      index: true,
    },
    refreshToken: {
      type: String,
      require: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      require: true,
    },
  },
  {
    timestamps: true,
  }
);

// AUTO DELETE WHEN EXPIRED
SessionSchema.index({ expiresAt: 1 }, { expireAfterSecond: 0 });

export default mongoose.model("Session", SessionSchema);
