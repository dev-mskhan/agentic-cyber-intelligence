import { Document, Types } from "mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export type Role = "analyst" | "admin" | "viewer";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: Role;
  organizationId: Types.ObjectId;
  authProvider: "local" | "google";
  googleId?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  refreshToken?: string;
  passwordResetToken?: string | undefined;
  passwordResetExpires?: Date | undefined;
  emailVerificationToken?: string | undefined;
  emailVerificationExpires?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidate: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
  generatePasswordResetToken(): string;
}
const UserSchema = new mongoose.Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      required: true,
      enum: ["analyst", "admin", "viewer"],
      default: "viewer",
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    // --- Auth provider ---
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many local users with no googleId
    },
    avatarUrl: { type: String },

    // --- Email verification ---
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // --- Password reset ---
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },

    // --- Auth session ---
    refreshToken: { type: String, select: false },
  },
  { timestamps: true },
);

// --- Hash password before save ---
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
  return;
});

UserSchema.methods.comparePassword = function (candidate: string) {
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.generateEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return rawToken;
};

UserSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  return rawToken;
};

export default mongoose.model("User", UserSchema);
