import React from "react";
import { Download, File } from "lucide-react";
import { DocsAPI } from "../../api";
import { Modal } from "../../components/Modal";

export function PreviewModal({ open, onClose, doc }) {
  if (!doc) return null;
  const type    = (doc.file_type || "").toLowerCase();
  const url     = DocsAPI.previewUrl(doc.id);
  const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(type);
  const isPdf   = type === "pdf";

  return (
    <Modal open={open} onClose={onClose} title={doc.doc_name} wide>
      <div className="flex flex-col items-center gap-4">
        {isPdf && (
          <iframe
            src={`${url}#toolbar=1`}
            className="w-full h-[55vh] rounded-lg border border-[var(--border-main)] bg-white"
            title="PDF Preview"
          />
        )}
        {isImage && (
          <img
            src={url}
            alt={doc.doc_name}
            className="max-h-[55vh] rounded-lg object-contain border border-[var(--border-main)]"
          />
        )}
        {!isPdf && !isImage && (
          <div className="text-center py-16 text-[var(--text-soft)]">
            <File className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="font-semibold text-[var(--text-main)]">{doc.file_name}</p>
            <p className="text-sm mt-1">Preview not available for this file type</p>
            <a
              href={DocsAPI.downloadUrl(doc.id)}
              className="mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm"
            >
              <Download className="w-4 h-4" /> Download to view
            </a>
          </div>
        )}
        {(isPdf || isImage) && (
          <a
            href={DocsAPI.downloadUrl(doc.id)}
            download
            className="mt-4 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 text-sm"
          >
            <Download className="w-4 h-4" /> Download Document
          </a>
        )}
      </div>
    </Modal>
  );
}
