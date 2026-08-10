export function suggestAgentSlug(
  existing: { slug: string }[],
  seed?: string,
): string {
  const normalized =
    (seed ?? "agent")
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "agent";

  const slugs = new Set(existing.map((a) => a.slug));
  if (!slugs.has(normalized)) return normalized;

  let n = 2;
  while (slugs.has(`${normalized}-${n}`)) n += 1;
  return `${normalized}-${n}`;
}
