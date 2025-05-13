'use client';

import React from 'react';
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { SearchIcon } from '@/components/icons';
import { UserIcon, UsersIcon, PaperAirplaneIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Alert } from '@heroui/alert';
import { Tooltip } from "@heroui/tooltip";
import { User } from '@/app/lib/definitions';
import { motion, AnimatePresence } from "framer-motion";

const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return "Avui";
  } else if (diffDays === 1) {
    return "Ahir";
  } else if (diffDays < 7) {
    return `Fa ${diffDays} dies`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Fa ${weeks} ${weeks === 1 ? 'setmana' : 'setmanes'}`;
  } else {
    const options = { day: 'numeric', month: 'short' };
    return date.toLocaleDateString('ca-ES', options);
  }
};

const getRoleName = (isStudent: boolean, isTeacher: boolean) => {
  if (isStudent) return 'Estudiant';
  if (isTeacher) return 'Professor';
};

const getRoleColor = (isStudent: boolean, isTeacher: boolean) => {
  if (isStudent) return 'default';
  if (isTeacher) return 'primary';
};

export function ParticipantsSection({courseUsers, canEditCourse}: {courseUsers: User[], canEditCourse: boolean}) {
  const [filterValue, setFilterValue] = React.useState("");
  const [tabSelection, setTabSelection] = React.useState("all");
  
  const hasSearchFilter = Boolean(filterValue);

  const filteredUsers = React.useMemo(() => {
    let filteredUsers = [...courseUsers];

    // Apply tab filter first
    if (tabSelection !== "all") {
      filteredUsers = filteredUsers.filter((user) => {
        if (tabSelection === "professor") {
          return user.is_teacher === true;
        }
        if (tabSelection === "student") {
          return user.is_student === true;
        }
        return false;
      });
    }

    // Then apply text search
    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        user.email.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredUsers;
  }, [courseUsers, filterValue, tabSelection]);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex justify-between gap-3 items-end w-full">
        <Input
          isClearable
          fullWidth
          placeholder="Cerca per nom o email..."
          startContent={<SearchIcon />}
          value={filterValue}
          onClear={() => setFilterValue("")}
          onValueChange={setFilterValue}
        />
        <AnimatePresence>
          {canEditCourse && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                aria-label="Afegir estudiant"
                color="success"
                variant="flat"
                startContent={<PlusIcon className="size-5" />}
              >
                Afegir estudiant
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [courseUsers, canEditCourse, filterValue, tabSelection]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-3xl border-1.5 border-default-200 bg-content1">
      <Tabs 
        selectedKey={tabSelection} 
        onSelectionChange={setTabSelection}
        aria-label="Participants tabs"
        variant="underlined"
        classNames={{
          tabList: "gap-6",
          tab: "max-w-fit px-0 h-10"
        }}
      >
        <Tab 
          key="all" 
          title={
            <div className="flex items-center gap-2">
              <UsersIcon className="size-4" />
              <span>Tots ({courseUsers.length})</span>
            </div>
          }
        />
        <Tab 
          key="professor" 
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Professors ({courseUsers.filter(u => u.is_teacher === true).length})</span>
            </div>
          }
        />
        <Tab 
          key="student" 
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Estudiants ({courseUsers.filter(u => u.is_student === true).length})</span>
            </div>
          }
        />
      </Tabs>
      
      {topContent}
      
      <div className="flex flex-col gap-3">
        {filteredUsers.map((user) => (
          <Card key={user.niub} className="w-full">
            <CardBody className="flex flex-row items-center py-3">
              <Avatar showFallback className="mr-4" />
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg mr-2">{user.name}</h3>
                  <Chip 
                    color={getRoleColor(user.is_student, user.is_teacher)}
                    size="sm" 
                    variant="flat"
                  >
                    {getRoleName(user?.is_student, user.is_teacher)}
                  </Chip>
                </div>
                <p className="text-default-500">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Enviar missatge">
                  <Button
                    aria-label="Enviar missatge"
                    color="primary"
                    isIconOnly
                  >
                  <PaperAirplaneIcon className="size-5"/>
                  </Button>
                </Tooltip>
                <AnimatePresence>
                  {canEditCourse && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Tooltip content="Esborrar estudiant">
                        <Button
                          aria-label="Esborrar estudiant"
                          color="danger"
                          isIconOnly
                        >
                          <TrashIcon className="size-5" />
                        </Button>
                      </Tooltip>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardBody>
          </Card>
        ))}

        {filteredUsers.length === 0 && (
          <Alert
            hideIcon
            color="warning"
            title="Cap coincidència trobada"
            description="No s'ha trobat cap participant que coincideixi amb els filtres aplicats."
          />
        )}
      </div>
    </div>
  );
}