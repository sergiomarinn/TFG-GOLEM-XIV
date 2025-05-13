'use client';

import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import { DocumentArrowUpIcon, DocumentCheckIcon, ArrowRightIcon, CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Course } from "@/types/course";
import { User } from "@/app/lib/definitions";
import { useState, useEffect } from "react";
import { getCourseTeachers } from "@/app/actions/course";
import { clsx } from "clsx";
import { Link } from "@heroui/link";

interface HorizontalCourseCardProps {
  course: Course;
  expand: boolean;
}

interface TagProps {
  label: string;
};

export const Tag = ({ label }: TagProps) => {
  return (
    <div className="flex items-center justify-center rounded-md backdrop-blur-md bg-white/60">
      <span className="text-xs text-white font-light px-2 py-1 capitalize">{label}</span>
    </div>
  );
}

export const HorizontalCourseCard = ({course, expand}: HorizontalCourseCardProps) => {
  const [teachers, setTeachers] = useState<User[]>([]);
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const teachers = await getCourseTeachers(course.id);
        setTeachers(teachers);
      } catch (error) {
        console.error("Error fetching course teachers:", error);
      }
    }
    fetchTeachers();
  }, [course.id])
  
  const gradients = {
    blue: "bg-gradient-to-br from-blue-500 to-violet-600",
    purple: "bg-gradient-to-br from-purple-500 to-pink-600",
    green: "bg-gradient-to-br from-emerald-500 to-teal-700",
    orange: "bg-gradient-to-br from-amber-500 to-orange-600",
    pink: "bg-gradient-to-br from-pink-400 to-rose-600",
    cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600",
    red: "bg-gradient-to-br from-red-500 to-rose-700",
    indigo: "bg-gradient-to-br from-indigo-500 to-purple-700",
    lime: "bg-gradient-to-br from-lime-400 to-green-600",
    default: "bg-gradient-to-br from-gray-500 to-gray-700"
  };
  
  const backgroundGradient = gradients[course.color];

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-3xl shadow-lg">
      {/* Background with gradient or image */}
      <div className={clsx(
        "relative w-full transition-all duration-400 transform",
        expand ? "h-[280px]" : teachers.length == 0 ? "h-[244px]" : "h-[285px]"
      )}>
        {/* Gradient or Image Background */}
        <div className={`absolute inset-0 ${backgroundGradient}`} />

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Content Container */}
        <div className={clsx(expand ? "flex flex-row" : "flex flex-col", "absolute bottom-0 left-0 w-full h-full")}>
          {/* Left Side Content (1/3) */}
          <div className={clsx(expand ? "w-[36.5%]" : "w-full", "px-6 py-6 backdrop-blur-lg bg-zinc-800/30 flex flex-col justify-between")}>
            {/* Category Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Tag label={course.academic_year}></Tag>
              {course.programming_languages.map((lang, index) => (
                <Tag key={index} label={lang}></Tag>
              ))}
            </div>

            {/* Course Title */}
            <div className="pb-3">
              <h2 className="text-2xl font-semibold text-white mb-1">{course.name}</h2>
              {/* Course Info */}
              <div className="flex items-center justify-between w-full text-white text-sm font-light mb-4">
                <span className="inline-flex items-start justify-center gap-1">
                  <CalendarIcon className="size-5 text-default-200"/>
                  Tardor
                </span>
                <span className="inline-flex items-start gap-1">
                  <UsersIcon className="size-5 text-default-200"/>
                  {course.students_count} Estudiants
                </span>
              </div>
            </div>

            {/* Teachers Avatars */}
            <div className={clsx(expand ? "mb-4" : "")}>
              <AvatarGroup max={7} isBordered>
                {teachers.map((teacher) => (
                  <Tooltip showArrow crossOffset={-12} closeDelay={50} content={teacher.name + " " + teacher.surnames}>
                    <Avatar showFallback />
                  </Tooltip>
                ))}
              </AvatarGroup>
            </div>
          </div>
          
          {/* Center Content (1/3) */}
          <div className={clsx(expand ? "w-[36.5%] flex flex-col justify-between" : "w-full hidden", "px-6 py-6 backdrop-blur-lg bg-zinc-800/20")}>
            {/* Course Description */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Descripció</h3>
              <p className="text-default-200 text-sm text-pretty line-clamp-4 mb-4">{course.description}</p>
            </div>
            
            {/* Practices Progress */}
            <div>
              <Progress
                aria-label="Pràctiques fetes"
                size="sm"
                color={course.corrected_practices === course.total_practices ? "success" : "primary"}
                value={course.corrected_practices}
                maxValue={course.total_practices}
              />
              <div className="flex items-start justify-start gap-2 mt-1.5 mb-2 text-default-300">
                <span className="text-xs pr-1 inline-flex items-center">
                  {course.corrected_practices === course.total_practices ? (
                    <DocumentCheckIcon className="size-4 inline-block mr-1" />
                  ) : (
                    <DocumentArrowUpIcon className="size-4 inline-block mr-1" />
                  )}
                  {course.corrected_practices}/{course.total_practices} Pràctiques
                </span>
              </div>
            </div>
          </div>
          
          {/* Right Side Content (1/3) */}
          <div className={clsx(expand ? "w-[27%] py-6" : "w-full py-4", "px-6 bg-zinc-800/10 flex flex-col justify-end")}>
            {/* Decorative elements */}
            <div className="flex-grow relative">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white opacity-10"></div>
              <div className="absolute top-12 left-10 w-8 h-8 rounded-full bg-white opacity-10"></div>
            </div>
            
            {/* Call to Action */}
            <div className="mt-auto">
              <Button
                color="primary"
                as={Link}
                fullWidth
                size="lg"
                endContent={<ArrowRightIcon className="size-5"/>}
                href={`/courses/${course.id}`}
              >
                Ves al curs
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}