export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2>{title}</h2>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 480 }}>{description}</p>
    </div>
  );
}
