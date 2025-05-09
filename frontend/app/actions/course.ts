import { Course, Courses } from "@/types/course"
import { getTokenFromSession } from "@/app/lib/session";

const API_URL = process.env.BACKEND_URL;

export async function getAllCourses(): Promise<Courses> {
  const res = await fetch(`${API_URL}/api/v1/courses`, {
    method: "GET",
    headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch courses")
  }

  return res.json()
}

export async function getCourseById(id: string): Promise<Course> {
  const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
    method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch course")
  }

  return res.json()
}

export async function getCoursesMe(): Promise<Courses> {
	const res = await fetch(`${API_URL}/api/v1/courses/me`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function getCourseWithUsers(id: string): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/users`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function getCourseWithPractices(id: string): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}/practices`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function createCourse(data: Partial<Course>): Promise<Course> {
  const res = await fetch(`${API_URL}/api/v1/courses`, {
    method: "POST",
    headers: { 
			"Content-Type": "application/json",
			'Authorization': `Bearer ${await getTokenFromSession()}`
		},
    body: JSON.stringify(data)
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to create course")
  }

  return res.json()
}

export async function updateCourse(id: string, data: Partial<Course>): Promise<Course> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
		method: "PUT",
		headers: { 
			"Content-Type": "application/json",
			'Authorization': `Bearer ${await getTokenFromSession()}`
		},
		body: JSON.stringify(data)
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to update course")
	}

	return res.json()
}

export async function deleteCourse(id: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/${id}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete course")
	}

	return res.json()
}

export async function downloadStudentsTemplateCSV(): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/courses/students-template/csv`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${await getTokenFromSession()}`
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
      "Authorization": `Bearer ${await getTokenFromSession()}`
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