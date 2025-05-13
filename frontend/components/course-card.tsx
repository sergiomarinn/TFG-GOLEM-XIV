'use client';

import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { DocumentArrowUpIcon, DocumentCheckIcon, ArrowRightIcon, CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Link } from "@heroui/link";
import { Tooltip } from "@heroui/tooltip";
import { Course } from "@/types/course";
import { useEffect, useState } from "react";
import { getCourseTeachers } from "@/app/actions/course";
import { User } from "@/app/lib/definitions";

interface CourseCardProps {
  course: Course;
}

export const Tag = ({ label }: {label: string}) => {
	return (
		<div className="flex items-center justify-center rounded-md backdrop-blur-md bg-white/60">
			<span className="text-xs text-white font-light px-2 py-1 capitalize">{label}</span>
		</div>
	);
}

export const CourseCard = ({course}: CourseCardProps) => {
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
      {/* Background Image */}
      <div className="relative h-[350px] w-full">
        {/* Gradient or Image Background */}
        <div className={`absolute inset-0 ${backgroundGradient}`} />

				{/* Pattern Overlay (optional) */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Upper part - visible area */}
        <div className="absolute top-0 left-0 w-full h-32">
          {/* Optional decorative elements */}
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-white opacity-10"></div>
          <div className="absolute top-12 left-10 w-8 h-8 rounded-full bg-white opacity-10"></div>
        </div>

        {/* Content Container */}
        <div className="absolute bottom-0 left-0 w-full px-6 pt-6 pb-6 backdrop-blur-lg bg-zinc-800/30">
          {/* Category Tag */}
					<div className="flex items-center gap-2 mb-2">
						<Tag label={course.academic_year}></Tag>
            {course.programming_languages.map((lang, index) => (
              <Tag key={index} label={lang}></Tag>
            ))}
					</div>

          {/* Course Title */}
          <h2 className="text-xl font-semibold text-white line-clamp-2 mb-1">{course.name}</h2>

          {/* Course Info */}
					<div className="flex items-center justify-between w-full text-white text-[0.82rem] font-light mb-4">
						<span className="inline-flex items-start gap-1">
							<CalendarIcon className="size-[1.1rem] text-gray-200"/>
							Primavera
						</span>
						<span className="inline-flex items-start gap-1">
							<UsersIcon className="size-[1.1rem] text-gray-200"/>
							{course.students_count} Estudiants
						</span>
						
					</div>

          {/* Practices progess */}
          <Progress
						className="pt-1"
						aria-label="Pràctiques fetes"
						size="sm"
						color={ course.corrected_practices === course.total_practices ? "success" : "primary" }
						value={course.corrected_practices}
						maxValue={course.total_practices}
					/>
					<div className="flex items-start justify-start gap-2 mt-1.5 mb-5 text-gray-300">
						<span className="text-[0.75rem] pr-1 inline-flex items-center">
						{course.corrected_practices === course.total_practices ? (
							<DocumentCheckIcon className="size-[1.1rem] inline-block mr-1" />
						) : (
							<DocumentArrowUpIcon className="size-[1.1rem] inline-block mr-1" />
						)}
							{course.corrected_practices}/{course.total_practices} Pràctiques</span>
					</div>
					<Button
						color="primary"
            as={Link}
						fullWidth
						endContent={
							<ArrowRightIcon className="size-5"/>
						}
            href={`/courses/${course.id}`}
					>
						Ves al curs
					</Button>

          {/* Teachers Avatars */}
          <div className="absolute right-5 -top-[1.55rem]">
						<AvatarGroup max={3} isBordered>
              {teachers.map((teacher) => (
                <Tooltip showArrow crossOffset={-12} closeDelay={50} content={teacher.name + " " + teacher.surnames}>
                  <Avatar showFallback />
                </Tooltip>
              ))}
						</AvatarGroup>
          </div>
        </div>
      </div>
    </div>
  )
}