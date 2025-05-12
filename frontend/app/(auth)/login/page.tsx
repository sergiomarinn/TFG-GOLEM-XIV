'use client'

import { login } from '@/app/actions/auth';
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import { Link } from "@heroui/link";
import { Tabs, Tab } from "@heroui/tabs";
import { useActionState, useState, useEffect } from 'react';
import { 
  MailIcon, 
  EyeSlashFilledIcon, 
  EyeFilledIcon,
  CardIcon,
  ArrowUpRightIcon
} from '@/components/icons'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)
  const [isVisible, setIsVisible] = useState(false);
  const [selected, setSelected] = useState("niub");
  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  useEffect(() => {
    if (state?.success) {
      addToast({
        title: "Acabes d'inicia de sessió correctament",
        description: state?.message,
        timeout: 3500,
        shouldShowTimeoutProgress: true,
        color: "success",
      });
    }
    else if (state?.success === false) {
      addToast({
        title: "Error a l'inica sessió",
        description: state?.message,
        timeout: 5000,
        color: "danger",
      });
    }
  }, [state]);

  return (
    <div className="flex flex-col justify-center p-10 rounded-xl shadow-xl sm:w-11/12 md:w-[450px] border-[1.35px] border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black dark:shadow-gray-800">
      <h1 className="font-extrabold text-center text-2xl mb-1">Inicia sessió</h1>
      <h2 className="text-center text-sm text-default-600 dark:text-default-400 mb-5">Hola, benvingut de nou👋</h2>
      <form action={action} noValidate className="flex flex-col">
        <Tabs aria-label="Options" selectedKey={selected} onSelectionChange={setSelected} fullWidth classNames={{tab: "p-0"}}>
          <Tab key="niub" title="NIUB">
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
          </Tab>
          <Tab key="email" title="Email">
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
          </Tab>
        </Tabs>
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
        <Button className="mt-5" type="submit" color="primary" isLoading={pending} fullWidth>
          {pending ? 'Iniciant sessió...' : 'Inicia sessió'}
        </Button>
        <span
          className="mt-5 inline-flex items-center justify-center text-[0.85rem] text-default-500 dark:text-gray-300"
        >
          No estàs registrat?
          <Link 
            className="ml-1 font-medium"
            href="/register"
            size="sm"
            underline="hover"
            showAnchorIcon
            anchorIcon={<ArrowUpRightIcon />}
          >
            Crea el teu compte
          </Link>
        </span>
      </form>
    </div>
  );
}
