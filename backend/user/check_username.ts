import { api } from "encore.dev/api";
import db from "../db";

export interface CheckUsernameRequest {
  username: string;
}

export interface CheckUsernameResponse {
  available: boolean;
  error?: string;
  suggestions?: string[];
}

const BANNED_WORDS = [
  "sex", "porn", "xxx", "nude", "naked", "nsfw", "fuck", "shit", "dick", "cock", "pussy", "ass",
  "cum", "orgasm", "masturbate", "bitch", "slut", "whore", "rape", "molest", "pedophile",
  "terror", "terrorist", "isis", "alqaeda", "bomb", "kill", "murder", "suicide", "genocide",
  "hitler", "nazi", "kkk", "weapon", "gun", "shoot", "attack", "violence", "death",
  "nigger", "nigga", "faggot", "retard", "cunt", "twat", "kike", "chink", "spic",
  "admin", "official", "staff", "support", "moderator", "tiktok", "instagram", "facebook",
  "youtube", "twitter", "google", "apple", "microsoft", "celebrity", "verified", "vip"
];

const CELEBRITY_PATTERNS = [
  "taylorswift", "justinbieber", "arianagrande", "selenagomez", "kimkardashian",
  "kyliejenner", "beyonce", "rihanna", "drake", "cristiano", "messi", "trump",
  "biden", "obama", "elonmusk", "billgates", "jeffbezos", "zuckerberg"
];

function containsBannedWord(username: string): boolean {
  const lowerUsername = username.toLowerCase();
  return BANNED_WORDS.some(word => lowerUsername.includes(word)) ||
         CELEBRITY_PATTERNS.some(pattern => lowerUsername.includes(pattern));
}

function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function generateSuggestions(username: string): string[] {
  const base = username.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 15);
  const suggestions: string[] = [];
  
  for (let i = 0; i < 3; i++) {
    const random = Math.floor(Math.random() * 999);
    suggestions.push(`${base}${random}`);
  }
  
  return suggestions;
}

export const checkUsername = api<CheckUsernameRequest, CheckUsernameResponse>(
  { auth: true, expose: true, method: "POST", path: "/users/check-username" },
  async (req) => {
    const { username } = req;

    if (username.length < 3) {
      return {
        available: false,
        error: "Username must be at least 3 characters long",
      };
    }

    if (username.length > 20) {
      return {
        available: false,
        error: "Username must be no more than 20 characters long",
      };
    }

    if (!isValidUsername(username)) {
      return {
        available: false,
        error: "Username can only contain letters, numbers, and underscores",
      };
    }

    if (containsBannedWord(username)) {
      return {
        available: false,
        error: "This username is not allowed",
      };
    }

    const existing = await db.queryRow`
      SELECT id FROM users WHERE LOWER(username) = LOWER(${username})
    `;

    if (existing) {
      return {
        available: false,
        error: "This username is already taken",
        suggestions: generateSuggestions(username),
      };
    }

    return { available: true };
  }
);
