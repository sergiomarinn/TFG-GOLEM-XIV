import { ArrowUpTrayIcon, DocumentArrowUpIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { useCallback, useRef, useState } from "react";
import { FileList } from "@/components/file-list";

interface FileUploaderProps {
  files: File[];
  setFiles: (files: File[]) => void;
  disabled?: boolean;
  acceptedExtensions: string[] | '*';
	multiple: boolean
}

export const FileUploader = ({ files, setFiles, disabled = false, acceptedExtensions, multiple = true }: FileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles: File[] = Array.from(e.target.files || []);
    if (newFiles.length > 0) {
      processFiles(newFiles);
    }
  };

  const processFiles = useCallback((newFiles: File[]) => {
    if (!multiple && files.length > 0) {
      addToast({
        title: "Només pots pujar un arxiu. Elimina l'arxiu actual per pujar un de nou.",
        color: "danger",
      });
      return;
    }
    
    const validFiles: File[] = [];
    let rejected = false;

    newFiles.forEach(file => {
      if (acceptedExtensions === '*') {
        validFiles.push(file);
      } else {
        const ext = file.name.split(".").pop()?.toLowerCase() || "";
        const isAccepted = (acceptedExtensions as string[]).map(ext => ext.toLowerCase()).includes(ext);

        if (!isAccepted) {
          rejected = true;
        } else {
          validFiles.push(file);
        }
      }
    });

    if (rejected && acceptedExtensions !== '*') {
      addToast({
        title: `Només es permeten arxius ${(acceptedExtensions as string[]).map(ext => ext.toUpperCase()).join(", ")}`,
        color: "danger",
      });
    }

    if (validFiles.length > 0) {
			const existingKeys = new Set(files.map(f => f.name + f.size));
			const newUniqueFiles = validFiles.filter(f => !existingKeys.has(f.name + f.size));
			setFiles([...files, ...newUniqueFiles]);
    }

		if (fileInputRef.current) fileInputRef.current.value = "";
  }, [acceptedExtensions, files, setFiles]);

	const deleteFile = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  // Drag & drop handlers...
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  }, [isDragging, disabled]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles: File[] = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [disabled, processFiles]);

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current && (multiple || files.length === 0)) {
      fileInputRef.current.click();
    }
  };

  const getAcceptAttribute = () => {
    if (acceptedExtensions === '*') {
      return undefined; // No especificar accept permite todos los archivos
    }
    return (acceptedExtensions as string[]).map(ext => "." + ext).join(",");
  };

  const getSupportedExtensionsText = () => {
    if (acceptedExtensions === '*') {
      return "Tots els tipus d'arxius";
    }
    return (acceptedExtensions as string[]).map(ext => ext.toUpperCase()).join(", ");
  };

  return (
    <div className="pt-1 px-1">
      <div
        role="button"
        className={`group border-1.5 border-dashed rounded-lg p-4 mb-1 text-center flex flex-col items-center justify-center transition-all ${
          isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : disabled || (!multiple && files.length > 0) 
              ? 'border-default-200 bg-default-50 opacity-60' 
              : 'border-default-300 bg-default-50 hover:border-primary-300 hover:bg-primary-50/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{ minHeight: '140px', cursor: disabled || (!multiple && files.length > 0)  ? 'not-allowed' : 'pointer' }}
      >
        <DocumentArrowUpIcon className={`transition-colors size-12 text-default-400 mb-2 ${disabled || (!multiple && files.length > 0) ? '' : 'group-hover:text-primary-500'}`} />
        
        <p className="text-sm text-default-600 mb-3">
          {disabled 
            ? "No es poden pujar arxius" 
            : multiple 
              ? "Arrossega i deixa els teus arxius aquí o"
              : files.length > 0 
                ? "Elimina l'arxiu actual per pujar un de nou"
                : "Arrossega i deixa el teu arxiu aquí o"}
        </p>
        
        <Button
          variant="flat"
          color="primary"
          startContent={<ArrowUpTrayIcon className="size-4" />}
          disabled={disabled || (!multiple && files.length > 0)}
          onPress={() => {
            openFileDialog();
          }}
        >
          Selecciona arxius
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple={multiple}
          accept={getAcceptAttribute()}
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      <span className="text-xs text-default-500 mb-4 px-1">
        Arxius soportats: {getSupportedExtensionsText()}
      </span>

      <div className="mt-4">
        <h4 className="text-default-900 text-lg font-medium mb-3 px-1">
          Arxius pujats
        </h4>
        <FileList files={files} onDelete={!disabled ? deleteFile : undefined} />
      </div>
    </div>
  );
};