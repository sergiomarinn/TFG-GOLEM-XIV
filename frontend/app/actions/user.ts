import { UpdatePassword, User, Users } from "@/app/lib/definitions"
import { getTokenFromSession } from "@/app/lib/session";

const API_URL = process.env.BACKEND_URL;

export async function getAllUsers(): Promise<Users> {
  const res = await fetch(`${API_URL}/api/v1/users`, {
    method: "GET",
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch users")
  }

  return res.json()
}

export async function getCourseByNIUB(niub: string): Promise<User> {
  const res = await fetch(`${API_URL}/api/v1/users/${niub}`, {
    method: "GET",
		headers: {
				"Authorization": `Bearer ${await getTokenFromSession()}`
		}
  })

  if (!res.ok) {
		const errorData = await res.json()
    throw new Error(errorData.detail || "Failed to fetch user")
  }

  return res.json()
}

export async function getUserMe(): Promise<User> {
    const res = await fetch(`${API_URL}/api/v1/users/me`, {
			method: "GET",
			headers: {
					"Authorization": `Bearer ${await getTokenFromSession()}`
			}
    })

    if (!res.ok) {
			const errorData = await res.json()
			throw new Error(errorData.detail || "Failed to fetch user")
    }

    return res.json()
}

export async function createUser(data: Partial<User>): Promise<User> {
  const res = await fetch(`${API_URL}/api/v1/users`, {
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

export async function updateUser(niub: string, data: Partial<User>): Promise<User> {
	const res = await fetch(`${API_URL}/api/v1/courses/${niub}`, {
			method: "PATCH",
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

export async function updateUserMe(	data: Partial<User>): Promise<User> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/password`, {
			method: "PATCH",
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

export async function updateUserMePassword(data: Partial<UpdatePassword>): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/courses/me/password`, {
			method: "PATCH",
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

export async function deleteUser(niub: string): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/users/${niub}`, {
		method: "DELETE",
		headers: {
			"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete user")
	}

	return res.json()
}

export async function deleteUserMe(): Promise<void> {
	const res = await fetch(`${API_URL}/api/v1/users/me`, {
		method: "DELETE",
		headers: {
				"Authorization": `Bearer ${await getTokenFromSession()}`
		}
	})

	if (!res.ok) {
		const errorData = await res.json()
		throw new Error(errorData.detail || "Failed to delete user")
	}

	return res.json()
}