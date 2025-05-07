'use client'

import { signup } from '@/app/actions/auth';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Link } from "@heroui/link";
import { addToast } from "@heroui/toast";
import { useActionState, useState, useEffect } from 'react';
import { redirect } from 'next/navigation';
import { 
  MailIcon, 
  EyeSlashFilledIcon, 
  EyeFilledIcon,
  CardIcon,
  ArrowUpRightIcon
} from '@/components/icons'

export default function RegisterPage() {
  const [state, action, pending] = useActionState(signup, undefined)
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  useEffect(() => {
    if (state?.success) {
      addToast({
        title: "Registre completat",
        description: state.message,
        timeout: 3000,
        shouldShowTimeoutProgress: true,
        color: "success",
      });

      const timeout = setTimeout(() => {
        redirect('/login');
      }, 3100);

      return () => clearTimeout(timeout);
    }

    else if (state?.success === false) {
      addToast({
        title: "Error al registrar-se",
        description: state?.message,
        timeout: 5000,
        color: "danger",
      });
    }
  }, [state]);

  return (
    <div className="flex flex-col justify-center p-11 rounded-3xl shadow-xl sm:w-11/12 md:w-[450px] border-[1.35px] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black dark:shadow-gray-800">
      <h1 className="font-extrabold text-center text-2xl mb-1">Crea el teu compte</h1>
      <h2 className="text-center text-sm text-default-600 dark:text-default-400 mb-5">Benvingut👋 Si us plau, ompli les dades per començar.</h2>
      <form action={action} noValidate className="flex flex-col gap-y-3">
        <div className="flex gap-3">
          <Input 
            name="name" 
            isRequired
            isDisabled={pending}
            label="Nom"
            type="text"
            size="sm"
            isInvalid={!!state?.errors?.name}
            errorMessage={state?.errors?.name?.[0]}
          />
          <Input
            name="surnames"
            isRequired
            isDisabled={pending}
            label="Cognoms"
            type="text"
            size="sm"
            isInvalid={!!state?.errors?.surnames}
            errorMessage={state?.errors?.surnames?.[0]}
          />
        </div>
        <Input
          name="niub"
          isRequired
          isDisabled={pending}
          label="NIUB"
          type="text"
          size="sm"
          endContent={
            <CardIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
          }
          description="Ha de començar amb 'niub' seguit de 8 dígits."
          isInvalid={!!state?.errors?.niub}
          errorMessage={state?.errors?.niub?.[0]}
        />
        <Input
          name="email"
          isRequired
          isDisabled={pending}
          label="Email"
          type="email"
          size="sm"
          endContent={
            <MailIcon className="text-2xl text-default-400 pointer-events-none flex-shrink-0" />
          }
          isInvalid={!!state?.errors?.email}
          errorMessage={state?.errors?.email?.[0]}
        />
        <Input
          name="password"
          isRequired
          isDisabled={pending}
          label="Contrasenya" 
          type={isVisible ? "text" : "password"} 
          size="sm"
          endContent={
            <button
              aria-label="toggle password visibility"
              className="focus:outline-none"
              type="button"
              onClick={toggleVisibility}
            >
              {isVisible ? (
                <EyeSlashFilledIcon className="text-2xl text-default-400 pointer-events-none" />
              ) : (
                <EyeFilledIcon className="text-2xl text-default-400 pointer-events-none" />
              )}
            </button>
          }
          isInvalid={!!state?.errors?.password}
          errorMessage={state?.errors?.password?.[0]}
        />
        <Button className="mt-2" type="submit" color="primary" isLoading={pending} fullWidth>
          {pending ? 'Registrant-se...' : 'Registrar-se'}
        </Button>
        <span
          className="mt-2 inline-flex items-center justify-center text-[0.85rem] text-default-500 dark:text-gray-300"
        >
          Ja estàs registrat?
          <Link 
            className="ml-1 font-medium"
            href="/login"
            size="sm"
            underline="hover"
            showAnchorIcon
            anchorIcon={<ArrowUpRightIcon />}
          >
            Inicia sessió
          </Link>
        </span>
      </form>
    </div>
  );
}
