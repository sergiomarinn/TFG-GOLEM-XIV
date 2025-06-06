'use server';

import { createSession, deleteSession } from '@/app/lib/session'
import { SignupFormSchema, FormState, User, LoginFormSchemaEmail, LoginFormSchemaNiub } from '@/app/lib/definitions'

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function signup(state: FormState, formData: FormData) {
  try {
    // 1. Validate form fields
    const validatedFields = SignupFormSchema.safeParse({
      niub: formData.get('niub'),
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      surnames: formData.get('surnames'),
    })
    
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }
    
    const { niub, name, surnames, email, password } = validatedFields.data
    
    // 2. Signup user
    const res = await fetch(`${API_URL}/api/v1/users/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niub, name, surnames, email, password }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      switch (errorData.detail) {
        case 'EMAIL_AND_NIUB_ALREADY_EXISTS':
          return {
            errors: {
              email: ['Aquest email ja està registrat'],
              niub: ['Aquest NIUB ja està registrat'],
            }
          }
        case 'EMAIL_ALREADY_EXISTS':
          return {
            errors: {
              email: ['Aquest email ja està registrat'],
            }
          }
        case 'NIUB_ALREADY_EXISTS':
          return {
            errors: {
              niub: ['Aquest NIUB ja està registrat'],
            }
          }
        default:
          throw new Error('Unexpected error')
      }
    }

    // 3. Redirect user to login page
    return {
      success: true,
      message: "Seràs redirigit a la pàgina d'inici de sessió.",
    }
  } catch (error) {
    return {
      success: false,
      message: "S'ha produït un error en crear el teu compte. Torna-ho a intentar.",
    }
  }
}

export async function login(state: FormState, formData: FormData) {
  try {
    // 1. Validate form fields
    let validatedFields = null;
    let username = '';
    
    if (formData.get('niub')) {
      validatedFields = LoginFormSchemaNiub.safeParse({
        niub: formData.get('niub'),
        password: formData.get('password'),
      });

      if (validatedFields.success) {
        username = validatedFields.data.niub;
      }
    }
    else {
      validatedFields = LoginFormSchemaEmail.safeParse({
        email: formData.get('email'),
        password: formData.get('password'),
      })

      if (validatedFields.success) {
        username = validatedFields.data.email;
      }
    }

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }
    
    const password = validatedFields.data.password;
    
    // 2. Token and user data from the API
    const formBody = new URLSearchParams()
    formBody.append('grant_type', 'password')
    formBody.append('username', username)
    formBody.append('password', password)

    const loginResponse = await fetch(`${API_URL}/api/v1/login/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body: formBody.toString(),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json()
      if (loginResponse.status === 400) {
        return {
          errors: {
            niub: ['Credencials incorrectes'],
            email: ['Credencials incorrectes'],
            password: ['Credencials incorrectes'],
          },
        }
      }
      throw new Error('Unexpected error')
    }

    const { access_token } = await loginResponse.json()

    const res = await fetch(`${API_URL}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Accept': 'application/json',
      }
    })
    
    if (!res.ok) {
      throw new Error('Error fetching user data')
    }
    
    const user: User = await res.json()

    // 3. Create user session
    await createSession(user, access_token)

    // 4. Redirect user
    return {
      success: true,
      message: "Seràs redirigit al Dashboard.",
    }
  } catch (error) {
    console.error(error)
    return {
      success: false,
      message: "S'ha produït un error a l'inicia sessió. Torna-ho a intentar.",
    }
  }
}

export async function logout() {
  try {
    await deleteSession()
  } catch (error) {
    console.error('Logout error:', error);
    return {
      message: 'Failed to log out',
    }
  }
}