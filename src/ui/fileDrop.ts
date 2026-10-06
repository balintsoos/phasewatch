export interface FileDropOptions {
  fileInput: HTMLInputElement;
  dropZone: HTMLElement;
  onFile: (file: File) => void;
}

export function wireFileDrop({ fileInput, dropZone, onFile }: FileDropOptions): void {
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement;
    const files = target.files;
    if (files && files.length > 0) onFile(files[0]!);
  });

  let dragCounter = 0;
  document.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone.classList.add('active');
  });
  document.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropZone.classList.remove('active');
    }
  });
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.classList.remove('active');
    const files = e.dataTransfer?.files;
    if (files && files.length > 0 && files[0]!.name.endsWith('.csv')) {
      onFile(files[0]!);
    }
  });
}
