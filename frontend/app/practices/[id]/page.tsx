'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CodeBracketIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon,
  PencilSquareIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Divider } from '@heroui/divider';
import { Progress } from '@heroui/progress';
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { 
  practiceStatusOptions as statusOptions, 
  practiceStatusColorMap as statusColorMap,
	practiceStatusIconColorMap as statusIconColorMap
} from "@/types";
import { addToast } from '@heroui/toast';
import { useParams } from 'next/navigation';
import { deletePracticeSubmission, downloadMyPractice, downloadPracticeByNiub, getPracticeById, getPracticeFileInfo, getPracticeFileInfoForUser, getPracticeStudent, sendPracticeData, uploadPractice } from '@/app/actions/practice';
import { Practice, PracticeFileInfo } from '@/types/practice';
import { FileUploader } from '@/components/file-uploader';
import { FileList } from '@/components/file-list';
import { useRouter } from "next/navigation";
import { User } from '@/app/lib/definitions';
import { Input } from '@heroui/input';
import { getUserFromClient } from '@/app/lib/client-session';
import { Spinner } from '@heroui/spinner';
import { Avatar } from '@heroui/avatar';
import { PracticeDrawer } from '@/components/drawer-practice';
import { FilesIcon } from '@/components/icons';
import { Skeleton } from '@heroui/skeleton';

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

const FeedbackSection = ({ feedback, grade, isLoading = false }: {feedback: string, grade: number | undefined, isLoading?: boolean}) => {
  return (
    <Card>
      <CardHeader>
				<div className="w-full flex items-center justify-between gap-2 pl-0.5">
          <div className="flex items-center gap-2">
            <PencilSquareIcon className="size-6 text-default-700" />
            <h2 className="text-xl font-semibold">Retroalimentació</h2>
          </div>
					{grade !== undefined && (
						<Chip 
							color={grade >= 5 ? "success" : "danger"} 
							variant="flat" 
							className="ml-auto"
						>
							Nota: {grade.toFixed(2)}
						</Chip>
					)}
				</div>
      </CardHeader>
      <Divider />
      <CardBody>
        {isLoading ? (
          <div className="flex flex-col gap-1">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
          </div>
        ) : feedback ? (
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

const StudentSidebar = ({ practiceStudents, onSelectStudent, selectedStudent }: { practiceStudents: User[], onSelectStudent: (student: User | null) => void, selectedStudent: User | null }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (practiceStudents) {
      setStudents(practiceStudents.filter((student) => student.is_student));
      setIsLoading(false)
    }
  }, [practiceStudents]);

  const filteredStudents = useMemo(() => {
    return students.filter(student => 
      student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.surnames?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      student.niub?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const handleStudentClick = (student: User) => {
    if (selectedStudent && selectedStudent.niub === student.niub) {
      // Si el estudiante ya está seleccionado, lo deseleccionamos
      onSelectStudent(null);
    } else {
      // Si no, lo seleccionamos
      onSelectStudent(student);
    }
  };

  return (
    <div className="h-full">
      <div className="mb-2 relative">
        <Input
          isClearable
          placeholder="Cerca estudiants..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<MagnifyingGlassIcon className="size-4 text-default-500" />}
          onClear={() => setSearchTerm("")}
        />
      </div>
      
      <div className="overflow-y-auto max-h-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Spinner />
          </div>
        ) : filteredStudents.length > 0 ? (
          <ul className="space-y-1">
            {filteredStudents.map((student) => {
              const isSelected = selectedStudent && selectedStudent.niub === student.niub;
              return (
                <li key={student.niub}>
                  <button
                    onClick={() => handleStudentClick(student)}
                    className={`w-full text-left p-2.5 rounded-lg ${
                      isSelected 
                        ? 'bg-primary-100 border-l-4 border-primary-500' 
                        : 'hover:bg-default-100'
                    } active:scale-95 transition-all flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar 
                        name={student.name[0]}
                        classNames={{
                          base: "text-large"
                        }}  
                      />
                      <div>
                        <p className={`text font-medium ${isSelected ? 'text-primary-700' : ''}`}>
                          {student.name + " " + student.surnames}
                        </p>
                        <p className="text-sm text-default-500">{student.niub} • {student.email}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-8 text-default-500">
            {searchTerm ? 'No s\'han trobat estudiants' : 'No hi ha estudiants inscrits'}
          </div>
        )}
      </div>
    </div>
  );
};

const StudentContentView = ({ practiceId, student, onBack } : { practiceId: string, student: User, onBack: () => void }) => {
  const [studentPractice, setStudentPractice] = useState<Practice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [studentFiles, setStudentFiles] = useState<PracticeFileInfo[]>([]);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isDeletingSubmission, setIsDeletingSubmission] = React.useState(false);
  const [isOpenPopoverDelete, setIsOpenPopoverDelete] = useState(false);

  useEffect(() => {
    const fetchStudentDetail = async () => {
      try {
        setIsLoading(true);
        const studentPractice = await getPracticeStudent(practiceId, student.niub ?? "");
        setStudentPractice(studentPractice);
        
        if (studentPractice.status !== "not_submitted") {
          const fileInfo = await getPracticeFileInfoForUser(practiceId, student.niub ?? "");
          setStudentFiles([fileInfo]);
        }
      } catch (error) {
        console.error("Error fetching student details:", error);
        addToast({
          title: "Error en carregar els detalls de l'estudiant",
          description: "No s'han pogut carregar els detalls de l'estudiant.",
          color: "danger"
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (practiceId && student) {
      fetchStudentDetail();
    }
  }, [practiceId, student]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownloadSubmission = async (niub: string) => {
    try {
      setIsDownloading(true);
      await downloadPracticeByNiub(practiceId, niub)

      addToast({
        title: "Descarrega realitzada amb èxit",
        color: "success",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      })
    } catch (error) {
      console.error("Error submitting practice:", error);
      addToast({
        title: "Error en descarrega la tramesa",
        description: "Torna-ho a intentar més tard",
        color: "danger"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    try {
      setIsDeletingSubmission(true);
      // Aquí deberías llamar a la función API para eliminar la submission
      await deletePracticeSubmission(practiceId, student.niub ?? "");
      
      // Actualizar el estado local después de eliminar
      setStudentPractice(prev => prev ? {
        ...prev,
        status: "not_submitted",
        submission_date: undefined,
        submission_file_name: undefined,
        correction: undefined
      } : null);
      setStudentFiles([]);

      addToast({
        title: "Entrega eliminada amb èxit",
        description: "L'entrega de l'estudiant ha estat eliminada correctament.",
        color: "success",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("Error deleting submission:", error);
      addToast({
        title: "Error en eliminar l'entrega",
        description: "No s'ha pogut eliminar l'entrega. Torna-ho a intentar més tard.",
        color: "danger"
      });
    } finally {
      setIsDeletingSubmission(false);
    }
  };

  const handleResendPracticeData = async () => {
    try {
      setIsResending(true);
      await sendPracticeData(practiceId, student.niub ?? "");
      setStudentPractice(prev => prev ? {
        ...prev,
        status: "submitted"
      } : null);

      addToast({
        title: "Pràctica reenviada",
        description: "La pràctica s'ha enviat novament per a la correcció.",
        color: "success",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      });
    } catch (error) {
      console.error("Error resending practice data:", error);
      addToast({
        title: "Error en reenviar la pràctica",
        description: "No s'ha pogut reenviar la pràctica. Torna-ho a intentar més tard.",
        color: "danger"
      });
    } finally {
      setIsResending(false);
    }
};


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-8">
        <p className="text-default-500">No s&apos;ha trobat la informació de l&apos;estudiant</p>
        <Button 
          color="primary" 
          variant="light" 
          className="mt-4"
          onPress={onBack}
        >
          Tornar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Información del estudiante */}
      <Card>
        <CardHeader>
          <div className="w-full flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <InformationCircleIcon className="size-6 text-default-700" />
              <h2 className="text-xl font-semibold">Informació de l&apos;estudiant</h2>
            </div>
          </div>
        </CardHeader>
        <Divider />
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1.5 items-center">
            <div>
              <p className="text-sm text-default-500">Nom complet</p>
              <p className="font-medium">{student.name + " " + student.surnames}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">NIUB</p>
              <p>{student.niub}</p>
            </div>
            <div>
              <p className="text-sm text-default-500">Estat</p>
              <Chip
                 color={
                    studentPractice && studentPractice.status
                      ? statusColorMap[studentPractice.status] || "default"
                      : "default"
                  }
                variant="flat"
                className="mt-1"
              >
                {studentPractice && studentPractice.status
                  ? (statusOptions.find(opt => opt.uid === studentPractice.status)?.name || studentPractice.status)
                  : 'No entregada'}
              </Chip>
            </div>
            {studentPractice && studentPractice.submission_date && (
              <div>
                <p className="text-sm text-default-500">Data d&apos;enviament</p>
                <p>{formatDate(studentPractice.submission_date)}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Archivos enviados */}
      {(studentPractice?.status !== 'not_submitted' ) && (
        <Card>
          <CardHeader>
            <div className="pl-1 w-full flex items-end justify-between">
              <div className="flex items-center gap-2">
                <FilesIcon className="size-6 text-default-700" />
                <h2 className="text-xl font-semibold">Arxius enviats</h2>
              </div>
              <Button
                size="sm"
                color="primary"
                variant="flat"
                startContent={!isDownloading && <ArrowDownTrayIcon className="size-4"/>}
                isLoading={isDownloading}
                onPress={() => handleDownloadSubmission(student.niub ?? "")}
              >
                Descarregar
              </Button>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            {studentFiles.length > 0 ? (
              <FileList files={studentFiles} />
            ) : (
              <p className="text-center text-default-500 py-3">No hi ha arxius disponibles.</p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Sección de retroalimentación */}
      {studentPractice?.status === 'corrected' && (
        <FeedbackSection feedback={studentPractice.correction?.feedback_comments ?? ""} grade={studentPractice?.correction?.grade} />
      )}

      {/* Botones de acción para corrección y eliminación */}
      {(studentPractice?.status === 'submitted' || studentPractice?.status === 'corrected' || studentPractice?.status === 'rejected') && (
        <div className="flex flex-col sm:flex-row gap-3 justify-end">
          <Popover isOpen={isOpenPopoverDelete} onOpenChange={(open) => setIsOpenPopoverDelete(open)}>
            <PopoverTrigger>
              <Button
                color="danger"
                variant="flat"
                startContent={<TrashIcon className="size-4" />}
              >
                Esborrar entrega
              </Button>
            </PopoverTrigger>
            <PopoverContent>
              <div className="flex flex-col gap-3 p-2">
                <p className="text-sm text-default-600">
                  Estàs segur que vols esborrar l&apos;entrega de <strong>{student.name}</strong>?
                </p>
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="light" onPress={() => setIsOpenPopoverDelete(false)}>
                    Cancel·lar
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    onPress={handleDeleteSubmission}
                    isLoading={isDeletingSubmission}
                  >
                    Confirmar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            color="primary"
            startContent={!isResending && <ArrowPathIcon className="size-4" />}
            isLoading={isResending}
            onPress={handleResendPracticeData}
          >
            Reenviar per corregir
          </Button>
        </div>
      )}
    </div>
  );
};

// Página principal
export default function PracticeDetailPage() {
  const params = useParams();
  const practiceId = params.id as string;
  const router = useRouter();

  const [practice, setPractice] = useState<Practice>();
  const [submissionFilesInfo, setSubmissionFilesInfo] = useState<PracticeFileInfo[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [isPracticeDrawerOpen, setIsPracticeDrawerOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  useEffect(() => {
    const fetchUserAndPractice = async () => {
      try {
        setIsLoading(true);
        const user = await getUserFromClient();
        setIsTeacher(user?.is_teacher || user?.is_admin || false);

        const practice = await getPracticeById(practiceId);
        setPractice(practice);
        
        if (practice.status !== "not_submitted") {
          const submissionFileInfo = await getPracticeFileInfo(practiceId);
          setSubmissionFilesInfo([submissionFileInfo]);
        }
      } catch (error) {
        console.error("Error fetching practice:", error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    if (practiceId) {
      fetchUserAndPractice();
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
      await uploadPractice(practice.id ?? "", files[0])

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

  const handleUpdatePractice = (updatedPractice: Practice) => {
    setPractice(prev => ({
      ...prev,
      ...updatedPractice,
    }));
  };

  const handleDeletePractice = (practiceId: string) => {
    router.push(`/courses/${practice?.course_id}`);
  };

  const handleSelectStudent = (student: User | null) => {
    setSelectedStudent(student);
  };

  const handleBackToPractice = () => {
    setSelectedStudent(null);
  };

  const handleDownloadSubmission = async () => {
    try {
      setIsDownloading(true);
      await downloadMyPractice(practice?.id ?? "")

      addToast({
        title: "Descarrega realitzada amb èxit",
        color: "success",
        timeout: 5000,
        shouldShowTimeoutProgress: true,
      })
    } catch (error) {
      console.error("Error downloading practice:", error);
      addToast({
        title: "Error en descarrega la tramesa",
        description: "Torna-ho a intentar més tard",
        color: "danger"
      });
    } finally {
      setIsDownloading(false);
    }
  }

  const canSubmit = useMemo(() => {
    return ['not_submitted', 'rejected'].includes(practice?.status ?? "") || showResubmit;
  }, [practice?.status, showResubmit]);

  const isPastDue = useMemo(() => {
    return new Date(practice?.due_date ?? "") < new Date();
  }, [practice?.due_date]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-red-600 text-lg font-semibold bg-red-100 p-4 rounded-3xl shadow max-w-lg">
          No tens accés a aquesta pràctica o no s&apos;ha pogut carregar correctament.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 pb-12 min-h-screen">
      {/* Header con navegación */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-[0.85rem] text-default-600 hover:text-primary-500 transition-colors"
      >
        <ArrowLeftIcon className="size-5" />
        <span>Tornar enrere</span>
      </button>
      
      {/* Header section */}
      {isLoading ? (
        <div className="mt-2 mb-8">
          <div className="flex items-end justify-between gap-2 mb-2">
            {/* Course name chip skeleton */}
            <Skeleton className="h-6 w-32 rounded-full" />
            
            {/* Edit button or status skeleton based on user role */}
            {isTeacher ? (
              <Button
                color="secondary"
                variant="flat"
                radius="lg"
                isDisabled
                className="opacity-50"
                startContent={<PencilIcon className="size-4" />}
              >
                Editar pràctica
              </Button>
            ) : (
              <Skeleton className="h-10 w-36 rounded-xl" />
            )}
          </div>
          
          {/* Practice name skeleton */}
          <Skeleton className="h-9 w-3/4 rounded-lg mb-3" />
          
          {/* Practice details skeleton */}
          <div className="flex flex-wrap gap-7 text-default-700">
            {/* Due date skeleton */}
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-4 text-default-400" />
              <Skeleton className="h-5 w-36 rounded-md" />
            </div>
            
            {/* Programming language skeleton */}
            <div className="flex items-center gap-1">
              <CodeBracketIcon className="size-4 text-default-400" />
              <Skeleton className="h-5 w-44 rounded-md" />
            </div>
            
            {/* Submission date skeleton (conditional) */}
            <div className="flex items-center gap-1">
              <PaperClipIcon className="size-4 text-default-400" />
              <Skeleton className="h-5 w-48 rounded-md" />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-2 mb-8">
          <div className="flex items-end justify-between gap-2 mb-2">
            <Chip color="primary" variant="flat">
              {practice?.course?.name}
            </Chip>
            {isTeacher ? <Button
              color="secondary"
              variant="flat"
              radius="lg"
              startContent={<PencilIcon className="size-4" />}
              onPress={() => setIsPracticeDrawerOpen(true)}
            >
              Editar pràctica
            </Button> :
            <PracticeStatus status={practice?.status || "not_submitted"} />}
          </div>
          <h1 className="text-3xl font-bold mb-3">{practice?.name}</h1>
          <div className="flex flex-wrap gap-7 text-default-700">
            <div className="flex items-center gap-1">
              <CalendarIcon className="size-4" />
              <span>Data límit: {formatDate(practice?.due_date ?? "")}</span>
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
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna principal */}
        <div className="lg:col-span-2">
          {isTeacher && selectedStudent ? (
            <StudentContentView 
              practiceId={practiceId}
              student={selectedStudent}
              onBack={handleBackToPractice}
            />
          ) : (
            <>
              {/* Descripción de la práctica */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <InformationCircleIcon className="size-6 text-default-700" />
                    <h2 className="text-xl font-semibold">Descripció de la pràctica</h2>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody>
                  {isLoading ? (
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-4 w-full rounded-md" />
                      <Skeleton className="h-4 w-5/6 rounded-md" />
                      <Skeleton className="h-4 w-4/6 rounded-md" />
                    </div>
                  ) : (
                    <div className="text-default-700 whitespace-pre-line px-2 pb-1">
                      {practice?.description}
                    </div>
                  )}
                </CardBody>
              </Card>
              
              {/* Sección de retroalimentación, si existe */}
              {(practice?.status === 'corrected' && !isTeacher) && (
                <div className="mt-6">
                  <FeedbackSection feedback={practice?.correction?.feedback_comments} grade={practice?.correction?.grade} isLoading={isLoading} />
                </div>
              )}

              {/* Archivos actuales, si hay una entrega */}
              {practice?.submission_file_name && practice?.submission_file_name.length > 0 && !isTeacher && (
                <Card className="mt-6">
                  <CardHeader>
                    <div className="pl-1 w-full flex items-end justify-between">
                      <div className="flex items-center gap-2">
                        <FilesIcon className="size-6 text-default-700" />
                        <h2 className="text-xl font-semibold">Arxius enviats</h2>
                      </div>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        startContent={!isDownloading && <ArrowDownTrayIcon className="size-4"/>}
                        isLoading={isDownloading}
                        onPress={handleDownloadSubmission}
                      >
                        Descarregar
                      </Button>
                    </div>
                  </CardHeader>
                  <Divider />
                  <CardBody>
                    <FileList files={submissionFilesInfo} />
                  </CardBody>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Columna lateral - Panel de subida de archivos o menú de estudiantes */}
        <div>
          {isTeacher ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="size-6 text-default-700" />
                  <div className="flex gap-1">
                    <h2 className="text-xl font-semibold mr-2">Estudiants</h2>
                    <Chip color="primary" variant="flat" className="px-[1.4px] text-[15px]">{practice?.users?.filter(user => !user.is_teacher).length}</Chip>
                  </div>
                </div>
              </CardHeader>
              <Divider />
              <CardBody>
                <StudentSidebar 
                  practiceStudents={practice?.users ?? []} 
                  onSelectStudent={handleSelectStudent}
                  selectedStudent={selectedStudent}
                />
              </CardBody>
            </Card>
          ) : (
            /* Panel de subida de archivos para estudiantes */
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CloudArrowUpIcon className="size-6 text-default-700" />
                  <h2 className="text-xl font-semibold">
                    {showResubmit ? "Tornar a enviar" : "Lliurar pràctica"}
                  </h2>
                </div>
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
                    disabled={!canSubmit || ['correcting', 'submitted'].includes(practice?.status ?? "")}
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
          )}
        </div>
      </div>
      {practice?.course && <PracticeDrawer 
        isOpen={isPracticeDrawerOpen}
        onOpenChange={setIsPracticeDrawerOpen}
        initialPractice={practice || null}
        course={practice?.course}
        onSave={handleUpdatePractice}
        onDelete={handleDeletePractice}
      />}
    </div>
  );
}