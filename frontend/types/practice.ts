import { User } from "@/app/lib/definitions"
import { Course } from "./course"

export interface Practice {
  id?: string
	name: string
	description: string
	programming_language: string
	due_date: string
	submission_date?: string
	course_id: string
	correction?: any
	course?: Course
	users?: User[]
}

export interface Practices {
	practices: Practice[]
	count: number
}
