'use client';

import React from 'react';
import { CourseCard } from '@/components/course-card';
import { Breadcrumbs, BreadcrumbItem } from "@heroui/breadcrumbs";
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Badge } from "@heroui/badge";
import {
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";
import { Selection } from '@react-types/shared';
import { SearchIcon, ChevronDownIcon, AlphabeticalSortIcon } from '@/components/icons';
import { 
  AcademicCapIcon,
	CodeBracketIcon,
	CalendarIcon,
	ClockIcon
} from '@heroicons/react/24/outline';
import { Course } from '@/types/course';
import { getMyCourses } from '../actions/course';

const sortOptions = [
	{ name: "Per Nom", uid: "name", icon: <AlphabeticalSortIcon className="size-4" /> },
	{ name: "Per Accedits Recentment", uid: "recently_accessed", icon: <ClockIcon className="size-4" /> }
];

export default function CoursesPage() {
  const [courses, setCourses] = React.useState<Course[]>([]);
  
  React.useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { courses } = await getMyCourses();
        setCourses(courses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    }
    fetchCourses();
  }, []);

  const programmingLanguageOptions = React.useMemo(() => {
    const languages = new Set<string>();
    courses.forEach((course) => {
      course.programming_languages.forEach((language) => {
        languages.add(language);
      });
    });
    return Array.from(languages).map((language) => ({
      name: language,
      uid: language
    }));
  }, [courses]);

  const academicYearOptions = React.useMemo(() => {
    const years = new Set<string>();
    courses.forEach((course) => {
      years.add(course.academic_year);
    });
    return Array.from(years).map((year) => ({
      name: year,
      uid: year
    }));
  }, [courses]);

  const [filterValue, setFilterValue] = React.useState("");
  const [academicYearFilter, setAcademicYearFilter] = React.useState<Selection>("all");
  const [languageFilter, setLanguageFilter] = React.useState<Selection>("all");
	const [sortFilter, setSortFilter] = React.useState<Selection>(new Set(["name"]));
  const hasSearchFilter = Boolean(filterValue);
	const sortFilterValue = React.useMemo(() => {
		const value = Array.from(sortFilter)[0];
		return sortOptions.find((option) => option.uid === value)?.name || "Ordenar per nom";
	}, [sortFilter]);

	const sortFilterIcon = React.useMemo(() => {
		const value = Array.from(sortFilter)[0];
		return sortOptions.find((option) => option.uid === value)?.icon || <AlphabeticalSortIcon className="size-4" />;
	}, [sortFilter]);

  // Filtrar cursos según búsqueda y filtros
  const filteredCourses = React.useMemo(() => {
    let filtered = [...courses];

    // Filtro de búsqueda
    if (hasSearchFilter) {
      filtered = filtered.filter((course) => 
        course.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    // Filtro de año académico
    if (academicYearFilter !== "all" && Array.from(academicYearFilter).length !== academicYearOptions.length) {
      filtered = filtered.filter((course) => 
        Array.from(academicYearFilter).includes(course.academic_year)
      );
    }

    // Filtro de lenguaje de programación
    if (languageFilter !== "all" && Array.from(languageFilter).length !== programmingLanguageOptions.length) {
      filtered = filtered.filter((course) =>
        course.programming_languages.some(lang => languageFilter.has(lang))
      );
    }

    return filtered;
  }, [courses, filterValue, academicYearFilter, languageFilter]);

	const sortedData = React.useMemo(() => {
		let sorted = [...filteredCourses];
		const sortKey = Array.from(sortFilter)[0] as string;
		switch(sortKey) {
			case "name": // Sort by course name (alphabetical)
				return sorted.sort((a, b) => a.name.localeCompare(b.name));
			case "recently_accessed": // Sort by recently accessed (example logic)
				return sorted.sort((a, b) => b.students_count - a.students_count); // Example: sort by number of students
			default:
				return sorted;
		}
	}, [filteredCourses, sortFilter]);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex justify-between gap-3 items-end mb-6">
        <Input
          isClearable
					variant="faded"
          className="w-full max-w-md"
          placeholder="Cerca per nom de curs..."
          startContent={<SearchIcon />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
        <div className="flex gap-3">
				<Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={sortFilterIcon} 
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat" 
              >
                {sortFilterValue}
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Filtre per curs acadèmic"
              closeOnSelect={true}
              selectedKeys={sortFilter}
              selectionMode="single"
              onSelectionChange={setSortFilter}
            >
              {sortOptions.map((option) => (
                <DropdownItem key={option.uid}>
                  {option.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={<CalendarIcon className="size-4" />} 
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat" 
              >
                Curs Acadèmic
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Filtre per curs acadèmic"
              closeOnSelect={true}
              selectedKeys={academicYearFilter}
              selectionMode="multiple"
              onSelectionChange={setAcademicYearFilter}
            >
              {academicYearOptions.map((option) => (
                <DropdownItem key={option.uid}>
                  {option.name}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>

          <Dropdown>
            <DropdownTrigger className="sm:flex">
              <Button
                startContent={<CodeBracketIcon className="size-4" />} 
                endContent={<ChevronDownIcon className="text-small" />} 
                variant="flat"
              >
                Llenguatge
              </Button>
            </DropdownTrigger>
            <DropdownMenu
              disallowEmptySelection
              aria-label="Filtre per llenguatge"
              closeOnSelect={true}
              selectedKeys={languageFilter}
              selectionMode="multiple"
              onSelectionChange={setLanguageFilter}
            >
              {programmingLanguageOptions.map((option) => (
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
    hasSearchFilter,
    filterValue,
    academicYearFilter,
    languageFilter,
		sortFilter,
    courses.length
  ]);

  // Estado para contar los cursos por semestre
  const [fallCount, springCount] = React.useMemo(() => {
    // En un caso real, deberías tener un campo 'semester' en cada curso
    // Aquí simplemente divido los cursos a la mitad para el ejemplo
    const totalCount = filteredCourses.length;
    return [Math.ceil(totalCount / 2), Math.floor(totalCount / 2)];
  }, [filteredCourses]);

  return (
    <div className="px-8 pb-8 min-h-screen bg-slate-100 dark:bg-neutral-900">
      <Breadcrumbs>
        <BreadcrumbItem href="/">Dashboard</BreadcrumbItem>
        <BreadcrumbItem href="/courses">Cursos</BreadcrumbItem>
      </Breadcrumbs>

      {/* Header section */}
      <div className="container px-2 pt-8 pb-5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold">Els meus cursos</h1>
            <p className="text-default-600 mt-2">
              Explora els teus cursos i accedeix a les seves pràctiques
            </p>
          </div>
          <div className="flex gap-3">
            <Badge content={fallCount} color="primary" placement="top-right">
              <Chip color="primary" variant="flat" size="lg">
                Tardor
              </Chip>
            </Badge>
            <Badge content={springCount} color="warning" placement="top-right">
              <Chip color="warning" variant="flat" size="lg">
                Primavera
              </Chip>
            </Badge>
          </div>
        </div>
      </div>
      <Divider className="mb-8" />

      <div className="container px-2">
        {topContent}
        
        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedData.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
            ))}
          </div>
        ) : (
          <div className="bg-default-50 border border-default-200 rounded-lg p-8 text-center">
            <AcademicCapIcon className="size-16 mx-auto text-default-400 mb-4" />
            <h3 className="text-xl font-semibold text-default-700 mb-2">Cap curs trobat</h3>
            <p className="text-default-500">
              No s'ha trobat cap curs amb els filtres aplicats. Prova de canviar els criteris de cerca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}