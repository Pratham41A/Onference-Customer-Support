import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const activitySchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    body: {
      type: String,
      required: true,
      trim: true,
    },

    due_date: {
      type: Date,
      required: true,
    }
  },

  {
    timestamps: true,
    strict: true,
  }
);

export const Activity = models.Activity || model("Activity", activitySchema);
