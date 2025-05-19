import { PracticeFileInfo } from "@/types/practice";
import { DocumentIcon, DocumentTextIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";

interface FileListProps {
  files: File[] | PracticeFileInfo[];
  onDelete?: (index: number) => void;
}

export const FileList = ({ files, onDelete }: FileListProps) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  if (!files || files.length === 0) {
    return (
      <div className="text-center px-2 py-2 text-default-500">
        <DocumentTextIcon className="size-12 mx-auto mb-3 opacity-60" />
        <p>No s&apos;ha afegit cap arxiu.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 px-2">
      {files.map((file, index) => (
        <div key={index} className="flex items-center justify-between p-3.5 gap-5 bg-default-100/90 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <DocumentIcon className="size-[1.9rem] text-default-500 shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="font-medium truncate">{file.name}</span>
              <span className="text-xs text-default-400">{formatFileSize(file.size)}</span>
            </div>
          </div>
          {onDelete && (
            <Button 
              isIconOnly 
              size="sm"
              variant="flat" 
              color="danger" 
              aria-label="Eliminar" 
              onPress={() => onDelete(index)}
            >
              <TrashIcon className="size-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};