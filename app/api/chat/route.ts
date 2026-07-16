import { NextResponse } from "next/server";
import puter from "@heyputer/puter.js";

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Set token for server-side auth
    const token = process.env.PUTER_API_TOKEN;
    if (!token) {
      console.error("PUTER_API_TOKEN is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    puter.setAuthToken(token);

    // Call Puter AI (default model)
    const response = await puter.ai.chat(message);

    return NextResponse.json({
      message: typeof response === "string" ? response : response?.message?.content || "Maaf, saya tidak mengerti."
    });
  } catch (error: any) {
    console.error("Error in AI chat API:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat menghubungi server AI." },
      { status: 500 }
    );
  }
}
