import React from "react";
import {
  FileImage,
  FileAudio,
  FileSpreadsheet,
  Presentation,
  FileText,
  File,
} from "lucide-react";

export function FileIcon({ type }) {
  const t = (type || "").toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(t))
    return <FileImage className="w-5 h-5 text-pink-400" />;
  if (["mp3", "wav", "ogg", "aac"].includes(t))
    return <FileAudio className="w-5 h-5 text-purple-400" />;
  if (["xlsx", "xls", "csv"].includes(t))
    return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
  if (["pptx", "ppt"].includes(t))
    return <Presentation className="w-5 h-5 text-orange-400" />;
  if (["pdf"].includes(t)) return <FileText className="w-5 h-5 text-red-400" />;
  return <File className="w-5 h-5 text-slate-400" />;
}
