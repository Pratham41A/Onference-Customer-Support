import mongoose from "mongoose";
const { Schema, model, models } = mongoose;

const messageSchema = new Schema(
  {
    from: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    to: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      default: 'NA',
      trim: true,
    },

    body: {
      type: String,
      default: 'NA',
      trim: true,
    },

    source: {
      type: String,
      enum: ["whatsapp", "email"],
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: ["template", "body"],
      required: true,
      trim: true,
    },
    template: {
      type: String,
      default: 'NA',
      trim: true,
    },
    inReplyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    internetMessageId: {
      type: String,
      default: null
    },
    messageId: {
      type: String,
      default: null
    },
  },

  { timestamps: true }
);

export const Message = models.Message || model("Message", messageSchema);
