'use client';

import React from 'react'
import { useParams } from 'next/navigation';
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
import { AcademicCapIcon, DocumentArrowUpIcon, FunnelIcon, ArrowLongUpIcon, ArrowLongDownIcon, UsersIcon } from '@heroicons/react/24/outline';
import { ParticipantsSection } from '@/components/participants-section';
import { getCourseById } from '@/app/actions/course';
import { Course } from '@/types/course';
import { Practice } from '@/types/practice';
import { User } from '@/app/lib/definitions';

const sortOptions = [
  { name: "Més properes", uid: "asc" },
  { name: "Més llunyanes", uid: "desc" }
];

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [courseInfo, setCourseInfo] = React.useState<Course>();
  const [coursePractices, setCoursePractices] = React.useState<Practice[]>([]);
  const [courseUsers, setCourseUsers] = React.useState<User[]>([]);

  React.useEffect(() => {
    const fetchCourse = async () => {
      try {
        const course = await getCourseById(courseId);
        setCourseInfo(courseInfo);
        setCoursePractices(course.practices || []);
        setCourseUsers(course.users || []);
      } catch (error) {
        console.error(error);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  const courseTeacher = React.useMemo(() => {
    if (courseInfo?.users) {
      const teacher = courseInfo.users.find((user) => user.is_teacher);
      return teacher ? teacher.name : "";
    }
    return "";
  }, [courseInfo]);

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
        Array.from(statusFilter).includes(practice.status),
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
      <div className="flex justify-between gap-3 items-end w-full">
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
            <DropdownTrigger className="sm:flex">
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
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    dateSort,
    coursePractices.length,
    hasSearchFilter,
  ]);

  return (
    <div className="px-8 pb-8 min-h-screen bg-slate-100 dark:bg-neutral-900">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/courses">Cursos</BreadcrumbItem>
        <BreadcrumbItem href={`/courses/${courseId}`}>{courseInfo?.name}</BreadcrumbItem>
      </Breadcrumbs>
      
      {/* Header section */}
      <div className="container px-2 pt-8 pb-5">
        <div className="flex items-center mb-2">
          <Chip color="primary" size="sm" variant="flat" className="mr-2">
            {courseInfo?.academic_year}
          </Chip>
          <Chip color="primary" size="sm" variant="flat" className="mr-2">
            {courseInfo?.semester}
          </Chip>
        </div>
        <h1 className="text-4xl font-bold mb-2">{courseInfo?.name}</h1>
        <div className="pl-0.5 flex items-center text-default-800 mb-3">
          <AcademicCapIcon className="size-5 mr-1" />
          <span>{courseTeacher}</span>
        </div>
        <p className="text-default-600 pl-0.5">{courseInfo?.description}</p>
      </div>
      <Divider className="mb-8" />

      {/* Layout of 2 columns */}
      <div className="flex flex-row gap-6">
        {/* coursePractices */}
        <div className="w-[63%]">
          <div className="flex items-center mb-4 pl-4">
            <DocumentArrowUpIcon className="size-9 text-primary-600 mr-2" />
            <h2 className="text-3xl font-semibold text-default-900">Pràctiques</h2>
          </div>
          <div className="flex flex-col gap-4 ml-1 p-4 rounded-3xl border-1.5 border-default-200 bg-content1">  
            {practicesTopContent}
            {sortedPractices.length !== 0 ? (
              <div className="flex flex-col gap-3">
                {sortedPractices.map((practice) => (
                  <PracticeCourseCard 
                    key={practice.id}
                    name={practice.name}
                    due_date={practice.due_date}
                    status={practice.status}>
                  </PracticeCourseCard>
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
        <div className="w-[37%]">
          <div className="flex items-center mb-4 pl-4">
            <UsersIcon className="size-9 text-primary-600 mr-2" />
            <h2 className="text-3xl font-semibold text-default-900">Participants</h2>
          </div>
          <ParticipantsSection courseUsers={courseUsers} />
        </div>
      </div>
    </div>
  );
}