'use client';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export default function SortableHeader({ field, sort, onSort, children, className = '' }) {
  const isActive = sort.field === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`table-header cursor-pointer hover:bg-gray-100 select-none ${className}`}
    >
      <span className="flex items-center gap-1">
        {children}
        <span className="flex flex-col ml-0.5 opacity-50">
          <ChevronUpIcon className={`h-2.5 w-2.5 -mb-0.5 ${isActive && sort.order === 'asc' ? 'opacity-100 text-sky-500' : ''}`} />
          <ChevronDownIcon className={`h-2.5 w-2.5 ${isActive && sort.order === 'desc' ? 'opacity-100 text-sky-500' : ''}`} />
        </span>
      </span>
    </th>
  );
}
