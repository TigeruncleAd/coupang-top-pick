import { useContext } from "react";
import { FormRenderContext } from "./formRender";
import _ from "lodash";
export function Numbers({
  label,
  itemKey,
  required,
  placeholder,
  min,
  max,
  className,
  inputClassName,
}: {
  label: string;
  itemKey: string;
  required?: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  className?: string;
  inputClassName?: string;
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext);
  const value = _.get(form, itemKey) ?? 0;
  const error = _.get(formErrors, itemKey);
  const defaultInputClassName =
    "w-full rounded-md px-4 py-2 text-sm border-grayD bg-zinc-100 read-only:bg-white";

  return (
    <div className={className ?? ""} key={itemKey}>
      <label
        htmlFor={itemKey}
        className="block text-sm font-medium leading-6 mb-2"
      >
        {label}
      </label>
      <input
        id={itemKey}
        min={min}
        max={max}
        required={required}
        type="number"
        className={inputClassName ?? defaultInputClassName}
        placeholder={placeholder ?? `${label} 을/를 입력해주세요`}
        onChange={(e) => {
          let newForm = _.cloneDeep(form);
          _.set(newForm, itemKey, Number(e.target.value));
          setForm(newForm);
        }}
        value={value}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
