'use client';

import { Practice, PracticeFileInfo, Practices } from "@/types/practice";
import { getTokenFromClient } from "@/app/lib/client-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAllPractices(): Promise<Practices> {
  const res = await fetch(`${API_URL}/api/v1/practices`, {
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

export async function getMyPracitces(): Promise<Practices> {
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
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}/submission-file-info/${niub}`, {
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

export async function createPractice(data: string, file: File): Promise<Practice> {
  const formData = new FormData();
  formData.append("practice", data);
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/v1/practices`, {
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

export async function updatePractice(practiceId: string, data: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/v1/practices/${practiceId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${await getTokenFromClient()}`,
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to update practice");
	}

	return await res.json();
}

export async function uploadPractice(practiceId: string, file: File): Promise<void> {
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
  await downloadFile(`${API_URL}/api/v1/practices/${practiceId}/download/${niub}`, `practice_${niub}.zip`);
}

async function downloadFile(url: string, filename: string): Promise<void> {
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
  const link = document.createElement("a");
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(link.href);
}