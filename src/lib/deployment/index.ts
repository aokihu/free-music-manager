import "server-only";

import { createCloudflareAdapters } from "./cloudflare/create-cloudflare-adapters";
import { createDevelopmentAdapters } from "./development/create-development-adapters";
import type { DeploymentAdapters, DeploymentProvider } from "./types";

let adapters: DeploymentAdapters | undefined;

function parseDeploymentProvider(value?: string): DeploymentProvider {
  if (value === "cloudflare" || value === "aws" || value === "server") {
    return value;
  }

  if (!value) {
    throw new Error("生产环境必须设置 DEPLOYMENT_PROVIDER");
  }

  throw new Error(`不支持的 DEPLOYMENT_PROVIDER：${value}`);
}

function createProductionAdapters(): DeploymentAdapters {
  const provider = parseDeploymentProvider(process.env.DEPLOYMENT_PROVIDER);

  if (provider === "cloudflare") return createCloudflareAdapters();

  throw new Error(`${provider} 部署适配器尚未实现`);
}

export function getDeploymentAdapters(): DeploymentAdapters {
  if (adapters) return adapters;

  adapters =
    process.env.NODE_ENV === "production"
      ? createProductionAdapters()
      : createDevelopmentAdapters();

  return adapters;
}

export type { DeploymentAdapters, DeploymentProvider } from "./types";
