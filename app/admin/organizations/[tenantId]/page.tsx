import { AdminOrganizationDetailClient } from "./organization-detail-client";

export default async function AdminOrganizationDetailPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  return <AdminOrganizationDetailClient tenantId={tenantId} />;
}
