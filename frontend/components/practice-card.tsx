'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon, CalendarIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { Button } from '@heroui/button';
import { Progress } from '@heroui/progress';
import { practiceStatusOptions as statusOptions, practiceStatusColorMap as statusColorMap } from "@/types";
import { Practice } from '@/types/practice';

// Componente de tarjeta de práctica
export const PracticeCard = ({ practice }: { practice: Practice }) => {
  const getStatusName = (uid: string) =>
		statusOptions.find((option) => option.uid === uid)?.name || uid;
	
	const getStatusValue = (uid: string) =>
		statusOptions.find((option) => option.uid === uid)?.value || 0;

	const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full 2xl:h-[240px] flex rounded-3xl overflow-hidden shadow-lg bg-white dark:bg-neutral-800">
      {/* Panel lateral izquierdo */}
      <div className="w-1/3 bg-primary-700 dark:bg-primary-100 p-7 flex flex-col justify-between">
        <div>
          <div className="text-default-400 text-sm font-light tracking-wider mb-1">CURS</div>
          <h2 className="text-white text-2xl font-semibold">{practice.course?.name}</h2>
        </div>
        <Link
          href={`/courses/${practice.course?.id}`} 
          className="flex items-center text-gray-300 dark:text-gray-400 hover:text-white dark:hover:text-white transition-colors"
        >
          <span>Veure el curs</span>
          <ChevronRightIcon className="size-4 ml-1" />
        </Link>
      </div>

      {/* Contenido principal */}
      <div className="w-3/4 p-7 flex flex-col justify-between gap-7">
				<div className="flex items-start justify-between gap-3">
					<div className="w-[60%]">
						<div className="text-default-500 text-sm font-light tracking-wide mb-1">PRÀCTICA</div>
						<h2 className="text-default-800 text-wrap text-2xl font-semibold mb-4 line-clamp-2">{practice.name}</h2>
					</div>
					<div className="w-[35%] flex flex-col items-end gap-1">
						<Progress aria-label={practice.status} color={statusColorMap[practice.status || "default"]} value={getStatusValue(practice.status || "default")} maxValue={statusOptions.length-2} />
						<span className="text-sm text-default-500 font-light mr-1">{getStatusName(practice.status || "default")}</span>
					</div>
				</div>
        
        <div className="flex justify-between">
					<div className="flex items-center gap-1 text-default-500 text-sm font-light">
						<CalendarIcon className="-translate-y-[0.05rem] size-4" />
						<span>{"Data límit: " + formatDate(practice.due_date)}</span>
					</div>
					<Button
						color="primary"
            as={Link}
						radius="full"
						endContent={
							<ArrowRightIcon className="size-5"/>
						}
            href={`/practices/${practice.id}`}
					>
						Ves a la pràctica
					</Button>
        </div>
      </div>
    </div>
  );
};