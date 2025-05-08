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
import { practiceStatusOptions } from '@/types';
import { PracticeCard } from '@/components/practice-card';

// Datos de ejemplo para las prácticas
const allPractices = [
  {
    id: 1,
    name: "Algoritmos de búsqueda",
    course: {
      id: "EDA",
      name: "Algorísmica Avançada",
      color: "primary"
    },
    status: "corrected",
    grade: 8.5,
    feedback: "Buen trabajo, implementación eficiente de los algoritmos.",
    submission_date: "2025-04-10T14:30:00",
    due_date: "2025-04-09T23:59:59",
    corrected_date: "2025-04-15T10:15:00",
  },
  {
    id: 2,
    name: "Estructuras de datos",
    course: {
      id: "EDA",
      name: "Algorísmica Avançada",
      color: "primary"
    },
    status: "corrected",
    grade: 9.2,
    feedback: "Excelente trabajo, muy buen manejo de las estructuras avanzadas.",
    submission_date: "2025-04-20T18:45:00",
    due_date: "2025-04-20T23:59:59",
    corrected_date: "2025-04-22T14:30:00",
  },
  {
    id: 3,
    name: "Sistema de recomendación",
    course: {
      id: "EDA",
      name: "Algorísmica Avançada",
      color: "primary"
    },
    status: "submitted",
    submission_date: "2025-05-05T21:15:00",
    due_date: "2025-05-05T23:59:59",
  },
  {
    id: 4,
    name: "Instalación de entorno",
    course: {
      id: "BD",
      name: "Bases de Datos",
      color: "secondary"
    },
    status: "corrected",
    grade: 10,
    feedback: "Perfecto, entorno configurado correctamente.",
    submission_date: "2025-03-05T12:30:00",
    due_date: "2025-03-07T23:59:59",
    corrected_date: "2025-03-10T09:45:00",
  },
  {
    id: 5,
    name: "Consultas SQL",
    course: {
      id: "BD",
      name: "Bases de Datos",
      color: "secondary"
    },
    status: "submitted",
    due_date: "2025-05-20T23:59:59",
  },
  {
    id: 6,
    name: "Práctica 3: Algoritmos genéticos",
    course: {
      id: "EDA",
      name: "Algorísmica Avançada",
      color: "primary"
    },
    status: "not_submitted",
    due_date: "2025-05-01T23:59:59",
  },
  {
    id: 7,
    name: "Optimización de consultas",
    course: {
      id: "BD",
      name: "Bases de Datos",
      color: "secondary"
    },
    status: "correcting",
    grade: 7.8,
    feedback: "Buena optimización pero falta explicar algunas decisiones.",
    submission_date: "2025-04-28T23:45:00",
    due_date: "2025-04-28T23:59:59",
    corrected_date: "2025-05-02T16:20:00",
  },
  {
    id: 8,
    name: "Algoritmos distribuidos",
    course: {
      id: "EDA", 
      name: "Algorísmica Avançada",
      color: "primary"
    },
    status: "rejected",
    feedback: "Es necesario corregir los errores en la sección 3.",
    submission_date: "2025-04-15T11:20:00",
    due_date: "2025-04-15T23:59:59",
    corrected_date: "2025-04-18T13:10:00",
    resubmit_date: "2025-04-25T23:59:59",
  }
];

const courseOptions = [
  { name: "Algorísmica Avançada", uid: "EDA" },
  { name: "Bases de Datos", uid: "BD" }
];

const sortOptions = [
  { name: "Més recents", uid: "recent" },
  { name: "Millor qualificació", uid: "best_grade" },
  { name: "Data de venciment", uid: "due_date" }
];

export default function PracticesGeneralPage() {
  const [filterValue, setFilterValue] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState<Selection>("all");
  const [sortOption, setSortOption] = React.useState<Selection>(new Set(["recent"]));
  const [activeTab, setActiveTab] = React.useState("corrected");
  
  const hasSearchFilter = Boolean(filterValue);

  // Obtener nombre del filtro seleccionado
  const sortOptionName = React.useMemo(() => {
    const value = Array.from(sortOption)[0];
    return sortOptions.find((option) => option.uid === value)?.name || "Ordenar por";
  }, [sortOption]);

  // Filtrar las prácticas
  const filteredPractices = React.useMemo(() => {
    let filtered = [...allPractices];

    // Filtro por estado (pestaña)
    if (activeTab !== "all") {
      filtered = filtered.filter(practice => practice.status === activeTab);
    }
    
    // Filtro por texto (busqueda)
    if (hasSearchFilter) {
      filtered = filtered.filter(practice => 
        practice.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        practice.course.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }
    
    // Filtro por curso
    if (courseFilter !== "all" && Array.from(courseFilter)[0] !== "all") {
      filtered = filtered.filter(practice => 
        practice.course.id === Array.from(courseFilter)[0]
      );
    }
    
    // Ordenar prácticas
    const sortBy = Array.from(sortOption)[0];
    switch(sortBy) {
      case 'recent':
        // Ordenar por fecha de corrección (más reciente primero), luego por fecha de entrega
        filtered.sort((a, b) => {
          const dateA = a.corrected_date || a.submission_date || a.due_date;
          const dateB = b.corrected_date || b.submission_date || b.due_date;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        });
        break;
      case 'best_grade':
        // Ordenar por nota (mayor primero)
        filtered.sort((a, b) => {
          const gradeA = a.grade !== undefined ? a.grade : -1;
          const gradeB = b.grade !== undefined ? b.grade : -1;
          return gradeB - gradeA;
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
  }, [allPractices, filterValue, courseFilter, sortOption, activeTab]);

  // Conteo de prácticas por estado
  const practiceCounts = React.useMemo(() => {
    return {
      all: allPractices.length,
      not_submitted: allPractices.filter(p => p.status === 'not_submitted').length,
      submitted: allPractices.filter(p => p.status === 'submitted').length,
      correcting: allPractices.filter(p => p.status === 'correcting').length,
      corrected: allPractices.filter(p => p.status === 'corrected').length,
      rejected: allPractices.filter(p => p.status === 'rejected').length
    };
  }, [allPractices]);

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
              selectionMode="single"
              onSelectionChange={setCourseFilter}
            >
              {courseOptions.map((course) => (
                <DropdownItem key={course.uid}>
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
  }, [filterValue, courseFilter, sortOption, sortOptionName]);

  return (
    <div className="px-8 pb-8 min-h-screen bg-slate-100 dark:bg-neutral-900">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/practices">Pràctiques</BreadcrumbItem>
      </Breadcrumbs>
      
      {/* Header section */}
      <div className="container px-2 pt-8 pb-5">
        <h1 className="text-4xl font-bold pl-0.5 mb-2">Les meves pràctiques</h1>
        <p className="text-default-600">
          Consulta totes les pràctiques dels teus cursos i explora'n l'estat i els detalls
        </p>
      </div>
      <Divider className="mb-8" />
      
      {/* Tabs for practice status */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={setActiveTab}
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
              <span>{`No entregades (${practiceCounts.rejected})`}</span>
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
        {filteredPractices.length > 0 ? (
          filteredPractices.map(practice => (
            <PracticeCard key={practice.id} practice={practice}/>
          ))
        ) : (
          <div className="bg-default-50 border border-default-200 rounded-lg p-8 text-center">
            <CodeBracketIcon className="size-16 mx-auto text-default-400 mb-4" />
            <h3 className="text-xl font-semibold text-default-700 mb-2">Cap pràctica trobada</h3>
            <p className="text-default-500">
              No s'ha trobat cap pràctica amb els filtres aplicats. Prova de canviar els criteris de cerca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}