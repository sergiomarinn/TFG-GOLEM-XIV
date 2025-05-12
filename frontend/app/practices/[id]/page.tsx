'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CodeBracketIcon,
  DocumentIcon,
  DocumentTextIcon,
  PaperClipIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
	TrashIcon,
} from '@heroicons/react/24/outline';
import { DocumentArrowUpIcon } from '@heroicons/react/24/solid';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Progress } from '@heroui/progress';

import { 
  practiceStatusOptions as statusOptions, 
  practiceStatusColorMap as statusColorMap,
	practiceStatusIconColorMap as statusIconColorMap
} from "@/types";
import { addToast } from '@heroui/toast';
import { useParams } from 'next/navigation';
import { getPracticeById, uploadPractice } from '@/app/actions/practice';
import { Practice } from '@/types/practice';

const PracticeStatus = ({ status }: {status: string}) => {
  const getStatusName = (uid: string) =>
    statusOptions.find((option) => option.uid === uid)?.name || uid;

  const getStatusValue = (uid: string) =>
    statusOptions.find((option) => option.uid === uid)?.value || 0;

	const getStatusIcon = (uid: string) =>
		statusOptions.find((option) => option.uid === uid)?.icon || null;

	const StatusIcon = getStatusIcon(status);
	const statusColor = statusIconColorMap[status] || "text-default-400";
	
  return (
    <div className="flex flex-col gap-1 w-[260px]">
      <div className="flex items-center justify-end gap-1 mr-1">
        {StatusIcon && (
					<StatusIcon className={`size-5 ${statusColor}`} />
				)}
        <span className="text-default-800">{getStatusName(status)}</span>
      </div>
      <Progress
				aria-label={status}
        color={statusColorMap[status]} 
        value={getStatusValue(status)} 
        maxValue={statusOptions.length-2}
      />
    </div>
  );
};

// Componente para el listado de archivos
const FileList = ({ files, onDelete }) => {
  if (!files || files.length === 0) {
    return (
      <div className="text-center px-2 py-2 text-default-500">
        <DocumentTextIcon className="size-12 mx-auto mb-3 opacity-60" />
        <p>No s'ha afegit cap arxiu.</p>
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
							<span className="text-xs text-default-400">{file.size}</span>
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

// Componente para manejar la subida de archivos
const FileUploader = ({ files, setFiles, disabled = false }) => {
  const fileInputRef = useRef(null);
	const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    if (newFiles.length > 0) {
      processFiles(newFiles);
    }
  };

	const processFiles = (newFiles) => {
    const validFiles = [];
		let rejected = false;

		newFiles.forEach(file => {
			const isZip =
				file.name.toLowerCase().endsWith('.zip') ||
				file.type === 'application/zip' ||
				file.type === 'application/x-zip-compressed';

			if (!isZip) {
				rejected = true;
			} else {
				validFiles.push({
					file,
					id: Math.random().toString(36).substring(7),
					name: file.name,
					size: formatFileSize(file.size),
					type: file.type
				});
			}
		});

		if (rejected) {
			addToast({
				title: "Només es permeten arxius ZIP",
				color: "danger",
			})
		}

		if (validFiles.length > 0) {
			setFiles([...files, ...validFiles]);
		}
	}

  const deleteFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

	const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

	// Handlers for drag and drop
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

	const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  }, [isDragging, disabled]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [disabled, processFiles]);

	const openFileDialog = () => {
    if (!disabled) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="pt-1 px-1">
			{/* Área de drag and drop */}
      <div 
        className={`group border-1.5 border-dashed rounded-lg p-4 mb-1 text-center flex flex-col items-center justify-center transition-all ${
          isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : disabled 
              ? 'border-default-200 bg-default-50 opacity-60' 
              : 'border-default-300 bg-default-50 hover:border-primary-300 hover:bg-primary-50/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        style={{ minHeight: '140px', cursor: disabled ? 'not-allowed' : 'pointer' }}
      >
        <DocumentArrowUpIcon className={
					`transition-colors size-12 text-default-400 mb-2 ${
					disabled ? '' : 'group-hover:text-primary-500'}` } />
        
        <p className="text-sm text-default-600 mb-3">
          {disabled 
            ? "No es poden pujar arxius" 
            : "Arrossega i deixa els teus arxius aquí o"}
        </p>
        
        <Button
          variant="flat"
          color="primary"
          startContent={<ArrowUpTrayIcon className="size-4" />}
          disabled={disabled}
          onPress={(e) => {
            e.stopPropagation();
            openFileDialog();
          }}
        >
          Selecciona arxius
        </Button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
					accept=".zip"
          className="hidden"
          disabled={disabled}
        />
      </div>
      
      <span className="text-xs text-default-500 mb-4 px-1">
        Arxius soportats: ZIP
      </span>
			<div className="mt-4">
				<h4 className="text-default-900 text-lg font-medium mb-3 px-1">
					Arxius pujats
				</h4>
	      <FileList files={files} onDelete={!disabled ? deleteFile : null} />
			</div>
    </div>
  );
};

// Componente de Feedback
const FeedbackSection = ({ feedback, grade }) => {
  return (
    <Card>
      <CardHeader>
				<div className="w-full flex items-center justify-between gap-2 px-2 pt-1">
					<h3 className="text-xl font-semibold">Retroalimentació</h3>
					{grade !== undefined && (
						<Chip 
							color={grade >= 5 ? "success" : "danger"} 
							variant="flat" 
							className="ml-auto"
						>
							Nota: {grade.toFixed(1)}
						</Chip>
					)}
				</div>
      </CardHeader>
      <Divider />
      <CardBody>
        {feedback ? (
          <div className="text-default-700 whitespace-pre-line px-2">
            {feedback}
          </div>
        ) : (
          <div className="text-center py-4 text-default-500">
            Encara no hi ha retroalimentació disponible.
          </div>
        )}
      </CardBody>
    </Card>
  );
};

// Datos de ejemplo para la práctica
const practiceSample = {
  id: 1,
  name: "Implementació d'algorismes de cerca avançats",
  description: "En aquesta pràctica, hauràs d'implementar diversos algorismes de cerca estudiats durant el curs, incloent cerca binària, interpolació i Jump Search. Hauràs de comparar l'eficiència d'aquests algorismes amb diferents conjunts de dades i realitzar una anàlisi de la seva complexitat temporal i espacial.",
  language: "Python",
  due_date: "2025-05-20T23:59:59",
  submission_date: "2025-05-18T14:32:10",
  status: "corrected",
  grade: 8.5,
  feedback: "Molt bona implementació dels algorismes de cerca. L'anàlisi és detallada i ben estructurada. Els experiments realitzats demostren un bon enteniment dels conceptes. Per millorar: podries haver optimitzat l'algorisme d'interpolació per als casos límit.\n\nT'animo a revisar la secció 3.2 on hi ha una petita ineficiència en la implementació del Jump Search.",
  course: {
    id: "EDA",
    name: "Algorísmica Avançada",
    color: "indigo"
  },
  resubmit_available: true,
  submitted_files: [
    { name: "search_algorithms.py", size: "4.2 KB" },
    { name: "benchmark_results.csv", size: "1.8 KB" },
    { name: "report.pdf", size: "523.1 KB" }
  ]
};

// Página principal
export default function PracticeDetailPage() {
  const params = useParams();
  const practiceId = params.id as string;

  const [practice, setPractice] = useState<Practice>();

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const practice = await getPracticeById(practiceId);
        setPractice(practice);
      } catch (error) {
        console.error("Error fetching practice:", error);
      }
    };
    if (practiceId) {
      fetchPractice();
    }
  }, [practiceId]);
  
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResubmit, setShowResubmit] = useState(false);

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmit = async () => {
    if (!practice) return;
    if (files.length === 0) {
      addToast({
        title: "Cap arxiu seleccionat",
        description: "Has d'afegir almenys un arxiu per poder enviar la pràctica.",
        color: "danger"
      })
      return;
    }
    
    try {
      setIsSubmitting(true);
      await uploadPractice(practice.id, files[0])
      
      setIsSubmitting(false);
      setShowResubmit(false);

      setPractice({
        ...practice,
        status: "submitted",
        submission_date: new Date().toISOString()
      });

      addToast({
        title: "Pràctica enviada amb èxit",
        color: "success",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      })
    } catch (error) {
      console.error("Error submitting practice:", error);
      addToast({
        title: "Error en enviar la pràctica",
        description: "Torna-ho a intentar més tard"
        color: "danger"
      });
    }
  };

  const canSubmit = useMemo(() => {
    return ['not_submitted', 'rejected'].includes(practice?.status) || showResubmit;
  }, [practice?.status, showResubmit]);

  const isPastDue = useMemo(() => {
    return new Date(practice?.due_date) < new Date();
  }, [practice?.due_date]);

  return (
    <div className="px-8 pb-12 min-h-screen bg-slate-100 dark:bg-neutral-900">
      {/* Header con navegación */}
      <Link
				href="/practices"
				className="inline-flex items-center gap-2 text-[0.85rem] text-default-600 hover:text-primary-500 transition-colors"
			>
				<ArrowLeftIcon className="size-5" />
				<span>Tornar enrere</span>
			</Link>
      
      {/* Header section */}
      <div className="mt-2 mb-8">
        <div className="flex items-end justify-between gap-2 mb-2">
          <Chip color="primary" variant="flat">
						{practice?.course?.name}
					</Chip>
          <PracticeStatus status={practice?.status || "not_submitted"} />
        </div>
        <h1 className="text-3xl font-bold mb-3">{practice?.name}</h1>
        <div className="flex flex-wrap gap-7 text-default-700">
          <div className="flex items-center gap-1">
            <CalendarIcon className="size-4" />
            <span>Data límit: {formatDate(practice?.due_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <CodeBracketIcon className="size-4" />
            <span>Llenguatge: {practice?.programming_language}</span>
          </div>
          {practice?.submission_date && (
            <div className="flex items-center gap-1">
              <PaperClipIcon className="size-4" />
              <span>Últim lliurament: {formatDate(practice.submission_date)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="md:col-span-2">
          {/* Descripción de la práctica */}
          <Card className="mb-6">
            <CardHeader>
              <h2 className="text-xl font-semibold px-2 pt-1">Descripció de la pràctica</h2>
            </CardHeader>
            <Divider />
            <CardBody>
              <div className="text-default-700 whitespace-pre-line px-2 pb-1">
                {practice?.description}
              </div>
            </CardBody>
          </Card>
          
          {/* Sección de retroalimentación, si existe */}
          {(practice?.status === 'corrected') && (
            <div className="mb-6">
              <FeedbackSection feedback={practice.correction} grade={8} />
            </div>
          )}

          {/* Archivos actuales, si hay una entrega */}
          {practice?.submission_file_name && practice?.submission_file_name.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <h2 className="text-xl font-semibold px-2 pt-1">Arxius enviats</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                <FileList files={practice?.submission_file_name ? [practice.submission_file_name] : []} onDelete={null} />
              </CardBody>
            </Card>
          )}
        </div>

        {/* Columna lateral */}
        <div>
          {/* Panel de subida de archivos */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold px-2 pt-1">
                {showResubmit ? "Tornar a enviar" : "Lliurar pràctica"}
              </h2>
            </CardHeader>
            <Divider />
            <CardBody>
              {practice?.status === 'corrected' && !showResubmit ? (
                <div className="text-center py-4">
                  <CheckCircleIcon className="size-12 mx-auto mb-3 text-success-500" />
                  <p className="mb-4 px-1.5">Aquesta pràctica ja ha estat corregida i avaluada.</p>
                  
                  {/* Prepare for resubmit_available boolean condition for future*/}
                  {true && (
                    <Button 
                      color="primary" 
                      variant="flat" 
                      onPress={() => setShowResubmit(true)}
                    >
                      Tornar a enviar
                    </Button>
                  )}
                </div>
              ) : isPastDue && !practice?.submission_date ? (
                <div className="text-center py-4">
                  <ExclamationTriangleIcon className="size-12 mx-auto mb-3 text-danger-500" />
                  <p className="text-danger-500 font-medium mb-2">La data límit ha passat</p>
                  <p className="mb-4">Contacta amb el professor si necessites una extensió.</p>
                </div>
              ) : (
                <FileUploader 
                  files={files} 
                  setFiles={setFiles} 
                  disabled={!canSubmit || ['correcting', 'submitted'].includes(practice?.status)}
                />
              )}
            </CardBody>
            {canSubmit && !isPastDue && (
              <CardFooter className="flex justify-end gap-2">
                {showResubmit && (
                  <Button 
                    variant="light" 
                    onPress={() => setShowResubmit(false)}
                  >
                    Cancel·lar
                  </Button>
                )}
                <Button 
                  color="primary" 
                  onPress={handleSubmit} 
                  isLoading={isSubmitting}
                  isDisabled={files.length === 0}
                >
                  {isSubmitting 
                    ? "Enviant..." 
                    : showResubmit 
                      ? "Tornar a enviar" 
                      : "Enviar pràctica"
                  }
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}