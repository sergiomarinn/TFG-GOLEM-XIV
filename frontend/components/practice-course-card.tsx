import { Button } from "@heroui/button";
import { ArrowRightIcon, CalendarIcon, CodeBracketIcon } from "@heroicons/react/24/outline";
import { Chip } from "@heroui/chip";
import { practiceStatusOptions as statusOptions, practiceStatusColorMap as statusColorMap } from "@/types";
import { Link } from "@heroui/link";
import { Practice } from "@/types/practice";
import { boolean } from "zod";
import { useEffect, useState } from "react";
import clsx from "clsx";

interface PracticeCardProps {
  practice: Practice;
  isTeacher: boolean;
}

export const PracticeCourseCard = ({ practice, isTeacher }: PracticeCardProps) => {
  const [teacher, setTeacher] = useState(false)

  useEffect(() => {
    setTeacher(isTeacher);
  }, [isTeacher])

	const getStatusName = (uid: string) =>
			statusOptions.find((option) => option.uid === uid)?.name || uid; 

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

  return (
    <div className="flex flex-row w-full rounded-3xl overflow-hidden shadow-lg">
      {/* Purple sidebar */}
      <div className="relative h-48 w-full bg-[#002E62] text-white p-8 overflow-hidden">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots-pattern)" />
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full flex justify-between">
					<div className="h-full flex flex-col items-start justify-between">
						<div className="space-y-1">
							<span className="text-xs text-gray-400 font-light leading-none block">PRÀCTICA</span>
							<h2 className="text-[1.35rem] font-semibold leading-tight">{practice.name}</h2>

							{/* Programming Language Badge */}
              <div className="flex items-center mt-2">
                <CodeBracketIcon className="size-4 text-gray-300 mr-1" />
                <span className="text-sm text-gray-300 leading-none capitalize">{practice.programming_language}</span>
              </div>
						</div>
						<span className="inline-flex items-center justify-center gap-1 text-[0.9rem] font-light text-gray-200 leading-none">
							<CalendarIcon className="-translate-y-[0.1rem] size-[1.2rem] text-gray-200"/>
							{"Data límit: " + formatDate(practice.due_date)}
						</span>
					</div>
					<div className={clsx("flex flex-col items-end", teacher ? "justify-end" : "justify-between")}>
						{!teacher && <Chip color={statusColorMap[practice.status || "not_submitted"]} size="sm" variant="shadow" className="text-gray-100">
							{getStatusName(practice.status || "not_submitted")}
						</Chip>}
						<Button
							color="primary"
              as={Link}
							radius="full"
							endContent={<ArrowRightIcon className="size-5"/>}
              href={`/practices/${practice.id}`}
						>
							Anar
						</Button>
					</div>
        </div>
      </div>
    </div>
  );
}