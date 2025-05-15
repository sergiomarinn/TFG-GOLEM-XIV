'use client';

import { Course, Courses } from "@/types/course"
import { getTokenFromClient } from "@/app/lib/client-session";
import { User } from "@/app/lib/definitions";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAllCourses(): Promise<Courses> {
  const res = await fetch(`${API_URL}/api/v1/courses`, {
    method: "GET",
    headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch courses")
  }

  return await res.json();
}

export async function getCourseById(id: string): Promise<Course> {
  const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
    method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch course")
  }

  return await res.json();
}

export async function getMyCourses(): Promise<Courses> {
	const res = await fetch(`${API_URL}/api/v1/courses/me`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return await res.json();
}

export async function getMyRecentCourses(limit = 5): Promise<Courses> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/recent?limit=${limit}`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return await res.json();
}

export async function getCourseWithUsers(id: string): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/users`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch course with users")
	}

	return await res.json();
}

export async function getCourseTeachers(id: string): Promise<User[]> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/teachers`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch course teachers")
	}

	return await res.json();
}

export async function getCourseWithPractices(id: string): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/practices`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch course with practices")
	}

	return await res.json();
}

export async function createCourse(data: Partial<Course>, file: File): Promise<Course> {
	const formData = new FormData();
	formData.append("course_in", JSON.stringify(data));
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/v1/courses`, {
    method: "POST",
    headers: {
			'Authorization': `Bearer ${await getTokenFromClient()}`
		},
    body: formData
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to create course")
  }

  return await res.json();
}

export async function addStudentByNiub(id: string, niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/students/${niub}`, {
		method: "POST",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to add student to course")
	}

	return await res.json();
}

export async function updateCourseLastAccess(id: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/${id}/access`, {
		method: "PATCH",
		headers: {
			'Authorization': `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to update last access course")
	}
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
		method: "PUT",
		headers: { 
			"Content-Type": "application/json",
			'Authorization': `Bearer ${await getTokenFromClient()}`
		},
		body: JSON.stringify(data)
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to update course")
	}

	return await res.json();
}

export async function deleteCourse(id: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete course")
	}

	return await res.json();
}

export async function deleteStudentFromCourse(id: string, niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/students/${niub}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete student from the course")
	}

	return await res.json();
}

export async function downloadStudentsTemplateCSV(): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/courses/students-template/csv`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${await getTokenFromClient()}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to download CSV template");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function downloadStudentsTemplateXLSX(): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/courses/students-template/xlsx`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${await getTokenFromClient()}`
    }
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to download XLSX template");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "students_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}