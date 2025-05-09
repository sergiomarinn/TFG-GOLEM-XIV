import { User } from "@/app/lib/definitions";
import { Practice } from "./practice";

export interface Course {
  id?: string
  name: string
  description: string
  academic_year: string
  color?: "blue" | "purple" | "green" | "orange" | "pink" | "cyan" | "red" | "indigo" | "lime" | "default";
	users?: User[]
	practices?: Practice[]
}

export interface Courses {
	courses: Course[]
	count: number
}