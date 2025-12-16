import { auth } from "@/lib/auth/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { authRateLimit } from "@/lib/arcjet/config";

const authHandlers = toNextJsHandler(auth);
export const { GET } = authHandlers;

export async function POST(req: Request) {
  const clonedRequest = req.clone();

  const decision = await authRateLimit.protect(req);
  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return new Response("Too many requests. Please try again later.", {
        status: 429,
      });
    } else if (decision.reason.isBot()) {
      return new Response("Bot traffic detected and blocked.", { status: 403 });
    } else if (decision.reason.isShield()) {
      return new Response("Request blocked by security shield.", {
        status: 403,
      });
    } else {
      return new Response("Request blocked by security policy.", {
        status: 403,
      });
    }
  }

  return authHandlers.POST(clonedRequest);
}
