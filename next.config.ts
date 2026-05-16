import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: [{ url: "/", revision: "v0.1.9" }], // Use version from package.json
  reloadOnOnline: false,
});

export default withSerwist({});
