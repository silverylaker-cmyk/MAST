import { useEffect, useState } from 'react';

export function PasteInput({ onImage }: { onImage: (dataUrl: string) => void }) {
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.type.startsWith('image/')) {
          const f = it.getAsFile();
          if (f) readFile(f);
          e.preventDefault();
          return;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  function readFile(f: File) {
    const r = new FileReader();
    r.onload = () => onImage(r.result as string);
    r.readAsDataURL(f);
  }

  return (
    <div
      className={`paste-zone ${drag ? 'drag' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith('image/')) readFile(f);
      }}
    >
      <div className="paste-icon">⌘V / Ctrl+V</div>
      <h2>결과지 화면을 캡처한 뒤 이 페이지에서 붙여넣기 하세요</h2>
      <p>
        윈도우: <kbd>Print Screen</kbd> 또는 <kbd>Win</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> 로 「특이 IgE 항체 결과」 표를 캡처 →{' '}
        <kbd>Ctrl</kbd>+<kbd>V</kbd>
      </p>
      <p className="muted">이미지 파일을 끌어다 놓거나 아래에서 선택해도 됩니다. 이미지는 브라우저 안에서만 처리되고 서버로 전송되지 않습니다.</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) readFile(f);
        }}
      />
    </div>
  );
}
