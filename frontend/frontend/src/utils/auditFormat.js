export function parseAuditJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function valueToText(value) {
  if (value === null || value === undefined || value === "") return "empty";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "empty";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function humanizeKey(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function humanAction(action) {
  const map = {
    UPLOAD: "Uploaded document",
    UPDATE_METADATA: "Updated document details",
    DELETE: "Deleted document",
    SHARE: "Shared document",
    UNSHARE: "Removed sharing",
  };
  return map[action] || action || "Action";
}

export function buildAuditSummary(log) {
  const oldValue = parseAuditJson(log?.old_value);
  const newValue = parseAuditJson(log?.new_value);

  if (!oldValue && !newValue) {
    return [humanAction(log?.action_type)];
  }

  const keys = [...new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ])];

  const changes = keys
    .map((key) => {
      const before = oldValue ? oldValue[key] : undefined;
      const after = newValue ? newValue[key] : undefined;
      if (JSON.stringify(before) === JSON.stringify(after)) return null;
      return `${humanizeKey(key)}: ${valueToText(before)} -> ${valueToText(after)}`;
    })
    .filter(Boolean);

  if (!changes.length) return [humanAction(log?.action_type)];
  return changes;
}
