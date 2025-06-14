'use client';

import { title, subtitle } from "@/components/primitives";
import { CourseCard } from "@/components/course-card";
import { HorizontalCourseCard } from "@/components/horizontal-course-card";
import { PracticeTable } from "@/components/practice-table";
import { WeekCalendarDemo } from "@/components/week-calendar";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Course } from "@/types/course";
import { Practice } from "@/types/practice";
import { getMyRecentCourses } from "@/app/actions/course";
import { getMyPractices } from "@/app/actions/practice";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { CourseCardSkeleton, HorizontalCourseCardSkeleton } from "@/components/course-cards-skeleton";
import { getUserFromClient } from '@/app/lib/client-session';

export default function Home() {
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [cardsPerRow, setCardsPerRow] = useState(3);
  const [expandFeaturedCourse, setExpandFeaturedCourse] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setContainerWidth(width);

        if (width < 470) {
          setCardsPerRow(1);
          setExpandFeaturedCourse(false);
        } else if (width < 805) {
          setCardsPerRow(2);
          setExpandFeaturedCourse(false);
        } else if (width < 860) {
          setCardsPerRow(2);
          setExpandFeaturedCourse(true);
        } else {
          setCardsPerRow(3);
          setExpandFeaturedCourse(true);
        }

        console.log("Width (ResizeObserver):", width);
      }
    });

    observer.observe(container);
      
    return () => {
      observer.unobserve(container);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const user = await getUserFromClient();
        setIsTeacher(user?.is_teacher || user?.is_admin || false);

        const { data: courses } = await getMyRecentCourses(cardsPerRow+1);
        setRecentCourses(courses);

        const { data: practices } = await getMyPractices();
        setPractices(practices);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [cardsPerRow]);

  const featuredCourse = recentCourses.length > 0 ? recentCourses[0] : null;
  const remainingCourses = recentCourses.length > 1 
    ? recentCourses.slice(1)
    : [];

  const handleSavePractice = (updatedPractice: Practice) => {
    const existingPracticeIndex = practices?.findIndex(
      practice => practice.id === updatedPractice.id
    );

    if (existingPracticeIndex !== undefined && existingPracticeIndex !== -1 && practices) {
      // Actualizar práctica existente, conservando atributos anteriores
      const existingPractice = practices[existingPracticeIndex];

      // Eliminar propiedades null o undefined del updatedPractice
      const filteredUpdate = Object.fromEntries(
        Object.entries(updatedPractice).filter(([_, value]) => value !== null && value !== undefined)
      ) as Practice;
      
      const mergedPractice = {
        ...existingPractice,
        ...filteredUpdate,
      };

      const updatedPractices = [...practices];
      updatedPractices[existingPracticeIndex] = mergedPractice;

      setPractices(updatedPractices);
    } else if (practices) {
      // Añadir nueva práctica
      const newPractices = [...(practices ?? []), updatedPractice];
      setPractices(newPractices);
    }
  };

  const handleDeletePractice = (practiceId: string) => {
    if (!practices) return;

    const filteredPractices = practices?.filter(
      practice => practice.id !== practiceId
    );
    
    setPractices(filteredPractices ?? []);
  };

  return (
    <section className="px-8 pb-4 flex flex-col min-h-screen gap-16">
      <div className="flex flex-col lg:flex-row items-start gap-16">
        <div ref={containerRef} className="w-full lg:flex-1 min-w-0 flex flex-col">
          <h2 className={title({ size: "sm" })}>Cursos recents</h2>

          {!isLoading && recentCourses.length === 0 ? (
            <div className="mt-4 p-6 bg-content1 rounded-3xl border border-default-200 text-center">
              <AcademicCapIcon className="size-16 mx-auto text-default-400 mb-4" />
              <h3 className="text-xl font-semibold text-default-700 mb-2">Cap curs recent trobat</h3>
              <p className="text-default-500 mb-4">
                Encara no has accedit a cap curs. Comença explorant els cursos disponibles.
              </p>
              <Button
                color="primary"
                as={Link}
                href={`/courses`}
              >
                Descobreix cursos
              </Button>
            </div>
          ) : (
            <>
              {/* Featured Course (Horizontal Card) */}
              {isLoading ? (
                <div className="mt-4 mb-6">
                  <HorizontalCourseCardSkeleton
                    expand={expandFeaturedCourse}
                  />
                </div> 
              ) : featuredCourse && (
                <div className="mt-4 mb-6">
                  <HorizontalCourseCard
                    course={featuredCourse} 
                    expand={expandFeaturedCourse}
                  />
                </div>
              )}
              
              {/* Regular Course Cards in a grid */}
              {isLoading ? (
                <div className={`grid grid-cols-1 ${
                  cardsPerRow >= 2 ? 'sm:grid-cols-2' : ''
                } ${
                  cardsPerRow >= 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
                  {Array.from({ length: cardsPerRow }).map((_, i) => (
                    <CourseCardSkeleton key={i} />
                  ))}
                </div>
              ) : remainingCourses.length > 0 && (
                <div className={`grid grid-cols-1 ${
                  cardsPerRow >= 2 ? 'sm:grid-cols-2' : ''
                } ${
                  cardsPerRow >= 3 ? 'lg:grid-cols-3' : ''} gap-6`}>
                  <AnimatePresence initial={false} mode="popLayout">
                    {remainingCourses.slice(0, cardsPerRow).map((course, index) => (
                      <motion.div
                        key={course.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <CourseCard course={course} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {/* Add empty placeholder divs to maintain grid layout if fewer items than columns */}
                  {remainingCourses.length % cardsPerRow !== 0 && 
                    remainingCourses.length < cardsPerRow && 
                    Array.from({ length: cardsPerRow - (remainingCourses.length % cardsPerRow) }).map((_, i) => (
                      <div key={`placeholder-${i}`} className="hidden sm:block"></div>
                    ))
                  }
                </div>
              )}
            </>
          )}
        </div>
        <div className="min-w-[485px] w-full lg:w-auto shrink-0 flex flex-col gap-4">
          <h2 className={title({ size: "sm" })}>Calendari</h2>
          <WeekCalendarDemo practices={practices} />
        </div>
      </div>
      <div className="hidden lg:block">
        <h2 className={title({ size: "sm" })}>Properes entregues</h2>
        <div className="mt-4 p-4 rounded-3xl border-1.5 border-default-200 bg-content1">
          <PracticeTable practices={practices} isLoading={isLoading} isTeacher={isTeacher} onSave={handleSavePractice} onDelete={handleDeletePractice} />
        </div>
      </div>
    </section>
  );
}
