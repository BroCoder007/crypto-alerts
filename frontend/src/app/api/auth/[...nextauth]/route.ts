import NextAuth, { type NextAuthOptions } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
const options: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {}
      return baseUrl;
    },
  },
};
const handler = NextAuth(options);
async function route(
  request: NextRequest,
  context: { params: Promise<{ nextauth: string[] }> },
) {
  if (!options.providers.length) {
    const { nextauth } = await context.params;
    if (request.method === "GET" && nextauth[0] === "providers")
      return NextResponse.json({});
    if (request.method === "GET" && nextauth[0] === "session")
      return NextResponse.json(null);
    return NextResponse.json(
      { error: "Account sign-in is not configured." },
      { status: 503 },
    );
  }
  return handler(request, context);
}
export { route as GET, route as POST };
