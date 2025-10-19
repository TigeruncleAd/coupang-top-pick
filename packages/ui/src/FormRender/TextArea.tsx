import { useContext } from "react";
import DynamicHeightTextBox from "../common/DynamicHeightTextbox";
import { FormRenderContext } from "./formRender";
import _ from "lodash";
export function TextArea({
  label,
  itemKey,
  required,
  placeholder,
  rows,
  className,
  labelClassName,
  readOnly = false,
  resizable = false,
  maxLength,
  inputClassName,
}: {
  label?: string;
  itemKey: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  className?: string;
  readOnly?: boolean;
  labelClassName?: string;
  resizable?: boolean;
  maxLength?: number;
  inputClassName?: string;
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext);
  const value = _.get(form, itemKey) ?? "";
  const error = _.get(formErrors, itemKey);
  const defaultInputClassName =
    "w-full rounded-md px-4 py-2 text-sm border-grayD bg-zinc-100 read-only:bg-white";
  return (
    <div className={className ?? ""}>
      {label && (
        <label
          htmlFor={itemKey}
          className={
            labelClassName ?? "block text-sm font-medium leading-6 mb-2"
          }
        >
          {label}
        </label>
      )}
      <DynamicHeightTextBox
        defaultRows={rows ?? 3}
        className={inputClassName ?? defaultInputClassName}
        placeholder={placeholder ?? `${label} 을/를 입력해주세요`}
        onChange={(e) => {
          let newForm = _.cloneDeep(form);
          _.set(newForm, itemKey, e.target.value);
          setForm(newForm);
        }}
        resizable={resizable}
        value={value}
        required={required}
        readOnly={readOnly}
        maxLength={maxLength}
      />
      {maxLength && (
        <div className="text-xs text-right text-gray-500">
          {value.length} / {maxLength}
        </div>
      )}
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
