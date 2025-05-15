'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CodeBracketIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
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
import { getPracticeById, getPracticeFileInfo, uploadPractice } from '@/app/actions/practice';
import { Practice, PracticeFileInfo } from '@/types/practice';
import { FileUploader } from '@/components/file-uploader';
import { FileList } from '@/components/file-list';

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

// Página principal
export default function PracticeDetailPage() {
  const params = useParams();
  const practiceId = params.id as string;

  const [practice, setPractice] = useState<Practice>();
  const [submissionFilesInfo, setSubmissionFilesInfo] = useState<PracticeFileInfo[]>([]);

  useEffect(() => {
    const fetchPractice = async () => {
      try {
        const practice = await getPracticeById(practiceId);
        setPractice(practice);

        const submissionFileInfo = await getPracticeFileInfo(practiceId);
        setSubmissionFilesInfo([submissionFileInfo]);
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
        description: "Torna-ho a intentar més tard",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
      setShowResubmit(false);
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
            <span className="capitalize">Llenguatge: {practice?.programming_language}</span>
          </div>
          {practice?.submission_date && (
            <div className="flex items-center gap-1">
              <PaperClipIcon className="size-4" />
              <span>Últim lliurament: {formatDate(practice.submission_date)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2">
          {/* Descripción de la práctica */}
          <Card>
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
            <Card className="mt-6">
              <CardHeader>
                <h2 className="text-xl font-semibold px-2 pt-1">Arxius enviats</h2>
              </CardHeader>
              <Divider />
              <CardBody>
                <FileList files={submissionFilesInfo} />
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
                  <ExclamationTriangleIcon className="size-14 mx-auto mb-2 text-danger-500" />
                  <p className="text-danger-500 font-medium mb-2">La data límit ha passat</p>
                  <p className="px-1.5 text-default-800 text-sm">Contacta amb el professor si necessites una extensió.</p>
                </div>
              ) : (
                <FileUploader 
                  files={files} 
                  setFiles={setFiles} 
                  disabled={!canSubmit || ['correcting', 'submitted'].includes(practice?.status)}
                  acceptedExtensions={['zip']}
                  multiple={false}
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