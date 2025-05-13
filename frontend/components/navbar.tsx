'use client'

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  SearchIcon
} from "@/components/icons";
import { User } from "@heroui/user";
import { Button } from "@heroui/button";
import { BellIcon } from "@heroicons/react/24/outline";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchInput = (
    // <div className="relative w-full">
    //   <div className="absolute top-[15px] left-4 flex items-center pointer-events-none">
    //     <SearchIcon className="text-base text-default-500" />
    //   </div>
      
    //   <input
    //     type="search"
    //     placeholder="Cerca..."
    //     aria-label="Cerca"
    //     className="w-full py-3 pl-10 pr-24 bg-content1 border-1.5 border-default-300 rounded-full text-sm focus:outline-none focus:border-blue-500 transition-colors duration-400"
    //   />
      
    //   <div className="absolute inset-y-0 right-0 flex items-center pr-3">
    //     <label htmlFor="type" className="sr-only">
    //       Tipus
    //     </label>
    //     <select
    //       id="type"
    //       name="type"
    //       className="h-full py-0 pl-2 pr-7 border-0 bg-transparent text-default-500 text-sm focus:ring-0 focus:outline-none cursor-pointer"
    //     >
    //       <option>Cursos</option>
    //       <option>Pràctiques</option>
    //     </select>
    //   </div>
    // </div>
    <Input
      aria-label="Cerca"
      size="lg"
      variant="bordered"
      placeholder="Cerca..."
      radius="full"
      classNames={{
          inputWrapper: [
            "border-1.5",
          ]
      }}
      startContent={
        <SearchIcon className="text-base text-default-400 pointer-events-none flex-shrink-0" />
      }
      endContent={
        <div className="flex items-center">
          <label className="sr-only" htmlFor="type">
            Tipus
          </label>
          <select
            className="outline-none border-0 bg-transparent text-default-400 text-small"
            id="type"
            name="type"
          >
            <option>Cursos</option>
            <option>Pràctiques</option>
          </select>
        </div>
      }
    />
  );

  return (
    <HeroUINavbar className="" maxWidth="xl" height="105px" position="sticky" onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Tancar menu" : "Obrir menu"} />
      </NavbarContent>
      <NavbarContent as="div" className="items-center hidden sm:flex" justify="start">
        {searchInput}
      </NavbarContent>
      <NavbarContent as="div" className="items-center sm:hidden" justify="center">
        {searchInput}
      </NavbarContent>
      <NavbarContent justify="end">
        <ThemeSwitch />
        <Button
          isIconOnly
          radius="full"
          variant="bordered"
          className="border-small"
        >
          <BellIcon className="size-5"/>
        </Button>
        <div className="mx-1 w-[1.5px] h-[50px] bg-default-400/80 rounded-full" />
        <User
          avatarProps={{
            showFallback: true,
          }}
          isFocusable={true}
          description="Product Designer"
          name="Jane Doe"
        />
      </NavbarContent>
      <NavbarMenu>
        {siteConfig.navMenuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              color="foreground"
              href={item.href}
              size="lg"
            >
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </HeroUINavbar>
  );
};
