import { title, subtitle } from "@/components/primitives";
import { CourseCard } from "@/components/course-card";
import { HorizontalCourseCard } from "@/components/horizontal-course-card";
import { PracticeTable } from "@/components/practice-table";
import { WeekCalendarDemo } from "@/components/week-calendar";

export default function Home() {
  return (
    <section className="px-8 flex items-start min-h-screen gap-16 bg-slate-100 dark:bg-neutral-900">
      <div className="w-4/6 flex flex-col">
        <h2 className={title({ size: "sm" })}>Cursos recents</h2>
        
        {/* Regular Course Cards in a grid */}
        <div className="mt-4 mb-10 grid grid-cols-1 md:grid-cols-3 place-content-stretch gap-6">
          <div className="col-span-full">
            <HorizontalCourseCard
              title="Sistemes Operatius I"
              students_number={120}
              academic_year="2023-2024"
              programmingLanguage="C & Bash"
              color="purple"
              completedPractices={4}
              totalPractices={4}
              description="Curs introductori als fonaments de la ciència de dades. S'estudien els conceptes bàsics d'anàlisi, visualització i modelització de dades amb R i Python."
            />
          </div>
          <CourseCard 
            title="Algorísmica Avançada"
            students_number={40}
            academic_year="2023-2024"
            programmingLanguage="Python"
            color="blue"
            completedPractices={2}
            totalPractices={3}
          />
          
          <CourseCard 
            title="Intel·ligència Artificial"
            students_number={85}
            academic_year="2023-2024"
            programmingLanguage="Python"
            color="green"
            completedPractices={3}
            totalPractices={3}
          />

          <CourseCard 
            title="Algorísmica Avançada"
            students_number={40}
            academic_year="2023-2024"
            programmingLanguage="Python"
            color="pink"
            completedPractices={2}
            totalPractices={3}
          />
        </div>
        <h2 className={title({ size: "sm" })}>Properes entregues</h2>
        <div className="mt-4 p-4 rounded-3xl border-1.5">
          <PracticeTable />
        </div>
      </div>
      <div className="w-2/6 flex flex-col gap-4">
        <h2 className={title({ size: "sm" })}>Calendari</h2>
        <WeekCalendarDemo />
      </div>
    </section>
  );
}
