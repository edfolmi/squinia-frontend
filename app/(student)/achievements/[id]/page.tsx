import { CertificatePageClient } from "./certificate-page-client";

export default async function AchievementCertificatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CertificatePageClient achievementId={id} />;
}
