import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { EllipsisVerticalIcon, TrashIcon } from '@heroicons/react/24/outline';

interface DeleteMenuProps {
  onDelete: () => void;
}

export const DeleteMenu = ({ onDelete }: DeleteMenuProps) => {
  return (
    <Menu as="div" className="relative">
      <Menu.Button className="p-2 hover:bg-gray-100 rounded-full">
        <EllipsisVerticalIcon className="h-5 w-5" />
      </Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={onDelete}
                className={`${
                  active ? 'bg-red-50 text-red-600' : 'text-red-500'
                } flex w-full items-center px-4 py-2 text-sm`}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                Delete
              </button>
            )}
          </Menu.Item>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
