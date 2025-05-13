import { User } from "@/app/lib/definitions"
import { Course } from "./course"

export interface Practice {
  id?: string
	name: string
	description: string
	programming_language: string
	due_date: string
	submission_date?: string
	status?: string
	submission_file_name?: string
	course_id: string
	correction?: any
	course?: Course
	users?: User[]
	teacher?: User
}

export interface Practices {
	data: Practice[]
	count: number
}

export interface PracticeFileInfo {
	name: string
	size: number
}