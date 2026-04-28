import ProjectDetailPage from "./client-page";

export function generateStaticParams() {
  return [{ slug: "_" }];
}

export default function Page() {
  return <ProjectDetailPage />;
}
