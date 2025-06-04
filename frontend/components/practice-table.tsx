
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
import { Chip } from "@heroui/chip";
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
import { practiceStatusOptions as statusOptions, practiceStatusColorMap as statusColorMap } from "@/types";
import { Practice } from "@/types/practice";
import { redirect } from "next/navigation";
import { PencilIcon } from "@heroicons/react/24/outline";
import { PracticeDrawer } from '@/components/drawer-practice';

export const columns = [
  {name: "PRÀCTICA", uid: "name", sortable: true},
  {name: "CURS", uid: "course", sortable: true},
  {name: "PROFESSOR", uid: "teacher", sortable: true},
  {name: "ESTAT", uid: "status", sortable: true},
  {name: "DATA DE VENCIMENT", uid: "due_date", sortable: true},
  {name: "ACCIONS", uid: "actions"},
];

export const dueDateRangesOptions = [
  { name: "Propers 7 dies", uid: "next_7_days" },
  { name: "Propers 30 dies", uid: "next_30_days" },
  { name: "Propers 3 mesos", uid: "next_3_months" },
  { name: "Propers 6 mesos", uid: "next_6_months" },
];

interface PracticeTableProps {
  practices: Practice[]
  isLoading: boolean
  isTeacher?: boolean
  onSave: (updatedPractice: Practice) => void
  onDelete: (practiceId: string) => void
}

export const PracticeTable = ({ practices, isLoading, isTeacher = false, onSave, onDelete }: PracticeTableProps) => {
  const [isPracticeDrawerOpen, setIsPracticeDrawerOpen] = React.useState(false);
  const [currentPractice, setCurrentPractice] = React.useState<Practice | null>(null);
  const [filterValue, setFilterValue] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Selection>("all");
  const [selectedDueRangeFilter, setSelectedDueRangeFilter] = React.useState<Selection>(new Set(["next_7_days"]));
  const selectedDueRangeFilterValue = React.useMemo(() => {
    const value = Array.from(selectedDueRangeFilter)[0];
    return dueDateRangesOptions.find((option) => option.uid === value)?.name || "Filtra per data";
  }, [selectedDueRangeFilter]);

  const getStatusName = (uid: string) =>
    statusOptions.find((option) => option.uid === uid)?.name || uid; 

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ca-ES', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredColumns = React.useMemo(() => {
    return isTeacher
      ? columns.filter(column => column.uid !== "status")
      : columns;
  }, [isTeacher])

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
        practice.status !== undefined && Array.from(statusFilter).includes(practice.status),
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

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a: Practice, b: Practice) => {
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
  }, [sortDescriptor, filteredItems]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage) || 1;

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return sortedItems.slice(start, end);
  }, [page, sortedItems, rowsPerPage]);

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
            <p className="text-bold text-small capitalize">{practice.course?.name}</p>
          </div>
        );
      case "teacher":
        return (
          <User
            avatarProps={{radius: "lg", showFallback: true}}
            description={practice.teacher?.email}
            name={practice.teacher?.name}
          >
            {practice.teacher?.email}
          </User>
        );
      case "due_date":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{formatDate(cellValue)}</p>
          </div>
        );
      case "status":
        return (
          <Chip color={statusColorMap[practice.status || "default"]} size="sm" variant="flat">
            {getStatusName(practice.status || "default")}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex justify-center items-center gap-2">
            <Tooltip content="Anar a la pràctica">
              <button
                type="button"
                onClick={() => redirect(`/practices/${practice.id}`)}
                className="text-lg text-default-400 hover:text-primary transition-transform duration-150 active:scale-95 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                aria-label="Anar a la pràctica"
              >
                <EyeIcon />
              </button>
            </Tooltip>
            {isTeacher && <Tooltip content="Editar pràctica">
              <button
                type="button"
                onClick={() => {setIsPracticeDrawerOpen(true); setCurrentPractice(practice);}}
                className="text-lg text-default-400 hover:text-primary transition-transform duration-150 active:scale-95 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                aria-label="Editar pràctica"
              >
                <PencilIcon className="size-4" />
              </button>
            </Tooltip>}
          </div>
        );
      default:
        return cellValue;
    }
  }, [isTeacher]);

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
                  <DropdownItem key={dueDateRange.uid}>
                    {dueDateRange.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {!isTeacher && <Dropdown>
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
                  <DropdownItem key={status.uid}>
                    {status.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>}
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
    isTeacher
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
    <div>
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
        <TableHeader columns={filteredColumns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody isLoading={isLoading} emptyContent={"No hi ha cap pràctica que requereixi una acció"} items={items}>
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {currentPractice?.course && <PracticeDrawer 
        isOpen={isPracticeDrawerOpen}
        onOpenChange={setIsPracticeDrawerOpen}
        initialPractice={currentPractice || null}
        course={currentPractice?.course}
        onSave={onSave}
        onDelete={onDelete}
      />}
    </div>
  );
}