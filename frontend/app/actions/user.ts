import { UpdatePassword, User, Users } from "@/app/lib/definitions"
import { getTokenFromClient } from "@/app/lib/client-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getAllUsers(): Promise<Users> {
  const res = await fetch(`${API_URL}/api/v1/users`, {
    method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch users")
  }

  return await res.json();
}

export async function getStudentsUsers(search: string): Promise<Users> {
  const res = await fetch(`${API_URL}/api/v1/users/students?search=${search}`, {
    method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch users")
  }

  return await res.json();
}

export async function getCourseByNIUB(niub: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/v1/users/${niub}`, {
    method: "GET",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch user")
  }

  return await res.json();
}

export async function getMyUser(): Promise<User> {
    const res = await fetch(`${API_URL}/api/v1/users/me`, {
			method: "GET",
			headers: {
				"Authorization": `Bearer ${await getTokenFromClient()}`
			}
    })

    if (!res.ok) {
			const errorData = await res.json()
			throw new Error(errorData.detail || "Failed to fetch user")
    }

    return await res.json();
}

export async function createUser(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_URL}/api/v1/users/`, {
    method: "POST",
    headers: { 
			"Content-Type": "application/json",
			'Authorization': `Bearer ${await getTokenFromClient()}`
		},
    body: JSON.stringify(data)
  })

  if (!res.ok) {
        const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to create course")
  }

  return await res.json();
}

export async function updateUser(niub: string, data: Partial<User>): Promise<User> {
	const res = await fetch(`${API_URL}/api/v1/courses/${niub}`, {
			method: "PATCH",
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

export async function updateMyUser(data: Partial<User>): Promise<User> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/password`, {
			method: "PATCH",
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

export async function updateMyUserPassword(data: Partial<UpdatePassword>): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/password`, {
			method: "PATCH",
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

export async function deleteUser(niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/users/${niub}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete user")
	}

	return await res.json();
}

export async function deleteMyUser(): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/users/me`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromClient()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete user")
	}

	return await res.json();
}