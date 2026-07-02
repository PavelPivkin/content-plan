/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig = {
  output: "export",
  basePath: isGitHubPages ? "/content-plan" : "",
  assetPrefix: isGitHubPages ? "/content-plan/" : "",
  trailingSlash: true,
  images: {
    unoptimized: true
  }
};

export default nextConfig;
