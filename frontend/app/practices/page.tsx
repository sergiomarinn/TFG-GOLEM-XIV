'use client';

import React from 'react';
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { Tab, Tabs } from "@heroui/tabs";
import { Divider } from "@heroui/divider";
import { Selection } from '@react-types/shared';
import {
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { 
  SearchIcon, 
  ChevronDownIcon 
} from '@/components/icons';
import { 
  AcademicCapIcon, 
  ArrowsUpDownIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon, 
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline';
import { PracticeCard } from '@/components/practice-card';
import { Practice } from '@/types/practice';
import { Course } from '@/types/course';
import { getMyPractices } from '@/app/actions/practice';
import { PracticeCardSkeleton } from '@/components/practice-cards-skeleton';

const sortOptions = [
  { name: "Més recents", uid: "recent" },
  { name: "Data de venciment", uid: "due_date" }
];

export default function PracticesGeneralPage() {
  const [practices, setAllPractices] = React.useState<Practice[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchPracticesData = async () => {
      try {
        setIsLoading(true);
        const { data: practices } = await getMyPractices();
        setAllPractices(practices);
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPracticesData();
  }, []);

  const [filterValue, setFilterValue] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState<Selection>("all");
  const [sortOption, setSortOption] = React.useState<Selection>(new Set(["recent"]));
  const [activeTab, setActiveTab] = React.useState("corrected");

  const courseOptions = React.useMemo(() => {
    let filtered = [...practices];

    if (activeTab !== "all") {
      filtered = filtered.filter(practice => practice.status === activeTab);
    }
    
    if (!filtered || filtered.length === 0) return [{ uid: 'all', name: 'Tots els cursos' }];

    const uniqueCourses = new Map<string, Course>();
    
    filtered.forEach(practice => {
      if (practice.course && practice.course.id) {
        uniqueCourses.set(practice.course.id, practice.course);
      }
    });
    
    const options = Array.from(uniqueCourses.values()).map(course => ({
      uid: course.id,
      name: course.name
    }));

    return options
  }, [practices, activeTab]);
  
  const hasSearchFilter = Boolean(filterValue);

  // Obtener nombre del filtro seleccionado
  const sortOptionName = React.useMemo(() => {
    const value = Array.from(sortOption)[0];
    return sortOptions.find((option) => option.uid === value)?.name || "Ordenar por";
  }, [sortOption]);

  // Filtrar las prácticas
  const filteredPractices = React.useMemo(() => {
    let filtered = [...practices];

    // Filtro por estado (pestaña)
    if (activeTab !== "all") {
      filtered = filtered.filter(practice => practice.status === activeTab);
    }
    
    // Filtro por texto (busqueda)
    if (hasSearchFilter) {
      filtered = filtered.filter(practice => 
        practice.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        practice.course?.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Filtro por curso
    if (courseFilter !== "all" && Array.from(courseFilter).length !== courseOptions.length) {
      filtered = filtered.filter(practice =>
        Array.from(courseFilter).includes(practice.course?.id ?? "")
      );
    }
    
    // Ordenar prácticas
    const sortBy = Array.from(sortOption)[0];
    switch(sortBy) {
      case 'recent':
        // Ordenar poniendo primero las que tienen submission_date, luego las que no
        filtered.sort((a, b) => {
          const hasSubmissionA = !!a.submission_date;
          const hasSubmissionB = !!b.submission_date;
          
          // Si una tiene submission_date y la otra no, priorizar la que tiene
          if (hasSubmissionA && !hasSubmissionB) return -1;
          if (!hasSubmissionA && hasSubmissionB) return 1;
          
          // Si ambas tienen o ambas no tienen submission_date, ordenar por fecha
          const dateA = a.submission_date || a.due_date;
          const dateB = b.submission_date || b.due_date;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'due_date':
        // Ordenar por fecha límite (más próxima primero)
        filtered.sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
        break;
    }
    
    return filtered;
  }, [practices, filterValue, courseFilter, sortOption, activeTab]);

  // Conteo de prácticas por estado
  const practiceCounts = React.useMemo(() => {
    return {
      all: practices.length,
      not_submitted: practices.filter(p => p.status === 'not_submitted').length,
      submitted: practices.filter(p => p.status === 'submitted').length,
      correcting: practices.filter(p => p.status === 'correcting').length,
      corrected: practices.filter(p => p.status === 'corrected').length,
      rejected: practices.filter(p => p.status === 'rejected').length
    };
  }, [practices]);

  // Contenido superior de la página (filtros)
  const topContent = React.useMemo(() => {
    return (
      <div className="flex justify-between gap-3 items-end w-full mb-4">
        <Input
          isClearable
          className="w-full"
          variant="bordered"
          placeholder="Cerca per nom de pràctica..."
          startContent={<SearchIcon />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={<AcademicCapIcon className="size-4" />}
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat"
              >
                Curs
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Filtrar por curso"
              closeOnSelect={true}
              selectedKeys={courseFilter}
              selectionMode="multiple"
              onSelectionChange={setCourseFilter}
            >
              {courseOptions.map((course, index) => (
                <DropdownItem key={course.uid ?? index}>
                  {course.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={<ArrowsUpDownIcon className="size-4" />}
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat"
              >
                {sortOptionName}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Ordenar por"
              closeOnSelect={true}
              selectedKeys={sortOption}
              selectionMode="single"
              onSelectionChange={setSortOption}
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
  }, [filterValue, courseFilter, sortOption, sortOptionName, filteredPractices]);

  return (
    <div className="px-8 pb-8 min-h-screen">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/practices">Pràctiques</BreadcrumbItem>
      </Breadcrumbs>
      
      {/* Header section */}
      <div className="container px-2 pt-8 pb-5">
        <h1 className="text-4xl font-bold pl-0.5 mb-2">Les meves pràctiques</h1>
        <p className="text-default-600">
          Consulta totes les pràctiques dels teus cursos i explora&apos;n l&apos;estat i els detalls
        </p>
      </div>
      <Divider className="mb-8" />
      
      {/* Tabs for practice status */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={(key) => setActiveTab(key as string)}
        aria-label="Estat de les pràctiques"
        variant="underlined"
        size="lg"
        classNames={{
          base: "mb-2",
          tab: "h-10"
        }}
      >
        <Tab 
          key="all" 
          title={
            <div className="flex items-center gap-2">
              <span>{`Totes (${practiceCounts.all})`}</span>
            </div>
          }
        />
        <Tab 
          key="corrected"
          title={
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-5 text-success-500" />
              <span>{`Corregides (${practiceCounts.corrected})`}</span>
            </div>
          }
        />
        <Tab 
          key="submitted" 
          title={
            <div className="flex items-center gap-2">
              <ArrowPathIcon className="size-5 text-primary-500" />
              <span>{`Entregades (${practiceCounts.submitted})`}</span>
            </div>
          }
        />
        <Tab 
          key="correcting" 
          title={
            <div className="flex items-center gap-2">
              <ClockIcon className="size-5 text-warning-500" />
              <span>{`Corregint-se  (${practiceCounts.correcting})`}</span>
            </div>
          }
        />
        <Tab 
          key="rejected" 
          title={
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="size-5 text-danger-500" />
              <span>{`Rebutjades (${practiceCounts.rejected})`}</span>
            </div>
          }
        />
        <Tab 
          key="not_submitted" 
          title={
            <div className="flex items-center gap-2">
              <XCircleIcon className="size-5 text-danger-500" />
              <span>{`No entregades (${practiceCounts.not_submitted})`}</span>
            </div>
          }
        />
      </Tabs>
      
      {/* Filters and sorting */}
      <div className="mb-6">
        {topContent}
      </div>
      
      {/* Practice list */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <PracticeCardSkeleton key={i} />
          ))
        ) : filteredPractices.length > 0 ? (
          filteredPractices.map(practice => (
            <PracticeCard key={practice.id} practice={practice}/>
          ))
        ) : (
          <div className="bg-default-50 border border-default-200 rounded-lg p-8 text-center">
            <CodeBracketIcon className="size-16 mx-auto text-default-400 mb-4" />
            <h3 className="text-xl font-semibold text-default-700 mb-2">Cap pràctica trobada</h3>
            <p className="text-default-500">
              No s&apos;ha trobat cap pràctica amb els filtres aplicats. Prova de canviar els criteris de cerca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}