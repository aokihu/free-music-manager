import "server-only";

import type { DeploymentAdapters } from "../types";
import { createCloudflareCatalogRepository } from "./create-cloudflare-catalog-repository";
import { createCloudflareObjectStorage } from "./create-cloudflare-object-storage";

export function createCloudflareAdapters(): DeploymentAdapters {
  return {
    catalogRepository: createCloudflareCatalogRepository(),
    objectStorage: createCloudflareObjectStorage(),
  };
}
