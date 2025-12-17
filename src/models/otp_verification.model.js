import mongoose, { Schema } from "mongoose";
import bycrpt from "bcrypt";

const otpVerificationSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

otpVerificationSchema.pre("save", async function (next) {
  if (this.isModified("otp")) {
    this.otp = await bycrpt.hash(this.otp, 10);
    next();
  }
});

otpVerificationSchema.methods.isOtpValid = async function (otp) {
  return await bycrpt.compare(otp, this.otp);
};

export const OtpVerification = mongoose.model(
  "OtpVerification",
  otpVerificationSchema
);
