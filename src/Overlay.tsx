import React, { useEffect } from 'react';
import { ReactComponent as CloseIcon } from './svg/close.svg';
import './Overlay.css';

type OverlayProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  children: React.ReactNode;
};
export default function Overlay({ open, setOpen, children }: OverlayProps) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay">
      <button className="close-overlay-button" onClick={() => setOpen(false)}>
        <CloseIcon />
      </button>
      <div className="overlay-content">{children}</div>
    </div>
  );
}
