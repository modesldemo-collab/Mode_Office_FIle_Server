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
            className="w-full h-[70vh] rounded-lg border border-slate-700 bg-white"
            title="PDF Preview"
          />
        )}
        {isImage && (
          <img
            src={url}
            alt={doc.doc_name}
            className="max-h-[70vh] rounded-lg object-contain border border-slate-700"
          />
        )}
        {!isPdf && !isImage && (
          <div className="text-center py-16 text-slate-400">
            <File className="w-16 h-16 mx-auto mb-4 opacity-40" />
            <p className="font-medium text-white">{doc.file_name}</p>
            <p className="text-sm mt-1">Preview not available for this file type</p>
            <a
              href={DocsAPI.downloadUrl(doc.id)}
              className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Download to view
            </a>
          </div>
        )}
        {(isPdf || isImage) && (
          <a
            href={DocsAPI.downloadUrl(doc.id)}
            download
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium"
          >
            <Download className="w-4 h-4" /> Download
          </a>
        )}
      </div>
    </Modal>
  );
}
