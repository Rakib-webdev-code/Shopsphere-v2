import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { actionEmailHtml, sendEmail } from "@/lib/email";
import { db, mongoClient } from "@/lib/mongodb";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const facebookClientId = process.env.FACEBOOK_CLIENT_ID;
const facebookClientSecret = process.env.FACEBOOK_CLIENT_SECRET;
const githubClientId = process.env.GITHUB_CLIENT_ID;
const githubClientSecret = process.env.GITHUB_CLIENT_SECRET;

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60,
    // Sends the reset link by email (Resend) or prints it to the console in
    // development. The response never reveals whether the address exists.
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your ShopSphere password",
        consoleLink: `[auth] Reset ${user.email}: ${url}`,
        html: actionEmailHtml({
          heading: "Reset your password",
          body: "We received a request to reset your ShopSphere password. This link works for one hour. If you did not ask for it, you can ignore this email.",
          buttonLabel: "Choose a new password",
          url,
        }),
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your ShopSphere email",
        consoleLink: `[auth] Verify ${user.email}: ${url}`,
        html: actionEmailHtml({
          heading: "Confirm your email address",
          body: "Welcome to ShopSphere. Confirm your email so we can keep your account and orders safe.",
          buttonLabel: "Verify email",
          url,
        }),
      });
    },
    sendOnSignUp: true,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "facebook"],
    },
  },
  user: {
    additionalFields: {
      // `input: false` means public sign-up requests cannot set these fields.
      // Existing users without a role are treated as customers in the DAL.
      role: {
        type: "string",
        required: false,
        defaultValue: "customer",
        input: false,
      },
      phone: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  socialProviders: {
    ...(googleClientId && googleClientSecret
      ? {
          google: {
            clientId: googleClientId,
            clientSecret: googleClientSecret,
          },
        }
      : {}),
    ...(facebookClientId && facebookClientSecret
      ? {
          facebook: {
            clientId: facebookClientId,
            clientSecret: facebookClientSecret,
          },
        }
      : {}),
    ...(githubClientId && githubClientSecret
      ? {
          github: {
            clientId: githubClientId,
            clientSecret: githubClientSecret,
          },
        }
      : {}),
  },
  database: mongodbAdapter(db, {
    client: mongoClient,
    // Local ShopSphere development uses a standalone MongoDB instance, which
    // does not support transactions. Keep auth writes compatible with it.
    transaction: false,
  }),
});
