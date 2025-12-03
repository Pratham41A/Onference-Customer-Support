import mongoose from "mongoose";

const {Schema,model,models}=mongoose
const inboxSchema = new Schema(
  {
   owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  preview: { type: String, required: true },
  status: { type: String, enum: ['unread', 'read','started','ended'], default: 'unread' },
  end_count: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Inbox = models.Inbox || model("Inbox", inboxSchema);