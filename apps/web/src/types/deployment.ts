export interface Deployment {
  /**
   * The deployment's ID. This is obtained by calling the
   * `/info` endpoint of the deployment URL.
   */
  id: string;
  /**
   * The API URL of the deployment.
   */
  deploymentUrl: string;
  /**
   * The tenant ID of the deployment. This is obtained by calling
   * the `/info` endpoint of the deployment URL.
   */
  tenantId: string;
  /**
   * A custom name for the deployment. This is a custom field the user sets.
   */
  name: string;
  /**
   * Whether this deployment is the default deployment.
   */
  isDefault?: boolean;
  /**
   * The ID of the primary graph for this deployment.
   */
  primaryGraphId: string;
  /**
   * The ID of the default graph for this deployment. This should only be set for one deployment,
   * and it should be the same deployment that isDefault is set to true on.
   */
  defaultGraphId?: string;
}
