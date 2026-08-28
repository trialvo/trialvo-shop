export default function JsonLd({
  id,
  data,
}: {
  id: string;
  data: object | null | undefined;
}) {
  if (!data) return null;
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
