'use client';

import { Practice, PracticeFileInfo, Practices } from "@/types/practice";
import { getTokenFromClient } from "@/app/lib/client-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAllPractices(): Promise<Practices> {
  const res = await fetch(`${API_URL}/api/v1/practices/`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromClient()}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch practices");
  }

  return await res.json();
}

export async function searchPractices(search: string): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/v1/practices/search?search=${search}`, {
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

export async function getPracticeById(id: string): Promise<Practice> {
  const res = await fetch(`${API_URL}/api/v1/practices/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromClient()}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch practice");
  }

  return await res.json();
}

export async function getMyPractices(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/v1/practices/me`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function getMyPracticesCorrected(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/v1/practices/me/corrected`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function getMyPracticesUncorrected(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/v1/practices/me/uncorrected`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch courses")
	}

	return res.json()
}

export async function getPracticeWithUsers(id: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/v1/practices/${id}/users`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to fetch practice with users");
	}

	return await res.json();
}

export async function getPracticeWithCourse(id: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/v1/practices/${id}/course`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		},
	});

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch practice with course")
	}

	return res.json()
}

export async function getPracticeStudent(id: string, niub: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/v1/practices/${id}/${niub}`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		},
	});

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch student practice")
	}

	return res.json()
}

export async function getPracticeCorrectionFilesInfo(practiceId: string): Promise<PracticeFileInfo[]> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/correction-files-info`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to get practice correction files info");
	}

	return await res.json();
}

export async function getPracticeFileInfo(practiceId: string): Promise<PracticeFileInfo> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/submission-file-info`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to get practice file info");
	}

	return await res.json();
}

export async function getPracticeFileInfoForUser(practiceId: string, niub: string): Promise<PracticeFileInfo> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/users/${niub}/submission-file-info`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to get practice file info for user");
	}

	return await res.json();
}

export async function createPractice(data: Partial<Practice>, files: File[]): Promise<Practice> {
  const formData = new FormData();
  formData.append("practice_in", JSON.stringify(data));
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch(`${API_URL}/api/v1/practices/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getTokenFromClient()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to create practice");
  }

  return await res.json();
}

export async function updatePractice(practiceId: string, data: Partial<Practice>, files?: File[]): Promise<Practice> {
	const formData = new FormData();
	formData.append("practice_in", JSON.stringify(data));

	if (files) {
		for (const file of files) {
			formData.append("files", file);
		}
	}
	
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}`, {
		method: "PUT",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`,
		},
		body: formData,
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to update practice");
	}

	return await res.json();
}

export async function uploadPractice(practiceId: string, file: File): Promise<PracticeFileInfo> {
	const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getTokenFromClient()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to upload practice");
  }

	return await res.json();
}

export async function sendPracticeData(practiceId: string, niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/practices/send-practice-data/${practiceId}/${niub}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
			"Content-Type": "application/json",
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to send practice data");
	}
}

export async function deletePracticeSubmission(practiceId: string, niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/submission/${niub}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to delete practice submission");
	}
}

export async function deletePractice(practiceId: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}`, {
		method: "DELETE",
		headers: {
			Authorization: `Bearer ${await getTokenFromClient()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to delete practice");
	}
}

export async function downloadMyPractice(practiceId: string): Promise<void> {
  await downloadFile(`${API_URL}/api/v1/practices/${practiceId}/download/me`, `my_practice_${practiceId}.zip`);
}

export async function downloadAllPractices(practiceId: string): Promise<void> {
  await downloadFile(`${API_URL}/api/v1/practices/${practiceId}/download/all`, `all_practices_${practiceId}.zip`);
}

export async function downloadPracticeByNiub(practiceId: string, niub: string): Promise<void> {
  await downloadFile(`${API_URL}/api/v1/practices/${practiceId}/download/${niub}`, `practice_${practiceId}_${niub}.zip`);
}

async function downloadFile(url: string, fallbackFilename: string): Promise<void> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromClient()}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to download file");
  }

  const blob = await res.blob();

  const disposition = res.headers.get("Content-Disposition");
  let filename = fallbackFilename;

  if (disposition) {
		// For your specific format: attachment; filename=MVC App_student_niub20601356.zip
		const simpleMatch = disposition.match(/filename=([^;]+)/i);
		if (simpleMatch && simpleMatch[1]) {
			// Take everything after 'filename=' until the end of string or next semicolon
			filename = simpleMatch[1].trim().replace(/['"]/g, '');
		} else {
			// Fallback to standard format with quotes
			const filenameRegex = /filename\*?=['"]?(?:UTF-\d['"]*)?([\w,.%+-]+(?:\s[\w,.%+-]+)*)['"]?;?/i;
			const matches = disposition.match(filenameRegex);
			
			if (matches && matches[1]) {
				filename = decodeURIComponent(matches[1].replace(/['"]/g, ''));
			}
		}
	}

  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}