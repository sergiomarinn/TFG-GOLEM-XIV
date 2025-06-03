import { Practice } from "@/types/practice";
import { Button } from "@heroui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter
} from "@heroui/drawer";
import { Tooltip } from '@heroui/tooltip';
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { DatePicker } from "@heroui/date-picker";
import { useEffect, useState } from "react";
import { TrashIcon } from "@heroicons/react/24/outline";
import { FileUploader } from "@/components/file-uploader";
import { addToast } from "@heroui/toast";
import { createPractice, deletePractice, updatePractice } from "@/app/actions/practice";
import { DateValue, parseAbsoluteToLocal, parseZonedDateTime, ZonedDateTime } from "@internationalized/date";
import { Course } from "@/types/course";
import { downloadStudentsTemplateCSV } from "@/app/actions/course";

interface PracticeDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialPractice: Practice | null,
  course: Course,
  onSave: (updatedPractice: Practice) => void
  onDelete: (practiceId: string) => void
}

export const PracticeDrawer = ({ 
  isOpen = false, 
  onOpenChange,  
  initialPractice = null,
  course,
  onSave,
  onDelete
}: PracticeDrawerProps) => {
  const [practice, setPractice] = useState<Practice | null>(initialPractice);
  const [files, setFiles] = useState<File[]>([]);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isCreatingOrUpdatingPractice, setIsCreatingOrUpdatingPractice] = useState(false);
  const [isOpenPopoverDelete, setIsOpenPopoverDelete] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  type EditFormField = "name" | "description" | "programming_language" | "due_date" | "course_id";

  const [editFormData, setEditFormData] = useState({
    name: practice?.name || "",
    description: practice?.description || "",
    programming_language: practice?.programming_language || "",
    due_date: practice?.due_date
      ? parseZonedDateTime(practice.due_date.split(".")[0] + "[Europe/Madrid]")
      : parseAbsoluteToLocal(new Date().toISOString()),
    course_id: course?.id || ""
  });

  useEffect(() => {
    if (initialPractice) {
      setEditFormData({
        name: initialPractice?.name || "",
        description: initialPractice?.description || "",
        programming_language: initialPractice?.programming_language || "",
        due_date: initialPractice?.due_date
          ? parseZonedDateTime(initialPractice.due_date.split(".")[0] + "[Europe/Madrid]")
          : parseAbsoluteToLocal(new Date().toISOString()),
        course_id: course?.id || ""
      });
      setPractice(initialPractice);
      setFiles([]);
    } else {
      // Reseteamos el formulario para creación
      setEditFormData({
        name: "",
        description: "",
        programming_language: "",
        due_date: parseAbsoluteToLocal(new Date().toISOString()),
        course_id: course?.id || ""
      });
      setPractice(null);
      setFiles([]);
    }
  }, [initialPractice, course, isOpen]);

  const handleEditFormChange = (field: EditFormField, value: string | ZonedDateTime | null) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  const handlePractice = async () => {
    const practiceData = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim(),
      programming_language: editFormData.programming_language.trim(),
      due_date: editFormData.due_date.add({ hours: 2 }).toAbsoluteString(),
      course_id: editFormData.course_id.trim(),
    };

    if (practice?.id) {
      try {
        setIsCreatingOrUpdatingPractice(true);
        const updatedPractice = await updatePractice(practice.id, practiceData);
        addToast({
          title: `Pràctica ${updatedPractice.name} actualizada correctament`,
          color: "success"
        })
        setPractice(updatedPractice);
        onSave?.(updatedPractice);
        onOpenChange?.(false);
      } catch (error) {
        console.error("Error updating practice:", error);
        addToast({
          title: `Error en actualizar la pràctica ${editFormData.name.trim()}`,
          color: "danger"
        })
      } finally {
        setIsCreatingOrUpdatingPractice(false);
      }
    } 
    // Si es una práctica nueva (modo creación)
    else {
      try {
        setIsCreatingOrUpdatingPractice(true);
        const createdPractice = await createPractice(practiceData, files);
        addToast({
          title: `Pràctica ${createdPractice.name} creada correctament`,
          color: "success"
        })
        setPractice(createdPractice);
        onSave?.(createdPractice);
        onOpenChange?.(false);
      } catch (error) {
        console.error("Error creating practice:", error);
        addToast({
          title: `Error en crear la pràctica ${editFormData.name.trim()}`,
          color: "danger"
        })
      } finally {
        setIsCreatingOrUpdatingPractice(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (!practice?.id) return;
      setIsDeletingCourse(true);
      await deletePractice(practice.id);
      addToast({
        title: `Pràctica ${practice.name} eliminada correctament`,
        color: "success"
      })
      onDelete?.(practice.id)
      onOpenChange?.(false);
    } catch (error) {
      addToast({
        title: `Error en eliminar la pràctica ${practice?.name}`,
        color: "danger"
      })
      console.error(error);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const isSaveCreateEnabled = (() => {
    // Comprueba que los campos del formulario esenciales NO estén vacíos
    const hasRequiredFields = editFormData.name?.trim() !== "" && editFormData.description?.trim() !== "" && editFormData.programming_language?.trim() !== "" && editFormData.due_date && editFormData.course_id?.trim() !== "";

    if (practice?.id) {
      // Modo edición: basta con que los campos esenciales tengan datos
      return hasRequiredFields;
    } else {
      // Modo creación: campos esenciales + archivo cargado
      return hasRequiredFields && !!files[0];
    }
  })();

  const programmingLanguageOptions = [
    { value: "python", label: "Python" },
    { value: "java", label: "Java" }
  ];

	return (
    <Drawer
      hideCloseButton
      backdrop="blur"
      classNames={{
        base: "data-[placement=right]:sm:m-2 data-[placement=left]:sm:m-2 rounded-medium",
      }}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable={false}
    >
      <DrawerContent>
        {(onClose) => (
          <>
            <DrawerHeader className="absolute top-0 inset-x-0 z-50 flex flex-row gap-2 px-2 py-2 border-b border-default-200/50 justify-between bg-content1/50 backdrop-saturate-150 backdrop-blur-lg">
              <div className="w-full flex items-center justify-between">
                <Tooltip content="Tancar">
                  <Button
                    isIconOnly
                    className="text-default-400"
                    size="sm"
                    variant="light"
                    onPress={onClose}
                  >
                    <svg
                      fill="none"
                      height="20"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="m13 17 5-5-5-5M6 17l5-5-5-5" />
                    </svg>
                  </Button>
                </Tooltip>
                {practice && <Popover isOpen={isOpenPopoverDelete} onOpenChange={(open) => setIsOpenPopoverDelete(open)}>
                  <PopoverTrigger>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<TrashIcon className="size-4" />}
                    >
                      Esborrar
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <div className="flex flex-col gap-3 p-2">
                      <p className="text-sm text-default-600">
                        Estàs segur que vols esborrar la pràctica <strong>{practice.name}</strong>?
                      </p>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="light" onPress={() => setIsOpenPopoverDelete(false)}>
                          Cancel·lar
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onPress={handleDelete}
                          isLoading={isDeletingCourse}
                        >
                          Confirmar
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>}
              </div>
            </DrawerHeader>
            <DrawerBody className="pt-14">
              <div className="flex flex-col gap-3 pt-4">
                <h1 className="text-2xl font-bold leading-5">
                  {practice ? "Editar informació de la pràctica": "Afegir nova pràctica"}
                </h1>
                <h3 className="text-sm text-default-500">
                  {practice ? 
                  "Actualitza la informació bàsica de la pràctica. Fes clic a desar quan hagis acabat."
                  : "Afegeix la informació bàsica de la pràctica. Fes clic a desar quan hagis acabat."}
                </h3>
                <Input
                  label="Nom de la pràctica"
                  radius="lg"
                  value={editFormData.name}
                  onValueChange={(value) => handleEditFormChange("name", value)}
                />
                <Textarea
                  label="Descripció"
                  radius="lg"
                  value={editFormData.description}
                  onValueChange={(value) => handleEditFormChange("description", value)}
                />
                <Select
                  items={programmingLanguageOptions}
                  selectionMode="single"
                  label="Llenguatge de programació"
                  radius="lg"
                  selectedKeys={[editFormData.programming_language]}
                  onChange={(e) => handleEditFormChange("programming_language", e.target.value)}
                >
                  {programmingLanguageOptions.map((option) => (
                    <SelectItem key={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </Select>
                <Input
                  isReadOnly
                  label="Curs"
                  radius="lg"
                  value={course.name}
                />
                <DatePicker
                  hideTimeZone
                  showMonthAndYearPickers
                  visibleMonths={2}
                  label="Data límit"
                  value={editFormData.due_date}
                  onChange={(value) => handleEditFormChange("due_date", value)}
                />
              </div>
              {!practice && <div className="flex flex-col gap-3 pt-3 pb-4">
                <h2 className="text-xl font-bold leading-5">
                  Pujar els fitxers de correcció
                </h2>
                <div className="w-full flex flex-col gap-3 rounded-lg bg-default-200/60 p-5">
                  <div className="flex items-center gap-3 font-medium text-sm">
                    Exemple de fitxers
                  </div>
                  <p className="text-default-500/80 text-sm font-light">
                    Pots descarregar els fitxers d&apos;exemple adjunts i utilitzar-lo com a punt de partida per fer el teu fitxer de correcció
                  </p>
                  <Button
                    className="bg-default-50 border-small"
                    radius="sm"
                    variant="bordered"
                    isLoading={isDownloadingTemplate}
                    isDisabled={true}
                    onPress={async () => {
                      setIsDownloadingTemplate(true);
                      try {
                        await downloadStudentsTemplateCSV();
                      } catch (e) {
                        addToast({
                          title: "Error en descarregar el fitxers d'exemple",
                          color: "danger"
                        })
                      } finally {
                        setIsDownloadingTemplate(false);
                      }
                    }}
                  >
                    Descarregar
                  </Button>
                </div>
                <FileUploader 
                  files={files} 
                  setFiles={setFiles}
                  acceptedExtensions={"*"}
                  multiple={true}
                />
              </div>}
            </DrawerBody>
            <DrawerFooter className="flex gap-1">
              <Button variant="flat" onPress={onClose}>Cancel·lar</Button>
              <Button 
                color="primary" 
                onPress={handlePractice} 
                isLoading={isCreatingOrUpdatingPractice}
                disabled={!isSaveCreateEnabled}
              >
                {practice ? "Desar canvis" : "Crear pràctica"}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}