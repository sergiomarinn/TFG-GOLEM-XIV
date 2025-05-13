import { User } from "@/app/lib/definitions";
import { Practice } from "./practice";

export interface Course {
  id?: string
  name: string
  description: string
  academic_year: string
  semester: 'primavera' | 'tardor'
  corrected_practices?: number
  total_practices?: number
  students_count?: number
  programming_languages: string[]
  color: "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "red" | "indigo" | "lime" | "default";
	users?: User[]
	practices?: Practice[]
}

export interface Courses {
	data: Course[]
	count: number
}