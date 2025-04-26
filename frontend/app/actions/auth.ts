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
    const res = await fetch('/api/users/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niub, name, surnames, email, password }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      return {
        errors: {
          niub: [errorData.error || 'Error signing up'],
          name: [errorData.error || 'Error signing up'],
          surnames: [errorData.error || 'Error signing up'],
          email: [errorData.error || 'Error signing up'],
          password: [errorData.error || 'Error signing up'],
        },
      }
    }

    // 3. Redirect user to login page
    redirect('/login')
  } catch (error) {
    return {
      message: 'Something went wrong. Please try again.',
    }
  }
}

export async function login(state: FormState, formData: FormData) {
  try {
    // 1. Validate form fields
    const validatedFields = LoginFormSchema.safeParse({
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
    const loginResponse = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json()
      return {
        errors: {
          email: [errorData.error || 'Invalid credentials'],
          password: [errorData.error || 'Invalid credentials'],
        },
      }
    }

    const { access_token } = await loginResponse.json()

    const res = await fetch('/api/users/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${access_token}` },
    })
    
    if (!res.ok) {
      throw new Error('Error fetching user data')
    }
    
    const user: User = await res.json()

    // 3. Create user session
    await createSession(user, access_token)

    // 4. Redirect user
    redirect('/dashboard')
  } catch (error) {
    return {
      message: 'Something went wrong. Please try again.',
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