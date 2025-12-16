import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth/auth";
import prisma from "@/lib/prisma";
import { arcjetInstance } from "@/lib/arcjet/config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    // Apply Arcjet protection before processing
    const decision = await arcjetInstance.protect(request);
    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      if (decision.reason.isBot()) {
        return NextResponse.json(
          { error: "Bot traffic detected and blocked." },
          { status: 403 }
        );
      }
      if (decision.reason.isShield()) {
        return NextResponse.json(
          { error: "Request blocked by security shield." },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Request blocked by security policy." },
        { status: 403 }
      );
    }

    // Verify user is authenticated using server-side auth
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    console.log(
      "Session check:",
      session?.user ? "User authenticated" : "No user session"
    );

    if (!session?.user) {
      console.error("Unauthorized: No user session found");
      return NextResponse.json(
        { error: "Unauthorized - Please log in first" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Request body:", body);

    // Check if this is an upload completion request (with imageUrl)
    if (body.imageUrl) {
      // Update user profile with the new image URL
      console.log("Updating user profile image:", {
        userId: session.user.id,
        newImage: body.imageUrl,
      });

      try {
        // Update user profile image in database
        const updatedUser = await prisma.user.update({
          where: { id: session.user.id },
          data: { image: body.imageUrl },
        });

        console.log("Successfully updated user profile image in database");

        return NextResponse.json({
          success: true,
          message: "Profile image updated successfully",
          image: body.imageUrl,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            image: updatedUser.image,
          },
        });
      } catch (dbError) {
        console.error("Failed to update user profile in database:", dbError);
        return NextResponse.json(
          { error: "Failed to update profile image in database" },
          { status: 500 }
        );
      }
    }

    // Handle signature generation request
    // Extract parameters from the nested structure that CldUploadWidget sends
    const requestData = body.paramsToSign || {};
    const {
      timestamp,
      folder,
      public_id: publicId,
      source,
      resource_type: resourceType,
      custom_coordinates: customCoordinates,
    } = requestData;

    console.log("Extracted params:", {
      timestamp,
      folder,
      publicId,
      source,
      resourceType,
      customCoordinates,
    });

    // Validate required parameters
    if (!timestamp || !folder || !publicId) {
      console.error("Missing parameters:", { timestamp, folder, publicId });
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Validate timestamp is recent (within 1 hour)
    const now = Math.floor(Date.now() / 1000);
    const maxAge = 3600; // 1 hour
    if (Math.abs(timestamp - now) > maxAge) {
      console.error("Invalid timestamp:", {
        timestamp,
        now,
        diff: Math.abs(timestamp - now),
      });
      return NextResponse.json({ error: "Invalid timestamp" }, { status: 400 });
    }

    // Validate folder structure (prevent directory traversal)
    const allowedFolders = /^profile-images\/[a-zA-Z0-9_-]+$/;
    if (!allowedFolders.test(folder)) {
      return NextResponse.json(
        { error: "Invalid folder structure" },
        { status: 400 }
      );
    }

    // Validate public ID (prevent malicious names)
    const allowedPublicId = /^avatar_[0-9]+$/;
    if (!allowedPublicId.test(publicId)) {
      return NextResponse.json(
        { error: "Invalid public ID format" },
        { status: 400 }
      );
    }

    // Generate secure signature with strict parameters
    const signatureParams = {
      timestamp,
      folder,
      public_id: publicId,
      ...(source && { source }),
      ...(resourceType && { resource_type: resourceType }),
      ...(customCoordinates && { custom_coordinates: customCoordinates }),
    };

    const signature = cloudinary.utils.api_sign_request(
      signatureParams,
      process.env.CLOUDINARY_API_SECRET!
    );

    console.log("Signature generated:", signature);
    console.log("Environment check:", {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
        ? "SET"
        : "MISSING",
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ? "SET" : "MISSING",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "SET" : "MISSING",
    });

    return NextResponse.json({
      signature,
      timestamp,
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
      folder,
      public_id: publicId,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return NextResponse.json(
      { error: "Failed to generate signature" },
      { status: 500 }
    );
  }
}
