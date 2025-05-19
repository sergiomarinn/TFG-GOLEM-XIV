import { Course } from "@/types/course";
import { Button,ButtonGroup } from "@heroui/button";
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
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useEffect, useState } from "react";
import { ChevronDownIcon, EyeDropperIcon, TrashIcon } from "@heroicons/react/24/outline";
import { FileUploader } from "@/components/file-uploader";
import { createCourse, deleteCourse, downloadStudentsTemplateCSV, downloadStudentsTemplateXLSX, updateCourse } from "@/app/actions/course";
import { addToast } from "@heroui/toast";

const gradients = {
  blue: "bg-gradient-to-br from-blue-500 to-violet-600",
  purple: "bg-gradient-to-br from-purple-500 to-pink-600",
  green: "bg-gradient-to-br from-emerald-500 to-teal-700",
  orange: "bg-gradient-to-br from-amber-500 to-orange-600",
  pink: "bg-gradient-to-br from-pink-400 to-rose-600",
  cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600",
  red: "bg-gradient-to-br from-red-500 to-rose-700",
  indigo: "bg-gradient-to-br from-indigo-500 to-purple-700",
  lime: "bg-gradient-to-br from-lime-400 to-green-600",
  default: "bg-gradient-to-br from-gray-500 to-gray-700"
};

export type GradientColor = keyof typeof gradients;

const ColorSelector = ({ selectedColor, onColorSelect }: { selectedColor: string, onColorSelect: (color: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Popover 
        isOpen={isOpen} 
        onOpenChange={(open) => setIsOpen(open)}
        placement="top-end"
      >
        <PopoverTrigger>
          <Button
            className="absolute bottom-3 right-3"
            isIconOnly
            radius="full"
          >
            <EyeDropperIcon className="size-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="p-2 grid grid-cols-5 gap-1">
            {Object.keys(gradients).map((color) => (
              <button
                key={color}
                onClick={() => {
                  onColorSelect(color);
                  setIsOpen(false);
                }}
                className={`w-6 h-6 rounded-full ${color === selectedColor ? "ring-2 ring-offset-1" : ""} ${gradients[color as GradientColor]}`}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

const getCurrentAcademicYear = (): string => {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  if (month <= 6) {
    return `${year - 1}-${year}`;
  } else {
    return `${year}-${year + 1}`;
  }
}


interface CourseDrawerProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  initialCourse: Course | null
  onSave: (updatedCourse: Course) => void
  onDelete: (courseId: string) => void
}

export const CourseDrawer = ({ 
  isOpen = false, 
  onOpenChange,  
  initialCourse = null,
  onSave,
  onDelete
}: CourseDrawerProps) => {
  const [course, setCourse] = useState<Course | null>(initialCourse);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedDownloadOption, setSelectedDownloadOption] = useState(new Set(["xlsx"]));
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isCreatingOrUpdatingCourse, setIsCreatingOrUpdatingCourse] = useState(false);
  const [isOpenPopoverDelete, setIsOpenPopoverDelete] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  type EditFormField = "name" | "academic_year" | "semester" | "description" | "color";

  const [editFormData, setEditFormData] = useState({
    name: course?.name || "",
    description: course?.description || "",
    semester: course?.semester || "",
    academic_year: getCurrentAcademicYear(),
    color: course?.color || "default"
  });

  useEffect(() => {
    if (initialCourse) {
      setEditFormData({
        name: initialCourse.name || "",
        description: initialCourse.description || "",
        semester: initialCourse.semester || "",
        academic_year: initialCourse.academic_year || getCurrentAcademicYear(),
        color: initialCourse.color || "default"
      });
      setCourse(initialCourse);
      setFiles([]);
    } else {
      // Reseteamos el formulario para creación
      setEditFormData({
        name: "",
        description: "",
        semester: "",
        academic_year: getCurrentAcademicYear(),
        color: "default"
      });
      setCourse(null);
      setFiles([]);
    }
  }, [initialCourse, isOpen]);

  const handleEditFormChange = (field: EditFormField, value: string) => {
    setEditFormData({
      ...editFormData,
      [field]: value
    });
  };

  const handleCourse = async () => {
    const updatedData = {
      name: editFormData.name.trim(),
      academic_year: editFormData.academic_year.trim(),
      semester: editFormData.semester.trim() as "primavera" | "tardor",
      description: editFormData.description.trim(),
      color: editFormData.color.trim() as GradientColor,
    };

    // Si ya existe un curso (modo edición)
    if (course?.id) {
      try {
        setIsCreatingOrUpdatingCourse(true);
        const updatedCourse = await updateCourse(course.id, updatedData);
        addToast({
          title: `Curs ${updatedCourse.name} actualizat correctament`,
          color: "success"
        })
        setCourse(updatedCourse);
        onSave?.(updatedCourse);
        onOpenChange?.(false);
      } catch (error) {
        console.error("Error updating course:", error);
        addToast({
          title: `Error en actualizar el curs ${editFormData.name.trim()}`,
          color: "danger"
        })
      } finally {
        setIsCreatingOrUpdatingCourse(false);
      }
    } 
    // Si es un curso nuevo (modo creación)
    else {
      try {
        setIsCreatingOrUpdatingCourse(true);
        const createdCourse = await createCourse(updatedData, files[0]);
        addToast({
          title: `Curs ${createdCourse.name} creat correctament`,
          color: "success"
        })
        setCourse(createdCourse);
        onSave?.(createdCourse);
        onOpenChange?.(false);
      } catch (error) {
        console.error("Error creating course:", error);
        addToast({
          title: `Error en crear el curs ${editFormData.name.trim()}`,
          color: "danger"
        })
      } finally {
        setIsCreatingOrUpdatingCourse(false);
      }
    }
  };

  const handleDelete = async () => {
    try {
      if (!course?.id) return;
      setIsDeletingCourse(true);
      await deleteCourse(course.id);
      addToast({
        title: `Curs ${course.name} eliminat correctament`,
        color: "success"
      })
      onDelete?.(course.id)
      onOpenChange?.(false);
    } catch (error) {
      addToast({
        title: `Error en eliminar el curs ${course?.name}`,
        color: "danger"
      })
      console.error(error);
    } finally {
      setIsDeletingCourse(false);
    }
  };

  const isSaveCreateEnabled = (() => {
    // Comprueba que los campos del formulario esenciales NO estén vacíos
    const hasRequiredFields = editFormData.name?.trim() !== "" && editFormData.description?.trim() !== "" && editFormData.semester?.trim() !== "" && editFormData.academic_year?.trim() !== "" && editFormData.color?.trim() !== "";

    if (course?.id) {
      // Modo edición: basta con que los campos esenciales tengan datos
      return hasRequiredFields;
    } else {
      // Modo creación: campos esenciales + archivo cargado
      return hasRequiredFields && !!files[0];
    }
  })();

  const semesterOptions = [
    { value: "tardor", label: "Tardor" },
    { value: "primavera", label: "Primavera" }
  ];

  const downloadDescriptionsMap = {
    xlsx: "Descarregar la plantilla en format XLSX",
    csv: "Descarregar la plantilla en format CSV",
  };

  type DownloadOption = 'xlsx' | 'csv';

  const downloadLabelsMap: Record<DownloadOption, string> = {
    xlsx: "Descarregar",
    csv: "Descarregar (CSV)",
  };

  const selectedDownloadOptionValue: DownloadOption = Array.from(selectedDownloadOption)[0] as DownloadOption;

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
                {course && <Popover isOpen={isOpenPopoverDelete} onOpenChange={(open) => setIsOpenPopoverDelete(open)}>
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
                        Estàs segur que vols esborrar el curs <strong>{course.name}</strong>?
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
            <DrawerBody className="pt-12">
              <div className="flex w-full justify-center items-center pt-4">
                <div className="relative w-full h-64">
                  <div className={`w-full h-full ${gradients[editFormData.color]} relative rounded-3xl`}>
                    <ColorSelector 
                      selectedColor={editFormData.color} 
                      onColorSelect={(color: string) => handleEditFormChange("color", color)} 
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4">
                <h1 className="text-2xl font-bold leading-5">
                  {course ? "Editar informació del curs": "Afegir nou curs"}
                </h1>
                <h3 className="text-sm text-default-500">
                  {course ? 
                  "Actualitza la informació bàsica del curs. Fes clic a desar quan hagis acabat."
                  : "Afegeix la informació bàsica del curs. Fes clic a desar quan hagis acabat."}
                </h3>
                <Input
                  label="Nom del curs"
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
                <div className="flex items-center gap-2">
                  <Input
                    isReadOnly
                    label="Curs acadèmic"
                    radius="lg"
                    value={editFormData.academic_year}
                    onValueChange={(value) => handleEditFormChange("name", value)}
                  />
                  <Select
                    items={semesterOptions}
                    selectionMode="single"
                    label="Semestre"
                    radius="lg"
                    selectedKeys={[editFormData.semester]}
                    onChange={(e) => handleEditFormChange("semester", e.target.value)}
                  >
                    {semesterOptions.map((option) => (
                      <SelectItem key={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
              {!course && <div className="flex flex-col gap-3 pt-3 pb-4">
                <h2 className="text-xl font-bold leading-5">
                  Pujar llistat d&apos;estudiants
                </h2>
                <div className="w-full flex flex-col gap-3 rounded-lg bg-default-200/60 p-5">
                  <div className="flex items-center gap-3 font-medium text-sm">
                    <img
                      src="/xlsx_icon.svg"
                      alt="XLSX icon"
                      width={20}
                      className="block"
                    />
                    Exemple de taula
                  </div>
                  <p className="text-default-500/80 text-sm font-light">
                    Pots descarregar el fitxer d&apos;exemple adjunt i utilitzar-lo com a punt de partida per afegir els estudiants al curs.
                  </p>
                  {/* <Button
                      className="bg-default-50 border-small"
                      radius="sm"
                      variant="bordered"
                  >
                    Descarregar
                  </Button> */}
                  <ButtonGroup radius="sm" variant="bordered">
                    <Button
                      isLoading={isDownloadingTemplate}
                      className="w-full bg-default-50 border-small"
                      onPress={async () => {
                        setIsDownloadingTemplate(true);
                        try {
                          if (selectedDownloadOptionValue === "xlsx") {
                            await downloadStudentsTemplateXLSX();
                          } else {
                            await downloadStudentsTemplateCSV(); 
                          }
                        } finally {
                          setIsDownloadingTemplate(false);
                        }
                      }}
                    >
                      {downloadLabelsMap[selectedDownloadOptionValue]}
                    </Button>
                    <Dropdown placement="bottom-end">
                      <DropdownTrigger>
                        <Button isIconOnly className="bg-default-50 border-small"> 
                          <ChevronDownIcon className="size-4" />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu
                        disallowEmptySelection
                        aria-label="Download options"
                        selectedKeys={selectedDownloadOption}
                        selectionMode="single"
                        onSelectionChange={(keys) => setSelectedDownloadOption(keys as Set<string>)}
                      >
                        <DropdownItem key="xlsx" description={downloadDescriptionsMap["xlsx"]}>
                          {downloadLabelsMap["xlsx"]}
                        </DropdownItem>
                        <DropdownItem key="csv" description={downloadDescriptionsMap["csv"]}>
                          {downloadLabelsMap["csv"]}
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </ButtonGroup>
                </div>
                <FileUploader 
                  files={files} 
                  setFiles={setFiles}
                  acceptedExtensions={['csv', 'xlsx']}
                  multiple={false}
                />
              </div>}
            </DrawerBody>
            <DrawerFooter className="flex gap-1">
              <Button variant="flat" onPress={onClose}>Cancel·lar</Button>
              <Button 
                color="primary" 
                onPress={handleCourse} 
                isLoading={isCreatingOrUpdatingCourse}
                disabled={!isSaveCreateEnabled}
              >
                {course ? "Desar canvis" : "Crear curs"}
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}