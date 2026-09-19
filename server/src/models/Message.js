import mongoose from "mongoose";

const { Schema } = mongoose;

const MessageSchema = new Schema(
  {
    invitation: { type: Schema.Types.ObjectId, ref: "Invitation", required: true, index: true },
    author: { type: String, default: "", maxlength: 60 },
    body: { type: String, required: true, maxlength: 600 },
    hidden: { type: Boolean, default: false },
    /** Salted hash only — enough to rate-limit a flooder, never the raw IP. */
    ipHash: { type: String, default: "", index: true },
  },
  { timestamps: true },
);

export const Message = mongoose.model("Message", MessageSchema);
