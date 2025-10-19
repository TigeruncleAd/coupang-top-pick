"use client";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useState, Fragment, useDeferredValue } from "react";
import _ from "lodash";
import { useAsyncEffect } from "@repo/utils";

interface props {
  value: any;
  handleChange: any;
  lookupDisplayValue: any;
  getData: any;
  params?: any;
  searchParams?: any;
}
export function LookupComboboxFilterSSR({
  value,
  handleChange,
  lookupDisplayValue,
  getData,
  params,
  searchParams,
}: props) {
  const [query, setQuery] = useState("");
  const [listData, setListData] = useState<any[]>([]);
  const deferredQuery = useDeferredValue(query);
  const currentValue = listData.find((item) => item.id?.toString() === value);

  useAsyncEffect(async () => {
    const data = await getData({
      query: deferredQuery,
      ...params,
      ...searchParams,
    });

    setListData([
      { id: "", name: "전체", title: "전체", label: "전체" },
      ...data,
    ]);
  }, [deferredQuery, params, searchParams]);

  return (
    <Combobox value={currentValue} onChange={handleChange}>
      <div className="relative w-full">
        <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 md:text-sm">
          <Combobox.Input
            className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-gray-900 focus:ring-0"
            displayValue={(value) => _.get(value, lookupDisplayValue, " ")}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="전체"
          />
          <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-5 w-5 text-gray-400"
              aria-hidden="true"
            />
          </Combobox.Button>
        </div>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
          afterLeave={() => setQuery("")}
        >
          <Combobox.Options className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white py-1  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none md:text-sm ">
            {listData?.length === 0 ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                검색 결과가 없습니다.
              </div>
            ) : (
              listData?.map((lookupItem: any) => (
                <Combobox.Option
                  key={lookupItem.id}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-teal-600 text-white" : "text-gray-900"
                    }`
                  }
                  value={lookupItem}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate text-sm ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {_.get(lookupItem, lookupDisplayValue) ?? ""}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-teal-600"
                          }`}
                        >
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Transition>
      </div>
    </Combobox>
  );
}
