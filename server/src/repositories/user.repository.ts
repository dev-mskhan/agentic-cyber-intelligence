import User, { type IUser } from "../models/User.js";
import type { Types } from "mongoose";

export const userRepository = {
  findByOrganization: (organizationId: string) => User.find({ organizationId }).select("-password"),
  countByOrganization: (organizationId: string) => User.countDocuments({ organizationId }),
  findByEmail: (email: string) => User.findOne({ email }),

  findByEmailWithPassword: (email: string) =>
    User.findOne({ email }).select("+password"),

  findByGoogleId: (googleId: string) => User.findOne({ googleId }),

  findById: (id: string | Types.ObjectId) => User.findById(id),

  findByRefreshToken: (token: string) =>
    User.findOne({ refreshToken: token }).select("+refreshToken"),

  findByVerificationToken: (hashedToken: string) =>
    User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires"),

  findByResetToken: (hashedToken: string) =>
    User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires"),

  create: (data: Partial<IUser>, session?: any) =>
    User.create([data], session ? { session } : {}).then((docs) => docs[0]),

  save: (user: IUser) => user.save(),

  clearRefreshTokenByToken: (token: string) =>
    User.findOneAndUpdate({ refreshToken: token }, { refreshToken: undefined }),
};
