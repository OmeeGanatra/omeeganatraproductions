import SharePage from "./client-page";

export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function Page() {
  return <SharePage />;
}
