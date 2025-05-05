'use client'

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Button } from "@heroui/button";
import { Kbd } from "@heroui/kbd";
import { Link } from "@heroui/link";
import { Input } from "@heroui/input";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { useState } from "react";

import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import {
  TwitterIcon,
  GithubIcon,
  DiscordIcon,
  HeartFilledIcon,
  SearchIcon,
  Logo,
} from "@/components/icons";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const searchInput = (
    <Input
      
      aria-label="Cerca"
      size="lg"
      variant="bordered"
      placeholder="Cerca..."
      radius="full"
      className="bg-white"
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
      type="search"
    />
  );

  return (
    <HeroUINavbar className="bg-slate-100" maxWidth="xl" height="105px" position="sticky" onMenuOpenChange={setIsMenuOpen}>
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Tancar menu" : "Obrir menu"} />
      </NavbarContent>
      <NavbarContent as="div" className="items-center" justify="start">
        {searchInput}
      </NavbarContent>
      <NavbarContent as="div" className="items-center sm:hidden" justify="center">
        {searchInput}
      </NavbarContent>
      <NavbarContent justify="end">
        <ThemeSwitch />
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
