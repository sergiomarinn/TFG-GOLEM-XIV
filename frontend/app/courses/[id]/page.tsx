'use client';

import React from 'react'
import { useParams, useRouter } from 'next/navigation';
import { PracticeCourseCard } from '@/components/practice-course-card';
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Chip } from "@heroui/chip";
import { Alert } from '@heroui/alert';
import {
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { Divider } from "@heroui/divider";
import { Selection } from '@react-types/shared';
import { SearchIcon, ChevronDownIcon } from '@/components/icons'
import { practiceStatusOptions } from "@/types";
import { AcademicCapIcon, DocumentArrowUpIcon, FunnelIcon, ArrowLongUpIcon, ArrowLongDownIcon, UsersIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import { ParticipantsSection } from '@/components/participants-section';
import { getCourseById, updateCourseLastAccess } from '@/app/actions/course';
import { Course } from '@/types/course';
import { Practice } from '@/types/practice';
import { User } from '@/app/lib/definitions';
import { getUserFromClient } from '@/app/lib/client-session';
import { CourseDrawer } from '@/components/drawer-course';
import { motion, AnimatePresence } from "framer-motion";
import { PracticeDrawer } from '@/components/drawer-practice';
import { PracticeCourseCardSkeleton } from '@/components/practice-cards-skeleton';
import { Skeleton } from '@heroui/skeleton';

const sortOptions = [
  { name: "Més properes", uid: "asc" },
  { name: "Més llunyanes", uid: "desc" }
];

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const [courseInfo, setCourseInfo] = React.useState<Course>();
  const [coursePractices, setCoursePractices] = React.useState<Practice[]>([]);
  const [courseUsers, setCourseUsers] = React.useState<User[]>([]);
  const [canEditCourse, setCanEditCourse] = React.useState(false);
  const [isCourseDrawerOpen, setIsCourseDrawerOpen] = React.useState(false);
  const [isPracticeDrawerOpen, setIsPracticeDrawerOpen] = React.useState(false);
  const [currentPractice, setCurrentPractice] = React.useState<Practice | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        setIsLoading(true);
        const course = await getCourseById(courseId);
        setCourseInfo(course);
        setCoursePractices(course.practices || []);
        setCourseUsers(course.users || []);
        
        await updateCourseLastAccess(courseId);
        
        const user = await getUserFromClient();
        const isInCourse = course.users?.some(u => u.niub === user?.niub);
        const isTeacherInCourse = isInCourse && user?.is_teacher;
        setCanEditCourse(isTeacherInCourse || user?.is_admin || false);
      } catch (error) {
        console.error(error);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const courseTeacher = React.useMemo(() => {
    if (courseInfo?.users) {
      const teacher = courseInfo.users.find((user) => user.is_teacher);
      return teacher ? teacher.name + " " + teacher.surnames : "";
    }
    return "";
  }, [courseInfo]);

  const handleUpdateCourse = (updatedCourse: Course) => {
    setCourseInfo(prev => ({
      ...prev,
      ...updatedCourse,
    }));
  };

  const handleDeleteCourse = (courseId: string) => {
    router.push("/courses");
  };

  const handleEditPractice = (practice: Practice) => {
    practice.course = courseInfo;
    setCurrentPractice(practice);
    setIsPracticeDrawerOpen(true);
  };

  const handleNewPractice = () => {
    setCurrentPractice(null);
    setIsPracticeDrawerOpen(true);
  };

  const handleSavePractice = (updatedPractice: Practice) => {
    const existingPracticeIndex = courseInfo?.practices?.findIndex(
      practice => practice.id === updatedPractice.id
    );

    if (existingPracticeIndex !== undefined && existingPracticeIndex !== -1 && courseInfo) {
      // Actualizar práctica existente
      const updatedPractices = [...(courseInfo.practices ?? [])];
      updatedPractices[existingPracticeIndex] = updatedPractice;

      setCourseInfo({ ...courseInfo, practices: updatedPractices });
      setCoursePractices(updatedPractices);
    } else if (courseInfo) {
      // Añadir nueva práctica
      const newPractices = [...(courseInfo.practices ?? []), updatedPractice];
      setCourseInfo({ ...courseInfo, practices: newPractices });
      setCoursePractices(newPractices);
    }
  };

  const handleDeletePractice = (practiceId: string) => {
    if (!courseInfo) return;

    const filteredPractices = courseInfo?.practices?.filter(
      practice => practice.id !== practiceId
    );

    setCourseInfo({
      ...courseInfo,
      practices: filteredPractices,
    });
    
    setCoursePractices(filteredPractices ?? []);
  };

  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [dateSort, setDateSort] = React.useState<Selection>(new Set(["asc"]));
  const hasSearchFilter = Boolean(filterValue);

  const dateSortValue = React.useMemo(() => {
      const value = Array.from(dateSort)[0];
      return sortOptions.find((option) => option.uid === value)?.name || "Ordenar per data";
    }, [dateSort]);

  const filteredPractices = React.useMemo(() => {
    let filteredPractices = [...coursePractices];

    if (hasSearchFilter) {
      filteredPractices = filteredPractices.filter((practice) =>
        practice.name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== practiceStatusOptions.length) {
      filteredPractices = filteredPractices.filter((practice) =>
        practice.status !== undefined && Array.from(statusFilter).includes(practice.status),
      );
    }

    return filteredPractices;
  }, [coursePractices, filterValue, statusFilter]);

  const sortedPractices = React.useMemo(() => {
    let sortedData = [...filteredPractices];
    
    const sortKey = Array.from(dateSort)[0] as string;
    
    switch(sortKey) {
      case "asc": // Sort by due date (ascending - closest first)
        return sortedData.sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
      case "desc": // Sort by due date (descending - furthest first)
        return sortedData.sort((a, b) => 
          new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
        );
      default:
        return sortedData;
    }
  }, [filteredPractices, dateSort]);

  const practicesTopContent = React.useMemo(() => {
    return (
      <div className="flex justify-between gap-3 items-center w-full">
        <Input
          isClearable
          className="w-full"
          placeholder="Cerca per nom..."
          startContent={<SearchIcon />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={<FunnelIcon className="size-4" />} 
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat" 
              >
                Estat
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Columna Estat"
              closeOnSelect={false}
              selectedKeys={statusFilter}
              selectionMode="multiple"
              onSelectionChange={setStatusFilter}
            >
              {practiceStatusOptions.map((status) => (
                <DropdownItem key={status.uid}>
                  {status.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger className="hidden lg:flex">
              <Button
                startContent={
                  Array.from(dateSort)[0] === "asc" 
                    ? <ArrowLongUpIcon className="size-4" /> 
                    : <ArrowLongDownIcon className="size-4" />
                }
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat"
              >
                {dateSortValue}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Ordenar per data"
              closeOnSelect={true}
              selectedKeys={dateSort}
              selectionMode="single"
              onSelectionChange={setDateSort}
            >
              {sortOptions.map((option) => (
                <DropdownItem key={option.uid}>
                  {option.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <AnimatePresence>
            {canEditCourse && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  aria-label="Afegir pràctica"
                  color="success"
                  variant="flat"
                  startContent={<PlusIcon className="size-5" />}
                  onPress={() => handleNewPractice()}
                >
                  Afegir pràctica
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    dateSort,
    coursePractices.length,
    hasSearchFilter,
    canEditCourse
  ]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-center text-red-600 text-lg font-semibold bg-red-100 p-4 rounded-3xl shadow max-w-lg">
          No tens accés a aquest curs o no s&apos;ha pogut carregar correctament.
        </p>
      </div>
    )
  }

  return (
    <div className="px-8 pb-8 min-h-screen">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/courses">Cursos</BreadcrumbItem>
        <BreadcrumbItem href={`/courses/${courseId}`}>{courseInfo?.name}</BreadcrumbItem>
      </Breadcrumbs>
      
      {/* Header section */}
      <div className="relative w-full px-2 pt-8 pb-5">
        {isLoading ? (
          <div>
            <div className="flex items-center mb-2">
              {/* Academic year and semester chip skeletons */}
              <Skeleton className="h-6 w-24 rounded-full mr-2" />
              <Skeleton className="h-6 w-28 rounded-full mr-2" />
            </div>
            
            {/* Course name skeleton */}
            <Skeleton className="h-10 w-3/4 rounded-lg mb-2" />
            
            {/* Teacher name skeleton */}
            <div className="pl-0.5 flex items-center mb-3">
              <Skeleton className="size-5 mr-1 rounded-md" />
              <Skeleton className="h-5 w-48 rounded-md" />
            </div>
            
            {/* Description skeleton - multiple lines */}
            <div className="pl-0.5 space-y-2">
              <Skeleton className="h-4 w-full rounded-md" />
              <Skeleton className="h-4 w-5/6 rounded-md" />
              <Skeleton className="h-4 w-4/6 rounded-md" />
            </div>
            
            {/* Edit button skeleton */}
            <Skeleton className="h-10 w-32 rounded-lg absolute top-10 right-2" />
          </div>
        ) : (
          <div>
            <div className="flex items-center mb-2">
              <Chip color="primary" size="sm" variant="flat" className="mr-2">
                {courseInfo?.academic_year}
              </Chip>
              <Chip color="primary" size="sm" variant="flat" className="mr-2 capitalize">
                {courseInfo?.semester}
              </Chip>
            </div>
            <h1 className="text-4xl font-bold mb-2">{courseInfo?.name}</h1>
            <div className="pl-0.5 flex items-center text-default-800 mb-3">
              <AcademicCapIcon className="size-5 mr-1" />
              <span>{courseTeacher}</span>
            </div>
            <p className="text-default-600 pl-0.5">{courseInfo?.description}</p>
            {canEditCourse && <Button
              className="absolute top-10 right-2"
              color="secondary"
              variant="flat"
              radius="lg"
              startContent={<PencilIcon className="size-4" />}
              onPress={() => setIsCourseDrawerOpen(true)}
            >
              Editar curs
            </Button>}
          </div>
        )}
      </div>
      <Divider className="mb-8" />

      {/* Layout of 2 columns */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* coursePractices */}
        <div className="lg:w-[63%]">
          <div className="flex items-center mb-4 pl-4">
            <DocumentArrowUpIcon className="size-9 text-primary-600 mr-2" />
            <h2 className="text-3xl font-semibold text-default-900">Pràctiques</h2>
          </div>
          <div className="flex flex-col gap-4 ml-1 p-4 rounded-3xl border-1.5 border-default-200 bg-content1">  
            {practicesTopContent}
            
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PracticeCourseCardSkeleton key={i} />
                ))}
              </div>
            ) : sortedPractices.length !== 0 ? (
              <div className="flex flex-col gap-3">
                {sortedPractices.map((practice) => (
                  <div className="relative" key={practice.id}>
                    <PracticeCourseCard 
                      key={practice.id}
                      practice={practice}
                      isTeacher={canEditCourse}  
                    />
                    {canEditCourse && <Button
                      className="absolute top-8 right-8 z-20"
                      variant="shadow"
                      radius="full"
                      size="sm"
                      startContent={<PencilIcon className="size-4" />}
                      onPress={() => handleEditPractice(practice)}
                    >
                      Editar
                    </Button>}
                  </div>
                ))}
              </div>) 
              : coursePractices.length > 0 ? (
                <Alert
                  hideIcon
                  color="warning"
                  title="Cap coincidència trobada"
                  description="No s'ha trobat cap pràctica que coincideixi amb els filtres aplicats."
                />
              ) : null
            }
        
            {/* Empty state (will show if no coursePractices) */}
            {coursePractices.length === 0 && (
              <Alert
                color="primary"
                title="Cap pràctica disponible"
                description="Actualment no hi ha pràctiques assignades en aquest curs. Les pràctiques apareixeran aquí quan estiguin disponibles."
              />
            )}
          </div>
        </div>
        {/* Columna derecha: Participantes */}
        <div className="lg:w-[37%]">
          <div className="flex items-center mb-4 pl-4">
            <UsersIcon className="size-9 text-primary-600 mr-2" />
            <h2 className="text-3xl font-semibold text-default-900">Participants</h2>
          </div>
          <ParticipantsSection courseId={courseInfo?.id || ""} courseUsers={courseUsers} canEditCourse={canEditCourse} isLoading={isLoading} />
        </div>
      </div>
      <CourseDrawer 
        isOpen={isCourseDrawerOpen}
        onOpenChange={setIsCourseDrawerOpen}
        initialCourse={courseInfo || null}
        onSave={handleUpdateCourse}
        onDelete={handleDeleteCourse}
      />
      {courseInfo && (
        <PracticeDrawer 
          isOpen={isPracticeDrawerOpen}
          onOpenChange={setIsPracticeDrawerOpen}
          initialPractice={currentPractice}
          course={courseInfo}
          onSave={handleSavePractice}
          onDelete={handleDeletePractice}
        />
      )}
    </div>
  );
}