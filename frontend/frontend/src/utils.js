export function formatBytes(b) {
  if (!b) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 ** 2).toFixed(1)} MB`;
}

export function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
