'use server'

import { createSession, deleteSession } from '@/app/lib/session'
import { SignupFormSchema, LoginFormSchema, FormState, User } from '@/app/lib/definitions'
import { redirect } from 'next/navigation'
 
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
    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/users/signup`, {
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
    const validatedFields = LoginFormSchema.safeParse({
      niub: formData.get('niub'),
      email: formData.get('email'),
      password: formData.get('password'),
    })
    
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
      }
    }
    
    const { email, password } = validatedFields.data
    
    // 2. Token and user data from the API
    const formBody = new URLSearchParams()
    formBody.append('grant_type', 'password')
    formBody.append('username', email)
    formBody.append('password', password)

    const loginResponse = await fetch(`${process.env.BACKEND_URL}/api/v1/login/access-token`, {
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

    const res = await fetch(`${process.env.BACKEND_URL}/api/v1/users/me`, {
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
    redirect('/')
  } catch (error) {
    return {
      success: false,
      message: "S'ha produït un error a l'inicia sessió. Torna-ho a intentar.",
    }
  }
}

export async function logout() {
  try {
    await deleteSession()
    redirect('/login') 
  } catch (error) {
    return {
      message: 'Something went wrong. Please try again.',
    }
  }
}