import EditorPageClient from "./EditorPageClient";

type EditorPageProps = {
  searchParams: Promise<{
    videoUrl?: string;
  }>;
};

export default async function EditorPage({ searchParams }: EditorPageProps) {
  const { videoUrl } = await searchParams;
  return <EditorPageClient videoUrl={videoUrl ?? null} />;
}
