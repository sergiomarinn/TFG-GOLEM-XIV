'use client';

import React from 'react';
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { SearchIcon } from '@/components/icons';
import { UserIcon, UsersIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { Alert } from '@heroui/alert';
import { Tooltip } from "@heroui/tooltip";

// Ejemplo de datos de usuarios (esto vendría de tu backend)
const courseUsers = [
  { 
    id: 1, 
    name: "Maria García", 
    email: "maria.garcia@upc.edu", 
    role: "student", 
    avatar: "https://i.pravatar.cc/150?img=1",
    lastAccess: "2025-05-01T15:30:00"
  },
  { 
    id: 2, 
    name: "Carlos López", 
    email: "carlos.lopez@upc.edu", 
    role: "student", 
    avatar: "https://i.pravatar.cc/150?img=2",
    lastAccess: "2025-05-04T09:45:00"
  },
  { 
    id: 3, 
    name: "Laura Martínez", 
    email: "laura.martinez@upc.edu", 
    role: "student", 
    avatar: "https://i.pravatar.cc/150?img=3",
    lastAccess: "2025-05-02T11:20:00"
  },
  { 
    id: 4, 
    name: "Jordi Garcia", 
    email: "jordi.garcia@upc.edu", 
    role: "professor", 
    avatar: "https://i.pravatar.cc/150?img=4",
    lastAccess: "2025-05-05T10:15:00"
  },
  { 
    id: 5, 
    name: "Elena Ruiz", 
    email: "elena.ruiz@upc.edu",
    role: "professor",
    avatar: "https://i.pravatar.cc/150?img=5",
    lastAccess: "2025-05-03T16:40:00"
  },
  { 
    id: 6, 
    name: "Pablo Sánchez", 
    email: "pablo.sanchez@upc.edu", 
    role: "student", 
    avatar: "https://i.pravatar.cc/150?img=6",
    lastAccess: "2025-05-01T14:10:00"
  }
];

const roleOptions = [
  { name: "Tots", uid: "all" },
  { name: "Professors", uid: "professor" },
  { name: "Estudiants", uid: "student" }
];

const getRelativeTime = (dateString) => {
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

const getRoleName = (role: string) => {
  switch(role) {
    case 'professor': return 'Professor';
    case 'teaching_assistant': return 'Professor assistent';
    case 'student': return 'Estudiant';
    default: return role;
  }
};

const getRoleColor = (role: string) => {
  switch(role) {
    case 'professor': return 'primary';
    case 'teaching_assistant': return 'secondary';
    case 'student': return 'default';
    default: return 'default';
  }
};

export function ParticipantsSection() {
  const [filterValue, setFilterValue] = React.useState("");
  const [tabSelection, setTabSelection] = React.useState("all");
  
  const hasSearchFilter = Boolean(filterValue);

  const filteredUsers = React.useMemo(() => {
    let filteredUsers = [...courseUsers];

    // Apply tab filter first
    if (tabSelection !== "all") {
      filteredUsers = filteredUsers.filter((user) => user.role === tabSelection);
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
      </div>
    );
  }, [courseUsers, filterValue, tabSelection]);

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
              <span>Professors ({courseUsers.filter(u => u.role === "professor").length})</span>
            </div>
          }
        />
        <Tab 
          key="student" 
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Estudiants ({courseUsers.filter(u => u.role === "student").length})</span>
            </div>
          }
        />
      </Tabs>
      
      {topContent}
      
      <div className="flex flex-col gap-3">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="w-full">
            <CardBody className="flex flex-row items-center py-3">
              <Avatar src={user.avatar} className="mr-4" />
              <div className="flex-grow">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg mr-2">{user.name}</h3>
                  <Chip 
                    color={getRoleColor(user.role)}
                    size="sm" 
                    variant="flat"
                  >
                    {getRoleName(user.role)}
                  </Chip>
                </div>
                <p className="text-default-500">{user.email}</p>
              </div>
              <Tooltip content="Enviar missatge">
                <Button
                  aria-label="Enviar missatge"
                  color="primary"
                  isIconOnly
                >
                <PaperAirplaneIcon className="size-5"/>
                </Button>
              </Tooltip>
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