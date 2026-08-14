"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  alt?: string;
};

export function ImagePreview({ src, alt = "Documentation image" }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    const closeOnBackdrop = (event: MouseEvent) => {
      if (event.target === element) dialog.current?.close();
    };
    element?.addEventListener("click", closeOnBackdrop);
    return () => element?.removeEventListener("click", closeOnBackdrop);
  }, []);

  return (
    <>
      <button className="image-preview-trigger" type="button" onClick={() => dialog.current?.showModal()} aria-label={`Enlarge ${alt}`}>
        <img src={src} alt={alt} />
      </button>
      <dialog className="image-preview-dialog" ref={dialog} aria-label={alt}>
        <button className="image-preview-close" type="button" onClick={() => dialog.current?.close()} aria-label="Close image preview">×</button>
        <div className="image-preview-content">
          <img src={src} alt={alt} />
        </div>
      </dialog>
    </>
  );
}
