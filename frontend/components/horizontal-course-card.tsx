import Image from "next/image"
import { Button } from "@heroui/button";
import { Progress } from "@heroui/progress";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { DocumentArrowUpIcon, DocumentCheckIcon, ArrowRightIcon, CalendarIcon, UsersIcon } from "@heroicons/react/24/outline";

interface HorizontalCourseCardProps {
  title?: string;
  students_number?: number;
  academic_year?: string;
  programmingLanguage?: string;
  color?: "blue" | "purple" | "green" | "orange" | "pink";
  image?: string;
  completedPractices?: number;
  totalPractices?: number;
  description?: string;
}

interface TagProps {
  label: string;
};

export const Tag = ({ label }: TagProps) => {
  return (
    <div className="flex items-center justify-center rounded-md backdrop-blur-md bg-white/60">
      <span className="text-xs text-white font-light px-2 py-1">{label}</span>
    </div>
  );
}

export const HorizontalCourseCard = ({
  title = "Algorísmica Avançada",
  students_number = 40,
  academic_year = "2023-2024",
  programmingLanguage = "Python",
  color = "blue",
  image,
  completedPractices = 2,
  totalPractices = 3,
  description = "Curs avançat d'algorísmica per a estudiants del grau d'informàtica. Aprofundeix en estructures de dades complexes i algoritmes eficients."
}: HorizontalCourseCardProps) => {
  
  // Definir gradientes para diferentes colores
  const gradients = {
    blue: "bg-gradient-to-r from-blue-500 to-violet-600",
    purple: "bg-gradient-to-r from-purple-500 to-pink-600",
    green: "bg-gradient-to-r from-emerald-500 to-teal-700",
    orange: "bg-gradient-to-r from-amber-500 to-orange-600",
    pink: "bg-gradient-to-r from-pink-400 to-rose-600"
  };
  
  // Seleccionar el gradiente según el color
  const backgroundGradient = gradients[color];

  return (
    <div className="relative mx-auto w-full overflow-hidden rounded-3xl shadow-lg">
      {/* Background with gradient or image */}
      <div className="relative h-[265px] md:h-[280px] w-full transition-all duration-400 transform">
        {/* Gradient or Image Background */}
        {image ? (
          <Image src={image} alt={`${title} background`} fill className="object-cover" priority />
        ) : (
          <div className={`absolute inset-0 ${backgroundGradient}`} />
        )}

        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" 
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        {/* Content Container */}
        <div className="absolute bottom-0 left-0 w-full h-full flex flex-col md:flex-row">
          {/* Left Side Content (1/3) */}
          <div className="w-full md:w-[36.5%] px-6 py-6 backdrop-blur-lg bg-zinc-800/30 flex flex-col justify-between">
            {/* Category Tags */}
            <div className="flex items-center gap-2 mb-2">
              <Tag label={academic_year}></Tag>
              <Tag label={programmingLanguage}></Tag>
            </div>

            {/* Course Title */}
            <div className="pb-3">
              <h2 className="text-2xl font-semibold text-white mb-1">{title}</h2>
              {/* Course Info */}
              <div className="flex items-center justify-between w-full text-white text-sm font-light mb-4">
                <span className="inline-flex items-start justify-center gap-1">
                  <CalendarIcon className="size-5 text-default-200"/>
                  Tardor
                </span>
                <span className="inline-flex items-start gap-1">
                  <UsersIcon className="size-5 text-default-200"/>
                  {students_number} Estudiants
                </span>
              </div>
            </div>

            {/* Teachers Avatars */}
            <div className="md:mb-4">
              <AvatarGroup max={7} isBordered>
                <Avatar showFallback src="https://i.pravatar.cc/150?u=a042581f4e29026024d" />
                <Avatar showFallback src="https://images.unsplash.com/broken" />
                <Avatar showFallback src="https://i.pravatar.cc/150?u=a042581f4e29026704d" />
              </AvatarGroup>
            </div>
          </div>
          
          {/* Center Content (1/3) */}
          <div className="hidden md:flex flex-col justify-between w-full md:w-[36.5%] px-6 py-6 backdrop-blur-lg bg-zinc-800/20 ">
            {/* Course Description */}
            <div>
              <h3 className="text-lg font-medium text-white mb-2">Descripció</h3>
              <p className="text-default-200 text-sm text-pretty line-clamp-4 mb-4">{description}</p>
            </div>
            
            {/* Practices Progress */}
            <div>
              <Progress
                aria-label="Pràctiques fetes"
                size="sm"
                color={completedPractices === totalPractices ? "success" : "primary"}
                value={completedPractices}
                maxValue={totalPractices}
              />
              <div className="flex items-start justify-start gap-2 mt-1.5 mb-2 text-default-300">
                <span className="text-xs pr-1 inline-flex items-center">
                  {completedPractices === totalPractices ? (
                    <DocumentCheckIcon className="size-4 inline-block mr-1" />
                  ) : (
                    <DocumentArrowUpIcon className="size-4 inline-block mr-1" />
                  )}
                  {completedPractices}/{totalPractices} Pràctiques
                </span>
              </div>
            </div>
          </div>
          
          {/* Right Side Content (1/3) */}
          <div className="w-full md:w-[27%] px-6 py-3 md:py-6 bg-zinc-800/10 flex flex-col justify-end">
            {/* Decorative elements */}
            <div className="flex-grow relative">
              <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-white opacity-10"></div>
              <div className="absolute top-12 left-10 w-8 h-8 rounded-full bg-white opacity-10"></div>
            </div>
            
            {/* Call to Action */}
            <div className="mt-auto">
              <Button
                color="primary"
                fullWidth
                size="lg"
                endContent={<ArrowRightIcon className="size-5"/>}
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