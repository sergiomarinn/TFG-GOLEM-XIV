
'use client';

import React, {SVGProps} from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  SortDescriptor,
  Selection
} from "@heroui/table";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip, ChipProps } from "@heroui/chip";
import { User } from "@heroui/user";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip"
import {
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem
} from "@heroui/dropdown";

import { SearchIcon, ChevronDownIcon, EyeIcon } from '@/components/icons'

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "";
};

export const columns = [
  {name: "PRÀCTICA", uid: "name", sortable: true},
  {name: "CURS", uid: "course", sortable: true},
  {name: "PROFESSOR", uid: "teacher", sortable: true},
  {name: "ESTAT", uid: "status", sortable: true},
  {name: "DATA DE VENCIMENT", uid: "due_date", sortable: true},
  {name: "ACCIONS", uid: "actions"},
];

export const statusOptions = [
  { name: "No entregada", uid: "not_submitted" },
  { name: "Pendent de correcció", uid: "pending" },
  { name: "En revisió", uid: "reviewing" },
  { name: "Corregida", uid: "corrected" },
  { name: "Rebutjada", uid: "rejected" },
];

export const dueDateRangesOptions = [
  { name: "Propers 7 dies", uid: "next_7_days" },
  { name: "Propers 30 dies", uid: "next_30_days" },
  { name: "Propers 3 mesos", uid: "next_3_months" },
  { name: "Propers 6 mesos", uid: "next_6_months" },
];

export const practices = [
  {
    id: 1,
    name: "Introducció a JavaScript",
    course: "Web Bàsica",
    teacher: "Laura Soler",
    teacherEmail: "laura.soler@ub.edu",
    status: "pending",
    due_date: "2025-10-10",
    avatar: "https://i.pravatar.cc/150?u=1",
  },
  {
    id: 2,
    name: "Components en React",
    course: "Desenvolupament Frontend",
    teacher: "Marc Vidal",
    teacherEmail: "marc.vidal@ub.edu",
    status: "reviewing",
    due_date: "2025-08-08",
    avatar: "https://i.pravatar.cc/150?u=2",
  },
  {
    id: 3,
    name: "API REST amb Node.js",
    course: "Backend amb JavaScript",
    teacher: "Carla Rius",
    teacherEmail: "carla.rius@ub.edu",
    status: "corrected",
    due_date: "2025-12-30",
    avatar: "https://i.pravatar.cc/150?u=3",
  },
  {
    id: 4,
    name: "Estil amb TailwindCSS",
    course: "Disseny Web",
    teacher: "Joan Serra",
    teacherEmail: "joan.serra@ub.edu",
    status: "rejected",
    due_date: "2025-05-09",
    avatar: "https://i.pravatar.cc/150?u=4",
  },
  {
    id: 5,
    name: "CRUD amb Supabase",
    course: "Bases de dades modernes",
    teacher: "Núria Bosch",
    teacherEmail: "nuria.bosch@ub.edu",
    status: "pending",
    due_date: "2025-05-12",
    avatar: "https://i.pravatar.cc/150?u=5",
  },
  {
    id: 6,
    name: "Validació de formularis",
    course: "Web Bàsica",
    teacher: "Laura Soler",
    teacherEmail: "laura.soler@ub.edu",
    status: "reviewing",
    due_date: "2025-05-09",
    avatar: "https://i.pravatar.cc/150?u=6",
  },
  {
    id: 7,
    name: "Rutes dinàmiques en Next.js",
    course: "Desenvolupament Frontend",
    teacher: "Marc Vidal",
    teacherEmail: "marc.vidal@ub.edu",
    status: "not_submitted",
    due_date: "2025-05-07",
    avatar: "https://i.pravatar.cc/150?u=7",
  },
  {
    id: 8,
    name: "Autenticació amb Supabase",
    course: "Backend amb JavaScript",
    teacher: "Carla Rius",
    teacherEmail: "carla.rius@ub.edu",
    status: "corrected",
    due_date: "2025-12-29",
    avatar: "https://i.pravatar.cc/150?u=8",
  },
  {
    id: 9,
    name: "Introducció a CSS Grid",
    course: "Disseny Web",
    teacher: "Joan Serra",
    teacherEmail: "joan.serra@ub.edu",
    status: "rejected",
    due_date: "2025-09-04",
    avatar: "https://i.pravatar.cc/150?u=9",
  },
  {
    id: 10,
    name: "Relacions en PostgreSQL",
    course: "Bases de dades modernes",
    teacher: "Núria Bosch",
    teacherEmail: "nuria.bosch@ub.edu",
    status: "pending",
    due_date: "2025-05-11",
    avatar: "https://i.pravatar.cc/150?u=10",
  },
  {
    id: 11,
    name: "Intro a HTML semàntic",
    course: "Web Bàsica",
    teacher: "Laura Soler",
    teacherEmail: "laura.soler@ub.edu",
    status: "corrected",
    due_date: "2025-05-05",
    avatar: "https://i.pravatar.cc/150?u=11",
  },
  {
    id: 12,
    name: "Hooks personalitzats",
    course: "Desenvolupament Frontend",
    teacher: "Marc Vidal",
    teacherEmail: "marc.vidal@ub.edu",
    status: "reviewing",
    due_date: "2025-05-10",
    avatar: "https://i.pravatar.cc/150?u=12",
  },
  {
    id: 13,
    name: "Autenticació amb tokens",
    course: "Backend amb JavaScript",
    teacher: "Carla Rius",
    teacherEmail: "carla.rius@ub.edu",
    status: "not_submitted",
    due_date: "2025-05-01",
    avatar: "https://i.pravatar.cc/150?u=13",
  },
  {
    id: 14,
    name: "Flexbox avançat",
    course: "Disseny Web",
    teacher: "Joan Serra",
    teacherEmail: "joan.serra@ub.edu",
    status: "corrected",
    due_date: "2025-05-06",
    avatar: "https://i.pravatar.cc/150?u=14",
  },
  {
    id: 15,
    name: "Indexos i consultes eficients",
    course: "Bases de dades modernes",
    teacher: "Núria Bosch",
    teacherEmail: "nuria.bosch@ub.edu",
    status: "pending",
    due_date: "2025-05-13",
    avatar: "https://i.pravatar.cc/150?u=15",
  },
];

const statusColorMap: Record<string, ChipProps["color"]> = {
  corrected: "success",
  rejected: "danger",
  not_submitted: "danger",
  reviewing: "warning",
  pending: "warning",
};

type Practice = (typeof practices)[0];

export const PracticeTable = () => {
  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [selectedDueRangeFilter, setSelectedDueRangeFilter] = React.useState<Selection>(new Set(["next_7_days"]));
  const selectedDueRangeFilterValue = React.useMemo(() => {
    const value = Array.from(selectedDueRangeFilter)[0];
    return dueDateRangesOptions.find((option) => option.uid === value)?.name || "Filtra per data";
  }, [selectedDueRangeFilter]);

  const getStatusName = (uid: string) =>
    statusOptions.find((option) => option.uid === uid)?.name || uid; 

  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: "due_date",
    direction: "ascending",
  });

  const [page, setPage] = React.useState(1);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = React.useMemo(() => {
    const getLimitDate = () => {
      const value = Array.from(selectedDueRangeFilter)[0];
      const date = new Date();
      switch (value) {
        case "next_7_days":
          date.setDate(date.getDate() + 7);
          return date;
        case "next_30_days":
          date.setDate(date.getDate() + 30);
          return date;
        case "next_3_months":
          date.setMonth(date.getMonth() + 3);
          return date;
        case "next_6_months":
          date.setMonth(date.getMonth() + 6);
          return date;
        default:
          return null;
      }
    };

    let filteredPractices = [...practices];

    if (hasSearchFilter) {
      filteredPractices = filteredPractices.filter((practice) =>
        practice.name.toLowerCase().includes(filterValue.toLowerCase()),
      );
    }
    if (statusFilter !== "all" && Array.from(statusFilter).length !== statusOptions.length) {
      filteredPractices = filteredPractices.filter((practice) =>
        Array.from(statusFilter).includes(practice.status),
      );
    }
    const limitDate: Date | null = getLimitDate();
    if (limitDate) {
      const now = new Date();
      filteredPractices = filteredPractices.filter((practice) => {
        const dueDate = new Date(practice.due_date);
        return dueDate >= now && dueDate <= limitDate;
      });
    }

    return filteredPractices;
  }, [practices, filterValue, statusFilter, selectedDueRangeFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a: Practice, b: Practice) => {
      const column = sortDescriptor.column as keyof Practice;

      let first = a[column];
      let second = b[column];

      if (column === "due_date") {
        first = new Date(first as string).getTime();
        second = new Date(second as string).getTime();
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]); 

  const renderCell = React.useCallback((practice: Practice, columnKey: React.Key) => {
    const cellValue = practice[columnKey as keyof Practice];

    switch (columnKey) {
      case "name":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
          </div>
        );
      case "course":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
          </div>
        );
      case "teacher":
        return (
          <User
            avatarProps={{radius: "lg", src: practice.avatar}}
            description={practice.teacherEmail}
            name={cellValue}
          >
            {practice.teacherEmail}
          </User>
        );
      case "due_date":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{cellValue}</p>
          </div>
        );
      case "status":
        return (
          <Chip color={statusColorMap[practice.status]} size="sm" variant="flat">
            {getStatusName(practice.status)}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Tooltip content="Anar a la pràctica">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <EyeIcon />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onSearchChange = React.useCallback((value?: string) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = React.useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-3 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[44%]"
            placeholder="Cerca per nom..."
            startContent={<SearchIcon />}
            value={filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  {selectedDueRangeFilterValue}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={selectedDueRangeFilter}
                selectionMode="single"
                onSelectionChange={setSelectedDueRangeFilter}
              >
                {dueDateRangesOptions.map((dueDateRange) => (
                  <DropdownItem key={dueDateRange.uid} className="capitalize">
                    {capitalize(dueDateRange.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button endContent={<ChevronDownIcon className="text-small" />} variant="flat">
                  Estat
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Columna Estat"
                closeOnSelect={false}
                selectedKeys={statusFilter}
                selectionMode="multiple"
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {capitalize(status.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    );
  }, [
    filterValue,
    statusFilter,
    selectedDueRangeFilter,
    selectedDueRangeFilterValue,
    onSearchChange,
    onRowsPerPageChange,
    practices.length,
    hasSearchFilter,
  ]);

  const bottomContent = React.useMemo(() => {
    return (
      <div className="flex w-full justify-center">
        <Pagination
          showControls
          showShadow
          color="primary"
          variant="light"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [page, pages, hasSearchFilter]);

  return (
    <Table
      isHeaderSticky
      aria-label="Practices table"
      bottomContent={bottomContent}
      bottomContentPlacement="outside"
      classNames={{
        wrapper: "max-h-[400px]",
      }}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="outside"
      onSortChange={setSortDescriptor}
    >
      <TableHeader columns={columns}>
        {(column) => (
          <TableColumn
            key={column.uid}
            allowsSorting={column.sortable}
          >
            {column.name}
          </TableColumn>
        )}
      </TableHeader>
      <TableBody emptyContent={"No hi ha cap pràctica que requereixi una acció"} items={sortedItems}>
        {(item) => (
          <TableRow key={item.id}>
            {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}