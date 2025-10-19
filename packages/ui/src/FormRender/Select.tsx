import { useContext } from "react";
import { FormRenderContext } from "./formRender";
import _ from "lodash";
export function Select({
  label,
  itemKey,
  required,
  optionClassName,
  options,
  selectClassName,
  readOnly = false,
  className,
}: {
  label: string;
  itemKey: string;
  required?: boolean;
  optionClassName?: string;
  selectClassName?: string;
  options: { label: string; value: any }[];
  className?: string;
  readOnly?: boolean;
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext);
  const value = _.get(form, itemKey);
  const error = _.get(formErrors, itemKey);

  return (
    <div key={itemKey} className={className ?? ""}>
      <label htmlFor={itemKey} className="block text-sm font-medium leading-6">
        {label}
      </label>
      <div className="mt-2">
        <select
          id={itemKey}
          required={required}
          disabled={readOnly}
          className={
            selectClassName ??
            "text-sm block w-full rounded-md py-2 text-gray3 shadow-sm placeholder:text-gray7 border-grayD readOnly:border-grayF"
          }
          onChange={(e) => {
            let newForm = _.cloneDeep(form);
            _.set(newForm, itemKey, e.target.value);
            setForm(newForm);
          }}
          value={value}
        >
          {options.map((option, index) => (
            <option
              key={index}
              value={option.value}
              className={optionClassName ?? "text-sm"}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
