import { NextRequest, NextResponse } from "next/server";
import { arcjetInstance } from "./config";

/**
 * Utility function to apply Arcjet protection to API routes
 * Returns the decision object, or handles the response if denied
 */
export async function protectWithArcjet(request: NextRequest) {
  try {
    const decision = await arcjetInstance.protect(request);

    if (decision.isDenied()) {
      // Handle different types of denials
      if (decision.reason.isRateLimit()) {
        return {
          denied: true,
          response: NextResponse.json(
            { error: "Rate limit exceeded. Please try again later." },
            { status: 429 }
          ),
        };
      }

      if (decision.reason.isBot()) {
        return {
          denied: true,
          response: NextResponse.json(
            { error: "Bot traffic detected and blocked." },
            { status: 403 }
          ),
        };
      }

      if (decision.reason.isShield()) {
        return {
          denied: true,
          response: NextResponse.json(
            { error: "Request blocked by security shield." },
            { status: 403 }
          ),
        };
      }

      // Generic security policy block
      return {
        denied: true,
        response: NextResponse.json(
          { error: "Request blocked by security policy." },
          { status: 403 }
        ),
      };
    }

    return { denied: false, decision };
  } catch (error) {
    console.error("Arcjet protection error:", error);
    // Fail open - continue processing if Arcjet fails
    return { denied: false, decision: null };
  }
}

/**
 * Higher-order function to wrap API handlers with Arcjet protection
 */
export function withArcjetProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const protection = await protectWithArcjet(request);

    if (protection.denied) {
      return protection.response;
    }

    return handler(request);
  };
}
