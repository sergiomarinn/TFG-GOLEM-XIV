import { Practice, Practices } from "@/types/practice";
import { getTokenFromSession } from "@/app/lib/session";

const API_URL = process.env.BACKEND_URL;

export async function getAllPractices(): Promise<Practices> {
  const res = await fetch(`${API_URL}/api/practices`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromSession()}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch practices");
  }

  return res.json();
}

export async function getPracticeById(id: string): Promise<Practice> {
  const res = await fetch(`${API_URL}/api/practices/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromSession()}`,
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to fetch practice");
  }

  return res.json();
}

export async function getPracitcesMe(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/practices/me`, {
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

export async function getPracticesMeCorrected(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/practices/me/corrected`, {
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

export async function getPracticesMeUncorrected(): Promise<Practices> {
	const res = await fetch(`${API_URL}/api/practices/me/uncorrected`, {
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

export async function getPracticeWithUsers(id: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/practices/${id}/users`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`,
		},
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to fetch practice with users");
	}

	return res.json();
}

export async function getPracticeWithCourse(id: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/practices/${id}/course`, {
		method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		},
	});

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to fetch practice with course")
	}

	return res.json()
}		

export async function createPractice(data: string, file: File): Promise<Practice> {
  const formData = new FormData();
  formData.append("practice", data);
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/practices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getTokenFromSession()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to create practice");
  }

  return res.json();
}

export async function updatePractice(practiceId: string, data: string): Promise<Practice> {
	const res = await fetch(`${API_URL}/api/practices/${practiceId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${await getTokenFromSession()}`,
		},
		body: JSON.stringify(data),
	});

	if (!res.ok) {
		const errorData = await res.json();
		throw new Error(errorData.detail || "Failed to update practice");
	}

	return res.json();
}

export async function uploadPractice(practiceId: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_URL}/api/practices/${practiceId}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await getTokenFromSession()}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Failed to upload practice");
  }
}

export async function downloadMyPractice(practiceId: string): Promise<void> {
  await downloadFile(`${API_URL}/api/practices/${practiceId}/download/me`, `my_practice_${practiceId}.zip`);
}

export async function downloadAllPractices(practiceId: string): Promise<void> {
  await downloadFile(`${API_URL}/api/practices/${practiceId}/download/all`, `all_practices_${practiceId}.zip`);
}

export async function downloadPracticeByNiub(practiceId: string, niub: string): Promise<void> {
  await downloadFile(`${API_URL}/api/practices/${practiceId}/download/${niub}`, `practice_${niub}.zip`);
}

async function downloadFile(url: string, filename: string): Promise<void> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${await getTokenFromSession()}`,
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