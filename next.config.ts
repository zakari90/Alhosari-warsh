import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  additionalPrecacheEntries: ["/"],
  reloadOnOnline: false,
});

export default withSerwist({
  reactCompiler: true,
});
