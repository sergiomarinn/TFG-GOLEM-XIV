'use client';

import { Skeleton } from "@heroui/skeleton";

export const CourseCardSkeleton = () => {
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-3xl shadow-lg">
      <div className="relative h-[350px] w-full bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
        {/* Content Container */}
        <div className="absolute bottom-0 left-0 w-full px-6 pt-6 pb-6 backdrop-blur-lg bg-zinc-800/30">
          {/* Category Tags */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="w-20 h-6 rounded-md" />
            <Skeleton className="w-16 h-6 rounded-md" />
          </div>

          {/* Course Title */}
          <Skeleton className="h-7 w-4/5 mb-1" />

          {/* Course Info */}
          <div className="flex items-center justify-between w-full mb-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-28" />
          </div>

          {/* Practices progress */}
          <Skeleton className="h-2 w-full rounded mb-3" />
          <div className="flex items-start justify-start gap-2 mt-1.5 mb-5">
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Button */}
          <Skeleton className="h-10 w-full rounded-lg" />

          {/* Teachers Avatars */}
          <div className="absolute right-5 -top-[1.55rem] flex">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="w-10 h-10 rounded-full -ml-2" />
            <Skeleton className="w-10 h-10 rounded-full -ml-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const HorizontalCourseCardSkeleton = ({ expand = true }) => {
  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-3xl shadow-lg">
      <div className={`relative w-full ${expand ? "h-[280px]" : "h-[285px]"} bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse`}>
        <div className={`absolute bottom-0 left-0 w-full h-full ${expand ? "flex flex-row" : "flex flex-col"}`}>
          {/* Left Side Content */}
          <div className={`${expand ? "w-[36.5%]" : "w-full"} px-6 py-6 backdrop-blur-lg bg-zinc-800/30 flex flex-col justify-between`}>
            {/* Category Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-20 h-6 rounded-md" />
              <Skeleton className="w-16 h-6 rounded-md" />
            </div>

            {/* Course Title */}
            <div className="pb-3">
              <Skeleton className="h-8 w-4/5 mb-1" />
              {/* Course Info */}
              <div className="flex items-center justify-between w-full mb-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-28" />
              </div>
            </div>

            {/* Teachers Avatars */}
            <div className={expand ? "mb-4" : "ml-3"}>
              <div className="flex">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="w-10 h-10 rounded-full -ml-2" />
                <Skeleton className="w-10 h-10 rounded-full -ml-2" />
              </div>
            </div>
          </div>
          
          {/* Center Content */}
          {expand && (
            <div className="w-[36.5%] flex flex-col justify-between px-6 py-6 backdrop-blur-lg bg-zinc-800/20">
              {/* Course Description */}
              <div>
                <Skeleton className="h-6 w-36 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-3/4 mb-4" />
              </div>
              
              {/* Practices Progress */}
              <div>
                <Skeleton className="h-2 w-full rounded mb-3" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          )}
          
          {/* Right Side Content */}
          <div className={`${expand ? "w-[27%] py-6" : "w-full py-4"} px-6 bg-zinc-800/10 flex flex-col justify-end`}>
            {/* Call to Action */}
            <Skeleton className="h-12 w-full rounded-lg mt-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};