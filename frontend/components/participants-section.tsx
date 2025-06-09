'use client';

import React, { useEffect } from 'react';
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Button } from '@heroui/button';
import { Avatar } from "@heroui/avatar";
import { Card, CardBody } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from "@heroui/modal";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { SearchIcon } from '@/components/icons';
import { UserIcon, UsersIcon, PaperAirplaneIcon, TrashIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Alert } from '@heroui/alert';
import { Tooltip } from "@heroui/tooltip";
import { User } from '@/app/lib/definitions';
import { motion, AnimatePresence } from "framer-motion";
import { addToast } from '@heroui/toast';
import { addStudentByNiub, deleteStudentFromCourse } from '@/app/actions/course';
import { getStudentsUsers } from '@/app/actions/user';
import { Skeleton } from '@heroui/skeleton';
import { Link } from '@heroui/link';

const UserCardSkeleton = ({ count = 5, showDeleteButton = true }) => {
  return (
    <div className="flex flex-col gap-3">
      {Array(count).fill(0).map((_, index) => (
        <Card key={index} className="w-full">
          <CardBody className="flex flex-row items-center px-3.5 py-3">
            {/* Avatar skeleton with shimmer effect */}
            <div className="mr-3">
              <Skeleton className="size-9 rounded-full" />
            </div>
            
            {/* User info skeleton with varying widths */}
            <div className="flex-grow">
              <div className="flex items-center gap-2">
                <Skeleton className="h-6 w-24 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-36 rounded-md mt-1" />
            </div>
            
            {/* Action buttons skeleton */}
            <div className="flex items-center gap-2">
              <Skeleton className="size-9 rounded-lg" />
              
              {showDeleteButton && (
                <Skeleton className="size-9 rounded-lg" />
              )}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
};

// const getRelativeTime = (dateString: string) => {
//   const date = new Date(dateString);
//   const now = new Date();
//   const diffTime = Math.abs(now - date);
//   const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
//   if (diffDays === 0) {
//     return "Avui";
//   } else if (diffDays === 1) {
//     return "Ahir";
//   } else if (diffDays < 7) {
//     return `Fa ${diffDays} dies`;
//   } else if (diffDays < 30) {
//     const weeks = Math.floor(diffDays / 7);
//     return `Fa ${weeks} ${weeks === 1 ? 'setmana' : 'setmanes'}`;
//   } else {
//     const options = { day: 'numeric', month: 'short' };
//     return date.toLocaleDateString('ca-ES', options);
//   }
// };

const getRoleName = (user: User) =>
  user.is_student ? 'Estudiant' : user.is_teacher ? 'Professor' : 'Admin';

const getRoleColor = (user: User) =>
  user.is_student ? 'default' : user.is_teacher ? 'primary' : 'warning';

export function ParticipantsSection({courseId, courseUsers, canEditCourse, isLoading}: {courseId: string, courseUsers: User[], canEditCourse: boolean, isLoading: boolean}) {
  const [users, setUsers] = React.useState<User[]>([]);
  const [filterValue, setFilterValue] = React.useState("");
  const [tabSelection, setTabSelection] = React.useState("all");
  const { isOpen, onOpen, onOpenChange, onClose } = useDisclosure();
  const [isOpenPopoverDelete, setIsOpenPopoverDelete] = React.useState(false);

  // Estado de popover por niub
  const [openPopovers, setOpenPopovers] = React.useState<Record<string, boolean>>({});
  const [deletingUser, setDeletingUser] = React.useState<string | null>(null);

  // Estados para el modal de añadir estudiantes
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<User[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedStudents, setSelectedStudents] = React.useState<Set<string>>(new Set());
  const [isAddingStudents, setIsAddingStudents] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);
  
  useEffect(() => {
    const sortedCourseUsers = courseUsers.sort((a, b) => a.name.localeCompare(b.name));
    setUsers(sortedCourseUsers)
  }, [courseUsers]);

  const handleOpenPopover = (niub: string, isOpen: boolean) => {
    setOpenPopovers(prev => ({...prev, [niub]: isOpen}));
  };

  const handleDelete = async (niub: string) => {
    try {
      if (!niub) return;
      setDeletingUser(niub);
      await deleteStudentFromCourse(courseId, niub);
      addToast({
        title: `Estudiant ${niub} eliminat correctament`,
        color: "success"
      })
      setUsers(prevUsers => prevUsers.filter(user => user.niub !== niub));
    } catch (error) {
      addToast({
        title: `Error en eliminar  el estudiant ${niub}`,
        color: "danger"
      })
      console.error(error);
    } finally {
      setDeletingUser(null);
      handleOpenPopover(niub, false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      setIsSearching(true);
      setHasSearched(true);
      const { data: results } = await getStudentsUsers(searchQuery);
      
      const existingNiubs = new Set(users.map(user => user.niub));
      const filteredResults = results.filter(user => !existingNiubs.has(user.niub));
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching students:", error);
      addToast({
        title: "Error al cercar estudiants",
        color: "danger"        
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleStudentSelection = (niub: string) => {
    setSelectedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(niub)) {
        newSet.delete(niub);
      } else {
        newSet.add(niub);
      }
      return newSet;
    });
  };

  // Función para añadir los estudiantes seleccionados al curso
  const addSelectedStudents = async () => {
    if (selectedStudents.size === 0) return;
    
    setIsAddingStudents(true);
    const addedStudents: User[] = [];
    const failedStudents: string[] = [];
    
    try {
      for (const niub of Array.from(selectedStudents)) {
        try {
          await addStudentByNiub(courseId, niub);
          const student = searchResults.find(s => s.niub === niub);
          if (student) addedStudents.push(student);
        } catch (error) {
          console.error(`Error al añadir estudiante ${niub}:`, error);
          failedStudents.push(niub);
        }
      }
      
      // Actualizar la lista de usuarios
      if (addedStudents.length > 0) {
        setUsers(prev => [...prev, ...addedStudents]);
        addToast({
          title: `${addedStudents.length} estudiants afegits correctament`,
          color: "success"
        });
      }
      
      if (failedStudents.length > 0) {
        addToast({
          title: `Error a l'afegir ${failedStudents.length} estudiants`,
          color: "danger"
        });
      }
      
      // Reiniciar el estado
      setSelectedStudents(new Set());
      setSearchResults([]);
      setSearchQuery("");
      
      // Si todos los estudiantes fueron añadidos con éxito, cerrar el modal
      if (failedStudents.length === 0) {
        onClose();
      }
    } catch (error) {
      console.error("Error al añadir estudiantes:", error);
      addToast({
        title: "Error al añadir estudiantes",
        color: "danger"
      });
    } finally {
      setIsAddingStudents(false);
    }
  };
  
  const hasSearchFilter = Boolean(filterValue);

  const filteredUsers = React.useMemo(() => {
    let filteredUsers = [...users];

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
  }, [users, filterValue, tabSelection]);

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
                onPress={onOpen}
              >
                Afegir estudiant
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }, [users, canEditCourse, filterValue, tabSelection]);

  return (
    <div className="flex flex-col gap-3 p-4 rounded-3xl border-1.5 border-default-200 bg-content1">
      <Tabs 
        selectedKey={tabSelection} 
        onSelectionChange={(key) => setTabSelection(key as string)}
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
              <span>Tots ({users.length})</span>
            </div>
          }
        />
        <Tab 
          key="professor" 
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Professors ({users.filter(u => u.is_teacher === true).length})</span>
            </div>
          }
        />
        <Tab 
          key="student" 
          title={
            <div className="flex items-center gap-2">
              <UserIcon className="size-4" />
              <span>Estudiants ({users.filter(u => u.is_student === true).length})</span>
            </div>
          }
        />
      </Tabs>
      
      {topContent}
      
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <UserCardSkeleton />
        ) : filteredUsers.map((user) => (
          <Card key={user.niub} className="w-full">
            <CardBody className="flex flex-row items-center px-3.5 py-3">
              <Avatar showFallback className="mr-3 flex-shrink-0" />
              <div className="flex-grow min-w-0 mr-4">
                <div className="flex items-center">
                  <h3 className="font-semibold text-lg truncate mr-2">{user.name + " " + user.surnames}</h3>
                  <Chip
                    color={getRoleColor(user)}
                    size="sm" 
                    variant="flat"
                  >
                    {getRoleName(user)}
                  </Chip>
                </div>
                <p className="text-default-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <Tooltip content="Enviar missatge">
                  <Button
                    as={Link}
                    href={`mailto:${user.email}`}
                    aria-label={`Enviar missatge a ${user.name}`}
                    color="primary"
                    isIconOnly
                  >
                  <PaperAirplaneIcon className="size-5"/>
                  </Button>
                </Tooltip>
                <AnimatePresence>
                  {canEditCourse && user.is_student && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    > 
                      <Popover 
                        isOpen={!!openPopovers[user.niub ?? ""]} 
                        onOpenChange={(open) => handleOpenPopover(user.niub ?? "", open)}
                        placement="bottom-end"
                        showArrow
                      >
                        <PopoverTrigger>
                          <Button
                            aria-label={`Esborrar l'estudiant ${user.name}`}
                            color="danger"
                            isIconOnly
                          >
                            <TrashIcon className="size-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent>
                          <div className="flex flex-col gap-3 p-2">
                            <p className="text-sm text-default-600">
                              Estàs segur que vols esborrar el estudiant <strong>{user.niub}</strong>?
                            </p>
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="light" onPress={() => handleOpenPopover(user.niub ?? "", false)}>
                                Cancel·lar
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                onPress={() => handleDelete(user.niub ?? "")}
                                isLoading={deletingUser === user.niub}
                              >
                                Confirmar
                              </Button>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
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
      <Modal size="xl" isOpen={isOpen} onOpenChange={onOpenChange} scrollBehavior="inside" backdrop="blur">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Afegir estudiants</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-1.5">
                    <Input
                      isClearable
                      fullWidth
                      placeholder="Cerca estudiants por nom, cognoms, email o NIUB..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                      startContent={<SearchIcon className="text-default-500" />}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                    />
                    <Button 
                      color="primary" 
                      isLoading={isSearching}
                      onPress={handleSearch}
                    >
                      Buscar
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-default-600">Resultats: {searchResults.length}</span>
                        {selectedStudents.size > 0 && (
                          <span className="text-sm text-primary">{selectedStudents.size} {selectedStudents.size > 1 ? "seleccionats" : "seleccionat"}</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col gap-2 overflow-y-auto border border-default-200 rounded-lg p-2">
                        {searchResults.map((student) => (
                          <Card key={student.niub} className="w-full">
                            <CardBody className="py-2 px-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Avatar 
                                    showFallback 
                                    name={student.name[0]} 
                                    size="sm"
                                    classNames={{
                                      base: "text-sm"
                                    }}
                                  />
                                  <div>
                                    <p className="font-medium">{student.name + " " + student.surnames}</p>
                                    <p className="text-xs text-default-500">{student.niub} • {student.email}</p>
                                  </div>
                                </div>
                                <Button
                                  isIconOnly
                                  color={selectedStudents.has(student.niub ?? "") ? "success" : "default"}
                                  variant={selectedStudents.has(student.niub ?? "") ? "solid" : "light"}
                                  size="sm"
                                  onPress={() => toggleStudentSelection(student.niub ?? "")}
                                >
                                  {selectedStudents.has(student.niub ?? "") ? (
                                    <CheckIcon className="size-4" />
                                  ) : (
                                    <PlusIcon className="size-4" />
                                  )}
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : hasSearched && !isSearching ? (
                    <Alert 
                      hideIcon
                      color="warning" 
                      title="No s'ha trobat cap estudiant que coincideixi amb la cerca"
                      description="Prova a cercar amb un altre nom, cognoms, email o niub per tornar a intentar-ho."
                    />
                  ) : null}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  Cancel·lar
                </Button>
                <Button 
                  color="primary" 
                  onPress={addSelectedStudents}
                  isDisabled={selectedStudents.size === 0}
                  isLoading={isAddingStudents}
                >
                  Afegir {selectedStudents.size > 0 ? `(${selectedStudents.size})` : ''}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}