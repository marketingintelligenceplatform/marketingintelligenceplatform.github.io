export interface AuthIdentity {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  activeOrganizationId: string | null;
}

export interface WorkspaceAuth extends AuthIdentity {
  membershipId: string;
  organizationId: string;
  workspaceName: string;
  role: string;
  permissions: string[];
}
