import { useContext } from "react";
import { CommonToggleSwitch } from '../common/CommonToggleSwitch'
import { FormRenderContext } from "./formRender";
import _ from "lodash";
export function Toggle({
  label,
  itemKey,
  defaultValue = false,
  className,
  readOnly = false,
}: {
  label: string;
  itemKey: string;
  defaultValue?: boolean;
  className?: string;
  readOnly?: boolean;
}) {
  const { form, setForm, formErrors } = useContext(FormRenderContext);
  const value = _.get(form, itemKey) ?? defaultValue;
  const error = _.get(formErrors, itemKey);
  return (
    <div key={itemKey} className={className ?? ""}>
      <label
        htmlFor={itemKey}
        className="block text-sm font-medium leading-6 text-gray-900 mb-2"
      >
        {label}
      </label>
      <CommonToggleSwitch
        value={value}
        defaultValue={defaultValue}
        disabled={readOnly}
        handleToggle={(newValue) => {
          let newForm = _.cloneDeep(form);
          _.set(newForm, itemKey, newValue);
          setForm(newForm);
        }}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  );
}
