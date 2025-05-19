'use client';

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { Skeleton } from '@heroui/skeleton';

// Skeleton for PracticeCard component
export const PracticeCardSkeleton = () => {
  return (
    <div className="flex rounded-3xl overflow-hidden shadow-lg bg-white dark:bg-neutral-800">
      {/* Panel lateral izquierdo */}
      <div className="w-1/3 bg-primary-700 dark:bg-primary-100 p-7 flex flex-col justify-between">
        <div>
          <div className="text-default-400 text-sm font-light tracking-wider mb-1">CURS</div>
          <Skeleton className="h-8 w-32 rounded-md bg-primary-600/30" />
        </div>
        <div 
          className="flex items-center text-gray-300 dark:text-gray-400"
        >
          <Skeleton className="h-4 w-24 rounded-md bg-primary-600/30" />
          <ChevronRightIcon className="size-4 ml-1" />
        </div>
      </div>

      {/* Contenido principal */}
      <div className="w-3/4 p-7 flex flex-col justify-between gap-7">
        <div className="flex items-start justify-between gap-3">
          <div className="w-[60%]">
            <div className="text-default-500 text-sm font-light tracking-wide mb-1">PRÀCTICA</div>
            <Skeleton className="h-8 w-full rounded-md mb-4" />
          </div>
          <div className="w-[35%] flex flex-col items-end gap-1">
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-4 w-20 rounded-md mt-1" />
          </div>
        </div>
        
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
      </div>
    </div>
  );
};

// Skeleton for PracticeCourseCard component
export const PracticeCourseCardSkeleton = () => {
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
              <Skeleton className="h-8 w-64 rounded-md bg-white/20" />

              {/* Programming Language Badge */}
              <div className="flex items-center mt-2">
                <Skeleton className="size-4 mr-1 rounded-md bg-white/20" />
                <Skeleton className="h-4 w-20 rounded-md bg-white/20" />
              </div>
            </div>
            <Skeleton className="h-5 w-44 rounded-md bg-white/20" />
          </div>
          <div className="flex flex-col items-end justify-between">
            <Skeleton className="h-6 w-24 rounded-full bg-white/20" />
            <Skeleton className="h-10 w-20 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton for both components to be used in a grid or list
export const PracticeCardsSkeleton = ({ count = 3, type = "standard" }) => {
  return (
    <>
      {Array(count).fill(0).map((_, index) => (
        <div key={index} className="w-full">
          {type === "standard" ? <PracticeCardSkeleton /> : <PracticeCourseCardSkeleton />}
        </div>
      ))}
    </>
  );
};